"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";

type Props = {
  level: number;
  position: [number, number, number];
};

export default function TreeModel({ level, position }: Props) {
  const { scene } = useGLTF(`/models/trees/tree-${level}.glb`);

  // シーンをクローンして独立したコピーを作成
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  
  return (
    <primitive
      object={clonedScene}
      position={position}
      scale={0.8}
    />
  );
}