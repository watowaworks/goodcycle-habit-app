"use client";

import { Habit } from "@/types";
import {
  getCompletionStatusForPeriod,
  getCurrentMonthRange,
  getTodayString,
  getWeekRange,
} from "@/lib/utils";
import { useState, useMemo } from "react";

type Props = {
  habit: Habit;
};

export default function CompletionCalendar({ habit }: Props) {
  const [range, setRange] = useState<"week" | "month">("week");
  const thisWeek = getWeekRange();
  const thisMonth = getCurrentMonthRange();

  const completionStatus = useMemo(() => {
    if (range === "week") {
      return getCompletionStatusForPeriod(
        habit,
        thisWeek.startDate,
        thisWeek.endDate
      );
    } else {
      return getCompletionStatusForPeriod(
        habit,
        thisMonth.startDate,
        thisMonth.endDate
      );
    }
  }, [habit, range]);

  // 日付をフォーマット（MM/DD形式）
  const formatDate = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00");
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  };

  // 曜日を取得（0=日曜、1=月曜...）
  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00");
    return date.getDay();
  };

  // 月曜始まりの曜日ラベル
  const dayLabels = ["月", "火", "水", "木", "金", "土", "日"];

  // 月間表示時、1日目の前に空セルを追加するための計算
  const getEmptyCellsCount = () => {
    if (range === "week") return 0;
    // 月の1日目の曜日を取得（0=日曜、1=月曜...）
    const firstDate = completionStatus[0]?.date;
    if (!firstDate) return 0;
    const dayOfWeek = getDayOfWeek(firstDate);
    // 月曜始まりに変換（月=0, 火=1, ..., 日=6）
    return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  };

  const emptyCells = getEmptyCellsCount();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">📅 完了状況</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setRange("week")}
            className={`px-3 py-1 rounded text-sm transition ${
              range === "week"
                ? "bg-emerald-500 dark:bg-emerald-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            週間
          </button>
          <button
            onClick={() => setRange("month")}
            className={`px-3 py-1 rounded text-sm transition ${
              range === "month"
                ? "bg-emerald-500 dark:bg-emerald-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            月間
          </button>
        </div>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {dayLabels.map((label) => (
          <div
            key={label}
            className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400"
          >
            {label}
          </div>
        ))}
      </div>

      {/* 日付グリッド */}
      <div className="grid grid-cols-7 gap-2">
        {/* 月間表示時の空セル */}
        {Array.from({ length: emptyCells }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {completionStatus.map(({ date, completed, isDue }) => {
          const dayOfWeek = getDayOfWeek(date);
          const isToday = date === getTodayString();

          return (
            <div
              key={date}
              className={`
                aspect-square rounded-lg flex flex-col items-center justify-center text-xs
                ${
                  completed
                    ? "bg-emerald-500 dark:bg-emerald-600 text-white"
                    : !isDue
                    ? "bg-gray-50 dark:bg-gray-900/50 text-gray-300 dark:text-gray-600 border-2 border-dashed border-gray-300 dark:border-gray-700"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                }
                ${isToday ? "ring-2 ring-blue-500 dark:ring-blue-400" : ""}
              `}
              title={`${formatDate(date)} (${
                dayLabels[dayOfWeek === 0 ? 6 : dayOfWeek - 1]
              })`}
            >
              <span className="font-bold">
                {new Date(date + "T00:00:00").getDate()}
              </span>
              {completed && <span className="text-xs mt-1">✓</span>}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-emerald-500 dark:bg-emerald-600 rounded"></div>
          <span>完了</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 dark:bg-gray-700 rounded"></div>
          <span>未完了</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-50 dark:bg-gray-900/50 rounded border-2 border-dashed border-gray-300 dark:border-gray-700"></div>
          <span>対象外</span>
        </div>
      </div>
    </div>
  );
}
