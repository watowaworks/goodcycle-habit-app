"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";

export default function Ground() {
  const { scene } = useGLTF("/models/ground.glb");
  // シーンをクローンして独立したコピーを作成（必要に応じて）
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  return (
    <primitive
      object={clonedScene}
      position={[0, -3, 0]}
      scale={[10, 1, 2]}
      rotation={[0, 0, 0]}
    />
  );
}
