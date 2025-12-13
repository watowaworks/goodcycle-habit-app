"use client";

import { auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import Image from "next/image";
import { useState } from "react";
import LoadingSpinner from "./LoadingSpinner";

export default function AuthButton() {
  const [user, loading] = useAuthState(auth);
  const [error, setError] = useState<string | null>(null);

  // ログイン処理
  const handleLogin = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("ログインエラー:", err);
      setError("ログインに失敗しました。もう一度お試しください。");
    }
  };

  // ログアウト処理
  const handleLogout = async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (err: any) {
      console.error("ログアウトエラー:", err);
      setError("ログアウトに失敗しました。");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <LoadingSpinner size="sm" />
        <span className="text-sm text-gray-500">読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex items-center gap-3">
        {user ? (
          <>
            {/* ユーザー情報表示 */}
            {user.photoURL && (
              <Image
                src={user.photoURL}
                alt={user.displayName || "User"}
                width={32}
                height={32}
                className="rounded-full"
              />
            )}
            <span className="text-sm">{user.displayName}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              ログアウト
            </button>
          </>
        ) : (
          <button
            onClick={handleLogin}
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            Googleでログイン
          </button>
        )}
      </div>

      {/* エラーメッセージ表示 */}
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
