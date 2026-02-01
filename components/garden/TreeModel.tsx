"use client";

import { Habit } from "@/types";
import { useGLTF, Html } from "@react-three/drei";
import { useMemo, useState, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { calculateGrowthRate, formatDateToString } from "@/lib/utils";

type Props = {
  level: number;
  position: [number, number, number];
  habit: Habit;
  isSelected: boolean;
  onSelect: () => void;
};

export default function TreeModel({
  level,
  position,
  habit,
  isSelected,
  onSelect,
}: Props) {
  const { scene } = useGLTF(`/models/trees/tree-${level}.glb`);
  const [isHovered, setIsHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);

  // シーンをクローンして独立したコピーを作成
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // 初期スケールを設定
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.scale.set(1, 1, 1);
    }
  }, []);

  // アニメーション: スケールアップ
  useFrame(() => {
    if (!groupRef.current) return;

    const targetScale = isHovered || isSelected ? 1.2 : 1;

    // スムーズな補間（lerp）
    groupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.1
    );
  });

  // タップ/クリックでツールチップを表示/非表示
  const handleClick = (e: any) => {
    e.stopPropagation();
    // 木であることを示すフラグを設定（Canvasのクリックハンドラーで判定用）
    e.object.userData.isTree = true;
    onSelect();
  };

  return (
    <>
      <group ref={groupRef} position={position}>
        <primitive
          object={clonedScene}
          scale={3}
          onPointerOver={(e: any) => {
            e.stopPropagation();
            setIsHovered(true);
          }}
          onPointerOut={() => {
            setIsHovered(false);
          }}
          onClick={handleClick}
        />
      </group>
      {(isHovered || isSelected) && (
        <Html position={[position[0], position[1] + 2, position[2]]} center>
          <div className="bg-linear-to-br from-emerald-400/90 via-teal-400/90 to-cyan-400/90 backdrop-blur-md text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-xl border border-emerald-300/30 animate-[fadeInScale_0.3s_ease-out]">
            <div className="font-bold">{habit.title}</div>
            <div className="text-xs opacity-80">レベル: {level}</div>
            <div className="text-xs opacity-80">
              成長率: {Math.floor(calculateGrowthRate(habit))}%
            </div>
            <div className="text-xs opacity-80">
              植えられた日: {formatDateToString(habit.createdAt)}
            </div>
          </div>
        </Html>
      )}
    </>
  );
}
