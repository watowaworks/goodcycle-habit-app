"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type Props = {
  weather: "sunny" | "cloudy" | "rainy" | "stormy";
};

type RainDrop = {
  x: number;
  y: number;
  z: number;
  speed: number;
};

export default function Rain({ weather }: Props) {
  const rainCount = weather === "stormy" ? 4000 : 2000; // 雨粒の数
  const rainLength = 0.3; // 雨粒の長さ

  // 雨粒の初期位置を生成（useMemoで再生成を防ぐ）
  // Math.random は意図的に使用（初期配置のランダム性）
  const rainDrops = useMemo<RainDrop[]>(() => {
    /* eslint-disable react-hooks/purity -- Math.random for procedural rain placement */
    const baseSpeed = weather === "stormy" ? 0.8 : 0.5;
    const sphereRadius = 300; // Skyの球の半径
    return Array.from({ length: rainCount }, () => {
      // 円形の範囲内にランダムに配置（XZ平面）
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * sphereRadius * 0.9; // 半径の90%以内
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;

      return {
        x,
        y: Math.random() * sphereRadius * 1.5 + 10, // 上から広い範囲
        z,
        speed: baseSpeed + Math.random() * 0.2, // 少しランダム性を持たせる
      };
    });
    /* eslint-enable react-hooks/purity */
  }, [weather, rainCount]);

  // ジオメトリとマテリアルは1つだけ作成（全インスタンスで共有）
  const geometry = useMemo(
    () => new THREE.CylinderGeometry(0.05, 0.05, rainLength, 4),
    []
  );

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0x88ccff,
        opacity: 0.8,
        transparent: true,
      }),
    []
  );

  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  // インスタンスの位置を設定するための一時オブジェクト
  const tempObject = useMemo(() => new THREE.Object3D(), []);

  // アニメーションループ（rainy/stormy の時のみ）
  useFrame(() => {
    if (weather !== "rainy" && weather !== "stormy") return;
    if (!instancedMeshRef.current) return;

    rainDrops.forEach((drop, index) => {
      drop.y -= drop.speed;

      // 画面下に到達したら上に戻す（Skyの球の範囲内）
      const sphereRadius = 100;
      if (drop.y < -sphereRadius * 0.5) {
        drop.y = sphereRadius * 0.8 + 10;
        // XZ平面で円形に再配置
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * sphereRadius * 0.9;
        drop.x = Math.cos(angle) * distance;
        drop.z = Math.sin(angle) * distance;
      }

      // インスタンスの位置を設定
      tempObject.position.set(drop.x, drop.y, drop.z);
      tempObject.updateMatrix();
      instancedMeshRef.current!.setMatrixAt(index, tempObject.matrix);
    });

    // インスタンス行列の更新を通知（GPUに反映）
    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
  });

  // 雨が降る天気の時のみ表示
  if (weather !== "rainy" && weather !== "stormy") {
    return null;
  }

  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[geometry, material, rainCount]}
    />
  );
}
