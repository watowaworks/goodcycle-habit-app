"use client";

import { calculateGrowthRate, getTreeModelLevel } from "@/lib/utils";
import { Habit } from "@/types";
import TreeModel from "./TreeModel";

type Props = {
  habits: Habit[];
  selectedTreeId: string | null;
  onTreeSelect: (treeId: string | null) => void;
};

// 木の位置を計算（円形に配置）
function calculateTreePositions(
  index: number,
  total: number
): [number, number, number] {
  const angle = (index / total) * Math.PI * 2;
  const radius = 5;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  return [x, 0, z];
}

export default function Trees({ habits, selectedTreeId, onTreeSelect }: Props) {
  return (
    <>
      {habits.map((habit, index) => {
        const growthRate = calculateGrowthRate(habit);
        const modelLevel = getTreeModelLevel(growthRate);
        const position = calculateTreePositions(index, habits.length);

        return (
          <TreeModel
            key={habit.id}
            level={modelLevel}
            position={position}
            habit={habit}
            isSelected={selectedTreeId === habit.id}
            onSelect={() => {
              // 既に選択されている場合は解除、そうでなければ選択
              onTreeSelect(selectedTreeId === habit.id ? null : habit.id);
            }}
          />
        );
      })}
    </>
  );
}
