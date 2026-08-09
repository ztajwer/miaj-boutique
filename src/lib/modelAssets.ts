
/**
 * 3D models live in Git LFS. Vercel serves ~134-byte pointer files from /public,
 * so production loads real binaries from GitHub's LFS media CDN instead.
 */
const PRODUCT_FILES = ["pro1_opt.glb", "pro2.glb", "pro3_opt.glb", "pro4_opt.glb", "pro5.glb", "pro6.glb"] as const;

/** Arc left→right: pro3, pro4, pro1, pro2, pro5 (pro1 moves to 3rd slot) */
const PRODUCT_DISPLAY_ORDER = [2, 3, 0, 1, 4] as const;

function isLocalDevHost(): boolean {
  if (typeof window === "undefined") {
    return process.env.NODE_ENV !== "production";
  }

  const host = window.location.hostname;
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "[::1]" ||
    host.endsWith(".local") ||
    /^192\.168\./.test(host) ||
    /^10\./.test(host) ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
  );
}


function resolveGlbBase(): string {
  const configured = process.env.NEXT_PUBLIC_GLB_BASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  // Always use local public directory
  return "";
}

export function getModelUrl(filename: string): string {
  // If the file is an optimized model, it is deployed directly to Vercel's edge network
  // and completely bypasses GitHub LFS. Always serve it natively.
  if (filename.endsWith("_opt.glb")) {
    return `/${filename}`;
  }

  const name = filename.replace(/^\//, "");
  const base = resolveGlbBase();
  return base ? `${base}/${name}` : `/${name}`;
}

export function getProductModelUrls(): readonly string[] {
  const urls = PRODUCT_FILES.map((file) => getModelUrl(file));
  return PRODUCT_DISPLAY_ORDER.map((index) => urls[index]);
}

export function getProductFilenameFromUrl(url: string): string {
  const path = url.split("?")[0] ?? url;
  const parts = path.split("/");
  return parts[parts.length - 1] ?? path;
}

export function extendGltfLoader(loader: { setCrossOrigin: (mode: string) => void }) {
  loader.setCrossOrigin("anonymous");
}
