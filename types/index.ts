export type FrequencyType = "daily" | "weekly" | "interval";
export type NotificationSettings = {
  enabled: boolean;
  reminderTime?: string;
};

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
  frequencyType: FrequencyType;
  daysOfWeek?: number[];
  intervalDays?: number;
  startDate?: string;
  notification?: NotificationSettings;
};