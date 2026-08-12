"use client";

import { useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { DoorFrameState } from "@/lib/doorFraming";

interface GlassDoorsProps {
  progressRef: MutableRefObject<number>;
  frameRef?: MutableRefObject<DoorFrameState>;
  animRef?: MutableRefObject<{ phase: string }>;
}

export const PANEL_W = 1.55;
export const PANEL_H = 4.8;
export const DOOR_ASSEMBLY_H = PANEL_H + 0.2;

const GLASS_W = 1.80;
const GLASS_H = 5.0;
const PANEL_D = 0.05;
const MAX_OPEN = Math.PI * 0.44;

const CHAMPAGNE = "#D4AF6A";

function ChampagneMat({ roughness = 0.08 }: { roughness?: number }) {
  return (
    <meshPhysicalMaterial
      color={CHAMPAGNE}
      metalness={1.0}
      roughness={roughness}
      clearcoat={1.0}
      clearcoatRoughness={0.04}
      envMapIntensity={3.0}
      reflectivity={1.0}
    />
  );
}

function GlassMat() {
  return (
    <meshPhysicalMaterial
      color="#F8E5D0" 
      transmission={0.90} // Restored for luxury look
      opacity={0.10} // Restored original shade
      transparent={true}
      roughness={0.08}
      metalness={0.2}
      ior={1.45}
      thickness={0.05}
      envMapIntensity={2.5}
      side={THREE.DoubleSide}
      depthWrite={false}
    />
  );
}

/**
 * BIG premium champagne-gold handle — 15% larger than before.
 * r = 0.048 (was 0.042), height = 2.75 (was 2.4)
 * Focus: thick, bold, polished luxury bar handle.
 */
function DoorHandle({ side }: { side: "left" | "right" }) {
  const x         = side === "left" ? GLASS_W / 2 - 0.12 : -GLASS_W / 2 + 0.12;
  const height    = 2.4;     // Taller height as requested
  const r         = 0.038;   // Slimmer width as requested
  const backR     = 0.065;   // bracket radius scaled
  const mountLen  = 0.14;    // bracket depth
  const z         = PANEL_D * 0.5 + 0.08;

  return (
    <group position={[x, 0, z]}>

      {/* Flat back-plate behind handle */}
      <mesh position={[0, 0, -0.065]} castShadow>
        <boxGeometry args={[r * 3.2, height + 0.14, 0.020]} />
        <ChampagneMat roughness={0.22} />
      </mesh>

      {/* Main vertical bar */}
      <mesh castShadow>
        <cylinderGeometry args={[r, r, height, 36]} />
        <ChampagneMat roughness={0.06} />
      </mesh>

      {/* Top mounting bracket */}
      <mesh
        position={[0, height / 2 - 0.08, -mountLen / 2]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <cylinderGeometry args={[backR, backR, mountLen, 24]} />
        <ChampagneMat roughness={0.12} />
      </mesh>

      {/* Bottom mounting bracket */}
      <mesh
        position={[0, -height / 2 + 0.08, -mountLen / 2]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <cylinderGeometry args={[backR, backR, mountLen, 24]} />
        <ChampagneMat roughness={0.12} />
      </mesh>

      {/* Collar ring — upper third */}
      <mesh position={[0, height * 0.28, 0]} castShadow>
        <torusGeometry args={[r + 0.009, 0.011, 16, 40]} />
        <ChampagneMat roughness={0.04} />
      </mesh>

      {/* Collar ring — center */}
      <mesh position={[0, 0, 0]} castShadow>
        <torusGeometry args={[r + 0.012, 0.013, 16, 40]} />
        <ChampagneMat roughness={0.03} />
      </mesh>

      {/* Collar ring — lower third */}
      <mesh position={[0, -height * 0.28, 0]} castShadow>
        <torusGeometry args={[r + 0.009, 0.011, 16, 40]} />
        <ChampagneMat roughness={0.04} />
      </mesh>

      {/* Top spherical cap */}
      <mesh position={[0, height / 2 + 0.030, 0]} castShadow>
        <sphereGeometry args={[r * 1.6, 28, 28]} />
        <ChampagneMat roughness={0.03} />
      </mesh>

      {/* Bottom spherical cap */}
      <mesh position={[0, -height / 2 - 0.030, 0]} castShadow>
        <sphereGeometry args={[r * 1.6, 28, 28]} />
        <ChampagneMat roughness={0.03} />
      </mesh>

    </group>
  );
}

function DoorPanel({
  side,
  targetAngleRef,
  animRef,
}: {
  side: "left" | "right";
  targetAngleRef: MutableRefObject<number>;
  animRef?: MutableRefObject<{ phase: string }>;
}) {
  const pivotRef = useRef<THREE.Group>(null);
  const angle    = useRef(0);
  const hingeX   = side === "left" ? -PANEL_W : PANEL_W;
  const openDir  = side === "left" ? -1 : 1;

  useFrame((_, delta) => {
    if (!pivotRef.current) return;
    const target = targetAngleRef.current * openDir;
    const phase  = animRef?.current?.phase;
    if (phase === "complete") {
      angle.current = target;
    } else {
      const follow = phase === "opening" ? 20 : 10;
      angle.current = THREE.MathUtils.lerp(angle.current, target, Math.min(1, delta * follow));
    }
    pivotRef.current.rotation.y = angle.current;
  });

  const gap          = 0.002;
  const innerEdge    = side === "left" ?  PANEL_W - gap : -PANEL_W + gap;
  const outerEdge    = side === "left" ?  PANEL_W - GLASS_W : -PANEL_W + GLASS_W;
  const panelCenterX = (innerEdge + outerEdge) / 2;

  return (
    <group position={[hingeX, 0, -0.02]}>
      <group ref={pivotRef}>
        <group position={[panelCenterX, 0, 0]}>

          {/* Nearly invisible glass — only so the panel swings properly */}
          <mesh>
            <boxGeometry args={[GLASS_W, GLASS_H, PANEL_D * 0.4]} />
            <GlassMat />
          </mesh>

          {/* BIG GOLD HANDLE — the entire focus */}
          <DoorHandle side={side} />

        </group>
      </group>
    </group>
  );
}

export default function GlassDoors({ progressRef, frameRef, animRef }: GlassDoorsProps) {
  const leftTargetRef  = useRef(0);
  const rightTargetRef = useRef(0);
  const shadowMatRef   = useRef<THREE.ShadowMaterial>(null);
  const groupRef       = useRef<THREE.Group>(null);

  useFrame(() => {
    const p = progressRef.current;
    leftTargetRef.current  = p * MAX_OPEN;
    const delayed          = Math.max(0, (p - 0.06) / 0.94);
    rightTargetRef.current = delayed * MAX_OPEN;

    if (shadowMatRef.current) {
      shadowMatRef.current.opacity = 0.18 + p * 0.14;
    }

    if (groupRef.current && frameRef?.current) {
      const { scale, groupZ } = frameRef.current;
      groupRef.current.scale.set(scale.x, scale.y, scale.x);
      groupRef.current.position.z = groupZ;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <DoorPanel side="left"  targetAngleRef={leftTargetRef}  animRef={animRef} />
      <DoorPanel side="right" targetAngleRef={rightTargetRef} animRef={animRef} />

      {/* Floor shadow */}
      <mesh position={[0, -GLASS_H / 2 - 0.026, 0.3]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 6]} />
        <shadowMaterial ref={shadowMatRef} transparent opacity={0.18} color="#2E2010" />
      </mesh>

      {/* Warm lights to make handles shine */}
      <pointLight position={[ 0,   1.0, 1.5]} color="#FFF5E0" intensity={1.2} distance={5} decay={2} />
      <pointLight position={[-1.4, 0,   1.0]} color="#FFE8A0" intensity={0.6} distance={4} decay={2} />
      <pointLight position={[ 1.4, 0,   1.0]} color="#FFE8A0" intensity={0.6} distance={4} decay={2} />
    </group>
  );
}
