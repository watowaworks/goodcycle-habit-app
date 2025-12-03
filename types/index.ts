export type Habit = {
  id: string;
  title: string;
  category: string;
  color: string;
  completed: boolean;
  createdAt: string;
  completedDates?: string[];
  longestStreak?: number;
  currentStreak?: number;
  frequencyType: "daily" | "weekly" | "interval";
  daysOfWeek?: number[];
  intervalDays?: number;
  startDate?: string;
};