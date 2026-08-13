"use client";

import { Suspense, useRef, type MutableRefObject } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import CinematicCamera from "./CinematicCamera";
import GlassDoors from "./GlassDoors";
import SceneLighting from "./SceneLighting";
import LoadingBridge from "./LoadingBridge";
import { DEFAULT_FRAME } from "@/lib/doorFraming";
// Removed heavy postprocessing to ensure smooth door opening

import { ContactShadows, View, PerspectiveCamera } from "@react-three/drei";
import SafeEnvironment from "./SafeEnvironment";

function DoorSceneContent({
  progressRef,
  brightness,
}: {
  progressRef: MutableRefObject<number>;
  brightness: number;
}) {
  const frameRef = useRef(DEFAULT_FRAME);

  return (
    <>
      <Suspense fallback={null}>
        <SafeEnvironment file="/lebombo_1k.hdr" />
      </Suspense>
      <CinematicCamera progressRef={progressRef} frameRef={frameRef} />
      <SceneLighting brightness={brightness} />
      <GlassDoors progressRef={progressRef} frameRef={frameRef} />
      {/* Removed EffectComposer to fix door lag and ensure smooth performance */}
    </>
  );
}

interface DoorSceneCanvasProps {
  progressRef: MutableRefObject<number>;
  brightness: number;
  opacity: number;
}

export default function DoorSceneCanvas({
  progressRef,
  brightness,
  opacity,
}: DoorSceneCanvasProps) {
  return (
    <div
      className="door-scene-canvas fixed inset-0 z-[70]"
      style={{
        opacity,
        transition: "opacity 0.6s ease-out",
        pointerEvents: "none",
      }}
    >
      <Canvas
        shadows={false}
        dpr={1}
        gl={{ antialias: false, alpha: true, stencil: false, powerPreference: "high-performance" }}
        style={{ width: "100%", height: "100%" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.shadowMap.enabled = false;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.14;
        }}
      >
        <fog attach="fog" args={["#100c08", 4, 15]} />
        <LoadingBridge />
        <Suspense fallback={null}>
          <DoorSceneContent progressRef={progressRef} brightness={brightness} />
        </Suspense>
      </Canvas>
    </div>
  );
}
