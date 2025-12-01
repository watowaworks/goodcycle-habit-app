export type Habit = {
  id: string;
  title: string;
  category: string;
  color: string;
  completed: boolean;
  createdAt: Date;
  completedDates?: string[];
  longestStreak?: number;
  currentStreak?: number;
};