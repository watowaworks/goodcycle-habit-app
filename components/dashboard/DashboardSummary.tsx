"use client";

import { Habit } from "@/types";
import { findMostConsistentHabit } from "@/lib/utils";

type Props = {
  habits: Habit[];
};

export default function DashboardSummary({ habits }: Props) {
  const mostConsistentHabits = findMostConsistentHabit(habits);

  if (mostConsistentHabits.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 mb-6 text-center">
        <p className="text-gray-600">
          まだ継続中の習慣がありません。習慣を続けてみましょう！
        </p>
      </div>
    );
  }

  const streak = mostConsistentHabits[0].currentStreak ?? 0;

  return (
    <div className="bg-linear-to-r from-orange-100 to-yellow-100 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🏆</span>
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">
            {mostConsistentHabits.length === 1
              ? "最も継続できている習慣"
              : `最も継続できている習慣（${mostConsistentHabits.length}件）`}
          </p>
          <div className="space-y-2">
            {mostConsistentHabits.map((habit) => (
              <div key={habit.id} className="flex items-center gap-2">
                <p className="text-lg font-bold text-gray-800">{habit.title}</p>
                <p className="text-sm text-gray-600">{streak}日連続</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
