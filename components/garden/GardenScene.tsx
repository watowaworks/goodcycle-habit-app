"use client";

import { Habit } from "@/types";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
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
      <Ground />
      <ambientLight intensity={2} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <GardenTrees habits={habits} />
    </Canvas>
  );
}
