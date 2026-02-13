import { describe, it, expect } from "vitest";
import {
  formatDateToString,
  parseDateString,
  isHabitDueOnDate,
  getPreviousDueDate,
  calculateStreaks,
  calculateCompletionRate,
} from "./utils";
import type { Habit } from "@/types";

describe("formatDateToString", () => {
  it("日付を YYYY-MM-DD 形式の文字列に変換する", () => {
    const date = new Date(2026, 1, 13); // 2026年2月13日（月は0始まり）
    expect(formatDateToString(date)).toBe("2026-02-13");
  });

  it("1桁の月・日はゼロ埋めする", () => {
    const date = new Date(2026, 0, 5); // 2026年1月5日
    expect(formatDateToString(date)).toBe("2026-01-05");
  });
});

describe("parseDateString", () => {
  it("YYYY-MM-DD 形式の文字列を Date に変換する", () => {
    const result = parseDateString("2026-02-13");
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(13);
  });
});

describe("isHabitDueOnDate", () => {
  const baseHabit: Habit = {
    id: "1",
    title: "習慣",
    category: "health",
    color: "#000",
    completed: false,
    createdAt: new Date(),
    frequencyType: "daily",
  };

  it("毎日タイプは常に実施日", () => {
    const habit: Habit = { ...baseHabit, frequencyType: "daily" };
    expect(isHabitDueOnDate(habit, "2026-02-13")).toBe(true);
    expect(isHabitDueOnDate(habit, "2026-12-31")).toBe(true);
  });

  it("毎週タイプは指定曜日のみ実施日", () => {
    // 2025-02-09 は日曜日（0）
    const habit: Habit = { ...baseHabit, frequencyType: "weekly", daysOfWeek: [0, 3] };
    expect(isHabitDueOnDate(habit, "2026-02-08")).toBe(true); // 日曜
    expect(isHabitDueOnDate(habit, "2026-02-11")).toBe(true); // 水曜
    expect(isHabitDueOnDate(habit, "2026-02-09")).toBe(false); // 月曜
  });

  it("間隔タイプは startDate から intervalDays ごとに実施日", () => {
    const habit: Habit = {
      ...baseHabit,
      frequencyType: "interval",
      startDate: "2025-02-09",
      intervalDays: 3,
    };
    expect(isHabitDueOnDate(habit, "2025-02-09")).toBe(true); // 0日目
    expect(isHabitDueOnDate(habit, "2025-02-12")).toBe(true); // 3日目
    expect(isHabitDueOnDate(habit, "2025-02-15")).toBe(true); // 6日目
    expect(isHabitDueOnDate(habit, "2025-02-10")).toBe(false); // 1日目
  });
});

describe("getPreviousDueDate", () => {
  const baseHabit: Habit = {
    id: "1",
    title: "習慣",
    category: "health",
    color: "#000",
    completed: false,
    createdAt: new Date(),
    frequencyType: "daily",
  }
  it("毎日タイプは前日", () => {
    const habit: Habit = { ...baseHabit, frequencyType: "daily" };
    expect(getPreviousDueDate(habit, "2026-02-09")).toBe("2026-02-08");
  });

  it("毎週タイプは一つ前の指定曜日", () => {
    const habit: Habit = { ...baseHabit, frequencyType: "weekly", daysOfWeek: [0, 3] };
    expect(getPreviousDueDate(habit, "2026-02-08")).toBe("2026-02-04");
  });

  it("間隔タイプは開始日から間隔日数分前の日", () => {
    const habit: Habit = { ...baseHabit, frequencyType: "interval", startDate: "2026-02-09", intervalDays: 3 };
    expect(getPreviousDueDate(habit, "2026-02-12")).toBe("2026-02-09");
  });
});

describe("calculateStreaks", () => {
  const baseHabit: Habit = {
    id: "1",
    title: "習慣",
    category: "health",
    color: "#000",
    completed: false,
    createdAt: new Date(),
    frequencyType: "daily",
  }
  it("3日連続で完了している場合現在ストリーク数は3", () => {
    const habit: Habit = { ...baseHabit, frequencyType: "daily", completedDates: ["2026-02-08", "2026-02-09", "2026-02-10"] };
    expect(calculateStreaks(habit, "2026-02-10")).toEqual({ longestStreak: 3, currentStreak: 3 });
  });

  it("3日目の実施日を過ぎていない場合現在ストリーク数は2", () => {
    const habit: Habit = { ...baseHabit, frequencyType: "weekly", daysOfWeek: [0, 3], completedDates: ["2026-02-08", "2026-02-11"] };
    expect(calculateStreaks(habit, "2026-02-15")).toEqual({ longestStreak: 2, currentStreak: 2 });
  });

  it("3日目の実施日を過ぎた場合現在ストリーク数は0", () => {
    const habit: Habit = { ...baseHabit, frequencyType: "interval", startDate: "2026-02-09", intervalDays: 3, completedDates: ["2026-02-09", "2026-02-12"] };
    expect(calculateStreaks(habit, "2026-02-16")).toEqual({ longestStreak: 2, currentStreak: 0 });
  });
});

describe("calculateCompletionRate", () => {
  const baseHabit: Habit = {
    id: "1",
    title: "習慣",
    category: "health",
    color: "#000",
    completed: false,
    createdAt: new Date(),
    frequencyType: "daily",
  };

  it("3日間のうちすべて完了している場合100%", () => {
    const habit: Habit = { ...baseHabit, completedDates: ["2026-02-09", "2026-02-10", "2026-02-11"] };
    expect(calculateCompletionRate(habit, "2026-02-09", "2026-02-11")).toBe(100);
  });

  it("3日間のうち2日が完了している場合67%", () => {
    const habit: Habit = { ...baseHabit, completedDates: ["2026-02-09", "2026-02-11"] };
    expect(calculateCompletionRate(habit, "2026-02-09", "2026-02-11")).toBe(67);
  });

  it("3日間のうち0日が完了している場合0%", () => {
    const habit: Habit = { ...baseHabit, completedDates: [] };
    expect(calculateCompletionRate(habit, "2026-02-09", "2026-02-11")).toBe(0);
  });

  it("毎週タイプで実施日2日のうち1日完了している場合50%", () => {
    // daysOfWeek [0, 3] = 日曜・水曜 → 期間内で実施日は 2/11(水), 2/15(日) の2日
    const habit: Habit = { ...baseHabit, frequencyType: "weekly", daysOfWeek: [0, 3], completedDates: ["2026-02-11"] };
    expect(calculateCompletionRate(habit, "2026-02-09", "2026-02-15")).toBe(50);
  });

  it("間隔タイプで実施日3日のうち2日完了している場合67%", () => {
    const habit: Habit = { ...baseHabit, frequencyType: "interval", startDate: "2026-02-09", intervalDays: 3, completedDates: ["2026-02-09", "2026-02-12"] };
    expect(calculateCompletionRate(habit, "2026-02-09", "2026-02-15")).toBe(67);
  });
});