// Firebase v8 のCDN版を読み込む（Service Workerではこれが一般的）
importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js");

// firebaseConfig をここに書く必要がある
// 環境変数は使えないので、直接値を書くか、ビルド時に埋め込む必要がある
// まずは動作確認のため、直接値を書いてもOK（後で改善できる）
const firebaseConfig = {
  apiKey: "AIzaSyDA4UK5qc6HCB3tfwZqDE4wTgrFLDP4JdY",
  authDomain: "habitflow-firebase.firebaseapp.com",
  projectId: "habitflow-firebase",
  storageBucket: "habitflow-firebase.firebasestorage.app",
  messagingSenderId: "946384802345",
  appId: "1:946384802345:web:24bcdcc5834e6553d40238",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// バックグラウンドメッセージを受信したときのハンドラ
messaging.setBackgroundMessageHandler(function (payload) {
  console.log("[SW] バックグラウンドメッセージ受信:", payload);
  console.log("[SW] payload.data:", payload.data);
  
  const notificationTitle = payload.data?.title || "習慣のリマインド";
  const notificationOptions = {
    body: payload.data?.body || "通知本文",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: {
      habitId: payload.data?.habitId,
      habitTitle: payload.data?.habitTitle,
    },
  };

  console.log("[SW] 通知を表示します:", notificationTitle, notificationOptions);
  return self.registration.showNotification(notificationTitle, notificationOptions)
    .then(() => {
      console.log("[SW] 通知表示成功");
    })
    .catch((error) => {
      console.error("[SW] 通知表示エラー:", error);
    });
});