// lib/firestore.ts
import { db, auth } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import { FrequencyType, Habit } from "@/types";
import { DEFAULT_HABIT_COLOR } from "./habitColors";

// 習慣を追加（Firestoreが生成したIDを返す）
export async function addHabit(habit: Habit): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("ログインが必要です");

  const docRef = await addDoc(collection(db, "users", user.uid, "habits"), {
    ...habit,
    color: habit.color || DEFAULT_HABIT_COLOR,
    createdAt: habit.createdAt, // Date をそのまま Firestore に保存
    completedDates: habit.completedDates || [],
    longestStreak: habit.longestStreak || 0,
    currentStreak: habit.currentStreak || 0,
  });
  
  return docRef.id; // Firestoreが生成したIDを返す
}

// ログイン中ユーザーの習慣を取得（作成日時の昇順でソート：古い順、新しい習慣が下に表示される）
export async function getUserHabits() {
  const user = auth.currentUser;
  if (!user) throw new Error("ログインが必要です");

  const q = query(
    collection(db, "users", user.uid, "habits"),
    orderBy("createdAt", "asc") // 作成日時の昇順（古い順）
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();

    return {
      id: doc.id,
      title: data.title as string,
      category: data.category as Habit["category"],
      color: (data.color as string) || DEFAULT_HABIT_COLOR,
      completed: data.completed as boolean,
      // Firestore の Timestamp かもしれないので型ガード
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : new Date(data.createdAt), // 万一 Date 型の場合も対応
      completedDates: (data.completedDates as string[]) || [],
      longestStreak: (data.longestStreak as number) || 0,
      currentStreak: (data.currentStreak as number) || 0,
      frequencyType: (data.frequencyType as FrequencyType) || "daily",
      daysOfWeek: (data.daysOfWeek as number[]) || [],
      intervalDays: (data.intervalDays as number) || 0,
      startDate: (data.startDate as string) || "",
    };
  });
}

// 習慣を削除
export async function deleteHabit(habitId: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("ログインが必要です");

  await deleteDoc(doc(db, "users", user.uid, "habits", habitId));
}

// 習慣を更新（タイトルや完了ステータスなど部分更新）
export async function updateHabit(
  habitId: string,
  updatedFields: Partial<Habit>
) {
  const user = auth.currentUser;
  if (!user) throw new Error("ログインが必要です");

  await updateDoc(doc(db, "users", user.uid, "habits", habitId), updatedFields);
}

// カスタムカテゴリを取得
export async function getCustomCategories(): Promise<string[]> {
  const user = auth.currentUser;
  if (!user) throw new Error("ログインが必要です");

  const q = query(collection(db, "users", user.uid, "customCategories"));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => doc.data().name as string);
}

// カスタムカテゴリを追加
export async function addCustomCategory(categoryName: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("ログインが必要です");

  // 重複チェック
  const existing = await getCustomCategories();
  if (existing.includes(categoryName)) {
    throw new Error("このカテゴリは既に存在します");
  }

  await addDoc(collection(db, "users", user.uid, "customCategories"), {
    name: categoryName,
    createdAt: new Date(),
  });
}

// カスタムカテゴリを削除
export async function deleteCustomCategory(categoryName: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("ログインが必要です");

  const q = query(
    collection(db, "users", user.uid, "customCategories"),
    where("name", "==", categoryName)
  );
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    throw new Error("カテゴリが見つかりません");
  }

  // 同じ名前のカテゴリが複数ある場合も全て削除
  const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
}