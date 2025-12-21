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
      
      // ブラウザ情報をログに記録
      const userAgent = navigator.userAgent;
      const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor);
      const isEdge = /Edg/.test(userAgent);
      console.log("[FCM] ブラウザ情報:", {
        userAgent,
        isChrome,
        isEdge,
        notificationPermission: Notification.permission,
      });

      try {
        // 既存のService Worker登録を確認
        let registration: ServiceWorkerRegistration;
        const existingRegistrations = await navigator.serviceWorker.getRegistrations();
        const existingRegistration = existingRegistrations.find(
          (reg) => reg.scope === window.location.origin + "/"
        );
        
        if (existingRegistration) {
          console.log("[FCM] 既存のService Worker登録を使用:", existingRegistration);
          registration = existingRegistration;
        } else {
          // Service Workerを新規登録
          registration = await navigator.serviceWorker.register(
            "/firebase-messaging-sw.js",
            { scope: "/" }
          );
          console.log("[FCM] Service Worker 新規登録完了:", registration);
        }
        
        // Service Workerの状態を確認
        console.log("[FCM] Service Worker状態:", {
          scope: registration.scope,
          active: registration.active?.state,
          installing: registration.installing?.state,
          waiting: registration.waiting?.state,
        });
        
        // Chromeでは、Service Workerが完全にアクティブになるまで待機する必要がある場合がある
        if (registration.installing) {
          console.log("[FCM] Service Workerがインストール中です。待機します...");
          await new Promise<void>((resolve) => {
            registration.installing!.addEventListener("statechange", () => {
              if (registration.installing?.state === "installed") {
                console.log("[FCM] Service Workerのインストールが完了しました");
                resolve();
              }
            });
          });
        }
        
        // Service Workerがアクティブになるまで待機
        if (!registration.active) {
          console.log("[FCM] Service Workerがアクティブになるまで待機します...");
          await navigator.serviceWorker.ready;
          console.log("[FCM] Service Workerがアクティブになりました");
        }

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
        console.log("[FCM] onMessage ハンドラを登録します");
        
        // Service Workerの登録を事前に取得（再利用）
        let swRegistration: ServiceWorkerRegistration | null = null;
        const getServiceWorkerRegistration = async (): Promise<ServiceWorkerRegistration> => {
          if (swRegistration) {
            return swRegistration;
          }
          
          try {
            swRegistration = await navigator.serviceWorker.ready;
            console.log("[FCM] Service Worker準備完了（キャッシュ）");
            return swRegistration;
          } catch (swError) {
            console.error("[FCM] Service Worker準備エラー:", swError);
            // Service Workerが準備できない場合、直接登録を取得
            const registrations = await navigator.serviceWorker.getRegistrations();
            if (registrations.length > 0) {
              swRegistration = registrations[0];
              console.log("[FCM] 既存のService Worker登録を使用（フォールバック）");
              return swRegistration;
            } else {
              throw new Error("Service Worker登録が見つかりません");
            }
          }
        };
        
        onMessage(messaging, async (payload) => {
          console.log("[FCM] フォアグラウンドメッセージ受信:", payload);
          console.log("[FCM] Notification.permission:", Notification.permission);
          console.log("[FCM] ブラウザ:", navigator.userAgent);
          
          // フォアグラウンドでも通知を表示（Service Worker経由）
          if (Notification.permission === "granted") {
            try {
              // Service Workerの準備を確実に待つ
              const registration = await getServiceWorkerRegistration();
              
              // Chromeでの追加チェック: Service Workerがアクティブか確認
              if (!registration.active) {
                console.warn("[FCM] Service Workerがアクティブではありません。待機します...");
                // Service Workerがアクティブになるまで待機（最大5秒）
                await new Promise<void>((resolve, reject) => {
                  const timeout = setTimeout(() => {
                    reject(new Error("Service Workerがアクティブになるまでタイムアウト"));
                  }, 5000);
                  
                  const checkActive = () => {
                    if (registration.active) {
                      clearTimeout(timeout);
                      resolve();
                    } else {
                      setTimeout(checkActive, 100);
                    }
                  };
                  checkActive();
                });
                console.log("[FCM] Service Workerがアクティブになりました");
              }
              
              // notificationフィールドを使用
              const notificationTitle = payload.notification?.title || "通知";
              const notificationBody = payload.notification?.body || "通知本文";
              
              const notificationOptions: NotificationOptions & { vibrate?: number[] } = {
                body: notificationBody,
                icon: "/favicon.ico",
                badge: "/favicon.ico",
                tag: payload.messageId || `notification-${Date.now()}`, // Chromeで重複通知を防ぐ
                requireInteraction: false,
                silent: false,
                vibrate: [200, 100, 200], // 通知の振動パターン
                data: payload.data || {}, // 追加データを保持
              };
              
              console.log("[FCM] 通知を表示します:", notificationTitle, notificationOptions);
              console.log("[FCM] payload.notification:", payload.notification);
              console.log("[FCM] Service Worker状態（通知表示前）:", {
                active: registration.active?.state,
                scope: registration.scope,
              });
              
              // Chromeでは、showNotificationがPromiseを返すが、エラーが発生しても
              // 例外を投げない場合があるため、明示的にチェック
              try {
                const notificationPromise = registration.showNotification(notificationTitle, notificationOptions);
                
                // 通知の表示を待つ（タイムアウト付き）
                await Promise.race([
                  notificationPromise,
                  new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("通知表示がタイムアウトしました")), 3000)
                  ),
                ]);
                
                console.log("[FCM] 通知表示成功");
                
                // Chromeでの追加チェック: 通知が実際に表示されたか確認
                setTimeout(() => {
                  console.log("[FCM] 通知表示後の確認 - Service Worker状態:", registration.active?.state);
                }, 100);
              } catch (notificationError) {
                console.error("[FCM] 通知表示中にエラー:", notificationError);
                throw notificationError; // エラーを再スローしてフォールバック処理に進む
              }
              
            } catch (error) {
              console.error("[FCM] 通知の表示に失敗:", error);
              console.error("[FCM] エラー詳細:", {
                name: (error as Error).name,
                message: (error as Error).message,
                stack: (error as Error).stack,
              });
              
              // Chromeでの代替方法: 直接Notification APIを使用（フォールバック）
              // 注意: これはService Worker経由ではないため、制限がある
              // Chromeでは、Service Worker経由で通知を表示できない場合があるため、
              // 直接Notification APIを使用する
              try {
                console.log("[FCM] フォールバック: 直接Notification APIを使用");
                const notificationTitle = payload.notification?.title || "通知";
                const notificationBody = payload.notification?.body || "通知本文";
                
                // Chromeでは、直接Notification APIを使用する場合、いくつかの制限がある
                // ただし、フォアグラウンドでは動作する
                const fallbackNotification = new Notification(notificationTitle, {
                  body: notificationBody,
                  icon: "/favicon.ico",
                  badge: "/favicon.ico",
                  tag: payload.messageId || `notification-${Date.now()}`,
                  requireInteraction: false,
                  silent: false,
                });
                
                console.log("[FCM] フォールバック通知表示成功");
                
                // 通知が閉じられたときのイベント
                fallbackNotification.onclick = () => {
                  console.log("[FCM] フォールバック通知がクリックされました");
                  window.focus();
                  fallbackNotification.close();
                };
              } catch (fallbackError) {
                console.error("[FCM] フォールバック通知も失敗:", fallbackError);
                console.error("[FCM] フォールバックエラー詳細:", {
                  name: (fallbackError as Error).name,
                  message: (fallbackError as Error).message,
                  stack: (fallbackError as Error).stack,
                });
              }
            }
          } else {
            console.warn("[FCM] 通知の許可が取得できていません。permission:", Notification.permission);
          }
        });
        console.log("[FCM] onMessage ハンドラ登録完了");
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
