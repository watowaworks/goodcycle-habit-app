"use client";

import { Habit } from "@/types";
import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import Sky from "./Sky";
import Ground from "./Ground";
import GardenTrees from "./Trees";
import Rain from "./Rain";
import Lightning from "./Lightning";
import Background from "./Background";
import Fence from "./Fence";
import Signboard from "./Signboard";
import { calculateGardenAverageCompletionRate } from "@/lib/utils";

type Props = {
  habits: Habit[];
  weather: "sunny" | "cloudy" | "rainy" | "stormy";
};

function ResponsiveCamera({ isNarrow }: { isNarrow: boolean }) {
  const { camera } = useThree();

  useEffect(() => {
    const perspectiveCamera = camera as THREE.PerspectiveCamera;

    if (isNarrow) {
      perspectiveCamera.position.set(0, 40, 100);
    } else {
      perspectiveCamera.position.set(0, 40, 100);
    }

    // Three.js カメラの FOV 変更（Three.js のカメラは mutable）
    /* eslint-disable react-hooks/immutability -- Three.js PerspectiveCamera is mutable by design */
    if (isNarrow) {
      perspectiveCamera.fov = 80;
    } else {
      perspectiveCamera.fov = 50;
    }
    /* eslint-enable react-hooks/immutability */
    camera.updateProjectionMatrix();
  }, [camera, isNarrow]);

  return null;
}

export default function GardenScene({ habits, weather }: Props) {
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);
  const [isNarrow, setIsNarrow] = useState(false);
  const averageCompletionRate = useMemo(
    () => calculateGardenAverageCompletionRate(habits),
    [habits]
  );

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
    <Canvas dpr={[1, 2]}>
      <ResponsiveCamera isNarrow={isNarrow} />
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        enableRotate={true}
        minDistance={10}
        maxDistance={isNarrow ? 150 : 120}
        minPolarAngle={Math.PI * 0.20}
        maxPolarAngle={Math.PI * 0.50}
        minAzimuthAngle={-Math.PI * 0.24}
        maxAzimuthAngle={Math.PI * 0.24}
      />
      <Sky weather={weather} />
      <Rain weather={weather} />
      <Lightning weather={weather} />
      <Ground />
      <Fence />
      <Signboard habits={habits} weather={weather} averageCompletionRate={averageCompletionRate} />
      <Background />
      {/* 背景用の透明なメッシュ（Canvas内のどこかをクリックしたらツールチップを閉じる） */}
      <mesh
        position={[0, 0, 0]}
        onClick={(e: ThreeEvent<PointerEvent>) => {
          // 木をクリックした場合は何もしない（TreeModelで処理）
          if (e.object?.userData?.isTree) {
            return;
          }
          // それ以外をクリックしたら選択を解除
          setSelectedTreeId(null);
        }}
      >
        <planeGeometry args={[1000, 1000]} />
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
