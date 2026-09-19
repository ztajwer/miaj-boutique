"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useGLTF, ContactShadows, PerspectiveCamera } from "@react-three/drei";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { RGBELoader } from "three-stdlib";
import { getModelUrl, extendGltfLoader } from "@/lib/modelAssets";
import { optimizeModelForGpu, optimizeModelForGpuAsync } from "@/lib/gpuModelOptimize";
import { getDeviceProfile } from "@/lib/deviceProfile";
import {
  applyJewelryRendererSettings,
  fitProductToUniformSize,
  prepareProductMaterials,
  type CustomizationSettings,
} from "@/lib/productModelUtils";
import { useCustomization } from "@/context/CustomizationContext";
import type { ProductId } from "@/lib/products";
import { useRouter } from "next/navigation";

interface ShowcaseProductConfig {
  productId: ProductId;
  modelFile: string;
  targetMaxDim: number;
  mountDelay?: number;
}

function SafeEnvironment({ intensity }: { intensity: number }) {
  const texture = useLoader(RGBELoader, "/st_fagans_interior_1k.hdr");
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

const SHOWCASE_PRODUCTS: ShowcaseProductConfig[] = [
  { productId: "pro2", modelFile: "protest.glb", targetMaxDim: 0.15, mountDelay: 0 }, // Left — Luna bracelet
  { productId: "pro1", modelFile: "ring.glb", targetMaxDim: 0.15, mountDelay: 0 }, // Center — Heritage Ring
  { productId: "pro4", modelFile: "protest.glb", targetMaxDim: 0.15, mountDelay: 0 }, // Right — Cascade necklace
];

function SingleShowcaseProduct({
  config,
  textureMax,
  position,
  rotation = [0, 0, 0],
  customization,
}: {
  config: ShowcaseProductConfig;
  textureMax: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  customization?: CustomizationSettings;
}) {
  const { scene: rawScene } = useGLTF(getModelUrl(config.modelFile), true, true, extendGltfLoader);
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

    fitProductToUniformSize(cloned, config.targetMaxDim || 0.18);
    prepareProductMaterials(cloned, {
      castShadow: false,
      receiveShadow: false,
      customization,
      productId: config.productId,
    });
    optimizeModelForGpu(cloned, textureMax);
    optimizeModelForGpuAsync(cloned, textureMax);

    cloned.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        // Products should remain in front of the transparent glass cover.
        mesh.renderOrder = 20;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
      }
    });

    return cloned;
  }, [rawScene, config.targetMaxDim, config.productId, customization, textureMax]);

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
        rotation={rotation}
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/product/${config.productId}`);
        }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; setHovered(true); }}
        onPointerOut={(e) => { e.stopPropagation(); document.body.style.cursor = 'auto'; setHovered(false); }}
      >
        <primitive object={clonedScene} />
        <ContactShadows position={[0, 0, 0]} opacity={0.6} scale={0.3} blur={1.5} far={0.3} color="#3D2817" frames={1} resolution={256} />
      </group>
    </group>
  );
}

function DelayedShowcaseProduct({
  config,
  textureMax,
  position,
  rotation = [0, 0, 0],
  customization,
}: {
  config: ShowcaseProductConfig;
  textureMax: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  customization?: CustomizationSettings;
}) {
  const [ready, setReady] = useState(() => (config.mountDelay || 0) <= 0);

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
      <SingleShowcaseProduct
        config={config}
        textureMax={textureMax}
        position={position}
        rotation={rotation}
        customization={customization}
      />
    </Suspense>
  );
}

function ShowcaseProductsGroup({ textureMax, tablePosition }: { textureMax: number; tablePosition: [number, number, number] }) {
  const { customizations } = useCustomization();
  // Display cushion surface height inside the glass showcase (raised additional 4px for elevated visibility)
  const yOffset = 0.561;

  return (
    <group position={tablePosition}>
      {/* Left bay: Luna Bracelet shifted a little bit more left */}
      <DelayedShowcaseProduct
        config={SHOWCASE_PRODUCTS[0]}
        textureMax={textureMax}
        customization={customizations.pro2}
        position={[-0.455, yOffset, 0.22]}
        rotation={[Math.PI / 2.5, Math.PI / 6, 0]}
      />
      {/* Front center bay: Heritage Diamond Ring resting inside the front cushion channel */}
      <DelayedShowcaseProduct
        config={SHOWCASE_PRODUCTS[1]}
        textureMax={textureMax}
        customization={customizations.pro1}
        position={[0, yOffset, 0.48]}
        rotation={[Math.PI / 2.5, 0, 0]}
      />
      {/* Right bay: Cascade Necklace shifted a little bit more right */}
      <DelayedShowcaseProduct
        config={SHOWCASE_PRODUCTS[2]}
        textureMax={textureMax}
        customization={customizations.pro4}
        position={[0.455, yOffset, 0.22]}
        rotation={[Math.PI / 2.5, -Math.PI / 6, 0]}
      />
    </group>
  );
}

function TableModel({ textureMax, isMobile }: { textureMax: number; isMobile: boolean }) {
  const { scene } = useGLTF(getModelUrl("1.glb"), true, true, extendGltfLoader);
  const { gl } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const textureAnisotropy = useMemo(
    () => Math.min(16, gl.capabilities.getMaxAnisotropy()),
    [gl],
  );

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
    cloned.position.y = (-box.min.y * targetScale) + 0.002;
    cloned.position.z = -0.5;

    cloned.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.frustumCulled = true;
        mesh.raycast = () => null;
        
        // Disable heavy real-time dynamic shadow passes; table uses optimized high-res baked ContactShadows
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        if (mesh.material) {
          const isArray = Array.isArray(mesh.material);
          const materials = isArray ? (mesh.material as THREE.Material[]) : [mesh.material as THREE.Material];
          
          const clonedMaterials = materials.map((m) => {
            const mat = m.clone() as any; 
            
            if (mat.map) mat.map.anisotropy = textureAnisotropy;
            if (mat.normalMap) mat.normalMap.anisotropy = textureAnisotropy;
            if (mat.roughnessMap) mat.roughnessMap.anisotropy = textureAnisotropy;
            if (mat.metalnessMap) mat.metalnessMap.anisotropy = textureAnisotropy;

            const isGlass = (mat.name && mat.name.toLowerCase().includes('glass')) || (mat.transmission !== undefined && mat.transmission > 0) || (mat.opacity !== undefined && mat.opacity < 1) || mat.transparent;
            const isMetal = mat.metalness !== undefined && mat.metalness > 0.5;
            const isGold = mat.name && mat.name.toLowerCase().includes('gold');

            if (isGlass) {
              const glassMat = new THREE.MeshPhysicalMaterial({
                color: '#ffffff',
                metalness: 0,
                roughness: 0.07,
                transmission: 0.32,
                transparent: true,
                opacity: 0.38,
                clearcoat: 1.0,
                ior: 1.45,
                thickness: 0.02,
                envMapIntensity: 1.25,
                side: THREE.DoubleSide,
                depthWrite: false,
              });
              mesh.renderOrder = 2;
              return glassMat;
            } else if (isMetal || isGold || (mat.color && typeof mat.color.getHex === 'function' && mat.color.getHex() > 0xaaaaaa)) {
              if (mat.color && typeof mat.color.setHex === 'function') {
                mat.color.setHex(0xE4C7A7); // Original light gold/beige trim
              }
              mat.metalness = Math.max(0.7, mat.metalness || 0);
              mat.roughness = Math.max(0.25, mat.roughness || 0.25);
              mat.envMapIntensity = 1.0;
              mat.normalMap = null;
              mat.roughnessMap = null;
            } else {
              // Original soft off-white structural/display surfaces
              if (mat.color && typeof mat.color.setHex === 'function') {
                mat.color.setHex(0xf2efe9);
              }
            }

            return mat as THREE.Material;
          });

          mesh.material = isArray ? clonedMaterials : clonedMaterials[0];
        }
      }
    });

    return cloned;
  }, [scene, textureMax, isMobile, textureAnisotropy]);

  if (!clonedScene) return null;

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} />
    </group>
  );
}

// TableGlassTop removed since Kiosk_Centre already has a glass node

interface Table3DProps {
  opacity?: number;
  isMobile?: boolean;
}

export default function Table3D({ opacity = 1, isMobile = false }: Table3DProps) {
  const profile = useMemo(() => getDeviceProfile(), []);

  // Use passed isMobile if provided, otherwise fallback to profile (useful for standalone mounting)
  const mobileLayout = isMobile;
  const textureMax = profile.lowEnd ? 1024 : 2048;
  const canvasDpr = profile.lowEnd ? 1 : mobileLayout ? 1.5 : 2;

  return (
    <div
      className="table-3d-wrapper absolute bottom-0 left-[50%] z-[60] h-[500px] w-full -translate-x-1/2 md:h-[600px]"
      style={{
        opacity,
        // Move the mobile table down by exactly 40px while preserving desktop placement.
        bottom: mobileLayout ? "calc(6dvh - 40px)" : "-290px",
        pointerEvents: "auto",
        transition: "opacity 0.6s ease-out, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      aria-label="3D Display Table Showcase"
    >
      <Canvas
        className="w-full h-full pointer-events-auto"
        resize={{ offsetSize: true }}
        dpr={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, canvasDpr) : [1, 2]}
        gl={{ antialias: true, alpha: true, stencil: false, depth: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          applyJewelryRendererSettings(gl, 1.15);
        }}
      >
        <PerspectiveCamera 
          makeDefault 
          position={[0, 1.8, 5.0]} 
          fov={17.5} 
          onUpdate={(c) => c.lookAt(0, 0.24, 0)}
        />
        <ambientLight intensity={0.9} color="#F8F1E9" />
        <spotLight position={[0, 5, 0]} intensity={2.0} color="#FFF5E6" angle={0.8} penumbra={0.8} />
        <pointLight position={[0, 1.5, 2.5]} intensity={0.8} color="#F8F1E9" distance={8} />

        <Suspense fallback={null}>
          <SafeEnvironment intensity={1.4} />
          <group scale={mobileLayout ? 1.20 : 1.40} position={mobileLayout ? [-0.06, -0.1, 0] : [0, -0.30, 0]}>
            <TableModel textureMax={textureMax} isMobile={mobileLayout} />
            <ShowcaseProductsGroup textureMax={textureMax} tablePosition={[0, 0, -0.5]} />
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
      </Canvas>
    </div>
  );
}
