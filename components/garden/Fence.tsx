"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

export default function Fence() {
  const { scene } = useGLTF("/models/fence.glb");
  const { size, min } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    return { size, min: box.min.clone() };
  }, [scene]);

  // Trees.tsx の配置に合わせた外周
  const columns = 4;
  const rows = 3;
  const spacing = 32;
  const rowOffset = 1;
  const minX = -((columns - 1) / 2) * spacing;
  const maxX = ((columns - 1) / 2) * spacing;
  const minZ = (0 - rowOffset) * spacing;
  const maxZ = ((rows - 1) - rowOffset) * spacing;

  const margin = 18;
  const left = minX - margin;
  const right = maxX + margin;
  const back = minZ - margin;
  const front = maxZ + margin;

  const width = right - left;
  const depth = front - back;

  const desiredHeight = 6;
  const scaleY = size.y > 0 ? desiredHeight / size.y : 1;
  const scaleZ = scaleY;
  const scaleXWidth = size.x > 0 ? width / size.x : 1;
  const scaleXDepth = size.x > 0 ? depth / size.x : 1;

  const yBase = -3;
  const yPosition = yBase - min.y * scaleY;

  const segments = useMemo(
    () => [
      {
        key: "front",
        position: [0, yPosition, front],
        rotation: [0, 0, 0],
        scale: [scaleXWidth, scaleY, scaleZ],
      },
      {
        key: "back",
        position: [0, yPosition, back],
        rotation: [0, Math.PI, 0],
        scale: [scaleXWidth, scaleY, scaleZ],
      },
      {
        key: "left",
        position: [left, yPosition, 0],
        rotation: [0, Math.PI / 2, 0],
        scale: [scaleXDepth, scaleY, scaleZ],
      },
      {
        key: "right",
        position: [right, yPosition, 0],
        rotation: [0, -Math.PI / 2, 0],
        scale: [scaleXDepth, scaleY, scaleZ],
      },
    ],
    [back, front, left, right, scaleXDepth, scaleXWidth, scaleY, scaleZ, yPosition]
  );

  const instances = useMemo(
    () => segments.map(() => scene.clone(true)),
    [scene, segments]
  );

  return (
    <group>
      {segments.map((segment, index) => (
        <primitive
          key={segment.key}
          object={instances[index]}
          position={segment.position as [number, number, number]}
          rotation={segment.rotation as [number, number, number]}
          scale={segment.scale as [number, number, number]}
        />
      ))}
    </group>
  );
}
