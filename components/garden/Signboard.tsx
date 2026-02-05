"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { getTodayString } from "@/lib/utils";

type Props = {
  weather: "sunny" | "rainy" | "cloudy" | "stormy";
  averageCompletionRate: number | null;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
};

export default function Signboard({
  weather,
  averageCompletionRate,
  position = [0, -3, 60],
  rotation = [0, 0, 0],
  scale = [3, 3, 3],
}: Props) {
  const { scene } = useGLTF("/models/Signboard.glb");
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  const dateCanvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 512;
    return c;
  }, []);

  const weatherCanvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 512;
    return c;
  }, []);

  const rateCanvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 512;
    return c;
  }, []);

  const dateTexture = useMemo(
    () => new THREE.CanvasTexture(dateCanvas),
    [dateCanvas]
  );
  const weatherTexture = useMemo(
    () => new THREE.CanvasTexture(weatherCanvas),
    [weatherCanvas]
  );
  const rateTexture = useMemo(
    () => new THREE.CanvasTexture(rateCanvas),
    [rateCanvas]
  );

  useEffect(() => {
    const dateCtx = dateCanvas.getContext("2d");
    const weatherCtx = weatherCanvas.getContext("2d");
    const rateCtx = rateCanvas.getContext("2d");
    if (!dateCtx || !weatherCtx || !rateCtx) return;

    const drawBoard = (
      ctx: CanvasRenderingContext2D,
      text: string,
      fontSize = 90,
      backgroundColor = "#f5efe3"
    ) => {
      const w = ctx.canvas.width;
      const h = ctx.canvas.height;

      //背景
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, w, h);

      // 枠
      ctx.strokeStyle = "#cbb48a";
      ctx.lineWidth = 10;
      ctx.strokeRect(24, 24, w - 48, h - 48);

      const left = w - 920;
      const right = w - 80;
      const top = h - 200;
      const bottom = h - 30;
      const centerX = (left + right) / 2;
      const centerY = (top + bottom) / 2;

      // 文字（中央に1行・上下反転を補正）
      ctx.save();
      ctx.translate(0, h);
      ctx.scale(1, -1);
      ctx.fillStyle = "#4a3b2a";
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, centerX, h - centerY);
      ctx.restore();
    };

    const today = new Date();
    const formattedDate = `${today.getFullYear()}年 ${today.getMonth() + 1}月 ${today.getDate()}日`;
    drawBoard(dateCtx, formattedDate, 70, "lightpink");

    const weatherText =
      weather === "sunny"
        ? "晴れ☀️"
        : weather === "cloudy"
          ? "曇り☁️"
          : weather === "rainy"
            ? "雨🌧️"
            : "雷雨⛈️";
    drawBoard(weatherCtx, weatherText, 80, "lightgreen");

    const rateText =
      averageCompletionRate === null
        ? "—"
        : `${Math.round(averageCompletionRate * 10) / 10}%`;
    drawBoard(rateCtx, `7日間の平均完了率:${rateText}`, 60, "lightblue");

    dateTexture.needsUpdate = true;
    weatherTexture.needsUpdate = true;
    rateTexture.needsUpdate = true;
  }, [
    averageCompletionRate,
    dateCanvas,
    dateTexture,
    rateCanvas,
    rateTexture,
    weather,
    weatherCanvas,
    weatherTexture,
  ]);

  useEffect(() => {
    clonedScene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const name = obj.name.toLowerCase();
      console.log("mesh name:", obj.name);

      const material = Array.isArray(obj.material) ? obj.material[0] : obj.material;
      if (!material) return;
      const cloned = material.clone();
      const standard = cloned as THREE.MeshStandardMaterial;
      if (name === "board_1") {
        standard.map = dateTexture;
        standard.color = new THREE.Color(0xffffff);
        cloned.needsUpdate = true;
        obj.material = cloned;
      }
      if (name === "board_2") {
        standard.map = weatherTexture;
        standard.color = new THREE.Color(0xffffff);
        cloned.needsUpdate = true;
        obj.material = cloned;
      }
      if (name === "board_3") {
        standard.map = rateTexture;
        standard.color = new THREE.Color(0xffffff);
        cloned.needsUpdate = true;
        obj.material = cloned;
      }
    });
  }, [clonedScene, dateTexture, rateTexture, weatherTexture]);

  return (
    <primitive
      object={clonedScene}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
}
