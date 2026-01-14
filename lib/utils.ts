import { Habit } from "@/types";

// DateオブジェクトをYYYY-MM-DD形式の文字列に変換
export function formatDateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 今日の日付をYYYY-MM-DD形式で取得（JST）
export function getTodayString(): string {
  return formatDateToString(new Date());
}

// 日付文字列をDateオブジェクトに変換
export function parseDateString(dateString: string): Date {
  return new Date(dateString + "T00:00:00");
}

// 前回の実施予定日を取得
export function getPreviousDueDate(habit: Habit, currentDate: string): string | null{
  const current = parseDateString(currentDate);

  switch (habit.frequencyType) {
    case "daily": {
      const previousDay = new Date(current);
      previousDay.setDate(previousDay.getDate() - 1);
      return formatDateToString(previousDay);
    }
    case "weekly": {
      if (!habit.daysOfWeek || habit.daysOfWeek.length === 0) {
        return null;
      }

      const currentDayOfWeek = current.getDay();
      const sortedDays = [...(habit.daysOfWeek || [])].sort((a, b) => a - b);
      const previousDayOfWeek = sortedDays.filter(day => day < currentDayOfWeek).sort((a, b) => b - a)[0];

      let daysToSubtract: number;
      
      if (previousDayOfWeek !== undefined) {
        daysToSubtract = currentDayOfWeek - previousDayOfWeek;
      } else {
        const targetDayOfWeek = sortedDays[sortedDays.length - 1];
        daysToSubtract = currentDayOfWeek - targetDayOfWeek + 7;
      }

      const previousDay = new Date(current);
      previousDay.setDate(previousDay.getDate() - daysToSubtract);
      return formatDateToString(previousDay);
    }
    case "interval": {
      if (!habit.startDate || !habit.intervalDays) {
        return null;
      }
      const startDate = parseDateString(habit.startDate);
      if (current < startDate) return null;

      const diffMs = current.getTime() - startDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return null;

      const quotient = Math.floor(diffDays / habit.intervalDays);
      const daysFromStart = isHabitDueOnDate(habit, currentDate)
        ? (quotient - 1) * habit.intervalDays
        : quotient * habit.intervalDays;

      const previousDay = new Date(startDate);
      previousDay.setDate(previousDay.getDate() + daysFromStart);
      return formatDateToString(previousDay);
    }
    default:
      return null;
  }
}

export function calculateStreaks(habit: Habit): {
  longestStreak: number;
  currentStreak: number;
} {
  // 最長ストリークの計算
  // 1. 日付を昇順にソート
  const sortedDates = [...new Set(habit.completedDates || [])].sort();
  // 2. 連続している期間を確認
  let longestStreak = sortedDates.length > 0 ? 1 : 0;
  let tempStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = sortedDates[i - 1];
    const currDate = sortedDates[i];
    
    // 前回の実施予定日を取得
    const previousDueDate = getPreviousDueDate(habit, currDate);
    
    if (prevDate === previousDueDate) {
      // 連続している
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      // 連続が途切れた
      tempStreak = 1;
    }
  }

  // 現在ストリークの計算
  const today = getTodayString();
  let currentStreak = 0;

  // 今日が実施日かどうかを確認
  if (isHabitDueOnDate(habit, today)) {
    if (habit.completedDates?.includes(today)) {
      // 今日が完了している
      currentStreak = 1;
      let checkDate = today;

      // 前の実施日を遡って連続日数をカウント
      while (true) {
        const previousDueDate = getPreviousDueDate(habit, checkDate);
        if (!previousDueDate) break;

        if (habit.completedDates?.includes(previousDueDate)) {
          currentStreak++;
          checkDate = previousDueDate;
        } else {
          break;
        }
      }
    } else {
      // 今日が未完了でも、前の実施日が完了していればストリークは続いている
      const previousDueDate = getPreviousDueDate(habit, today);
      if (previousDueDate && habit.completedDates?.includes(previousDueDate)) {
        currentStreak = 1;
        let checkDate = previousDueDate;

        // さらに前の実施日を遡って連続日数をカウント
        while (true) {
          const prev = getPreviousDueDate(habit, checkDate);
          if (!prev) break;

          if (habit.completedDates?.includes(prev)) {
            currentStreak++;
            checkDate = prev;
          } else {
            break;
          }
        }
      }
    }
  } else {
    const previousDueDate = getPreviousDueDate(habit, today);
    if (previousDueDate && habit.completedDates?.includes(previousDueDate)) {
      currentStreak = 1;
      let checkDate = previousDueDate;

      // さらに前の実施日を遡って連続日数をカウント
      while (true) {
        const prev = getPreviousDueDate(habit, checkDate);
        if (!prev) break;

        if (habit.completedDates?.includes(prev)) {
          currentStreak++;
          checkDate = prev;
        } else {
          break;
        }
      }
    }
  }

  return {
    longestStreak,
    currentStreak,
  };
}

