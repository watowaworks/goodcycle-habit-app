"use client";

import { auth, onAuthStateChanged } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { calculateGardenWeather } from "@/lib/utils";
import Header from "@/components/Header";
import LoadingSpinner from "@/components/LoadingSpinner";
import GardenScene from "@/components/garden/GardenScene";

export default function GardenPage() {
  const { habits, fetchHabits } = useStore();
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState<boolean>(!!auth.currentUser);

  // 初回ロード: Firestoreデータ取得
  useEffect(() => {
    const fetchData = async () => {
      if (auth.currentUser) {
        await fetchHabits();
      }
    };
    fetchData();

    // ログイン/ログアウトの変化を監視
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoggedIn(!!user);
      if (user) {
        await fetchHabits();
      }

      setLoading(false); // 認証状態が確定してからloadingをfalseにする
    });

    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fetchHabitsはZustandストア関数のため、依存配列から除外

  // 庭全体の天気を計算
  const weather = calculateGardenWeather(habits);

  return (
    <>
      <Header
        title="GoodCycle♾️"
        navLinks={[
          { label: "ホーム", href: "/" },
          { label: "ダッシュボード", href: "/dashboard" },
          { label: "ガーデン", href: "/garden" },
          { label: "お問い合わせ", href: "/contact" },
        ]}
      />
      <div className="w-full h-[calc(100vh-4rem)] pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" text="データを読み込んでいます..." />
          </div>
        ) : !loggedIn ? (
          <div className="mx-auto max-w-3xl px-4 pt-8">
            <div className="rounded-2xl border border-dashed border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-900/20 p-6 text-center mt-8">
              <p className="text-md font-medium text-emerald-800 dark:text-emerald-300 mb-2">
                ガーデン機能は、ログインするとご利用いただけます。
              </p>
              <p className="text-sm text-emerald-900/80 dark:text-emerald-400 mb-4">
                アカウントを作成して習慣を登録すると、継続度や完了率に応じて変化する3Dガーデンで、現在の状態を直感的に振り返ることができます。
              </p>
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 dark:bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 dark:hover:bg-emerald-700"
              >
                ホームに戻る
              </a>
            </div>
          </div>
        ) : (
          <GardenScene habits={habits} weather={weather} />
        )}
      </div>
    </>
  );
}
