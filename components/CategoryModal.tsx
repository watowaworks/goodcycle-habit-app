"use client";

import { useStore } from "@/lib/store";
import { Habit } from "@/types";

type Props = {
  habit: Habit;
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (newCategory: string) => void;
};

export default function CategoryModal({
  habit,
  isOpen,
  onClose,
  onSelectCategory,
}: Props) {
  const { categories } = useStore();

  if (!isOpen) return null;

  return (
    <div
      className="flex flex-col fixed inset-0 bg-black/20 items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-xl mx-auto shadow-lg p-6 w-80 max-h-[70vh] overflow-y-auto animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 text-gray-800">カテゴリを選択</h2>

        {/* カテゴリ一覧（ドロップダウン） */}
        <div className="relative">
          <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white py-2 shadow-sm">
            {categories.map((category) => {
              const isSelected = category === habit.category;
              return (
                <button
                  key={category}
                  onClick={() => {
                    onSelectCategory(category);
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                    isSelected
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="font-medium">{category}</span>
                  {isSelected && (
                    <svg
                      className="ml-auto h-5 w-5 text-emerald-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <button
          className="mt-6 w-full text-center py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
          onClick={onClose}
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
