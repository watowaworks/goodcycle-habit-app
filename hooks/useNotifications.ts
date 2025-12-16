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
      console.warn("通知APIがサポートされていません");
      return "denied" as NotificationPermissionState;
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result as NotificationPermissionState;
    } catch (error) {
      console.error("通知許可リクエストに失敗:", error);
      return "denied";
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