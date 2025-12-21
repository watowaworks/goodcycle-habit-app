import { create } from "zustand";
import { Habit } from "@/types";
import { persist } from "zustand/middleware";
import {
  addHabit as addHabitToFirestore,
  getUserHabits,
  deleteHabit as deleteHabitFromFirestore,
  updateHabit,
  getCustomCategories as getCustomCategoriesFromFirestore,
  addCustomCategory as addCustomCategoryToFirestore,
  deleteCustomCategory as deleteCustomCategoryFromFirestore,
  updateUserNotificationTimes,
} from "@/lib/firestore";
import { auth } from "@/lib/firebase";
import { calculateStreaks, getTodayString, isHabitDueOnDate } from "./utils";
import { DEFAULT_HABIT_COLOR } from "./habitColors";

type Filter = "all" | "completed" | "incomplete";

type Store = {
  localHabits: Habit[];  // 非ログイン時のローカル保存
  habits: Habit[];       // Firestore習慣
  filter: Filter;
  categories: string[];  // すべてのカテゴリ（デフォルト + カスタム）
  fetchHabits: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  addHabit: (habit: Habit) => Promise<void>;
  toggleHabitStatus: (id: string) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  updateHabitFields: (id: string, fields: Partial<Habit>) => Promise<void>;
  addCategory: (category: string) => Promise<void>;
  deleteCategory: (category: string) => Promise<void>;
  setFilter: (filter: Filter) => void;
  resetFilters: () => void;
  addLocalHabit: (habit: Habit) => void;
  clearLocalHabits: () => void;
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      localHabits: [],
      habits: [],
      filter: "all",
      categories: ["生活習慣", "運動", "健康", "学習", "仕事", "趣味", "お金"], // デフォルトカテゴリ

      fetchHabits: async () => {
        try {
          const user = auth.currentUser;
          if (!user) return;
          const habits = await getUserHabits();
          // 今日の日付を取得
          const today = getTodayString();
          // 各習慣について、更新すべきフィールドを記録
          const habitUpdates = new Map<string, Partial<Habit>>();

          const syncedHabits = habits.map(habit => {
            const normalizedHabit = {
              ...habit,
              color: habit.color || DEFAULT_HABIT_COLOR,
            };
            const shouldBeCompleted = habit.completedDates?.includes(today) || false;
            const { longestStreak, currentStreak } = calculateStreaks(normalizedHabit);
            
            // 更新が必要なフィールドを記録
            const updates: Partial<Habit> = {};
            
            if (habit.completed !== shouldBeCompleted) {
              updates.completed = shouldBeCompleted;
            }
            
            if (habit.longestStreak !== longestStreak || habit.currentStreak !== currentStreak) {
              updates.currentStreak = currentStreak;
              updates.longestStreak = longestStreak;
            }
            
            // 更新がある場合のみ、マップに追加
            if (!habit.color) {
              updates.color = DEFAULT_HABIT_COLOR;
            }

            if (Object.keys(updates).length > 0) {
              habitUpdates.set(habit.id, updates);
            }
            
            return {
              ...normalizedHabit,
              completed: shouldBeCompleted,
              currentStreak,
              longestStreak,
            };
          });

          // 更新がある習慣のみFirestoreに保存
          for (const [id, updates] of habitUpdates.entries()) {
            await updateHabit(id, updates);
          }

          // 通知時刻リストを更新（既存ユーザーのマイグレーションも含む）
          await updateUserNotificationTimes();

          set({ habits: syncedHabits });
        } catch (error) {
          console.error("習慣の取得に失敗しました:", error);
        }
      },

      addHabit: async (habit) => {
        try {
          const user = auth.currentUser;
          if (user) {
            // Firestoreに追加し、生成されたIDを取得
            const firestoreId = await addHabitToFirestore(habit);
            // FirestoreのIDを使って習慣を更新
            const habitWithFirestoreId = { ...habit, id: firestoreId };
            set({ habits: [...get().habits, habitWithFirestoreId] });
          } else {
            set({ localHabits: [...get().localHabits, habit] });
          }
        } catch (error) {
          console.error("習慣の追加に失敗しました:", error);
        }
      },

      toggleHabitStatus: async (id) => {
        try {
          const user = auth.currentUser;
          if (user) {
            const habit = get().habits.find((h) => h.id === id);
            if (!habit) return;

            const today = getTodayString();

            const newCompleted = !habit.completed;
            const completedDates =  habit.completedDates || [];

            let updatedCompletedDates: string[];

            if (newCompleted) {
              // 完了にする: 今日の日付を追加（重複チェック）
              if (!completedDates.includes(today)) {
                updatedCompletedDates = [...completedDates, today];
              } else {
                updatedCompletedDates = completedDates; // 既に含まれている場合はそのまま
              }
            } else {
              // 未完了にする: 今日の日付を削除
              updatedCompletedDates = completedDates.filter((date) => date !== today);
            }

            // 更新後の完了状態でストリークの計算
            const updatedHabit = {
              ...habit,
              completedDates: updatedCompletedDates,
            }
            const { longestStreak, currentStreak } = calculateStreaks(updatedHabit);

            const updated = { 
              completed: newCompleted,
              completedDates: updatedCompletedDates,
              longestStreak,
              currentStreak,
            };

            await updateHabit(id, updated);
            set({
              habits: get().habits.map((h) =>
                h.id === id ? { ...h,
                  completed: newCompleted,
                  completedDates: updatedCompletedDates,
                  longestStreak,
                  currentStreak,
                  } : h
              ),
            });
          } else {
            const habit = get().localHabits.find((h) => h.id === id);
            if (!habit) return;

            const today = getTodayString();
            if (!isHabitDueOnDate(habit, today)) {
              alert("この習慣は今日の実施日ではありません。");
              return;
            }
            
            set({
              localHabits: get().localHabits.map((h) => 
                h.id === id ? { ...h, completed: !h.completed } : h
              ),
            });
          }
        } catch (error) {
          console.error("習慣ステータス更新に失敗しました:", error);
        }
      },

      deleteHabit: async (id) => {
        try {
          const confirmed = confirm("習慣を削除しますか？");
          if (!confirmed) return;
          
          const user = auth.currentUser;
          if (user) {
            // まずFirestoreから削除
            await deleteHabitFromFirestore(id);
            // 成功したら状態から削除
            set((state) => ({
              habits: state.habits.filter((h) => h.id !== id),
            }));
          } else {
            set((state) => ({
              localHabits: state.localHabits.filter((h) => h.id !== id),
            }));
          }
        } catch (error) {
          console.error("習慣の削除に失敗しました:", error);
          alert("習慣の削除に失敗しました。もう一度お試しください。");
        }
      },

      updateHabitFields: async (id, fields) => {
        try {
          const user = auth.currentUser;
          const allHabits = user ? get().habits : get().localHabits;
          const existingHabit = allHabits.find((h) => h.id === id);
          
          if (!existingHabit) {
            console.error("習慣が見つかりません");
            return;
          }

          // 更新後の習慣データを作成
          const updatedHabit = {
            ...existingHabit,
            ...fields,
          };

          // 頻度タイプが変更された場合、ストリークを再計算
          const shouldRecalculateStreaks = fields.frequencyType !== undefined && 
                                           fields.frequencyType !== existingHabit.frequencyType;

          let finalFields = { ...fields };

          if (shouldRecalculateStreaks) {
            const { longestStreak, currentStreak } = calculateStreaks(updatedHabit);
            finalFields.longestStreak = longestStreak;
            finalFields.currentStreak = currentStreak;
          }

          if (user) {
            await updateHabit(id, finalFields);
            set({
              habits: get().habits.map((h) =>
                h.id === id ? {...h, ...finalFields} : h
              ),
            });
          } else {
            set({
              localHabits: get().localHabits.map((h) =>
                h.id === id ? {...h, ...finalFields} : h
              ),
            })
          }
        } catch (error) {
          console.error("習慣の更新に失敗しました:", error);
        }
      },

      fetchCategories: async () => {
        try {
          const defaultCategories = ["生活習慣", "運動", "健康", "学習", "仕事", "趣味", "お金"];
          const user = auth.currentUser;
          
          if (user) {
            // Firestoreからカスタムカテゴリを取得
            const customCategories = await getCustomCategoriesFromFirestore();
            // デフォルトカテゴリとカスタムカテゴリを統合
            const allCategories = [...defaultCategories, ...customCategories];
            set({ categories: allCategories });
          } else {
            // localStorageから取得
            const saved = localStorage.getItem("categories");
            if (saved) {
              try {
                const categories = JSON.parse(saved);
                set({ categories: categories });
              } catch {
                console.error("カテゴリの復元に失敗しました");
                // 復元に失敗した場合はデフォルトカテゴリを設定
                set({ categories: defaultCategories });
              }
            } else {
              // localStorageに何もない場合はデフォルトカテゴリを設定
              set({ categories: defaultCategories });
            }
          }
        } catch (error) {
          console.error("カテゴリの取得に失敗しました:", error);
        }
      },

      addCategory: async (category: string) => {
        try {
          const user = auth.currentUser;
          
          if (!user) {
            throw new Error("カテゴリの追加はログインが必要です");
          }

          const trimmedCategory = category.trim();
          
          if (!trimmedCategory) {
            throw new Error("カテゴリ名を入力してください");
          }

          // 重複チェック
          const { categories } = get();
          if (categories.includes(trimmedCategory)) {
            throw new Error("このカテゴリは既に存在します");
          }

          // Firestoreに追加
          await addCustomCategoryToFirestore(trimmedCategory);
          // categoriesに追加
          set({ categories: [...categories, trimmedCategory] });
        } catch (error) {
          console.error("カテゴリの追加に失敗しました:", error);
          throw error;
        }
      },

      deleteCategory: async (category: string) => {
        try {
          const { habits, localHabits, categories } = get();
          const user = auth.currentUser;
          const allHabits = user ? habits : localHabits;

          // 使用中チェック
          const habitsUsingCategory = allHabits.filter((h) => h.category === category);
          if (habitsUsingCategory.length > 0) {
            throw new Error(
              `このカテゴリは${habitsUsingCategory.length}個の習慣で使用されています。先にカテゴリを変更してください。`
            );
          }

          // デフォルトカテゴリかどうかを判定
          const defaultCategories = ["生活習慣", "運動", "健康", "学習", "仕事", "趣味", "お金"];
          const isDefaultCategory = defaultCategories.includes(category);

          if (user) {
            // カスタムカテゴリの場合のみFirestoreから削除
            if (!isDefaultCategory) {
              await deleteCustomCategoryFromFirestore(category);
            }
            // categoriesから削除
            set({ categories: categories.filter((c) => c !== category) });
          } else {
            // localStorageから削除
            const updated = categories.filter((c) => c !== category);
            localStorage.setItem("categories", JSON.stringify(updated));
            set({ categories: updated });
          }
        } catch (error) {
          console.error("カテゴリの削除に失敗しました:", error);
          throw error;
        }
      },

      setFilter: (filter) => set({ filter }),
      resetFilters: () => set({ filter: "all" }),

      addLocalHabit: (habit) =>
        set((state) => ({ localHabits: [...state.localHabits, habit] })),
      clearLocalHabits: () => set({ localHabits: [] }),
    }),
    { name: "habit-storage" }
  )
);
