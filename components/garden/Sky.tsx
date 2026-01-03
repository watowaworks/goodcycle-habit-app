"use client";

import { useMemo } from "react";
import * as THREE from "three";

type Props = {
  weather: "clear" | "sunny" | "cloudy" | "rainy";
};

function getSkyColor(weather: string): string {
  switch (weather) {
    case 'clear':
      return '#87CEEB'; // スカイブルー
    case 'sunny':
      return '#87CEEB'; // スカイブルー
    case 'cloudy':
      return '#B0C4DE'; // ライトスチールブルー
    case 'rain':
      return '#708090'; // スレートグレー
    default:
      return '#87CEEB';
  }
}

export default function Sky({ weather }: Props) {
  const skyColor = useMemo(() => getSkyColor(weather), [weather]);

  return (
    <mesh>
      <sphereGeometry args={[100, 32, 32]} />
      <meshBasicMaterial color={skyColor} side={THREE.BackSide} />
    </mesh>
  );
}