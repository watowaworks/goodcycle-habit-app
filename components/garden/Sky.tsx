"use client";

import { useMemo } from "react";
import * as THREE from "three";

type Props = {
  weather: "sunny" | "cloudy" | "rainy" | "stormy";
};

// 天気に応じた空色を取得
function getSkyColor(weather: string): THREE.Vector3 {
  switch (weather) {
    case "sunny":
      // 明るい空色（晴れ）
      return new THREE.Vector3(0.6, 0.85, 0.98);
    case "cloudy":
      // 薄い水色（曇り）
      return new THREE.Vector3(0.72, 0.83, 0.92);
    case "rainy":
      // 白に近いグレー（青みを少し残す）
      return new THREE.Vector3(0.88, 0.9, 0.94);
    case "stormy":
      // 白に近いグレー（青みを少し残す）
      return new THREE.Vector3(0.84, 0.86, 0.9);
    default:
      return new THREE.Vector3(0.6, 0.85, 0.98);
  }
}

// 天気に応じた雲パラメータを取得（段階1: 静的な雲）
function getCloudParams(weather: string): {
  cloudCoverage: number;
  cloudSoftness: number;
  cloudOpacity: number;
  cloudScale: number;
  cloudColor: THREE.Vector3;
} {
  switch (weather) {
    case "sunny":
      return {
        cloudCoverage: 0.9,
        cloudSoftness: 0.20,
        cloudOpacity: 0.7,
        cloudScale: 2.2,
        cloudColor: new THREE.Vector3(1.0, 0.98, 0.95),
      };
    case "cloudy":
      return {
        cloudCoverage: 0.80,
        cloudSoftness: 0.20,
        cloudOpacity: 0.7,
        cloudScale: 2.5,
        cloudColor: new THREE.Vector3(0.95, 0.95, 0.95),
      };
    case "rainy":
      return {
        cloudCoverage: 0.75,
        cloudSoftness: 0.18,
        cloudOpacity: 0.72,
        cloudScale: 4.0,
        cloudColor: new THREE.Vector3(0.78, 0.78, 0.78),
      };
    case "stormy":
      return {
        cloudCoverage: 0.72,
        cloudSoftness: 0.2,
        cloudOpacity: 0.8,
        cloudScale: 4.5,
        cloudColor: new THREE.Vector3(0.6, 0.6, 0.6),
      };
    default:
      return {
        cloudCoverage: 0.5,
        cloudSoftness: 0.16,
        cloudOpacity: 0.45,
        cloudScale: 2.4,
        cloudColor: new THREE.Vector3(1.0, 0.98, 0.95),
      };
  }
}

export default function Sky({ weather }: Props) {
  const skyColor = useMemo(() => getSkyColor(weather), [weather]);
  const { cloudCoverage, cloudSoftness, cloudOpacity, cloudScale, cloudColor } =
    useMemo(() => getCloudParams(weather), [weather]);

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
    uniform vec3 skyColor;
    uniform float cloudCoverage;
    uniform float cloudSoftness;
    uniform float cloudOpacity;
    uniform float cloudScale;
    uniform vec3 cloudColor;
    
    varying vec3 vWorldPosition;
    
    float hash(vec3 p) {
      return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
    }

    float noise(vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);
      vec3 u = f * f * (3.0 - 2.0 * f);

      float n000 = hash(i + vec3(0.0, 0.0, 0.0));
      float n100 = hash(i + vec3(1.0, 0.0, 0.0));
      float n010 = hash(i + vec3(0.0, 1.0, 0.0));
      float n110 = hash(i + vec3(1.0, 1.0, 0.0));
      float n001 = hash(i + vec3(0.0, 0.0, 1.0));
      float n101 = hash(i + vec3(1.0, 0.0, 1.0));
      float n011 = hash(i + vec3(0.0, 1.0, 1.0));
      float n111 = hash(i + vec3(1.0, 1.0, 1.0));

      float nx00 = mix(n000, n100, u.x);
      float nx10 = mix(n010, n110, u.x);
      float nx01 = mix(n001, n101, u.x);
      float nx11 = mix(n011, n111, u.x);
      float nxy0 = mix(nx00, nx10, u.y);
      float nxy1 = mix(nx01, nx11, u.y);
      return mix(nxy0, nxy1, u.z);
    }

    float fbm(vec3 p) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int i = 0; i < 5; i++) {
        value += amplitude * noise(p);
        p *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }

    void main() {
      vec3 baseColor = skyColor;

      // スカイドームの方向ベクトルで雲の形を作る（静的）
      vec3 dir = normalize(vWorldPosition);
      // 雲の高さを少し下げる
      float heightMask = smoothstep(-0.1, 0.35, dir.y);
      float base = fbm(dir * cloudScale);
      float ridged = 1.0 - abs(2.0 * base - 1.0);
      float clouds = smoothstep(
        cloudCoverage - cloudSoftness,
        cloudCoverage + cloudSoftness,
        ridged
      );
      // アニメ調: 雲の輪郭をはっきりさせる
      clouds = pow(clouds, 1.6);
      float cloudAmount = clouds * cloudOpacity * heightMask;
      vec3 finalColor = mix(baseColor, cloudColor, cloudAmount);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  const uniforms = useMemo(
    () => ({
      skyColor: { value: skyColor },
      cloudCoverage: { value: cloudCoverage },
      cloudSoftness: { value: cloudSoftness },
      cloudOpacity: { value: cloudOpacity },
      cloudScale: { value: cloudScale },
      cloudColor: { value: cloudColor },
    }),
    [
      skyColor,
      cloudCoverage,
      cloudSoftness,
      cloudOpacity,
      cloudScale,
      cloudColor,
    ]
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
