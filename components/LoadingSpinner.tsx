type Size = "sm" | "md" | "lg";

type Props = {
  size?: Size;
  text?: string;
  fullScreen?: boolean;
};

export default function LoadingSpinner({
  size = "md",
  text = "読み込み中...",
  fullScreen = false,
}: Props) {
  const sizeClasses: Record<Size, string> = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const containerClasses = fullScreen
    ? "fixed inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-50"
    : "flex flex-col items-center justify-center";

  return (
    <div className={containerClasses}>
      {/* スピナー */}
      <div
        className={`animate-spin rounded-full border-4 border-gray-200 border-t-emerald-500 ${sizeClasses[size]}`}
      ></div>
      {/* テキスト */}
      {text && <p className="text-gray-500 mt-2 text-sm">{text}</p>}
    </div>
  );
}
