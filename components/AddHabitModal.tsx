"use client";

import { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { FrequencyType, Habit } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/firebase";
import { HABIT_COLOR_OPTIONS, DEFAULT_HABIT_COLOR } from "@/lib/habitColors";
import { useClickOutside } from "@/hooks/useClickOutside";
type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AddHabitModal({ isOpen, onClose }: Props) {
  // 関数は個別に取得
  const addHabit = useStore((state) => state.addHabit);
  const addCategory = useStore((state) => state.addCategory);
  const deleteCategory = useStore((state) => state.deleteCategory);

  // 状態は個別に取得（型安全性とパフォーマンスのため）
  const categories = useStore((state) => state.categories);
  const habits = useStore((state) => state.habits);
  const localHabits = useStore((state) => state.localHabits);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("");
  const [color, setColor] = useState<string>(DEFAULT_HABIT_COLOR);
  const [loading, setLoading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [frequencyType, setFrequencyType] = useState<FrequencyType>("daily");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [intervalDays, setIntervalDays] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>("");
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // ドロップダウン外をクリックしたら閉じる
  useClickOutside(
    categoryDropdownRef,
    () => {
      setIsDropdownOpen(false);
    },
    isDropdownOpen
  );

  // モーダルを閉じたときにフォームをリセット
  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setCategory("");
      setColor(DEFAULT_HABIT_COLOR);
      setLoading(false);
      setNewCategoryName("");
      setAddingCategory(false);
      setIsDropdownOpen(false);
      setFrequencyType("daily");
      setDaysOfWeek([]);
      setIntervalDays(1);
      setStartDate("");
    }
  }, [isOpen]);

  const isLoggedIn = !!auth.currentUser;

  // カテゴリを追加
  const handleAddCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      alert("カテゴリ名を入力してください");
      return;
    }

    try {
      setAddingCategory(true);
      await addCategory(trimmed);
      setCategory(trimmed); // 追加したカテゴリを自動選択
      setNewCategoryName("");
    } catch (error: any) {
      alert(error.message || "カテゴリの追加に失敗しました");
    } finally {
      setAddingCategory(false);
    }
  };

  // カテゴリを削除
  const handleDeleteCategory = async (categoryToDelete: string) => {
    const user = auth.currentUser;
    const allHabits = user ? habits : localHabits;
    const habitsUsingCategory = allHabits.filter(
      (h: Habit) => h.category === categoryToDelete
    );

    if (habitsUsingCategory.length > 0) {
      alert(
        `このカテゴリは${habitsUsingCategory.length}個の習慣で使用されています。先にカテゴリを変更してください。`
      );
      return;
    }

    if (!confirm(`「${categoryToDelete}」を削除してもよろしいですか？`)) {
      return;
    }

    try {
      await deleteCategory(categoryToDelete);

      // 削除したカテゴリが選択されていた場合は選択を解除
      if (category === categoryToDelete) {
        setCategory("");
      }
    } catch (error: any) {
      alert(error.message || "カテゴリの削除に失敗しました");
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return alert("習慣のタイトルを入力してください");
    if (!category) return alert("カテゴリを選択してください");
    if (frequencyType === "weekly" && daysOfWeek.length === 0)
      return alert("曜日を選択してください");
    if (frequencyType === "interval" && intervalDays <= 0)
      return alert("周期を1以上にしてください");
    if (frequencyType === "interval" && !startDate)
      return alert("開始日を入力してください");

    // ログイン時はIDを後で設定、非ログイン時はuuidv4()を使用
    const tempId = uuidv4();
    const newHabit: Habit = {
      id: tempId,
      title,
      category: category,
      color,
      completed: false,
      createdAt: new Date(),
      frequencyType,
      ...(frequencyType === "weekly" ? { daysOfWeek } : {}),
      ...(frequencyType === "interval" ? { intervalDays, startDate } : {}),
    };

    try {
      setLoading(true);
      // Zustand + Firestore or ローカル
      // ログイン時はFirestoreがIDを生成し、store.tsで更新される
      await addHabit(newHabit);
      // フォームをリセット
      setTitle("");
      setCategory("");
      setColor(DEFAULT_HABIT_COLOR);
      onClose();
    } catch (error) {
      console.error("習慣の保存に失敗しました:", error);
      alert("習慣の保存に失敗しました。再試行してください。");
    } finally {
      setLoading(false);
    }
  };

  const toggleDayOfWeek = (dayIndex: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((day) => day !== dayIndex)
        : [...prev, dayIndex]
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md mx-auto my-4 max-h-[calc(100vh-2rem)] overflow-hidden bg-white rounded-2xl shadow flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto flex-1 p-4 sm:p-6">
          <h1 className="text-2xl font-bold mb-6 text-center">
            新しい習慣を追加
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* タイトル入力欄 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                習慣名
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: 朝のジョギング"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* カテゴリ選択欄 */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                カテゴリ
              </label>

              <div ref={categoryDropdownRef} className="relative">
                {/* ドロップダウントリガー */}
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <span
                    className={category ? "text-gray-700" : "text-gray-400"}
                  >
                    {category || "カテゴリを選択してください"}
                  </span>
                  <svg
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* ドロップダウンリスト */}
                {isDropdownOpen && (
                  <div className="absolute z-50 w-full mt-2 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white py-2 shadow-lg">
                    {categories.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        カテゴリがありません
                      </div>
                    ) : (
                      categories.map((cat: string) => {
                        const isSelected = category === cat;
                        return (
                          <div
                            key={cat}
                            className="flex items-center group hover:bg-gray-50"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setCategory(cat);
                                setIsDropdownOpen(false);
                              }}
                              className={`flex-1 flex items-center gap-3 px-4 py-3 text-left transition ${
                                isSelected
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "text-gray-700"
                              }`}
                            >
                              <span className="font-medium">{cat}</span>
                              {isSelected && (
                                <svg
                                  className="ml-auto h-5 w-5 text-emerald-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </button>
                            {isLoggedIn && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCategory(cat);
                                }}
                                className="mr-2 px-2 py-1 text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                                title="カテゴリを削除"
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* 新しいカテゴリを追加（ログイン時のみ） */}
              {isLoggedIn && (
                <div className="flex gap-2 mt-4">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCategory();
                      }
                    }}
                    placeholder="新しいカテゴリ名を入力"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={addingCategory}
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={addingCategory || !newCategoryName.trim()}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      addingCategory || !newCategoryName.trim()
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-green-500 text-white hover:bg-green-600"
                    }`}
                  >
                    {addingCategory ? "追加中..." : "追加"}
                  </button>
                </div>
              )}
            </div>

            {/* 頻度タイプ選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                頻度タイプ
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFrequencyType("daily")}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    frequencyType === "daily"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-300 text-gray-500"
                  }`}
                >
                  毎日
                </button>
                <button
                  type="button"
                  onClick={() => setFrequencyType("weekly")}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    frequencyType === "weekly"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-300 text-gray-500"
                  }`}
                >
                  毎週
                </button>
                <button
                  type="button"
                  onClick={() => setFrequencyType("interval")}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    frequencyType === "interval"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-300 text-gray-500"
                  }`}
                >
                  間隔
                </button>
              </div>
            </div>

            {/* 頻度タイプがweeklyの場合のみ表示 */}
            {frequencyType === "weekly" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  実施する曜日
                </label>
                <div className="flex flex-wrap gap-2">
                  {["月", "火", "水", "木", "金", "土", "日"].map(
                    (label, index) => {
                      const dayIndex = index === 6 ? 0 : index + 1;
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => toggleDayOfWeek(dayIndex)}
                          className={`px-3 py-2 sm:px-4 text-sm sm:text-base rounded-lg font-semibold transition flex-1 min-w-[calc(14%-0.5rem)] ${
                            daysOfWeek.includes(dayIndex)
                              ? "bg-blue-500 text-white"
                              : "bg-gray-300 text-gray-500"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            {/* 頻度タイプがintervalの場合のみ表示 */}
            {frequencyType === "interval" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  周期(日)
                </label>
                <input
                  type="number"
                  value={intervalDays}
                  onChange={(e) => setIntervalDays(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  開始日
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* カラー選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                カードカラー
              </label>
              <div className="flex flex-wrap gap-2">
                {HABIT_COLOR_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setColor(option)}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition ${
                      color === option
                        ? "border-blue-500 scale-105"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: option }}
                    aria-label={`色 ${option}`}
                  >
                    {color === option && (
                      <span className="inline-block h-2 w-2 rounded-full bg-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              {/* 戻るボタン */}
              <button
                type="button"
                disabled={loading}
                onClick={onClose}
                className={`flex-[2] py-2 rounded-lg font-semibold transition ${
                  loading
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-red-500 text-white hover:bg-red-600"
                }`}
              >
                {loading ? "戻り中" : "戻る"}
              </button>
              {/* 送信ボタン */}
              <button
                type="submit"
                disabled={loading}
                className={`flex-[8] py-2 rounded-lg font-semibold transition ${
                  loading
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                {loading ? "追加中..." : "追加する"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
