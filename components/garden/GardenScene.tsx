"use client";

import { Habit } from "@/types";
import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
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

function ResponsiveCamera({ isNarrow }: { isNarrow: boolean }) {
  const { camera } = useThree();

  useEffect(() => {
    const perspectiveCamera = camera as THREE.PerspectiveCamera;
    if (isNarrow) {
      perspectiveCamera.fov = 70;
    } else {
      perspectiveCamera.fov = 50;
    }
    camera.updateProjectionMatrix();
  }, [camera, isNarrow]);

  return null;
}

export default function GardenScene({ habits, weather }: Props) {
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const update = () => setIsNarrow(mediaQuery.matches);
    update();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", update);
      return () => mediaQuery.removeEventListener("change", update);
    }

    mediaQuery.addListener(update);
    return () => mediaQuery.removeListener(update);
  }, []);

  return (
    <Canvas camera={{ position: [0, 4, 15], fov: 50 }} dpr={[1, 2]}>
      <ResponsiveCamera isNarrow={isNarrow} />
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        enableRotate={true}
        minDistance={10}
        maxDistance={19}
        minPolarAngle={Math.PI * 0.30}
        maxPolarAngle={Math.PI * 0.50}
        minAzimuthAngle={-Math.PI * 0.12}
        maxAzimuthAngle={Math.PI * 0.12}
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
