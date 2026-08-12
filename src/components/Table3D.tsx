"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useGLTF, Html, ContactShadows, View, PerspectiveCamera } from "@react-three/drei";
import { useFrame, useThree, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { RGBELoader } from "three-stdlib";
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
  { productId: "protest", modelFile: "protest.glb", targetMaxDim: 0.15, colorHex: 0xB76E79, mountDelay: 0 }, // Left (Rose Gold)
  { productId: "protest", modelFile: "protest.glb", targetMaxDim: 0.15, colorHex: 0xF2F2F2, mountDelay: 0 }, // Center (Shiny Silver)
  { productId: "protest", modelFile: "protest.glb", targetMaxDim: 0.15, colorHex: 0xFFD700, mountDelay: 0 }, // Right (Gold)
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

    cloned.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh && mesh.material) {
        // Safely handle both array of materials and single materials
        let materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        
        const newMaterials = materials.map((m) => {
          const mat = (m as THREE.MeshStandardMaterial).clone();
          if (config.colorHex) {
            mat.color.setHex(config.colorHex);
            mat.roughness = 0.15; // Smooth realistic silver
          } else {
            mat.color.setHex(0xD4AF37); // Rich vibrant Gold
            mat.roughness = 0.18; // Smooth realistic gold
          }
          
          mat.metalness = 1.0;
          mat.envMapIntensity = 2.0; // Balanced reflection
          return mat;
        });

        mesh.material = Array.isArray(mesh.material) ? newMaterials : newMaterials[0];
        // Optimized: disabled real-time shadows on complex meshes to prevent lag, using ContactShadows instead
        mesh.castShadow = false;
        mesh.receiveShadow = false;
      }
    });

    cloned.scale.set(1, 1, 1);
    cloned.position.set(0, 0, 0);
    cloned.updateMatrixWorld(true);

    const box = new THREE.Box3();
    let hasMesh = false;
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        box.expandByObject(child);
        hasMesh = true;
      }
    });
    if (!hasMesh) box.setFromObject(cloned);

    const isInvalidBox = box.isEmpty() || isNaN(box.min.x) || isNaN(box.max.x) || !isFinite(box.min.x) || !isFinite(box.max.x);
    if (isInvalidBox) {
      box.min.set(-0.05, -0.05, -0.05);
      box.max.set(0.05, 0.05, 0.05);
    }

    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    let targetScale = 1;
    if (maxDim > 0) {
      // Use config.targetMaxDim, or default to a reasonable size if missing
      targetScale = (config.targetMaxDim || 0.15) / maxDim;
      cloned.scale.setScalar(targetScale);
    }
    
    // Perfectly center X and Z, and place the BOTTOM (box.min.y) at Y=0 (since the outer <group> applies `position[1]`)
    cloned.position.x = -center.x * targetScale;
    cloned.position.y = (-box.min.y * targetScale) + 0.002;
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
  const { scene } = useGLTF(getModelUrl("try.glb"), true, true, extendGltfLoader);
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
    cloned.position.y = (-box.min.y * targetScale) + 0.002;
    cloned.position.z = -0.5;

    console.log("TableModel Debug:", {
      box: box.clone(),
      size: size.clone(),
      center: center.clone(),
      maxDim,
      targetScale
    });

    cloned.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.frustumCulled = true;
        mesh.raycast = () => null;
        
        // Optimized: disable heavy real-time shadows on the table
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        if (mesh.material) {
          const isArray = Array.isArray(mesh.material);
          const materials = isArray ? (mesh.material as THREE.Material[]) : [mesh.material as THREE.Material];
          
          const clonedMaterials = materials.map((m) => {
            const mat = m.clone() as any; // Cast to any to safely check properties
            
            // Disable anisotropy on textures to prevent specular aliasing / noise (flickering on camera movement)
            if (mat.map) mat.map.anisotropy = 1;
            if (mat.normalMap) mat.normalMap.anisotropy = 1;
            if (mat.roughnessMap) mat.roughnessMap.anisotropy = 1;
            if (mat.metalnessMap) mat.metalnessMap.anisotropy = 1;

            const isGlass = (mat.name && mat.name.toLowerCase().includes('glass')) || (mat.transmission !== undefined && mat.transmission > 0) || (mat.opacity !== undefined && mat.opacity < 1) || mat.transparent;
            const isMetal = mat.metalness !== undefined && mat.metalness > 0.5;
            const isGold = mat.name && mat.name.toLowerCase().includes('gold');

            if (isGlass) {
              const glassMat = new THREE.MeshPhysicalMaterial({
                color: '#ffffff',
                metalness: 0.2,
                roughness: 0.1,
                transmission: 0, // Optimized: no heavy screen-space refraction
                transparent: true,
                opacity: 0.25,
                clearcoat: 1.0,
                ior: 1.45,
                thickness: 0.02,
                envMapIntensity: 1.0,
                side: THREE.DoubleSide,
                depthWrite: false,
              });
              mesh.renderOrder = 2;
              return glassMat;
            } else if (isMetal || isGold || (mat.color && typeof mat.color.getHex === 'function' && mat.color.getHex() > 0xaaaaaa)) {
              if (mat.color && typeof mat.color.setHex === 'function') {
                mat.color.setHex(0xE4C7A7); // Lighter gold/beige to match background
              }
              mat.metalness = Math.max(0.7, mat.metalness || 0);
              mat.roughness = Math.max(0.25, mat.roughness || 0.25); // Slightly rougher to avoid extreme glare
              mat.envMapIntensity = 1.0; // Optimized & less glaring
              mat.normalMap = null; 
              mat.roughnessMap = null;
            }

            return mat as THREE.Material;
          });

          mesh.material = isArray ? clonedMaterials : clonedMaterials[0];
        }
      }
    });

    return { cloned, debugInfo: { maxDim, targetScale, size: [size.x, size.y, size.z], center: [center.x, center.y, center.z] } };
  }, [scene, textureMax, isMobile]);

  if (!clonedScene) return null;

  return (
    <group ref={groupRef}>
      <Html position={[0, 1, 0]}>
        <div style={{ background: 'rgba(0,0,0,0.8)', padding: '10px', color: 'white', width: '300px', fontSize: '12px' }}>
          <h4>Table Debug Info</h4>
          <pre>{JSON.stringify(clonedScene.debugInfo, null, 2)}</pre>
        </div>
      </Html>
      <primitive object={clonedScene.cloned} />
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

  return (
    <div
      className={`table-3d-wrapper absolute left-[50%] -translate-x-1/2 z-[60] w-[100vw] h-[500px] md:h-[600px] ${mobileLayout ? 'bottom-[10px]' : 'bottom-[-260px]'}`}
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
        <ambientLight intensity={0.9} color="#F8F1E9" />
        <spotLight position={[0, 5, 0]} intensity={2.0} color="#FFF5E6" angle={0.8} penumbra={0.8} />
        <pointLight position={[0, 1.5, 2.5]} intensity={0.8} color="#F8F1E9" distance={8} />

        <Suspense fallback={null}>
          <SafeEnvironment intensity={1.4} />
          <group scale={mobileLayout ? 1.08 : 1.30} position={mobileLayout ? [0, -0.1, 0] : [0, -0.30, 0]}>
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
      </View>
    </div>
  );
}


