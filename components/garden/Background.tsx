"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";

type Props = {
  onBackgroundClick?: () => void;
};

export default function Background({ onBackgroundClick }: Props) {
  const { scene } = useGLTF("/models/background.glb");
  // シーンをクローンして独立したコピーを作成（必要に応じて）
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  return (
    <primitive
      object={clonedScene}
      position={[0, -50, -50]}
      scale={[1, 1, 1]}
      rotation={[0, 0, 0]}
      onClick={
        onBackgroundClick
          ? (e: any) => {
              e.stopPropagation();
              onBackgroundClick();
            }
          : undefined
      }
    />
  );
}
