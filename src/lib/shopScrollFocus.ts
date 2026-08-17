/** Luxury ease-out — slow start, refined deceleration (Apple-style) */
export function easeLuxuryCinematic(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - c, 4);
}

/** Smooth 0→1 for overlays and blends */
export function easeFocusProgress(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return clamped * clamped * (3 - 2 * clamped);
}

function delayedProgress(progress: number, start = 0.12): number {
  if (progress <= start) return 0;
  return easeLuxuryCinematic((progress - start) / (1 - start));
}

/** Subtle world scale — jewelry grows slightly as camera approaches */
export function getFocusTableScale(progress: number): number {
  return 1 + easeLuxuryCinematic(progress) * 0.04;
}

export function getFocusProductScale(progress: number): number {
  return 1 + easeLuxuryCinematic(progress) * 0.08;
}

/** Camera dolly — depth-only zoom toward the display table */
export function getFocusCameraDolly(progress: number): number {
  return easeLuxuryCinematic(progress) * 0.22;
}

/** Subtle vertical camera rise while dollying in */
export function getFocusCameraLift(progress: number): number {
  return easeLuxuryCinematic(progress) * 0.035;
}

export function getFocusCameraFovDelta(progress: number): number {
  return easeLuxuryCinematic(progress) * 1.8;
}

/** Subtle luxurious background blur */
export function getFocusBlurPx(progress: number): number {
  return 0; // Removed blur per user request
}

/** Warm white boutique veil */
export function getFocusVeilOpacity(progress: number): number {
  return delayedProgress(progress, 0.1) * 0.4;
}

export function getFocusBgScale(progress: number): number {
  const isBigScreen = typeof window !== "undefined" && window.innerWidth >= 768;
  const zoomFactor = isBigScreen ? 0.22 : 0.05;
  return 1 + easeLuxuryCinematic(progress) * zoomFactor;
}

/** Move table down slightly while zooming in */
export function getFocusTableTranslateY(progress: number): number {
  return 0; // Disabled per user request (zooms with the full screen now)
}

/** Specific zoom for the table wrapper to make the table noticeably bigger */
export function getFocusTableOuterScale(progress: number): number {
  return 1; // Disabled per user request (zooms with the full screen now)
}

/** Products fully visible on hero load */
export function getFocusProductReveal(progress: number): number {
  return 1;
}

/** No extra CSS scale — zoom handled by camera + world scale only */
export function getFocusHeroCssScale(_progress: number): number {
  return 1;
}

export function getShopFocusScrollRange(): number {
  if (typeof window === "undefined") return 1000;
  return Math.max(480, Math.round(window.innerHeight * 1.12));
}

export function getShopFocusScrollHeight(): number {
  if (typeof window === "undefined") return 2000;
  return Math.round(window.innerHeight + getShopFocusScrollRange());
}
