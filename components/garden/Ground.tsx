"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";

type Props = {
  onGroundClick?: () => void;
};

export default function Ground({ onGroundClick }: Props) {
  const { scene } = useGLTF("/models/temp.glb");
  // シーンをクローンして独立したコピーを作成（必要に応じて）
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  return (
    <primitive
      object={clonedScene}
      position={[0, -1, 0]}
      scale={0.35}
      rotation={[0, Math.PI/2, 0]}
      onClick={
        onGroundClick
          ? (e: any) => {
              e.stopPropagation();
              onGroundClick();
            }
          : undefined
      }
    />
  );
}
