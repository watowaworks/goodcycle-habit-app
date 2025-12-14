"use client";

import { useTheme } from "@/hooks/useTheme";
import { useEffect } from "react";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { mounted } = useTheme();

  // テーマの初期化を確実に行う
  useEffect(() => {
    // useThemeフック内で処理されるが、念のためマウントを確認
  }, []);

  // マウント前は何も表示しない（フラッシュを防ぐ）
  if (!mounted) {
    return null;
  }

  return <>{children}</>;
}

