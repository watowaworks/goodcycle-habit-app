"use client";

import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useMemo } from "react";
import { getTodayString } from "@/lib/utils";

type Props = {
  weather: "sunny" | "rainy" | "cloudy" | "stormy";
  averageCompletionRate: number | null;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
};

function getWeatherLabel(weather: Props["weather"]) {
  switch (weather) {
    case "sunny":
      return "晴れ";
    case "cloudy":
      return "くもり";
    case "rainy":
      return "雨";
    case "stormy":
      return "雷雨";
    default:
      return "";
  }
}

export default function Signboard({
  weather,
  averageCompletionRate,
  position = [0, -3, 60],
  rotation = [0, 0, 0],
  scale = [3, 3, 3],
}: Props) {
  const { scene } = useGLTF("/models/Signboard.glb");
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  const canvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 512;
    return c;
  }, []);

  const texture = useMemo(() => new THREE.CanvasTexture(canvas), [canvas]);

  useEffect(() => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    //背景
    ctx.fillStyle = "#f5efe3";
    ctx.fillRect(0, 0, w, h);

    // 枠
    ctx.strokeStyle = "#cbb48a";
    ctx.lineWidth = 10;
    ctx.strokeRect(24, 24, w - 48, h - 48);

    // 文字
    ctx.fillStyle = "#4a3b2a";
    ctx.font = "bold 52px sans-serif";
    ctx.fillText("Garden Status", 60, 90);

    ctx.font = "bold 40px sans-serif";
    ctx.fillText(`日付: ${getTodayString()}`, 60, 180);
    ctx.fillText(`天気: ${getWeatherLabel(weather)}`, 60, 250);

    const rateText =
      averageCompletionRate === null ? "—" : `${Math.round(averageCompletionRate * 10) / 10}%`;
    ctx.fillText(`完了率: ${rateText}`, 60, 320);

    texture.needsUpdate = true;
  }, [averageCompletionRate, canvas, texture, weather]);

  useEffect(() => {
    const targets = new Set(["signboard_1", "signboard_2", "signboard_3"]);
    clonedScene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const name = obj.name.toLowerCase();
      console.log("mesh name:", obj.name);
      if (!targets.has(name)) return;
  
      const material = (Array.isArray(obj.material) ? obj.material[0] : obj.material) as THREE.Material;
      const cloned = material.clone() as THREE.MeshStandardMaterial;
      cloned.map = texture;
      cloned.color = new THREE.Color(0xffffff);
      cloned.needsUpdate = true;
      obj.material = cloned;
    });
  }, [clonedScene, texture]);

  return (
    <primitive
      object={clonedScene}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
}
