"use client";

import { useState, useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

type Props = {
  weather: "sunny" | "cloudy" | "rainy" | "stormy";
};

// 稲妻の形状を生成する関数
function createLightningShape(
  start: [number, number, number],
  end: [number, number, number]
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [new THREE.Vector3(...start)];
  const segments = 15; // ジグザグのセグメント数

  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const x = start[0] + (end[0] - start[0]) * t + (Math.random() - 0.5) * 3;
    const y = start[1] + (end[1] - start[1]) * t + (Math.random() - 0.5) * 2;
    const z = start[2] + (end[2] - start[2]) * t + (Math.random() - 0.5) * 3;
    points.push(new THREE.Vector3(x, y, z));
  }

  points.push(new THREE.Vector3(...end));
  return points;
}

export default function Lightning({ weather }: Props) {
  const { scene } = useThree();
  const [isFlashing, setIsFlashing] = useState(false);
  const [lightningVisible, setLightningVisible] = useState(false);
  const [lightningPoints, setLightningPoints] = useState<THREE.Vector3[]>([]);
  const nextLightningTimeRef = useRef<number>(0);
  const baseAmbientIntensity = useRef<number | null>(null);
  const baseDirectionalIntensity = useRef<number | null>(null);
  const lightsInitializedRef = useRef<boolean>(false);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const directionalLightRef = useRef<THREE.DirectionalLight | null>(null);

  // シーン内のライトを取得（初回のみ）
  const initializeLights = () => {
    if (lightsInitializedRef.current) return;

    scene.traverse((object) => {
      if (object instanceof THREE.AmbientLight && !ambientLightRef.current) {
        ambientLightRef.current = object;
        baseAmbientIntensity.current = object.intensity;
      }
      if (
        object instanceof THREE.DirectionalLight &&
        !directionalLightRef.current
      ) {
        directionalLightRef.current = object;
        baseDirectionalIntensity.current = object.intensity;
      }
    });

    if (ambientLightRef.current && directionalLightRef.current) {
      lightsInitializedRef.current = true;
    }
  };

  // 雷を発生させる関数
  const triggerLightning = () => {
    // フラッシュ効果
    setIsFlashing(true);
    setLightningVisible(true);

    // 稲妻の位置をランダムに生成
    const startX = (Math.random() - 0.5) * 200;
    const startZ = (Math.random() - 0.5) * 200;
    const start: [number, number, number] = [startX, 100, startZ];
    const end: [number, number, number] = [
      startX + (Math.random() - 0.5) * 20,
      0,
      startZ + (Math.random() - 0.5) * 20,
    ];

    const points = createLightningShape(start, end);
    setLightningPoints(points);

    // 短時間で消す
    setTimeout(() => {
      setIsFlashing(false);
      setLightningVisible(false);
    }, 300); // 0.15秒で消える
  };

  // ランダムな間隔で雷を発生（stormy の時のみ）
  useFrame((state) => {
    if (weather !== "stormy") return;

    // ライトの初期化（初回のみ）
    initializeLights();

    const currentTime = state.clock.elapsedTime;

    if (currentTime >= nextLightningTimeRef.current) {
      triggerLightning();
      // 次の雷までの時間を設定（5〜8秒）
      const nextInterval = 5 + Math.random() * 3;
      nextLightningTimeRef.current = currentTime + nextInterval;
    }

    // フラッシュ効果: ライトの強度を調整（フラッシュ中のみ）
    if (
      isFlashing &&
      baseAmbientIntensity.current !== null &&
      baseDirectionalIntensity.current !== null
    ) {
      const flashIntensity = 2 + Math.random() * 3; // 2〜5倍
      if (ambientLightRef.current) {
        ambientLightRef.current.intensity =
          baseAmbientIntensity.current * flashIntensity;
      }
      if (directionalLightRef.current) {
        directionalLightRef.current.intensity =
          baseDirectionalIntensity.current * flashIntensity;
      }
    } else if (
      !isFlashing &&
      baseAmbientIntensity.current !== null &&
      baseDirectionalIntensity.current !== null
    ) {
      // フラッシュが終わったら元の強度に戻す（一度だけ）
      if (
        ambientLightRef.current &&
        ambientLightRef.current.intensity !== baseAmbientIntensity.current
      ) {
        ambientLightRef.current.intensity = baseAmbientIntensity.current;
      }
      if (
        directionalLightRef.current &&
        directionalLightRef.current.intensity !==
          baseDirectionalIntensity.current
      ) {
        directionalLightRef.current.intensity =
          baseDirectionalIntensity.current;
      }
    }
  });

  // 稲妻のジオメトリを生成（連続した線になるようにインデックスを設定）
  const lightningGeometry = useMemo(() => {
    if (lightningPoints.length === 0) return null;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(
      lightningPoints.flatMap((p) => [p.x, p.y, p.z])
    );
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    // 連続した線分にするためにインデックスを設定
    // 各頂点を次の頂点とペアにして線分を作成 (0-1, 1-2, 2-3, ...)
    const indices = [];
    for (let i = 0; i < lightningPoints.length - 1; i++) {
      indices.push(i, i + 1);
    }
    geometry.setIndex(indices);

    return geometry;
  }, [lightningPoints]);

  // 雷が発生する天気の時のみ表示
  if (weather !== "stormy") {
    return null;
  }

  return (
    <>
      {/* 稲妻の形状 */}
      {lightningVisible && lightningGeometry && (
        <lineSegments geometry={lightningGeometry}>
          <lineBasicMaterial color={0xffffcc} linewidth={2} />
        </lineSegments>
      )}
    </>
  );
}
