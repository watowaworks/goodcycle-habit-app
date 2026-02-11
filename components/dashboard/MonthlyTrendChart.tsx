"use client";

import { Habit } from "@/types";
import { calculateMonthlyTrend } from "@/lib/utils";
import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Props = {
  habit: Habit;
};

// 日付をフォーマット（M/D形式）
function formatDate(dateString: string) {
  const date = new Date(dateString + "T00:00:00");
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}

type CustomTooltipProps = {
  active?: boolean;
  payload?: Array<{ value: number; payload: { date: string } }>;
};

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border dark:border-gray-700 rounded shadow-lg">
        <p className="font-semibold text-gray-900 dark:text-gray-100">{formatDate(payload[0].payload.date)}</p>
        <p className="text-emerald-600 dark:text-emerald-400">
          完了率: {payload[0].value.toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
}

export default function MonthlyTrendChart({ habit }: Props) {
  const trendData = useMemo(() => {
    return calculateMonthlyTrend(habit);
  }, [habit]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-6">
      <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">📈 月間の完了推移率</h2>

      {trendData.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">データがありません</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              className="dark:fill-gray-400"
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              className="dark:fill-gray-400"
              label={{
                value: "完了率 (%)",
                angle: -90,
                position: "insideLeft",
                style: { fill: "#6b7280" },
              }}
            />
            <Tooltip content={(props) => <CustomTooltip {...props} />} />
            <Line
              type="monotone"
              dataKey="completionRate"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: "#10b981", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
