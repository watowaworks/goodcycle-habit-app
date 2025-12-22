// hooks/useFirebaseMessaging.ts

"use client";

import { useEffect, useState } from "react";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import app, { auth } from "@/lib/firebase";
import { saveFCMToken } from "@/lib/firestore";
import { onAuthStateChanged } from "firebase/auth";

export function useFirebaseMessaging() {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const setup = async () => {
      // Service WorkerとNotification APIがサポートされているかチェック
      if (!("serviceWorker" in navigator) || !("Notification" in window)) {
        console.warn("[FCM] このブラウザはService WorkerまたはNotification APIをサポートしていません");
        return;
      }
      

      try {
        // 既存のService Worker登録を確認
        let registration: ServiceWorkerRegistration;
        const existingRegistrations = await navigator.serviceWorker.getRegistrations();
        const existingRegistration = existingRegistrations.find(
          (reg) => reg.scope === window.location.origin + "/"
        );
        
        if (existingRegistration) {
          registration = existingRegistration;
        } else {
          registration = await navigator.serviceWorker.register(
            "/firebase-messaging-sw.js",
            { scope: "/" }
          );
        }
        
        // Service Workerがアクティブになるまで待機
        if (!registration.active) {
          await navigator.serviceWorker.ready;
        }

        // Firebase Messagingの初期化を試みる
        const messaging = getMessaging(app);
        setIsSupported(true);

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
          
          // 現在のオリジンを取得
          const origin = window.location.origin;
          console.log("[FCM] 現在のオリジン:", origin);
          
          // ログインしている場合のみFirestoreに保存
          if (auth.currentUser) {
            try {
              await saveFCMToken(currentToken, origin);
            } catch (error) {
              console.error("[FCM] トークンの保存に失敗:", error);
            }
          } else {
            console.log("[FCM] ログインしていないため、トークンを保存しません");
          }
        } else {
          console.log("[FCM] トークンを取得できませんでした（通知が許可されていない可能性）");
        }

        // フォアグラウンドメッセージの受信ハンドラ
        // Service Workerの登録を事前に取得（再利用）
        let swRegistration: ServiceWorkerRegistration | null = null;
        const getServiceWorkerRegistration = async (): Promise<ServiceWorkerRegistration> => {
          if (swRegistration) {
            return swRegistration;
          }
          swRegistration = await navigator.serviceWorker.ready;
          return swRegistration;
        };
        
        onMessage(messaging, async (payload) => {
          // フォアグラウンドでも通知を表示（Service Worker経由）
          if (Notification.permission === "granted") {
            try {
              const registration = await getServiceWorkerRegistration();
              
              const notificationTitle = payload.notification?.title || "通知";
              const notificationBody = payload.notification?.body || "通知本文";
              
              const notificationOptions: NotificationOptions & { vibrate?: number[] } = {
                body: notificationBody,
                icon: "/favicon.ico",
                badge: "/favicon.ico",
                tag: payload.messageId || `notification-${Date.now()}`,
                requireInteraction: false,
                silent: false,
                vibrate: [200, 100, 200],
                data: payload.data || {},
              };
              
              await registration.showNotification(notificationTitle, notificationOptions);
            } catch (error) {
              console.error("[FCM] 通知の表示に失敗:", error);
            }
          } else {
            console.warn("[FCM] 通知の許可が取得できていません。permission:", Notification.permission);
          }
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
          const origin = typeof window !== "undefined" ? window.location.origin : "";
          await saveFCMToken(fcmToken, origin);
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
