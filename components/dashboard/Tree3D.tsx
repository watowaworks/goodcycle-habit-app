"use client";

import { calculateGrowthRate, getTreeModelLevel } from "@/lib/utils";
import { Habit } from "@/types";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useEffect } from "react";

useGLTF.preload("/models/trees/tree-0.gltf");
useGLTF.preload("/models/trees/tree-25.gltf");
useGLTF.preload("/models/trees/tree-50.gltf");
useGLTF.preload("/models/trees/tree-75.gltf");
useGLTF.preload("/models/trees/tree-100.gltf");

type Props = {
  habit: Habit;
}

function TreeModel({ level }: { level: number }) {
  const { scene } = useGLTF(`/models/trees/tree-${level}.gltf`);

  return <primitive object={scene} scale={0.8} />
}

function TreeLoading() {
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-gray-500">読み込み中...</p>
    </div>
  );
}

export default function Tree3D({ habit }: Props) {
  const growthRate = calculateGrowthRate(habit);
  const modelLevel = getTreeModelLevel(growthRate);

  return (
    <div className="w-full h-[400px] bg-gray-50 dark:bg-gray-900 rounded-lg">
      <Canvas
        camera={{ position: [0, 0, 12], fov: 50 }}
        dpr={[1, 2]} // パフォーマンス調整
      >
        <OrbitControls 
          enableZoom={true}
          enablePan={false}
          enableRotate={true}
          minDistance={8}
          maxDistance={20}
          target={[0, 5, 0]} // カメラが向く中心点（木の中心）
        />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Suspense fallback={null}>
          <TreeModel level={modelLevel} />
        </Suspense>
      </Canvas>
    </div>
  );
}