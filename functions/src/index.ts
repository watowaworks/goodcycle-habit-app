import { setGlobalOptions } from "firebase-functions";
import { onRequest } from "firebase-functions/https";
import { onSchedule } from "firebase-functions/scheduler";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

// Firebase Admin SDK の初期化
admin.initializeApp();

setGlobalOptions({ maxInstances: 10 });

// 習慣の型定義（Cloud Functions側）
interface Habit {
  id: string;
  title: string;
  frequencyType: "daily" | "weekly" | "interval";
  daysOfWeek?: number[];
  intervalDays?: number;
  startDate?: string;
  notification?: {
    enabled: boolean;
    reminderTime?: string;
  };
}

// 指定日が習慣の実施日かどうかを判定（lib/utils.ts のロジックを参考に）
function isHabitDueOnDate(habit: Habit, date: string): boolean {
  // 日付文字列をDateオブジェクトに変換
  const parseDateString = (dateString: string): Date => {
    return new Date(dateString + "T00:00:00");
  };
  
  const targetDate = parseDateString(date);

  switch (habit.frequencyType) {
    case "daily":
      return true;
    case "weekly":
      return habit.daysOfWeek?.includes(targetDate.getDay()) ?? false;
    case "interval":
      if (!habit.startDate || !habit.intervalDays) {
        return false;
      }
      const startDate = parseDateString(habit.startDate);
      const diffMs = targetDate.getTime() - startDate.getTime();
      if (diffMs < 0) return false;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      return diffDays % habit.intervalDays === 0;
    default:
      return false;
  }
}

// テスト用: 手動で通知を送る関数
export const sendTestNotification = onRequest(async (request, response) => {
  // リクエストからトークンを取得（テスト用）
  const token = request.query.token as string;
  
  if (!token) {
    response.status(400).send("token パラメータが必要です");
    return;
  }

  try {
    // FCM通知を送信
    const message = {
      notification: {
        title: "テスト通知",
        body: "Cloud Functions からの通知テストです",
      },
      token: token,
    };

    const result = await admin.messaging().send(message);
    logger.info("通知送信成功:", result);
    response.send(`通知を送信しました: ${result}`);
  } catch (error) {
    logger.error("通知送信エラー:", error);
    response.status(500).send(`エラー: ${error}`);
  }
});

// スケジュール実行（1分ごと）: 習慣の通知時刻をチェックして通知を送信
export const checkAndSendNotifications = onSchedule({
  schedule: "every 1 minutes", // 1分ごとに実行
  timeZone: "Asia/Tokyo", // タイムゾーンを指定
}, async (event) => {
  // 現在時刻を取得（JST: Asia/Tokyo）
  // Intl.DateTimeFormat を使ってタイムゾーンを指定
  const now = new Date();
  const jstFormatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  
  const jstParts = jstFormatter.formatToParts(now);
  const year = jstParts.find(p => p.type === "year")?.value || "";
  const month = jstParts.find(p => p.type === "month")?.value || "";
  const day = jstParts.find(p => p.type === "day")?.value || "";
  const hour = jstParts.find(p => p.type === "hour")?.value || "";
  const minute = jstParts.find(p => p.type === "minute")?.value || "";
  
  const currentTime = `${hour}:${minute}`;
  const today = `${year}-${month}-${day}`;
  
  logger.info(`[スケジュール] 通知チェック開始: ${currentTime} (${today}) [JST]`);
  
  try {
    // すべてのユーザーを取得
    const usersSnapshot = await admin.firestore().collection("users").get();
    
    logger.info(`[スケジュール] ユーザー数: ${usersSnapshot.size}`);
    
    if (usersSnapshot.empty) {
      logger.info("[スケジュール] ユーザーが見つかりませんでした");
      return;
    }
    
    // 各ユーザーについて処理
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const fcmTokens = userData.fcmTokens || [];
      
      logger.info(`[スケジュール] ユーザー ${userId}: FCMトークン数 ${fcmTokens.length}`);
      
      if (fcmTokens.length === 0) {
        continue; // FCMトークンがない場合はスキップ
      }
      
      // ユーザーの習慣を取得
      const habitsSnapshot = await admin.firestore()
        .collection("users")
        .doc(userId)
        .collection("habits")
        .get();
      
      logger.info(`[スケジュール] ユーザー ${userId}: 習慣数 ${habitsSnapshot.size}`);
      
      if (habitsSnapshot.empty) {
        continue; // 習慣がない場合はスキップ
      }
      
      // 通知対象の習慣をフィルタリング
      const habitsToNotify: Habit[] = [];
      
      for (const habitDoc of habitsSnapshot.docs) {
        const habitData = habitDoc.data();
        const habit: Habit = {
          id: habitDoc.id,
          title: habitData.title || "",
          frequencyType: habitData.frequencyType || "daily",
          daysOfWeek: habitData.daysOfWeek,
          intervalDays: habitData.intervalDays,
          startDate: habitData.startDate,
          notification: habitData.notification,
        };
        
        logger.info(`[スケジュール] 習慣チェック: ${habit.title}`, {
          enabled: habit.notification?.enabled,
          reminderTime: habit.notification?.reminderTime,
          currentTime,
          isDue: isHabitDueOnDate(habit, today),
        });
        
        // 通知が有効で、reminderTimeが現在時刻と一致
        if (!habit.notification?.enabled) {
          logger.info(`[スケジュール] 習慣 ${habit.title}: 通知が無効`);
          continue;
        }
        
        if (habit.notification.reminderTime !== currentTime) {
          logger.info(`[スケジュール] 習慣 ${habit.title}: 時刻不一致 (${habit.notification.reminderTime} !== ${currentTime})`);
          continue;
        }
        
        // 今日が実施日かどうかを判定
        if (!isHabitDueOnDate(habit, today)) {
          logger.info(`[スケジュール] 習慣 ${habit.title}: 今日は実施日ではない`);
          continue;
        }
        
        logger.info(`[スケジュール] 習慣 ${habit.title}: 通知対象に追加`);
        habitsToNotify.push(habit);
      }
      
      // 通知対象の習慣がある場合、通知を送信
      logger.info(`[スケジュール] ユーザー ${userId}: 通知対象の習慣数 ${habitsToNotify.length}`);
      
      if (habitsToNotify.length > 0) {
        for (const habit of habitsToNotify) {
          const message = {
            notification: {
              title: "習慣のリマインド",
              body: `本日も忘れずに「${habit.title}」を継続しましょう！`,
            },
            tokens: fcmTokens, // 複数のトークンに対応
          };
          
          logger.info(`[スケジュール] 通知送信開始: ${habit.title} (トークン数: ${fcmTokens.length})`);
          
          try {
            const result = await admin.messaging().sendEachForMulticast(message);
            logger.info(`[スケジュール] 通知送信成功: ${habit.title} (${result.successCount}/${fcmTokens.length}件成功)`);
            
            if (result.failureCount > 0) {
              logger.warn(`[スケジュール] 通知送信失敗: ${habit.title} (${result.failureCount}件失敗)`);
              result.responses.forEach((response, index) => {
                if (!response.success) {
                  logger.warn(`[スケジュール] トークン ${index} の送信失敗:`, response.error);
                }
              });
            }
          } catch (error) {
            logger.error(`[スケジュール] 通知送信エラー: ${habit.title}`, error);
          }
        }
      }
    }
    
    logger.info(`[スケジュール] 通知チェック完了: ${currentTime}`);
  } catch (error) {
    logger.error("[スケジュール] エラー:", error);
  }
});