// 指定日（または今日）が含まれる週の範囲を取得（月曜日始まり）
export function getWeekRange(date?: Date): {
  startDate: string;
  endDate: string;
} {
  // 日付が指定されていない場合は今日を使用
  const targetDate = date || new Date();
  
  // 曜日を取得（0=日曜、1=月曜、2=火曜...）
  const dayOfWeek = targetDate.getDay();
  
  // 月曜日までの日数を計算
  // 日曜日（0）の場合は6日前、月曜日（1）の場合は0日前、火曜日（2）の場合は1日前...
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  // 週の開始日（月曜日）を計算
  const monday = new Date(targetDate);
  monday.setDate(monday.getDate() - daysToMonday);
  
  // 週の終了日（日曜日）を計算（月曜日の6日後）
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  
  return {
    startDate: formatDateToString(monday),
    endDate: formatDateToString(sunday),
  };
}

export function getPreviousWeekRange(date?: Date): {
  startDate: string;
  endDate: string;
} {
  const thisWeekRange = getWeekRange(date);
  const startDate = parseDateString(thisWeekRange.startDate);
  const endDate = parseDateString(thisWeekRange.endDate);
  
  startDate.setDate(startDate.getDate() - 7);
  endDate.setDate(endDate.getDate() - 7);
  return {
    startDate: formatDateToString(startDate),
    endDate: formatDateToString(endDate),
  };
}

// 今月の範囲を取得
export function getCurrentMonthRange(): {
  startDate: string;
  endDate: string;
} {
  const today = new Date();
  
  // 今月の1日を取得（年と月はそのままで、日だけ1日に設定）
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  return {
    startDate: formatDateToString(firstDay),
    endDate: formatDateToString(lastDay),
  };
}

