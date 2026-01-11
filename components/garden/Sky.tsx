"use client";

import { useMemo } from "react";
import * as THREE from "three";

type Props = {
  weather: "sunny" | "cloudy" | "rainy" | "stormy";
};

// 天気に応じたグラデーションの色を取得
function getSkyGradientColors(weather: string): {
  topColor: THREE.Vector3;
  bottomColor: THREE.Vector3;
} {
  switch (weather) {
    case "sunny":
      // 明るい青（上） → 白（下）（晴れ）
      return {
        topColor: new THREE.Vector3(0.53, 0.81, 0.92), // #87CEEB（明るい青）
        bottomColor: new THREE.Vector3(1.0, 1.0, 1.0), // 白
      };
    case "cloudy":
      // 濃いグレー（上） → 薄いグレー（下）（曇り）
      return {
        topColor: new THREE.Vector3(0.5, 0.55, 0.65), // 濃いグレー
        bottomColor: new THREE.Vector3(0.75, 0.78, 0.82), // 薄いグレー
      };
    case "rainy":
      // 濃いグレー（上） → 中程度のグレー（下）（雨）
      return {
        topColor: new THREE.Vector3(0.35, 0.38, 0.42), // 濃いグレー
        bottomColor: new THREE.Vector3(0.5, 0.52, 0.56), // 中程度のグレー
      };
    case "stormy":
      // 非常に濃いグレー（上） → 濃いグレー（下）（雷雨）
      return {
        topColor: new THREE.Vector3(0.15, 0.15, 0.18), // 非常に濃いグレー
        bottomColor: new THREE.Vector3(0.25, 0.25, 0.3), // 濃いグレー
      };
    default:
      return {
        topColor: new THREE.Vector3(0.53, 0.81, 0.92),
        bottomColor: new THREE.Vector3(1.0, 1.0, 1.0),
      };
  }
}

export default function Sky({ weather }: Props) {
  const { topColor, bottomColor } = useMemo(
    () => getSkyGradientColors(weather),
    [weather]
  );

  // 頂点シェーダー
  const vertexShader = `
    varying vec3 vWorldPosition;
    
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  // フラグメントシェーダー
  const fragmentShader = `
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    uniform float offset;
    uniform float exponent;
    
    varying vec3 vWorldPosition;
    
    void main() {
      float h = normalize(vWorldPosition + offset).y;
      float t = pow(max(h, 0.0), exponent);
      gl_FragColor = vec4(mix(bottomColor, topColor, t), 1.0);
    }
  `;

  const uniforms = useMemo(
    () => ({
      topColor: { value: topColor },
      bottomColor: { value: bottomColor },
      offset: { value: 0 }, // グラデーションのオフセット
      exponent: { value: 0.6 }, // グラデーションの強度（小さいほど緩やか）
    }),
    [topColor, bottomColor]
  );

  return (
    <mesh>
      <sphereGeometry args={[100, 32, 32]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
      />
    </mesh>
  );
}
