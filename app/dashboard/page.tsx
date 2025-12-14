"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { auth, onAuthStateChanged } from "@/lib/firebase";
import DashboardSummary from "@/components/dashboard/DashboardSummary";
import HabitTabs from "@/components/dashboard/HabitTabs";
import HabitDashboardContent from "@/components/dashboard/HabitDashboardContent";
import Header from "@/components/Header";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function DashboardPage() {
  const { habits, fetchHabits } = useStore();
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

  // ログイン時は Firestore の習慣を使用
  const allHabits = habits;

  // 習慣が読み込まれたら、最初の習慣を選択
  useEffect(() => {
    if (allHabits.length > 0 && !selectedHabitId) {
      setSelectedHabitId(allHabits[0].id);
    }
  }, [allHabits, selectedHabitId]);

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
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" text="データを読み込んでいます..." />
          </div>
        ) : !loggedIn ? (
          <div className="mt-8 rounded-2xl border border-dashed border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-900/20 p-6 text-center">
            <p className="text-md font-medium text-emerald-800 dark:text-emerald-300 mb-2">
              このダッシュボード機能は、ログインするとご利用いただけます。
            </p>
            <p className="text-sm text-emerald-900/80 dark:text-emerald-400 mb-4">
              アカウントを作成して習慣を登録すると、達成状況のグラフやカレンダー表示など、より詳しい可視化が利用できます。
            </p>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 dark:bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 dark:hover:bg-emerald-700"
            >
              ホームに戻る
            </a>
          </div>
        ) : allHabits.length === 0 ? (
          <p className="pt-10 text-center text-gray-500 dark:text-gray-400">
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
