// hooks/useFirebaseMessaging.ts

"use client";

import { useEffect, useState } from "react";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import app, { auth } from "@/lib/firebase";
import { saveFCMToken } from "@/lib/firestore";
import { onAuthStateChanged } from "firebase/auth";

export function useFirebaseMessaging() {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isSupported, setIsSupportedState] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const setup = async () => {
      // Service WorkerとNotification APIがサポートされているかチェック
      if (!("serviceWorker" in navigator) || !("Notification" in window)) {
        console.warn("[FCM] このブラウザはService WorkerまたはNotification APIをサポートしていません");
        return;
      }

      try {
        // Service Workerを登録
        const registration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
          { scope: "/" }
        );
        console.log("[FCM] Service Worker 登録完了:", registration);

        // Firebase Messagingの初期化を試みる
        const messaging = getMessaging(app);
        setIsSupportedState(true);

        // VAPIDキーを環境変数から取得
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
          console.error("[FCM] NEXT_PUBLIC_FIREBASE_VAPID_KEY が設定されていません");
          return;
        }

        // 通知許可をリクエストしてトークン取得
        const currentToken = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration: registration,
        });

        if (currentToken) {
          console.log("[FCM] 取得したトークン:", currentToken);
          setFcmToken(currentToken);   
          // ログインしている場合のみFirestoreに保存
          if (auth.currentUser) {
            try {
              await saveFCMToken(currentToken);
            } catch (error) {
              console.error("[FCM] トークンの保存に失敗:", error);
            }
          } else {
            console.log("[FCM] ログインしていないため、トークンを保存しません");
          }
        } else {
          console.log("[FCM] トークンを取得できませんでした（通知が許可されていない可能性）");
        }

        // フォアグラウンドメッセージの受信ハンドラ（オプション）
        onMessage(messaging, (payload) => {
          console.log("[FCM] フォアグラウンドメッセージ受信:", payload);
          // フォアグラウンドでも通知を表示したい場合は、ここで処理
        });
      } catch (error) {
        console.error("[FCM] セットアップ中にエラー:", error);
      }
    };

    setup();
  }, []);

  // ログイン状態が変わったときにトークンを保存する
  useEffect(() => {
    // fcmToken がまだ取得できていない場合は何もしない
    if (!fcmToken) return;

    // ログイン状態の変化を監視
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // ログインしたら、トークンを保存
        try {
          await saveFCMToken(fcmToken);
        } catch (error) {
          console.error("[FCM] トークンの保存に失敗:", error);
        }
      }
    });

    // クリーンアップ
    return () => unsubscribe();
  }, [fcmToken]);  // fcmToken が変わったときに再実行

  return { fcmToken, isSupported };
}