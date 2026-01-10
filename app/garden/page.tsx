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
          <LoadingSpinner />
        ) : !loggedIn ? (
          <div>ログインが必要です</div>
        ) : (
          <GardenScene habits={habits} weather={weather} />
        )}
      </div>
    </>
  );
}