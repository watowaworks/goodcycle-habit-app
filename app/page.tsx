"use client";

import { useEffect, useState, useRef } from "react";
import { useStore } from "@/lib/store";
import HabitCard from "@/components/HabitCard";
import { auth, onAuthStateChanged } from "@/lib/firebase";
import { getTodayString } from "@/lib/utils";
import AddHabitModal from "@/components/AddHabitModal";
import FilterModal from "@/components/FilterModal";
import Header from "@/components/Header";

export default function HomePage() {
  const {
    habits,
    localHabits,
    filter,
    setFilter,
    fetchHabits,
    fetchCategories,
  } = useStore();

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState<boolean>(!!auth.currentUser);
  const [showAddHabitModal, setShowAddHabitModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const lastCheckedDateRef = useRef(getTodayString());

  // カテゴリーデータ復元
  useEffect(() => {
    const saved = localStorage.getItem("selectedCategories");
    if (saved) {
      try {
        setSelectedCategories(JSON.parse(saved));
      } catch {
        console.error("カテゴリーデータ復元失敗");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "selectedCategories",
      JSON.stringify(selectedCategories)
    );
  }, [selectedCategories]);

  // 初回ロード: Firestoreデータ取得
  useEffect(() => {
    // ログイン/ログアウトの変化を監視
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoggedIn(!!user);

      if (user) {
        // ログイン時: Firestoreからデータ取得
        await fetchHabits();
        await fetchCategories();
      } else {
        // ログアウト時: ローカルカテゴリのみ取得
        await fetchCategories();
      }

      setLoading(false);
    });

    // 日付が変わったかどうかを定期的にチェック
    const checkDateChange = setInterval(async () => {
      const currentDate = getTodayString();
      if (
        currentDate !== lastCheckedDateRef.current &&
        auth.currentUser &&
        loggedIn
      ) {
        lastCheckedDateRef.current = currentDate;
        await fetchHabits();
      }
    }, 60000); // 1分ごとに日付をチェック（Firestoreにはアクセスしない）

    return () => {
      unsubscribe();
      clearInterval(checkDateChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

  // ログイン時は Firestore のみ、非ログイン時は localHabits のみ
  const allHabits = loggedIn ? habits : localHabits;

  const filteredHabits = allHabits.filter((habit) => {
    if (filter === "completed" && !habit.completed) return false;
    if (filter === "incomplete" && habit.completed) return false;
    if (
      selectedCategories.length > 0 &&
      !selectedCategories.includes(habit.category)
    )
      return false;
    return true;
  });

  if (loading) return <p className="text-center mt-10">読み込み中...</p>;

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
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAddHabitModal(true)}
            className="bg-emerald-500 text-white px-4 py-2  rounded-lg hover:bg-emerald-600"
          >
            + 新しい習慣
          </button>
          <button
            onClick={() => setShowFilterModal(true)}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
          >
            フィルター
          </button>
        </div>

        {/* 絞り込み結果 */}
        {filteredHabits.length === 0 ? (
          <p className="text-gray-500 text-center pt-10">
            条件に合う習慣がありません。
          </p>
        ) : (
          <div className="grid gap-3">
            {filteredHabits.map((habit) => (
              <HabitCard key={habit.id} habit={habit} />
            ))}
          </div>
        )}
        <AddHabitModal
          isOpen={showAddHabitModal}
          onClose={() => setShowAddHabitModal(false)}
        />
        <FilterModal
          isOpen={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          filter={filter}
          setFilter={setFilter}
        />
      </div>
    </>
  );
}
