"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  filter: "all" | "completed" | "incomplete";
  setFilter: (filter: "all" | "completed" | "incomplete") => void;
};

export default function FilterModal({
  isOpen,
  onClose,
  selectedCategories,
  setSelectedCategories,
  filter,
  setFilter,
}: Props) {
  const { categories } = useStore();

  // モーダル内での一時的な状態
  const [tempFilter, setTempFilter] = useState<
    "all" | "completed" | "incomplete"
  >(filter);
  const [tempSelectedCategories, setTempSelectedCategories] =
    useState<string[]>(selectedCategories);

  // モーダルが開いた時に、親の状態をローカルステートにコピー
  useEffect(() => {
    if (isOpen) {
      setTempFilter(filter);
      setTempSelectedCategories(selectedCategories);
    }
  }, [isOpen, filter, selectedCategories]);

  // モーダルを閉じた時にローカルステートをリセット
  useEffect(() => {
    if (!isOpen) {
      setTempFilter(filter);
      setTempSelectedCategories(selectedCategories);
    }
  }, [isOpen]);

  // カテゴリーのトグル処理（ローカルステートのみ更新）
  const toggleCategory = (category: string) => {
    setTempSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  // フィルター解除（ローカルステートのみリセット）
  const handleClearFilters = () => {
    setTempFilter("all");
    setTempSelectedCategories([]);
  };

  // 決定ボタン：ローカルステートの値を親の状態に反映
  const handleApply = () => {
    setFilter(tempFilter);
    setSelectedCategories(tempSelectedCategories);
    // localStorageに保存
    localStorage.setItem(
      "selectedCategories",
      JSON.stringify(tempSelectedCategories)
    );
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/20 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md mx-auto my-4 overflow-hidden bg-white rounded-xl shadow flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto flex-1 p-4 m-4">
          <h1 className="text-2xl font-bold mb-6 text-center">
            フィルター設定
          </h1>

          {/* 完了状態フィルター */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              完了状態
            </label>
            <div className="flex flex-wrap gap-2">
              {["all", "completed", "incomplete"].map((type) => (
                <button
                  key={type}
                  onClick={() =>
                    setTempFilter(type as "all" | "completed" | "incomplete")
                  }
                  className={`px-3 py-1 rounded transition ${
                    tempFilter === type
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  {type === "all"
                    ? "すべて"
                    : type === "completed"
                    ? "完了"
                    : "未完了"}
                </button>
              ))}
            </div>
          </div>

          {/* カテゴリーフィルター */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              カテゴリー
            </label>
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => {
                const isActive = tempSelectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1 rounded transition ${
                      isActive
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* フィルター解除ボタン */}
          <div className="mb-6">
            <button
              onClick={handleClearFilters}
              className="w-full px-3 py-2 rounded bg-gray-300 text-gray-700 hover:bg-gray-400 transition"
            >
              フィルター解除
            </button>
          </div>

          {/* 決定・キャンセルボタン */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 rounded-lg font-semibold transition 
            bg-gray-300 text-gray-700 hover:bg-gray-400"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="w-full py-2 rounded-lg font-semibold transition 
            bg-blue-500 text-white hover:bg-blue-600"
            >
              決定
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
