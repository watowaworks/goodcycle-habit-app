"use client";

import { calculateGrowthRate, getTreeModelLevel } from "@/lib/utils";
import { Habit } from "@/types";
import TreeModel from "./TreeModel";

type Props = {
  habits: Habit[];
  selectedTreeId: string | null;
  onTreeSelect: (treeId: string | null) => void;
};

// 木の位置を計算（グリッドに配置）
function calculateTreePositions(index: number): [number, number, number] {
  const columns = 4;
  const spacing = 32;
  const col = index % columns;
  const row = Math.floor(index / columns);
  const x = (col - 1.5) * spacing;
  const z = (row - 0.9) * spacing;
  return [x, -3, z];
}

export default function Trees({ habits, selectedTreeId, onTreeSelect }: Props) {
  const sortedHabits = [...habits].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );

  return (
    <>
      {sortedHabits.map((habit, index) => {
        const growthRate = calculateGrowthRate(habit);
        const modelLevel = getTreeModelLevel(growthRate);
        const position = calculateTreePositions(index);

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
