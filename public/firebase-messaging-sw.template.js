// Firebase v8 のCDN版を読み込む（Service Workerではこれが一般的）
importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js");

// firebaseConfig はビルド時に環境変数から注入されます
const firebaseConfig = {
  apiKey: "NEXT_PUBLIC_FIREBASE_API_KEY",
  authDomain: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  projectId: "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  storageBucket: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  appId: "NEXT_PUBLIC_FIREBASE_APP_ID",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// バックグラウンドメッセージを受信したときのハンドラ
messaging.setBackgroundMessageHandler(function (payload) {
  console.log("[SW] バックグラウンドメッセージ受信:", payload);
  console.log("[SW] payload.notification:", payload.notification);
  console.log("[SW] ユーザーエージェント:", self.navigator.userAgent);
  
  // notificationフィールドを使用
  const notificationTitle = payload.notification?.title || "習慣のリマインド";
  const notificationBody = payload.notification?.body || "通知本文";
  
  const notificationOptions = {
    body: notificationBody,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: payload.messageId || `notification-${Date.now()}`, // Chromeで重複通知を防ぐ
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200], // 通知の振動パターン
    data: payload.data || {}, // 追加データを保持
  };

  console.log("[SW] 通知を表示します:", notificationTitle, notificationOptions);
  
  // Chromeでは、showNotificationがPromiseを返すが、エラーが発生しても
  // 例外を投げない場合があるため、明示的にチェック
  return self.registration.showNotification(notificationTitle, notificationOptions)
    .then(() => {
      console.log("[SW] 通知表示成功");
      return null; // 成功時はnullを返す（Firebaseの要件）
    })
    .catch((error) => {
      console.error("[SW] 通知表示エラー:", error);
      console.error("[SW] エラー詳細:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      throw error; // エラーを再スローしてFirebaseに伝える
    });
});
