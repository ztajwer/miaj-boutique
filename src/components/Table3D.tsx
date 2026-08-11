"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useGLTF, Html, Environment, ContactShadows, View, PerspectiveCamera } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { getModelUrl, extendGltfLoader } from "@/lib/modelAssets";
import { optimizeModelForGpu, optimizeModelForGpuAsync } from "@/lib/gpuModelOptimize";
import { getDeviceProfile } from "@/lib/deviceProfile";
import { useRouter } from "next/navigation";

interface ShowcaseProductConfig {
  productId: string;
  modelFile: string;
  targetMaxDim: number;
  colorHex?: number;
  mountDelay?: number;
}

const SHOWCASE_PRODUCTS: ShowcaseProductConfig[] = [
  { productId: "pro1", modelFile: "pro1.glb", targetMaxDim: 0.12, mountDelay: 0 }, // Left (Gold)
  { productId: "pro3", modelFile: "pro3.glb", targetMaxDim: 0.12, colorHex: 0xF2F2F2, mountDelay: 0 }, // Center (Shiny Silver)
  { productId: "pro4", modelFile: "pro4.glb", targetMaxDim: 0.12, mountDelay: 0 }, // Right (Gold)
];

function SingleShowcaseProduct({
  config,
  textureMax,
  position,
  rotation = [0, 0, 0],
}: {
  config: ShowcaseProductConfig;
  textureMax: number;
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  const { scene: rawScene } = useGLTF(getModelUrl(config.modelFile), false, false, extendGltfLoader);
  const router = useRouter();
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  const clonedScene = useMemo(() => {
    if (!rawScene) return null;
    const cloned = rawScene.clone(true);
    
    const lightsToRemove: THREE.Object3D[] = [];
    cloned.traverse((child) => {
      if ((child as any).isLight) lightsToRemove.push(child);
    });
    lightsToRemove.forEach((light) => light.parent?.remove(light));

    cloned.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh && mesh.material) {
        const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
        
        if (config.colorHex) {
          mat.color.setHex(config.colorHex);
          mat.roughness = 0.15; // Smooth realistic silver
        } else {
          mat.color.setHex(0xD4AF37); // Rich vibrant Gold
          mat.roughness = 0.18; // Smooth realistic gold
        }
        
        mat.metalness = 1.0;
        mat.envMapIntensity = 2.0; // Balanced reflection

        mesh.material = mat;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    const box = new THREE.Box3();
    let hasMesh = false;
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        box.expandByObject(child);
        hasMesh = true;
      }
    });
    if (!hasMesh) box.setFromObject(cloned);

    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    let targetScale = 1;
    if (maxDim > 0) {
      targetScale = config.targetMaxDim / maxDim;
      cloned.scale.setScalar(targetScale);
    }

    cloned.position.x = -center.x * targetScale;
    cloned.position.y = -box.min.y * targetScale;
    cloned.position.z = -center.z * targetScale;

    optimizeModelForGpu(cloned, textureMax);
    return cloned;
  }, [rawScene, config.targetMaxDim, config.colorHex, textureMax]);

  useFrame(() => {
    if (groupRef.current) {
      const targetScale = hovered ? 1.15 : 1.0;
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
    }
  });

  if (!clonedScene) return null;

  return (
    <group position={position}>
      {/* Floating pivot so the product itself stays centered at the specified position/rotation */}
      <group 
        ref={groupRef}
        rotation={[Math.PI / 2.5, rotation[1], 0]} 
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/product/${config.productId}`);
        }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; setHovered(true); }}
        onPointerOut={(e) => { e.stopPropagation(); document.body.style.cursor = 'auto'; setHovered(false); }}
      >
        <primitive object={clonedScene} />
        <ContactShadows position={[0, 0, 0]} opacity={0.6} scale={0.3} blur={1.5} far={0.3} color="#3D2817" />
      </group>
    </group>
  );
}

function DelayedShowcaseProduct({
  config,
  textureMax,
  position,
  rotation = [0, 0, 0],
}: {
  config: ShowcaseProductConfig;
  textureMax: number;
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const delay = config.mountDelay || 0;
    if (delay <= 0) {
      setReady(true);
      return;
    }
    const timer = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(timer);
  }, [config.mountDelay]);

  if (!ready) return null;

  return (
    <Suspense fallback={null}>
      <SingleShowcaseProduct config={config} textureMax={textureMax} position={position} rotation={rotation} />
    </Suspense>
  );
}

function ShowcaseProductsGroup({ textureMax, tablePosition }: { textureMax: number; tablePosition: [number, number, number] }) {
  // Restored exactly to the perfect offset plus a 5px lift (from 0.56 to 0.58)
  const yOffset = 0.58; 
  return (
    <group position={tablePosition}>
      {/* Exact hexagon bay coordinates */}
      <DelayedShowcaseProduct config={SHOWCASE_PRODUCTS[0]} textureMax={textureMax} position={[-0.415, yOffset, 0.24]} rotation={[0, Math.PI / 6, 0]} />
      <DelayedShowcaseProduct config={SHOWCASE_PRODUCTS[1]} textureMax={textureMax} position={[0, yOffset, 0.48]} />
      <DelayedShowcaseProduct config={SHOWCASE_PRODUCTS[2]} textureMax={textureMax} position={[0.415, yOffset, 0.24]} rotation={[0, -Math.PI / 6, 0]} />
    </group>
  );
}

function TableModel({ textureMax, isMobile }: { textureMax: number; isMobile: boolean }) {
  const { scene } = useGLTF(getModelUrl("Kiosk_Centre_opt.glb"), false, false, extendGltfLoader);
  const groupRef = useRef<THREE.Group>(null);

  const clonedScene = useMemo(() => {
    if (!scene) return null;
    const cloned = scene.clone(true);
    const lightsToRemove: THREE.Object3D[] = [];
    cloned.traverse((child) => {
      if ((child as any).isLight) {
        lightsToRemove.push(child);
      }
    });
    lightsToRemove.forEach((light) => {
      light.parent?.remove(light);
    });

    cloned.scale.setScalar(1);
    cloned.position.set(0, 0, 0);
    cloned.rotation.set(0, Math.PI, 0);

    const box = new THREE.Box3();
    let hasMesh = false;
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        box.expandByObject(child);
        hasMesh = true;
      }
    });
    if (!hasMesh) {
      box.setFromObject(cloned);
    }
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    let targetScale = 1;
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      targetScale = 1.60 / maxDim; 
      cloned.scale.setScalar(targetScale);
    }

    cloned.position.x = -center.x * targetScale;
    cloned.position.y = -box.min.y * targetScale;
    cloned.position.z = -0.5;

    optimizeModelForGpu(cloned, textureMax);

    cloned.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.frustumCulled = true;
        mesh.raycast = () => null;
        
        if (!isMobile) {
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
        if (mesh.material) {
          const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
          mesh.material = mat;
          
          // Disable anisotropy on textures to prevent specular aliasing / noise (flickering on camera movement)
          if (mat.map) mat.map.anisotropy = 1;
          if (mat.normalMap) mat.normalMap.anisotropy = 1;
          if (mat.roughnessMap) mat.roughnessMap.anisotropy = 1;
          if (mat.metalnessMap) mat.metalnessMap.anisotropy = 1;
        }
      }
    });

    return cloned;
  }, [scene, textureMax, isMobile]);

  if (!clonedScene) return null;

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} />
    </group>
  );
}

function TableGlassTop({ tablePosition }: { tablePosition: [number, number, number] }) {
  return (
    <mesh position={[tablePosition[0], 0.52, tablePosition[2]]}>
      <cylinderGeometry args={[0.7, 0.7, 0.02, 64]} />
      <meshPhysicalMaterial 
        color="#ffffff" 
        transparent 
        opacity={0.08} 
        transmission={0.9} 
        roughness={0} 
        thickness={0.02} 
        side={THREE.DoubleSide} 
      />
    </mesh>
  );
}

interface Table3DProps {
  opacity?: number;
  isMobile?: boolean;
}

export default function Table3D({ opacity = 1, isMobile = false }: Table3DProps) {
  const profile = useMemo(() => getDeviceProfile(), []);
  
  // Use passed isMobile if provided, otherwise fallback to profile (useful for standalone mounting)
  const mobileLayout = isMobile;

  const textureMax = profile.lowEnd ? 1024 : 2048;

  return (
    <div
      className={`table-3d-wrapper absolute left-[50%] -translate-x-1/2 z-[60] w-[100vw] h-[400px] md:h-[600px] ${mobileLayout ? 'bottom-[57px]' : 'bottom-[-260px]'}`}
      style={{
        opacity,
        pointerEvents: "auto",
        transition: "opacity 0.6s ease-out, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      aria-label="3D Display Table Showcase"
    >
      <View className="w-full h-full pointer-events-auto">
        <PerspectiveCamera 
          makeDefault 
          position={[0, 1.8, 5.0]} 
          fov={17.5} 
          onUpdate={(c) => c.lookAt(0, 0.24, 0)}
        />
        <Environment preset="apartment" environmentIntensity={1.4} />
        <ambientLight intensity={0.9} color="#F8F1E9" />
        <spotLight position={[0, 5, 0]} intensity={2.0} color="#FFF5E6" angle={0.8} penumbra={0.8} />
        <pointLight position={[0, 1.5, 2.5]} intensity={0.8} color="#F8F1E9" distance={8} />

        <Suspense fallback={null}>
          <group scale={mobileLayout ? 0.92 : 1.30} position={mobileLayout ? [0, 0, 0] : [0, -0.30, 0]}>
            <TableModel textureMax={textureMax} isMobile={mobileLayout} />
            <ShowcaseProductsGroup textureMax={textureMax} tablePosition={[0, 0, -0.5]} />
            <TableGlassTop tablePosition={[0, 0, -0.5]} />
          </group>

          {/* Render smooth contact shadow plane to ground it on the floor. Inside Suspense so it bakes AFTER models load. */}
          <ContactShadows
            position={[0, 0, 0]}
            opacity={0.80}
            scale={15.0}
            blur={2.2}
            far={4.0}
            resolution={1024}
            color="#3D2817"
            frames={1}
          />
        </Suspense>
      </View>
    </div>
  );
}


