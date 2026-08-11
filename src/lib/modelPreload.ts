import { extendGltfLoader, getProductModelUrls, getModelUrl } from "./modelAssets";
import { getLineShelfProductModelUrls } from "./lineShelfProductLayout";
import { SHOP_GLB_FILES } from "./glbConfig";
import { SHOP_LINE_SHELF_PRODUCTS_ENABLED, SHOP_SHELVES_ENABLED } from "./shopTableEnabled";

const bytePrefetched = new Set<string>();
const gltfTriggered = new Set<string>();
let imagePipelineStarted = false;
let modelPipelineScheduled = false;
let shopStarted = false;

const SHOP_IMAGES = ["/imagemob.png", "/image.png"] as const;
const DOOR_IMAGES = ["/door_sm.png", "/door_bg.png"] as const;
const LOADER_IMAGES = ["/bg.png", "/logo_outline.png", "/logo.png"] as const;

function collectShopGlbUrls(): string[] {
  const urls = new Set<string>();
  if (SHOP_SHELVES_ENABLED) urls.add(getModelUrl("shelf.glb"));
  // Home page always renders shelf + table products via BoutiqueRoom.
  for (const file of SHOP_GLB_FILES) {
    if (file === "shelf.glb" && !SHOP_SHELVES_ENABLED) continue;
    if (file.startsWith("pro") || file === "door_col.glb") urls.add(getModelUrl(file));
  }
  if (SHOP_LINE_SHELF_PRODUCTS_ENABLED) {
    for (const url of getLineShelfProductModelUrls()) urls.add(url);
  }
  return [...urls];
}

/** Parallel HTTP warm — browser multiplexes on fast links. */
function warmHttpCache(url: string) {
  if (bytePrefetched.has(url) || typeof window === "undefined") return;
  bytePrefetched.add(url);
  void fetch(url, { mode: "cors", cache: "force-cache" }).catch(() => undefined);
}

function triggerGltfPreload(url: string) {
  if (gltfTriggered.has(url) || typeof window === "undefined") return;
  gltfTriggered.add(url);
  import("@react-three/drei").then(({ useGLTF }) => {
    useGLTF.preload(url, false, false, extendGltfLoader);
  }).catch(() => undefined);
}

function preloadCoreShowroomModels() {
  const coreUrls = [
    getModelUrl("door_col.glb"),
    getModelUrl("Kiosk_Centre.glb")
  ];
  if (SHOP_SHELVES_ENABLED) {
    coreUrls.push(getModelUrl("shelf.glb"));
  }
  
  let delay = 0;
  for (const url of coreUrls) {
    setTimeout(() => {
      triggerGltfPreload(url);
    }, delay);
    // Add 300ms delay between each heavy model parse to prevent OOM
    delay += 300; 
  }
}

function preloadImage(src: string) {
  if (typeof window === "undefined") return;
  const img = new window.Image();
  img.src = src;
}

export function prefetchProductBytes(index: number) {
  const urls = getProductModelUrls();
  const url = urls[Math.min(Math.max(index, 0), urls.length - 1)];
  if (url) warmHttpCache(url);
}

/** Detail page — HTTP warm + GLTF parse for one product. */
export function prefetchProductGlb(modelFile: string) {
  const url = getModelUrl(modelFile);
  warmHttpCache(url);
  triggerGltfPreload(url);
}

export function prefetchNextProductBytes(index: number) {
  prefetchProductBytes(index);
}

/** Images only — safe during loader (no GLB parse on main thread). */
export function bootImagePipeline() {
  if (imagePipelineStarted) return;
  imagePipelineStarted = true;

  for (const src of [...LOADER_IMAGES, ...DOOR_IMAGES, ...SHOP_IMAGES]) {
    preloadImage(src);
  }
}

export function scheduleIdle(task: () => void) {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(() => task(), { timeout: 800 });
    return;
  }
  window.setTimeout(task, 200);
}

/** Defer GLB download/parse until after loader animation completes. */
export function scheduleModelPreloads(delayMs = 0) {
  if (modelPipelineScheduled) return;
  modelPipelineScheduled = true;

  const run = () => {
    scheduleIdle(() => {
      void preloadCoreShowroomModels();
    });
  };

  if (delayMs > 0) {
    window.setTimeout(run, delayMs);
  } else {
    run();
  }
}

/** Loader + door — images immediately, models after UI is interactive. */
export function bootFastPipeline() {
  bootImagePipeline();
  scheduleModelPreloads(3000);
}

export function prefetchShopBytesOnDoor() {
  bootImagePipeline();
  scheduleModelPreloads(0);
}

export function startShopModelLoads() {
  if (shopStarted) return;
  shopStarted = true;
  bootImagePipeline();
  scheduleModelPreloads(0);
}

export function prefetchAllProductBytes() {
  const urls = collectShopGlbUrls();
  let delay = 0;
  for (const url of urls) {
    setTimeout(() => warmHttpCache(url), delay);
    delay += 200; // Stagger HTTP requests slightly
  }
}

export function bootShopModels() {
  startShopModelLoads();
}

export function preloadProductModels(): Promise<void> {
  startShopModelLoads();
  return Promise.resolve();
}

export function preloadDoorImages() {
  for (const src of DOOR_IMAGES) preloadImage(src);
}

export function preloadShopImages() {
  for (const src of SHOP_IMAGES) preloadImage(src);
}
