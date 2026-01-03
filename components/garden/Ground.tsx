"use client";

export default function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[50, 50]} />
      <meshBasicMaterial color="#90EE90" />
    </mesh>
  );
}