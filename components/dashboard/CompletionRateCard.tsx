"use client";

import { Habit } from "@/types";
import { getWeekRange, getPreviousWeekRange, calculateCompletionRate } from "@/lib/utils";
import { useMemo } from "react";

type Props = {
  habit: Habit;
};

export default function CompletionRateCard({ habit }: Props) {
  const { thisWeekRate, prevWeekRate, comparison } = useMemo(() => {
    const thisWeek = getWeekRange();
    const prevWeek = getPreviousWeekRange();

    const thisWeekCompletionRate = calculateCompletionRate(
      habit,
      thisWeek.startDate,
      thisWeek.endDate
    );

    const prevWeekCompletionRate = calculateCompletionRate(
      habit,
      prevWeek.startDate,
      prevWeek.endDate
    );

    const diff = thisWeekCompletionRate - prevWeekCompletionRate;

    return {
      thisWeekRate: thisWeekCompletionRate,
      prevWeekRate: prevWeekCompletionRate,
      comparison: diff,
    };
  }, [habit]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-bold mb-4">📊 今週の完了率</h2>
      
      <div className="space-y-4">
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-emerald-600">
              {thisWeekRate}%
            </span>
            <span className="text-sm text-gray-500">今週</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-emerald-500 h-3 rounded-full transition-all"
              style={{ width: `${thisWeekRate}%` }}
            />
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">先週との比較:</span>
            <span
              className={`font-semibold ${
                comparison > 0
                  ? "text-green-600"
                  : comparison < 0
                  ? "text-red-600"
                  : "text-gray-600"
              }`}
            >
              {comparison > 0 ? "⬆️" : comparison < 0 ? "⬇️" : "➡️"} {Math.abs(comparison).toFixed(1)}%
            </span>
            <span className="text-xs text-gray-500">
              (先週: {prevWeekRate}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

