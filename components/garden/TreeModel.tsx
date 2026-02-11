"use client";

import { Habit } from "@/types";
import { useGLTF, Html } from "@react-three/drei";
import { useMemo, useState, useRef, useEffect } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { calculateGrowthRate, formatDateToString, getTodayString, isHabitDueOnDate } from "@/lib/utils";

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

  const today = getTodayString();
  const isDueToday = isHabitDueOnDate(habit, today);
  const isCompletedToday = habit.completedDates?.includes(today);

  let flagColor = "lightgray"; // 灰（実施日ではない）
  if (isDueToday && isCompletedToday) {
    flagColor = "lime"; // 明るい緑
  } else if (isDueToday && !isCompletedToday) {
    flagColor = "lightcoral"; // 赤
  }

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
  const handleClick = (e: ThreeEvent<PointerEvent>) => {
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
          onPointerOver={(e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation();
            setIsHovered(true);
          }}
          onPointerOut={() => {
            setIsHovered(false);
          }}
          onClick={handleClick}
        />
        {/* 旗竿 */}
        <mesh position={[0, 1.5, 3]}>
          <cylinderGeometry args={[0.1, 0.1, 3.5, 8]} />
          <meshStandardMaterial color="#8b6f47" />
        </mesh>

        {/* 旗 */}
        <mesh position={[1, 2.5, 3]}>
          <planeGeometry args={[2.0, 1.5]} />
          <meshStandardMaterial color={flagColor} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {(isHovered || isSelected) && (
        <Html position={[position[0], position[1] + 2, position[2]]} center>
          <div className="bg-linear-to-br from-emerald-400/90 via-teal-400/90 to-cyan-400/90 backdrop-blur-md text-white px-3 py-2 rounded-lg text-md whitespace-nowrap shadow-xl border border-emerald-300/30 animate-[fadeInScale_0.3s_ease-out]">
            <div className="font-bold">{habit.title}</div>
            <div className="text-sm opacity-80">レベル: {level}</div>
            <div className="text-sm opacity-80">
              成長率: {Math.floor(calculateGrowthRate(habit))}%
            </div>
            <div className="text-sm opacity-80">
              植えられた日: {formatDateToString(habit.createdAt)}
            </div>
          </div>
        </Html>
      )}
    </>
  );
}
