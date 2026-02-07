"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { getTodayString, isHabitDueOnDate } from "@/lib/utils";
import { Habit } from "@/types";

type Props = {
  habits: Habit[];
  weather: "sunny" | "rainy" | "cloudy" | "stormy";
  averageCompletionRate: number | null;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
};

export default function Signboard({
  habits,
  weather,
  averageCompletionRate,
  position = [0, -3, 60],
  rotation = [0, 0, 0],
  scale = [3, 3, 3],
}: Props) {
  const { scene } = useGLTF("/models/Signboard.glb");
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  const stateCanvas = useMemo(() => {
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

  const stateTexture = useMemo(
    () => new THREE.CanvasTexture(stateCanvas),
    [stateCanvas]
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
    const stateCtx = stateCanvas.getContext("2d");
    const weatherCtx = weatherCanvas.getContext("2d");
    const rateCtx = rateCanvas.getContext("2d");
    if (!stateCtx || !weatherCtx || !rateCtx) return;

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

      const left = w - 920;
      const right = w - 80;
      const top = h - 200;
      const bottom = h - 20;
      const centerX = (left + right) / 2;
      const centerY = (top + bottom) / 2;

      // 文字（中央に1行・上下反転を補正）
      ctx.save();
      ctx.translate(0, h);
      ctx.scale(1, -1);
      ctx.fillStyle = "#171716";
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const lines = text.split("\n");
      const orderedLines = lines.slice().reverse();
      const lineHeight = fontSize * 1.2;
      const startY = centerY - ((orderedLines.length - 1) * lineHeight) / 2;
      orderedLines.forEach((line, index) => {
        ctx.fillText(line, centerX, h - (startY + index * lineHeight));
      });
      ctx.restore();
    };

    const today = getTodayString();
    const incompleteHabits = habits.filter((habit) => {
      const isDueToday = isHabitDueOnDate(habit, today);
      const isCompletedToday = habit.completedDates?.includes(today);

      return isDueToday && !isCompletedToday;
    });

    let stateText = "";
    if (incompleteHabits.length > 0) {
      stateText = `未完了の習慣が${incompleteHabits.length}個...\n余裕があればやってみよう！`;
    } else {
      stateText = "習慣をすべて完了しました！\n🎉お疲れ様でした🎉";
    }
    drawBoard(stateCtx, stateText, 45, "#FF99CC");

    const weatherText =
      weather === "sunny"
        ? "晴れ☀️"
        : weather === "cloudy"
          ? "くもり☁️"
          : weather === "rainy"
            ? "雨🌧️"
            : "雷雨⛈️";
    drawBoard(weatherCtx, weatherText, 80, "#66FF66");

    const rateText =
      averageCompletionRate === null
        ? "—"
        : `${Math.round(averageCompletionRate * 10) / 10}%`;
    drawBoard(rateCtx, `7日間の平均完了率:${rateText}`, 60, "#66CCFF");

    stateTexture.needsUpdate = true;
    weatherTexture.needsUpdate = true;
    rateTexture.needsUpdate = true;
  }, [
    averageCompletionRate,
    stateCanvas,
    stateTexture,
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
        standard.map = stateTexture;
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
  }, [clonedScene, stateTexture, rateTexture, weatherTexture]);

  return (
    <primitive
      object={clonedScene}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
}
