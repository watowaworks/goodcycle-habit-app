"use client";

import { Habit } from "@/types";
import CompletionRateCard from "./CompletionRateCard";
import CompletionCalendar from "./CompletionCalendar";
import MonthlyTrendChart from "./MonthlyTrendChart";
import Tree3D from "./Tree3D";

type Props = {
  habit: Habit;
};

export default function HabitDashboardContent({ habit }: Props) {
  return (
    <div className="space-y-6">
      {/* 3D木モデル */}
      <Tree3D habit={habit} />
      {/* 今週の完了率と先週との比較 */}
      <CompletionRateCard habit={habit} />

      {/* 過去7日間/30日間の完了状況 */}
      <CompletionCalendar habit={habit} />

      {/* 月間の完了推移率 */}
      <MonthlyTrendChart habit={habit} />
    </div>
  );
}

