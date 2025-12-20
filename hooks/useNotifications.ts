"use client";

import { Habit } from "@/types";
import { useCallback, useEffect, useState } from "react";

export type NotificationPermissionState = "default" | "granted" | "denied";
type NotifyOptions = Omit<NotificationOptions, "body"> & {
  body: string;
};

export function useNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermissionState>("default");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setIsSupported(true);
    setPermission(Notification.permission);
  }, []);

  const requestNotificationPermission  = useCallback(async () => {
    if (!isSupported) {
      console.warn("[useNotifications] 通知APIがサポートされていません");
      return "denied" as NotificationPermissionState;
    }
    
    // 現在の許可状態を確認
    const currentPermission = Notification.permission;
    console.log("[useNotifications] 現在の通知許可状態:", currentPermission);
    
    // 既に許可されている場合はそのまま返す
    if (currentPermission === "granted") {
      return "granted" as NotificationPermissionState;
    }
    
    // 既に拒否されている場合はそのまま返す
    if (currentPermission === "denied") {
      return "denied" as NotificationPermissionState;
    }
    
    try {
      console.log("[useNotifications] Notification.requestPermission()を呼び出します");
      
      // Edgeブラウザでの互換性のため、Promiseとコールバックの両方に対応
      let result: NotificationPermission;
      
      if (typeof Notification.requestPermission === "function") {
        const permissionResult = Notification.requestPermission();
        
        // Promiseを返す場合（新しいAPI）
        if (permissionResult instanceof Promise) {
          // タイムアウトを設定（EdgeブラウザでPromiseが解決されない場合に備える）
          const timeoutPromise = new Promise<NotificationPermission>((_, reject) => {
            setTimeout(() => {
              reject(new Error("通知許可リクエストがタイムアウトしました"));
            }, 5000); // 5秒でタイムアウト
          });
          
          try {
            result = await Promise.race([permissionResult, timeoutPromise]);
          } catch (timeoutError) {
            console.warn("[useNotifications] タイムアウト、直接確認します");
            // タイムアウトした場合、直接Notification.permissionを確認
            result = Notification.permission;
          }
        } else {
          // コールバック形式の場合（古いAPI、通常は発生しない）
          result = permissionResult as NotificationPermission;
        }
      } else {
        throw new Error("Notification.requestPermissionが利用できません");
      }
      
      console.log("[useNotifications] 通知許可の結果:", result);
      setPermission(result);
      return result as NotificationPermissionState;
    } catch (error) {
      console.error("[useNotifications] 通知許可リクエストに失敗:", error);
      // エラーが発生した場合でも、現在の許可状態を確認
      const fallbackPermission = Notification.permission;
      console.log("[useNotifications] フォールバック: 現在の許可状態:", fallbackPermission);
      setPermission(fallbackPermission);
      return fallbackPermission as NotificationPermissionState;
    }
  }, [isSupported]);

  const notify = useCallback((title: string, options?: NotifyOptions) => {
    if (!isSupported) {
      console.warn("通知APIがサポートされていません");
      return;
    }
    if (permission !== "granted") {
      console.warn("通知が許可されていません");
      return;
    } 
    try {
      const finalOptions = {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        ...options, // 呼び出し側の指定があればこちらを優先
      };
      return new Notification(title, finalOptions);
    } catch (error) {
      console.error("通知の送信に失敗:", error);
      return;
    }
  }, [isSupported, permission]);

  const sendHabitReminder = useCallback((habit: Habit) => {
    notify("習慣のリマインド", {
      body: `本日も忘れずに「${habit.title}」を継続しましょう！`,
      tag: `habit-reminder-${habit.id}`,
    });
  }, [notify]);

  return {
    isSupported,
    permission,
    requestNotificationPermission ,
    notify,
    sendHabitReminder,
  };
}