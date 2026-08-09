import * as THREE from "three";

const TEXTURE_KEYS = [
  "map",
  "normalMap",
  "roughnessMap",
  "metalnessMap",
  "aoMap",
  "emissiveMap",
  "alphaMap",
] as const;

async function downscaleTextureIfNeededAsync(texture: THREE.Texture, maxSize: number) {
  const image = texture.image as any;
  if (!image || typeof image !== "object" || !image.width || !image.height) return;

  texture.anisotropy = 1;

  if (image.width <= maxSize && image.height <= maxSize) return;

  const scale = maxSize / Math.max(image.width, image.height);
  const targetWidth = Math.max(1, Math.floor(image.width * scale));
  const targetHeight = Math.max(1, Math.floor(image.height * scale));

  try {
    // createImageBitmap is highly optimized, runs off-main-thread, and prevents UI freezing!
    const bitmap = await createImageBitmap(image, {
      resizeWidth: targetWidth,
      resizeHeight: targetHeight,
      resizeQuality: "high"
    });
    
    texture.image = bitmap;
    texture.needsUpdate = true;
  } catch {
    // If createImageBitmap fails (e.g., unsupported format in older browsers), fallback to canvas
    try {
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
        texture.image = canvas;
        texture.needsUpdate = true;
      }
    } catch {
      // Ignore
    }
  }
}

/** Reduce GPU memory for large GLB textures asynchronously without freezing the UI. */
export async function optimizeModelForGpuAsync(root: THREE.Object3D, maxTextureSize = 1024) {
  const promises: Promise<void>[] = [];

  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;

    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.frustumCulled = true;

    if (!mesh.material) return;

    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((mat) => {
      if (!(mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial)) {
        return;
      }

      for (const key of TEXTURE_KEYS) {
        const tex = mat[key as keyof typeof mat] as THREE.Texture | null;
        if (tex) {
          promises.push(downscaleTextureIfNeededAsync(tex, maxTextureSize));
        }
      }
    });
  });

  await Promise.allSettled(promises);
}

// Keep a synchronous dummy version for backward compatibility during transitions, but it just strips shadows
export function optimizeModelForGpu(root: THREE.Object3D, maxTextureSize = 1024) {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.frustumCulled = true;
  });
}
