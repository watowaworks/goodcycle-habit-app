"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Habit } from "@/types";
import { auth } from "@/lib/firebase";
import { DEFAULT_HABIT_COLOR } from "@/lib/habitColors";
import EditHabitModal from "./EditHabitModal";

type Props = { habit: Habit };

export default function HabitCard({ habit }: Props) {
  const toggleHabitStatus = useStore((state) => state.toggleHabitStatus);
  const deleteHabit = useStore((state) => state.deleteHabit);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const isLoggedIn = !!auth.currentUser;

  const currentColor = habit.color || DEFAULT_HABIT_COLOR;

  return (
    <div
      className="flex items-center justify-between rounded-xl p-4 shadow hover:shadow-md transition"
      style={{ backgroundColor: currentColor }}
    >
      <>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={habit.completed}
            onChange={() => toggleHabitStatus(habit.id)}
            className="w-5 h-5 accent-blue-500 cursor-pointer"
          />
          <div className="flex flex-col">
            <p
              className={`text-lg font-medium ${
                habit.completed
                  ? "line-through text-gray-400"
                  : "text-gray-800"
              }`}
            >
              {habit.title}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-gray-500">{habit.category}</p>
              {/* ストリークの表示 */}
              {isLoggedIn &&
                habit.currentStreak !== undefined &&
                habit.currentStreak > 0 && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
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
  );
}
