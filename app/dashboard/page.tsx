"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { auth, onAuthStateChanged } from "@/lib/firebase";
import DashboardSummary from "@/components/dashboard/DashboardSummary";
import HabitTabs from "@/components/dashboard/HabitTabs";
import HabitDashboardContent from "@/components/dashboard/HabitDashboardContent";
import Header from "@/components/Header";

export default function DashboardPage() {
  const { habits, localHabits, fetchHabits } = useStore();
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState<boolean>(!!auth.currentUser);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  // 初回ロード: Firestoreデータ取得
  useEffect(() => {
    const fetchData = async () => {
      if (auth.currentUser) {
        await fetchHabits();
      }
      setLoading(false);
    };
    fetchData();

    // ログイン/ログアウトの変化を監視
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoggedIn(!!user);
      if (user) {
        await fetchHabits();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [fetchHabits]);

  // ログイン時は Firestore のみ、非ログイン時は localHabits のみ
  const allHabits = loggedIn ? habits : localHabits;

  // 習慣が読み込まれたら、最初の習慣を選択
  useEffect(() => {
    if (allHabits.length > 0 && !selectedHabitId) {
      setSelectedHabitId(allHabits[0].id);
    }
  }, [allHabits, selectedHabitId]);

  if (loading) {
    return <p className="text-center mt-10">読み込み中...</p>;
  }

  const selectedHabit =
    allHabits.length > 0
      ? allHabits.find((h) => h.id === selectedHabitId) || allHabits[0]
      : null;

  return (
    <>
      <Header
        title="GoodCycle♾️"
        navLinks={[
          { label: "ホーム", href: "/" },
          { label: "ダッシュボード", href: "/dashboard" },
          { label: "お問い合わせ", href: "/contact" },
        ]}
      />

      <div className="mx-auto max-w-3xl px-4 py-8">
        {allHabits.length === 0 ? (
          <p className="pt-10 text-center text-gray-500">
            習慣が登録されていません。ホームページで習慣を追加してください。
          </p>
        ) : (
          <>
            {/* 全体サマリー */}
            <DashboardSummary habits={allHabits} />

            {/* タブUI */}
            <HabitTabs
              habits={allHabits}
              selectedHabitId={selectedHabitId}
              onSelectHabit={setSelectedHabitId}
            />

            {/* 選択中の習慣の詳細統計 */}
            {selectedHabit && <HabitDashboardContent habit={selectedHabit} />}
          </>
        )}
      </div>
    </>
  );
}
