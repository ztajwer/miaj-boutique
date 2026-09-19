"use client";

import { useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
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
      color="#FFF8F0"
      transmission={0}
      opacity={0.12}
      transparent={true}
      roughness={0.02}
      metalness={0.15}
      clearcoat={1.0}
      clearcoatRoughness={0.02}
      envMapIntensity={4.5}
      side={THREE.DoubleSide}
      depthWrite={false}
    />
  );
}

function DoorHandle({ side }: { side: "left" | "right" }) {
  const { size } = useThree();
  const isMobile = size.width < 768;

  const x = side === "left" ? GLASS_W / 2 - 0.12 : -GLASS_W / 2 + 0.12;
  const height = isMobile ? 1.7 : 2.4;
  const r = isMobile ? 0.052 : 0.038;
  const rosetteR = isMobile ? 0.092 : 0.072;
  const mountR = isMobile ? 0.052 : 0.042;
  const mountLen = 0.14;
  const z = PANEL_D * 0.5 + 0.08;

  return (
    <group position={[x, 0, z]}>

      {/* Single clean pull bar with softened, high-resolution ends. */}
      <mesh castShadow>
        <cylinderGeometry args={[r, r, height, 48]} />
        <ChampagneMat roughness={0.06} />
      </mesh>

      <mesh position={[0, height / 2, 0]} castShadow>
        <sphereGeometry args={[r * 1.22, 32, 20]} />
        <ChampagneMat roughness={0.04} />
      </mesh>

      <mesh position={[0, -height / 2, 0]} castShadow>
        <sphereGeometry args={[r * 1.22, 32, 20]} />
        <ChampagneMat roughness={0.04} />
      </mesh>

      {/* Minimal glass rosettes and recessed standoffs. */}
      <mesh
        position={[0, height / 2 - 0.06, -mountLen / 2]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <cylinderGeometry args={[mountR, mountR * 0.86, mountLen, 32]} />
        <ChampagneMat roughness={0.12} />
      </mesh>
      <mesh
        position={[0, -height / 2 + 0.06, -mountLen / 2]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <cylinderGeometry args={[mountR, mountR * 0.86, mountLen, 32]} />
        <ChampagneMat roughness={0.12} />
      </mesh>
      <mesh
        position={[0, height / 2 - 0.06, -mountLen + 0.012]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <cylinderGeometry args={[rosetteR, rosetteR * 0.9, 0.026, 48]} />
        <ChampagneMat roughness={0.1} />
      </mesh>
      <mesh
        position={[0, -height / 2 + 0.06, -mountLen + 0.012]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <cylinderGeometry args={[rosetteR, rosetteR * 0.9, 0.026, 48]} />
        <ChampagneMat roughness={0.1} />
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
