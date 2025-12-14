"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Habit } from "@/types";
import { auth } from "@/lib/firebase";
import { DEFAULT_HABIT_COLOR } from "@/lib/habitColors";
import EditHabitModal from "./EditHabitModal";
import { getTodayString, isHabitDueOnDate } from "@/lib/utils";

type Props = { habit: Habit };

export default function HabitCard({ habit }: Props) {
  const toggleHabitStatus = useStore((state) => state.toggleHabitStatus);
  const deleteHabit = useStore((state) => state.deleteHabit);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const isLoggedIn = !!auth.currentUser;

  const currentColor = habit.color || DEFAULT_HABIT_COLOR;
  const today = getTodayString();
  const isDue = isHabitDueOnDate(habit, today);

  // 頻度タイプの表示テキストを生成
  const getFrequencyText = () => {
    switch (habit.frequencyType) {
      case "daily":
        return "毎日";
      case "weekly":
        if (habit.daysOfWeek && habit.daysOfWeek.length > 0) {
          const dayLabels = ["日", "月", "火", "水", "木", "金", "土"];
          const selectedDays = habit.daysOfWeek
            .sort((a, b) => {
              // 日曜日（0）を最後に表示するため、特別な処理
              if (a === 0) return 1; // 日曜日は常に後ろ
              if (b === 0) return -1; // 日曜日は常に後ろ
              return a - b; // それ以外は通常の数値順
            })
            .map((day) => dayLabels[day])
            .join("・");
          return `毎週 ${selectedDays}`;
        }
        return "毎週";
      case "interval":
        if (habit.intervalDays) {
          return `${habit.intervalDays}日間隔`;
        }
        return "間隔";
      default:
        return "毎日";
    }
  };

  return (
    <div
      className={`relative rounded-xl overflow-hidden ${
        !isDue ? "border-2 border-dashed border-gray-300 dark:border-gray-100" : ""
      }`}
    >
      {/* 背景用のdiv（opacityを適用） */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: currentColor }}
      />
      {/* コンテンツ用のdiv（opacityの影響を受けない） */}
      <div className="relative flex items-center justify-between p-4 shadow hover:shadow-md dark:shadow-gray-800/50 transition">
        <>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={habit.completed}
              onChange={() => toggleHabitStatus(habit.id)}
              className="w-5 h-5 accent-blue-500 dark:accent-blue-400 cursor-pointer"
              disabled={!isDue}
            />
            <div className="flex flex-col">
              <p
                className={`text-lg font-medium ${
                  habit.completed
                    ? "line-through text-gray-500"
                    : !isDue
                    ? "text-gray-400"
                    : "text-gray-800"
                }`}
              >
                {habit.title}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <p className="text-sm text-gray-500">{habit.category}</p>
                {/* 頻度タイプの表示 */}
                <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
                  {getFrequencyText()}
                </span>
                {/* ストリークの表示 */}
                {isLoggedIn &&
                  habit.currentStreak !== undefined &&
                  habit.currentStreak > 0 && (
                    <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-500 px-2 py-0.5 rounded-full">
                      🔥 {habit.currentStreak}日連続
                    </span>
                  )}
              </div>
            </div>
          </div>

          <div className="relative flex items-center gap-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="text-xl transition-transform duration-200 hover:scale-125 hover:rotate-12"
            >
              ✏️
            </button>

            <button
              onClick={() => deleteHabit(habit.id)}
              className="text-xl transition-transform duration-200 hover:scale-125 hover:rotate-12"
            >
              🗑️
            </button>
          </div>

          <EditHabitModal
            habit={habit}
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
          />
        </>
      </div>
    </div>
  );
}
