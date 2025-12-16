"use client";

import { useEffect, useState, useRef } from "react";
import { useStore } from "@/lib/store";
import HabitCard from "@/components/HabitCard";
import { auth, onAuthStateChanged } from "@/lib/firebase";
import { getTodayString, isHabitDueOnDate } from "@/lib/utils";
import AddHabitModal from "@/components/AddHabitModal";
import FilterModal from "@/components/FilterModal";
import Header from "@/components/Header";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useNotifications } from "@/hooks/useNotifications";

export default function HomePage() {
  const habits = useStore((state) => state.habits);
  const localHabits = useStore((state) => state.localHabits);
  const filter = useStore((state) => state.filter);
  const setFilter = useStore((state) => state.setFilter);
  const fetchHabits = useStore((state) => state.fetchHabits);
  const fetchCategories = useStore((state) => state.fetchCategories);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState<boolean>(!!auth.currentUser);
  const [showAddHabitModal, setShowAddHabitModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const lastCheckedDateRef = useRef(getTodayString());
  const lastNotifiedTimeRef = useRef<string>("");

  const { isSupported, permission, requestNotificationPermission, notify, sendHabitReminder } = useNotifications();

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

  // 通知スケジューリング用の useEffect
  useEffect(() => {
    if (!isSupported || permission !== "granted") return;

    const getCurrentTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      return `${hours}:${minutes}`;
    };

    // 60秒ごとに通知をチェック
    const checkNotifications = setInterval(() => {
      const currentTime = getCurrentTime();
      const today = getTodayString();

      if (lastNotifiedTimeRef.current === currentTime) return;

      // 通知対象の習慣をフィルタリング
      const habitsToNotify = allHabits.filter((habit) => {
        return (
          habit.notification?.enabled === true &&
          habit.notification.reminderTime === currentTime &&
          isHabitDueOnDate(habit, today)
        );
      });

      // 通知を送信
      habitsToNotify.forEach((habit) => {
        sendHabitReminder(habit);
      });

      if (habitsToNotify.length > 0) {
        lastNotifiedTimeRef.current = currentTime;
      }
    }, 60000);

    return () => {
      clearInterval(checkNotifications);
    };
  }, [allHabits, isSupported, permission, sendHabitReminder]);

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
        {loading ?(
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" text="読み込み中..." />
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowAddHabitModal(true)}
                className="bg-emerald-500 dark:bg-emerald-600 text-gray-700 dark:text-gray-100 px-4 py-2 rounded-lg hover:bg-emerald-600 dark:hover:bg-emerald-700 transition"
              >
                + 新しい習慣
              </button>
              <button
                onClick={() => setShowFilterModal(true)}
                className="bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-100 px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition"
              >
                フィルター
              </button>
            </div>

            {/* 絞り込み結果 */}
            {filteredHabits.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center pt-10">
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
          </>
        )}
      </div>
    </>
  );
}
