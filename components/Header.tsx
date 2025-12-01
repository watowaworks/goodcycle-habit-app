"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthButton from "./AuthButton";

type NavLink = {
  label: string;
  href: string;
};

type HeaderProps = {
  title: string;
  navLinks?: NavLink[];
};

export default function Header({ title, navLinks = [] }: HeaderProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="flex w-full flex-col gap-3 bg-linear-to-r from-blue-100 to-cyan-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      {/* タイトルとハンバーガーボタンの行 */}
      <div className="flex items-center justify-between w-full lg:w-auto">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>

        {/* ハンバーガーボタン（lg未満のみ表示） */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="lg:hidden p-2 rounded-lg hover:bg-white/50 transition"
          aria-label="メニューを開く"
        >
          {!isMenuOpen && (
            // ハンバーガーアイコン（メニューが閉じている時）
            <svg
              className="h-6 w-6 text-gray-900"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* 通常のナビゲーション（lg以上のみ表示） */}
      <div className="hidden lg:flex lg:flex-row lg:items-center lg:gap-6">
        {navLinks.length > 0 && (
          <nav className="flex items-center gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-semibold transition ${
                  pathname === link.href
                    ? "text-emerald-600"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
        <AuthButton />
      </div>

      {/* ハンバーガーメニュー（lg未満のみ表示） */}
      <>
        {/* オーバーレイ */}
        <div
          className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${
            isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setIsMenuOpen(false)}
        />

        {/* メニューパネル（右からスライド） */}
        <div
          className={`fixed top-0 right-0 h-full w-80 bg-linear-to-r from-lime-100 to-emerald-100 shadow-xl z-50 lg:hidden transform transition-transform duration-300 ease-out ${
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex flex-col h-full p-6">
            {/* メニューヘッダー */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">メニュー</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
                aria-label="メニューを閉じる"
              >
                <svg
                  className="h-6 w-6 text-gray-900"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* ナビゲーションリンク */}
            {navLinks.length > 0 && (
              <nav className="flex flex-col gap-2 mb-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`px-4 py-3 rounded-lg text-base font-semibold transition ${
                      pathname === link.href
                        ? "bg-emerald-50 text-emerald-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}

            {/* AuthButton */}
            <div className="mt-auto pt-6 border-t border-gray-200">
              <AuthButton />
            </div>
          </div>
        </div>
      </>
    </header>
  );
}
