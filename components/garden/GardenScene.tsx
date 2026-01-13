"use client";

import { Habit } from "@/types";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useState } from "react";
import * as THREE from "three";
import Sky from "./Sky";
import Ground from "./Ground";
import GardenTrees from "./Trees";
import Rain from "./Rain";
import Lightning from "./Lightning";

type Props = {
  habits: Habit[];
  weather: "sunny" | "cloudy" | "rainy" | "stormy";
};

export default function GardenScene({ habits, weather }: Props) {
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);

  return (
    <Canvas camera={{ position: [0, 10, 20], fov: 50 }} dpr={[1, 2]}>
      <OrbitControls
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={50}
      />
      <Sky weather={weather} />
      <Rain weather={weather} />
      <Lightning weather={weather} />
      <Ground onGroundClick={() => setSelectedTreeId(null)} />
      {/* 背景用の透明なメッシュ（Canvas内のどこかをクリックしたらツールチップを閉じる） */}
      <mesh
        position={[0, 0, 0]}
        onClick={(e: any) => {
          // 木をクリックした場合は何もしない（TreeModelで処理）
          if (e.object?.userData?.isTree) {
            return;
          }
          // それ以外をクリックしたら選択を解除
          setSelectedTreeId(null);
        }}
      >
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
      <ambientLight intensity={2} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <GardenTrees
        habits={habits}
        selectedTreeId={selectedTreeId}
        onTreeSelect={setSelectedTreeId}
      />
    </Canvas>
  );
}
