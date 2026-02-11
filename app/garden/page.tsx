"use client";

import { auth, onAuthStateChanged } from "@/lib/firebase";
import { useEffect, useState, useRef } from "react";
import { useStore } from "@/lib/store";
import { calculateGardenWeather } from "@/lib/utils";
import Header from "@/components/Header";
import LoadingSpinner from "@/components/LoadingSpinner";
import GardenScene from "@/components/garden/GardenScene";
import { useClickOutside } from "@/hooks/useClickOutside";
import Link from "next/link";

export default function GardenPage() {
  const { habits, fetchHabits } = useStore();
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState<boolean>(!!auth.currentUser);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // 外側クリックでポップオーバーを閉じる
  useClickOutside(popoverRef, () => setIsPopoverOpen(false), isPopoverOpen);

  // 初回ロード: Firestoreデータ取得
  useEffect(() => {
    const fetchData = async () => {
      if (auth.currentUser) {
        await fetchHabits();
      }
    };
    fetchData();

    // ログイン/ログアウトの変化を監視
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoggedIn(!!user);
      if (user) {
        await fetchHabits();
      }

      setLoading(false); // 認証状態が確定してからloadingをfalseにする
    });

    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fetchHabitsはZustandストア関数のため、依存配列から除外

  // 庭全体の天気を計算
  const weather = calculateGardenWeather(habits);

  return (
    <>
      <Header
        title="GoodCycle"
        navLinks={[
          { label: "ホーム", href: "/app" },
          { label: "ダッシュボード", href: "/dashboard" },
          { label: "ガーデン", href: "/garden" },
          { label: "お問い合わせ", href: "/contact" },
        ]}
      />
      <div className="w-full h-[calc(100vh-4rem)] pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" text="データを読み込んでいます..." />
          </div>
        ) : !loggedIn ? (
          <div className="mx-auto max-w-3xl px-4 pt-8">
            <div className="rounded-2xl border border-dashed border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-900/20 p-6 text-center mt-8">
              <p className="text-md font-medium text-emerald-800 dark:text-emerald-300 mb-2">
                ガーデン機能は、ログインするとご利用いただけます。
              </p>
              <p className="text-sm text-emerald-900/80 dark:text-emerald-400 mb-4">
                アカウントを作成して習慣を登録すると、継続度や完了率に応じて変化する3Dガーデンで、現在の状態を直感的に振り返ることができます。
              </p>
              <Link
                href="/app"
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 dark:bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 dark:hover:bg-emerald-700"
              >
                ホームに戻る
              </Link>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full">
            {/* 情報アイコンボタンとポップオーバー */}
            <div ref={popoverRef} className="absolute top-4 right-4 z-10">
              {/* 情報アイコンボタン */}
              <button
                onClick={() => setIsPopoverOpen(!isPopoverOpen)}
                className="w-15 h-15 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg hover:bg-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
                aria-label="ガーデンの使い方"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>

              {/* ポップオーバー */}
              {isPopoverOpen && (
                <div className="absolute top-18 right-0 w-80 rounded-2xl border border-dashed border-emerald-200 dark:border-emerald-800 bg-white/90 dark:bg-gray-900/80 p-6 shadow-xl animate-[fadeInScale_0.3s_ease-out]">
                  <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-300 mb-4">
                    💡 Tips
                  </h3>

                  <div className="space-y-4">
                    {/* 習慣の木について */}
                    <div>
                      <h4 className="text-md font-medium text-emerald-800 dark:text-emerald-300 mb-2">
                        習慣の木について
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        全期間の完了率と現在の継続数から算出される成長度に応じて、5段階のモデルに変化します。
                      </p>
                    </div>

                    {/* 天気について */}
                    <div>
                      <h4 className="text-md font-medium text-emerald-800 dark:text-emerald-300 mb-2">
                        天気について
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        すべての習慣の直近7日の完了率の平均に応じて変化します。完了率が高いと晴れ、低いと雨や雷雨になります。
                      </p>
                    </div>
                    {/* フラッグの状態説明 */}
                    <div>
                      <h4 className="text-md font-medium text-emerald-800 dark:text-emerald-300 mb-2">
                        フラッグ🏴の状態
                      </h4>
                      <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-300" />
                          完了済みの習慣
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-400" />
                          未完了の習慣
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-2.5 w-2.5 rounded-full bg-gray-400" />
                          実施日ではない習慣
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <GardenScene habits={habits} weather={weather} />
          </div>
        )}
      </div>
    </>
  );
}