// 開始日から終了日までのすべての日付を配列として生成
export function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  
  // 開始日をDateオブジェクトに変換
  const start = parseDateString(startDate);
  const end = parseDateString(endDate);
  
  // 開始日から終了日まで、1日ずつ進めながら日付を追加
  const currentDate = new Date(start);
  
  // 終了日を超えるまでループ
  while (currentDate <= end) {
    dates.push(formatDateToString(currentDate));
    // 次の日に進む
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

// 指定期間の完了率を計算（0-100のパーセンテージ）
export function calculateCompletionRate(habit: Habit, startDate: string, endDate: string): number {
  // 期間内のすべての日付を生成
  const dateRange = generateDateRange(startDate, endDate);
  const scheduledDates = dateRange.filter(date => isHabitDueOnDate(habit, date));
  const targetDays = scheduledDates.length;
  
  // 期間内に日付がない場合、またはcompletedDatesが存在しない場合は0%を返す
  if (targetDays === 0 || !habit.completedDates || habit.completedDates.length === 0) {
    return 0;
  }
  
  // 期間内の完了日数をカウント
  const completedDays = scheduledDates.filter(date => 
    habit.completedDates!.includes(date)
  ).length;
  
  // 完了率を計算（小数点以下1桁に丸める）
  const completionRate = (completedDays / targetDays) * 100;
  return Math.round(completionRate * 10) / 10;
}

// 開始日から終了日の各日の完了状態を取得（カレンダー表示用）
export function getCompletionStatusForPeriod(
  habit: Habit,
  startDate: string,
  endDate: string
): { 
  date: string; 
  completed: boolean;
  isDue: boolean;
}[] {
  const dateRange = generateDateRange(startDate, endDate);
  const result = dateRange.map((date) => {
    const isDue = isHabitDueOnDate(habit, date);
    const completed = habit.completedDates?.includes(date) || false;
    return {
      date,
      completed,
      isDue,
    }
  })
  
  return result;
}

// 今月1日から今日までの日別累積完了率データを生成（グラフ用）
export function calculateMonthlyTrend(habit: Habit): {
  date: string;
  completionRate: number;
}[] {
  // 今月1日から今日までの範囲を取得
  const monthRange = getCurrentMonthRange();
  const startDate = monthRange.startDate;
  // 終了日を今日にする
  const endDate = getTodayString();
  
  // 期間内のすべての日付を生成
  const dateRange = generateDateRange(startDate, endDate);
  
  // 各日について、1日からその日までの累積完了率を計算
  const trendData = dateRange.map((currentDate) => {
    // 1日から現在の日付までの完了率を計算
    const completionRate = calculateCompletionRate(habit, startDate, currentDate);
    
    return {
      date: currentDate,
      completionRate,
    };
  });
  
  return trendData;
}

// 最も継続できている習慣を見つける（currentStreakが最も長い習慣、複数可）
export function findMostConsistentHabit(habits: Habit[]): Habit[] {
  // 習慣がない場合は空配列を返す
  if (habits.length === 0) {
    return [];
  }
  
  // 最大ストリークを探す
  let maxStreak = -1;
  
  for (const habit of habits) {
    // currentStreakが存在しない場合は0として扱う
    const currentStreak = habit.currentStreak ?? 0;
    
    // より長いストリークを見つけたら更新
    if (currentStreak > maxStreak) {
      maxStreak = currentStreak;
    }
  }
  
  // すべての習慣のストリークが0以下の場合は空配列を返す
  if (maxStreak <= 0) {
    return [];
  }
  
  // 最大ストリークを持つすべての習慣を返す
  return habits.filter((habit) => (habit.currentStreak ?? 0) === maxStreak);
}

// 指定日が習慣の実施日かどうかを判定
export function isHabitDueOnDate(habit: Habit, date: string): boolean {
  const targetDate = parseDateString(date);

  switch (habit.frequencyType) {
    case "daily":
      return true;
    case "weekly":
      return habit.daysOfWeek?.includes(targetDate.getDay()) ?? false;
    case "interval":
      if (!habit.startDate || !habit.intervalDays) {
        return false;
      }
      const startDate = parseDateString(habit.startDate!);
      const diffMs = targetDate.getTime() - startDate.getTime();
      if (diffMs < 0) return false;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      return diffDays % habit.intervalDays === 0;
    default:
      return false;
  }
}

// 成長度を計算
export function calculateGrowthRate(habit: Habit): number {
  // createdAtをDateオブジェクトに変換
  const createdAtDate = habit.createdAt instanceof Date 
    ? habit.createdAt 
    : new Date(habit.createdAt);

  // 全期間の完了率を計算（既存の関数を活用）
  const startDate = formatDateToString(createdAtDate);
  const endDate = getTodayString();
  const completionRate = calculateCompletionRate(habit, startDate, endDate);

  // ストリークボーナス（最大30日で20%）
  const currentStreak = habit.currentStreak ?? 0;
  const maxStreakBonus = 30;
  const streakBonus = Math.min(currentStreak, maxStreakBonus) / maxStreakBonus * 20;

  // 成長度 = 完了率（80%） + ストリークボーナス（20%）
  const growthRate = completionRate * 0.8 + streakBonus;

  return Math.min(100, Math.max(0, growthRate));
}

export function getTreeModelLevel(growthRate: number): number {
  if (growthRate >= 90) return 5;
  if (growthRate >= 70) return 4;
  if (growthRate >= 50) return 3;
  if (growthRate >= 25) return 2;
  return 1;
}

// 庭全体の天気を決定
export function calculateGardenWeather(habits: Habit[]): "sunny" | "cloudy" | "rainy" | "stormy" {
  // 1. 習慣がない場合の処理
  if (habits.length === 0) {
    return 'cloudy'; // デフォルトは曇り
  }

  // 2. 直近7日の日付範囲を計算
  const today = getTodayString();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const startDate = formatDateToString(sevenDaysAgo);

  // 3. 各習慣の直近7日の完了率を計算し、平均を求める
  const totalCompletionRate = habits.reduce((sum, habit) => {
    const completionRate = calculateCompletionRate(habit, startDate, today);
    return sum + completionRate;
  }, 0);
  const averageCompletionRate = totalCompletionRate / habits.length;

  // 4. 平均完了率に応じて天気を決定
  // 晴れ: 75%以上、曇り: 50-75%、雨: 25-50%、雷雨: 25%未満
  if (averageCompletionRate >= 75) {
    return 'sunny';
  } else if (averageCompletionRate >= 50) {
    return 'cloudy';
  } else if (averageCompletionRate >= 25) {
    return 'rainy';
  } else {
    return 'stormy';
  }
}