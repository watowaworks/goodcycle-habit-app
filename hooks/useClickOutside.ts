import { useEffect, RefObject } from "react";

/**
 * 要素の外側をクリックしたときにコールバックを実行するカスタムフック
 * 
 * @param ref - 監視する要素への参照
 * @param callback - 外側クリック時に実行する関数
 * @param isOpen - フックを有効にするかどうかの条件
 * 
 * @example
 * const [isOpen, setIsOpen] = useState(false);
 * const ref = useRef<HTMLDivElement>(null);
 * useClickOutside(ref, () => setIsOpen(false), isOpen);
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  callback: () => void,
  isOpen: boolean
) {
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callback();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, callback, isOpen]);
}

