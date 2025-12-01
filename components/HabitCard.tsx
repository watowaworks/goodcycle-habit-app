"use client";

import { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Habit } from "@/types";
import CategoryModal from "./CategoryModal";
import { auth } from "@/lib/firebase";
import { HABIT_COLOR_OPTIONS, DEFAULT_HABIT_COLOR } from "@/lib/habitColors";
import { useClickOutside } from "@/hooks/useClickOutside";

type Props = { habit: Habit };

export default function HabitCard({ habit }: Props) {
  const toggleHabitStatus = useStore((state) => state.toggleHabitStatus);
  const deleteHabit = useStore((state) => state.deleteHabit);
  const editHabit = useStore((state) => state.editHabit);
  const editCategory = useStore((state) => state.editCategory);
  const editColor = useStore((state) => state.editColor);

  const [editedTitle, setEditedTitle] = useState(habit.title);
  const [isEditing, setIsEditing] = useState(false);
  const [editMenuOpen, setEditMenuOpen] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const editMenuRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = !!auth.currentUser;

  // 編集モードになったら自動でフォーカス
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // 編集メニュー外をクリックしたら閉じる
  useClickOutside(editMenuRef, () => setEditMenuOpen(false), editMenuOpen);

  // カラーピッカー外クリックで閉じる
  useClickOutside(colorPickerRef, () => setShowColorPicker(false), showColorPicker);

  // キー操作（Enter: 保存, Esc: キャンセル）
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      editHabit(habit.id, editedTitle);
      setIsEditing(false);
    } else if (e.key === "Escape") {
      setEditedTitle(habit.title);
      setIsEditing(false);
    }
  };

  const currentColor = habit.color || DEFAULT_HABIT_COLOR;

  return (
    <div
      className="flex items-center justify-between rounded-xl p-4 shadow hover:shadow-md transition"
      style={{ backgroundColor: currentColor }}
    >
      {isEditing ? (
        <>
          <input
            ref={inputRef}
            className="border p-1 flex-1"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex gap-2 ml-2">
            <button
              className="bg-blue-500 text-white px-2 rounded"
              onClick={() => {
                editHabit(habit.id, editedTitle);
                setIsEditing(false);
              }}
            >
              💾 保存
            </button>
            <button
              className="bg-gray-300 px-2 rounded"
              onClick={() => {
                setEditedTitle(habit.title);
                setIsEditing(false);
              }}
            >
              ❌
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={habit.completed}
              onChange={() => toggleHabitStatus(habit.id)}
              className="w-5 h-5 accent-blue-500 cursor-pointer"
            />
            <div className="flex flex-col">
              <p
                className={`text-lg font-medium ${
                  habit.completed
                    ? "line-through text-gray-400"
                    : "text-gray-800"
                }`}
              >
                {habit.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-gray-500">{habit.category}</p>
                {/* ストリークの表示 */}
                {isLoggedIn &&
                  habit.currentStreak !== undefined &&
                  habit.currentStreak > 0 && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                      🔥 {habit.currentStreak}日連続
                    </span>
                  )}
              </div>
            </div>
          </div>

          <div className="relative flex items-center gap-2">
            <button
              onClick={() => setEditMenuOpen(true)}
              className="text-xl transition-transform duration-200 hover:scale-125 hover:rotate-12"
            >
              ✏️
            </button>

            {editMenuOpen && (
              <div
                ref={editMenuRef}
                className="absolute right-0 top-5 z-50 mt-2 w-40 rounded-xl border bg-white shadow-lg"
              >
                <button
                  className="block w-full text-left px-3 py-2 hover:bg-gray-100"
                  onClick={() => {
                    setEditMenuOpen(false);
                    setIsEditing(true); // 既存のタイトル編集モード
                  }}
                >
                  習慣名を編集
                </button>

                <button
                  className="block w-full text-left px-3 py-2 hover:bg-gray-100"
                  onClick={() => {
                    setEditMenuOpen(false);
                    setShowCategoryModal(true); // カテゴリ編集モーダルを開く
                  }}
                >
                  カテゴリを編集
                </button>

                <button
                  className="block w-full text-left px-3 py-2 hover:bg-gray-100"
                  onClick={() => {
                    setEditMenuOpen(false);
                    setShowColorPicker(true);
                  }}
                >
                  色を編集
                </button>
              </div>
            )}

            <button
              onClick={() => deleteHabit(habit.id)}
              className="text-xl transition-transform duration-200 hover:scale-125 hover:rotate-12"
            >
              🗑️
            </button>

            {showColorPicker && (
              <div
                ref={colorPickerRef}
                className="absolute right-0 top-12 z-50 w-48 rounded-xl border bg-white p-3 shadow-lg"
              >
                <p className="mb-2 text-sm text-gray-600">色を選択</p>
                <div className="grid grid-cols-4 gap-2">
                  {HABIT_COLOR_OPTIONS.map((option) => (
                    <button
                      key={option}
                      className={`h-8 w-8 rounded-full border-2 transition ${
                        currentColor === option
                          ? "border-blue-500 scale-105"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: option }}
                      onClick={() => {
                        editColor(habit.id, option);
                        setShowColorPicker(false);
                      }}
                      aria-label={`色 ${option}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <CategoryModal
            habit={habit}
            isOpen={showCategoryModal}
            onClose={() => setShowCategoryModal(false)}
            onSelectCategory={(category) => {
              editCategory(habit.id, category);
              setShowCategoryModal(false);
            }}
          />
        </>
      )}
    </div>
  );
}
