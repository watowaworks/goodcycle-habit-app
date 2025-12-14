"use client";

import { Habit } from "@/types";
import { useState, useRef } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { DEFAULT_HABIT_COLOR } from "@/lib/habitColors";

type Props = {
  habits: Habit[];
  selectedHabitId: string | null;
  onSelectHabit: (habitId: string) => void;
};

export default function HabitTabs({
  habits,
  selectedHabitId,
  onSelectHabit,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setIsOpen(false), isOpen);

  const selectedHabit = habits.find((h) => h.id === selectedHabitId);

  return (
    <div className="relative mb-6" ref={dropdownRef}>
      {/* ドロップダウンボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 shadow-sm dark:shadow-gray-900/50 transition hover:border-gray-300 dark:hover:border-gray-600 hover:shadow"
      >
        <div className="flex items-center gap-3">
          {selectedHabit && (
            <div
              className="h-4 w-4 rounded-full border border-gray-200 dark:border-gray-600"
              style={{
                backgroundColor: selectedHabit.color || DEFAULT_HABIT_COLOR,
              }}
            />
          )}
          <span className="font-medium text-gray-800 dark:text-gray-200">
            {selectedHabit?.title || "習慣を選択"}
          </span>
        </div>
        <svg
          className={`h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
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

      {/* ドロップダウンメニュー */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 shadow-lg dark:shadow-gray-900/50">
          {habits.map((habit) => {
            const isSelected = habit.id === selectedHabitId;
            return (
              <button
                key={habit.id}
                onClick={() => {
                  onSelectHabit(habit.id);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                  isSelected
                    ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <div
                  className="h-4 w-4 rounded-full border border-gray-200 dark:border-gray-600"
                  style={{
                    backgroundColor: habit.color || DEFAULT_HABIT_COLOR,
                  }}
                />
                <span className="font-medium">{habit.title}</span>
                {isSelected && (
                  <svg
                    className="ml-auto h-5 w-5 text-emerald-500 dark:text-emerald-400"
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
            );
          })}
        </div>
      )}
    </div>
  );
}
