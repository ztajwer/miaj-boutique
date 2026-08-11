"use client";

import { useLoader, useThree } from "@react-three/fiber";
import { RGBELoader } from "three-stdlib";
import * as THREE from "three";
import { useEffect } from "react";

export default function SafeEnvironment({ intensity = 1, file = "/st_fagans_interior_1k.hdr" }: { intensity?: number, file?: string }) {
  const texture = useLoader(RGBELoader, file);
  const { scene } = useThree();

  useEffect(() => {
    if (!texture) return;
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    scene.environmentIntensity = intensity;
    
    return () => {
      scene.environment = null;
    };
  }, [texture, scene, intensity]);

  return null;
}
