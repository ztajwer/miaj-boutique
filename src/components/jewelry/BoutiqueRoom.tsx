"use client";

import { useEffect, useRef, useState } from "react";
import { startShopModelLoads } from "@/lib/modelPreload";
import { createBoutiqueParallaxMotion } from "@/lib/boutiqueParallaxMotion";
import BoutiqueParallaxBg from "./BoutiqueParallaxBg";
import Table3D from "../Table3D";

import LineShelfProductMini from "./LineShelfProductMini";
import { getFocusBgScale, getFocusTableTranslateY, getFocusTableOuterScale } from "@/lib/shopScrollFocus";
import ProductCarousel3D from "./ProductCarousel3D";
import { PRODUCTS, type ProductId } from "@/lib/products";
import { getModelUrl } from "@/lib/modelAssets";
import {
  LINE_SHELF_PRODUCT_SIZE_PX,
  type LineShelfProductConfig,
} from "@/lib/lineShelfProductLayout";
import { getDeviceProfile } from "@/lib/deviceProfile";
import { Suspense, memo } from "react";
import Image from "next/image";
import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { EffectComposer, DepthOfField, Vignette } from "@react-three/postprocessing";
import { applyJewelryRendererSettings } from "@/lib/productModelUtils";

interface BoutiqueRoomProps {
  visible: boolean;
  entered?: boolean;
  focusProgress?: number;
}

const BOUTIQUE_IMAGE = "/bback.png";
const BOUTIQUE_VIDEO_MOBILE = "";
const BOUTIQUE_IMAGE_MOBILE_POSTER = "/main_mob_bg.png";

// Custom premium scales for realistic real-world jewelry sizing on display shelves
const PRODUCT_SHELF_SCALES: Record<ProductId, number> = {
  pro1: 0.38, 
  pro2: 0.61, 
  pro3: 0.30, 
  pro4: 0.30, 
  pro5: 0.30, 
  protest: 0.38,
};

// Custom resolver to build correct metadata config for any product in any slot
function getCustomProductConfig(
  productId: ProductId,
  slotIndex: number,
  side: "left" | "right"
): LineShelfProductConfig {
  const product = PRODUCTS[productId];
  const rowIndex = Math.floor(slotIndex / 2);
  const tier = rowIndex === 0 ? "upper" : rowIndex === 1 ? "middle" : "lower";

  return {
    slotIndex,
    rowIndex,
    side,
    tier,
    url: getModelUrl(product.modelFile),
    modelFile: product.modelFile,
    productId,
    productSizePx: LINE_SHELF_PRODUCT_SIZE_PX,
    displaySize: PRODUCT_SHELF_SCALES[productId] ?? 0.48,
  };
}

function getCarouselProductConfig(
  productId: ProductId,
  slotIndex: number
): LineShelfProductConfig {
  const product = PRODUCTS[productId];
  return {
    slotIndex,
    rowIndex: 0,
    side: "left",
    tier: "middle",
    url: getModelUrl(product.modelFile),
    modelFile: product.modelFile,
    productId,
    productSizePx: 80,
    displaySize: 0.48,
  };
}

export default function BoutiqueRoom({ visible, entered = false, focusProgress = 0 }: BoutiqueRoomProps) {
  const roomRef = useRef<HTMLDivElement>(null);
  const motionRef = useRef(createBoutiqueParallaxMotion());
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!visible) return;
    startShopModelLoads();

    const img = new window.Image();
    img.src = BOUTIQUE_IMAGE;
    
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [visible]);

  if (!visible || !mounted) return null;

  return (
    <div
      ref={roomRef}
      className="boutique-room boutique-hero"
      aria-label="MAJ Boutique showroom"
    >
      <BoutiqueParallaxBg
        mobileVideoSrc={BOUTIQUE_VIDEO_MOBILE}
        mobilePosterSrc={BOUTIQUE_IMAGE_MOBILE_POSTER}
        desktopSrc={BOUTIQUE_IMAGE}
        roomRef={roomRef}
        active={visible}
        motionRef={motionRef}
        focusProgress={focusProgress}
      >

        {/* MOBILE LAYOUT (Horizontal Row) */}
        {isMobile && (
          <div
            className="absolute flex items-end justify-center pointer-events-none"
            style={{
              top: "34%", // Lowered slightly
              left: 0,
              right: 0,
              gap: "4%", // Adjusted spacing
              zIndex: 15,
            }}
          >
            {/* Left Shelf */}
            <div className="relative flex flex-col items-center justify-end" style={{ width: "31vw", height: "14vh", maxWidth: "150px" }}>
              <Image src="/shelf.png" alt="" aria-hidden fill className="absolute inset-0 w-full h-full z-0 pointer-events-none" style={{ objectFit: "fill" }} />
              <div className="pointer-events-auto flex flex-col items-center relative z-10 w-full h-[65%] pb-[12%]">
                <div style={{ width: "65%", height: "100%", zIndex: 20, "--product-size": "100%" } as any}>
                  {entered && <LineShelfProductMini config={getCustomProductConfig("protest" as any, 0, "left")} mountDelay={1500} />}
                </div>
              </div>
            </div>

            {/* Center Shelf */}
            <div className="relative flex flex-col items-center justify-end" style={{ width: "35vw", height: "16vh", maxWidth: "170px" }}>
              <Image src="/shelf.png" alt="" aria-hidden fill className="absolute inset-0 w-full h-full z-0 pointer-events-none" style={{ objectFit: "fill" }} />
              <div className="pointer-events-auto flex flex-col items-center relative z-10 w-full h-[65%] pb-[12%]">
                <div style={{ width: "65%", height: "100%", zIndex: 20, "--product-size": "100%" } as any}>
                  {entered && <LineShelfProductMini config={getCustomProductConfig("protest" as any, 1, "left")} mountDelay={3000} />}
                </div>
              </div>
            </div>

            {/* Right Shelf */}
            <div className="relative flex flex-col items-center justify-end" style={{ width: "31vw", height: "14vh", maxWidth: "150px" }}>
              <Image src="/shelf.png" alt="" aria-hidden fill className="absolute inset-0 w-full h-full z-0 pointer-events-none" style={{ objectFit: "fill" }} />
              <div className="pointer-events-auto flex flex-col items-center relative z-10 w-full h-[65%] pb-[12%]">
                <div style={{ width: "65%", height: "100%", zIndex: 20, "--product-size": "100%" } as any}>
                  {entered && <LineShelfProductMini config={getCustomProductConfig("protest" as any, 2, "right")} mountDelay={4500} />}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NEW DESKTOP LAYOUT (Only on Desktop) */}
        {!isMobile && (
          <div
          className="absolute flex items-end justify-center pointer-events-none"
          style={{
            top: "calc(32% + 5px)",
            left: 0,
            right: 0,
            gap: "140px",
            zIndex: 15,
          }}
        >
          {/* SHELF */}
          <div className="relative flex flex-col items-center justify-end" style={{ width: "clamp(120px, 20vw, 300px)", height: "clamp(80px, calc(38vh - 100px), 380px)" }}>
            <Image src="/shelf.png" alt="" aria-hidden fill sizes="(max-width: 1024px) 30vw, 300px" className="absolute inset-0 w-full h-full z-0 pointer-events-none" style={{ objectFit: "fill" }} />
            <div className="pointer-events-auto flex flex-col items-center relative z-10 w-full h-[65%] pb-[10%]">
              <div style={{ width: "80%", height: "100%", zIndex: 20, "--product-size": "100%" } as any}>
                {entered && <LineShelfProductMini config={getCustomProductConfig("protest" as any, 0, "left")} mountDelay={0} />}
              </div>
            </div>
          </div>

          {/* SHELF */}
          <div className="relative flex flex-col items-center justify-end" style={{ width: "clamp(120px, 20vw, 300px)", height: "clamp(80px, calc(38vh - 100px), 380px)" }}>
            <Image src="/shelf.png" alt="" aria-hidden fill sizes="(max-width: 1024px) 30vw, 300px" className="absolute inset-0 w-full h-full z-0 pointer-events-none" style={{ objectFit: "fill" }} />
            <div className="pointer-events-auto flex flex-col items-center relative z-10 w-full h-[65%] pb-[10%]">
              <div style={{ width: "80%", height: "100%", zIndex: 20, "--product-size": "100%" } as any}>
                {entered && <LineShelfProductMini config={getCustomProductConfig("protest" as any, 1, "left")} mountDelay={0} />}
              </div>
            </div>
          </div>

          {/* SHELF */}
          <div className="relative flex flex-col items-center justify-end" style={{ width: "clamp(120px, 20vw, 300px)", height: "clamp(80px, calc(38vh - 100px), 380px)" }}>
            <Image src="/shelf.png" alt="" aria-hidden fill sizes="(max-width: 1024px) 30vw, 300px" className="absolute inset-0 w-full h-full z-0 pointer-events-none" style={{ objectFit: "fill" }} />
            <div className="pointer-events-auto flex flex-col items-center relative z-10 w-full h-[65%] pb-[10%]">
              <div style={{ width: "80%", height: "100%", zIndex: 20, "--product-size": "100%" } as any}>
                {entered && <LineShelfProductMini config={getCustomProductConfig("protest" as any, 2, "right")} mountDelay={0} />}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* 3D Display Table — inside parallax so it moves with the background */}
        <div style={{
          position: "absolute",
          inset: 0,
          transform: `translateY(${getFocusTableTranslateY(focusProgress)}px) scale(${getFocusTableOuterScale(focusProgress)})`,
          transformOrigin: "50% bottom",
          pointerEvents: "none",
          zIndex: 60,
          willChange: "transform"
        }}>
          {entered && <Table3D opacity={1} isMobile={isMobile} />}
        </div>

      </BoutiqueParallaxBg>

      {/* Global Canvas for all line shelf and table products overlay */}
      <div
        className="fixed inset-0 pointer-events-none w-screen h-screen"
        style={{ zIndex: 60 }}
      >
        <Canvas
          eventSource={roomRef as any}
          className="w-full h-full"
          dpr={[1, 1.5]}
          gl={{ antialias: false, alpha: true, stencil: false, depth: true, powerPreference: "high-performance" }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
            applyJewelryRendererSettings(gl, 1.15);
          }}
        >
          <View.Port />
        </Canvas>
      </div>
    </div>
  );
}
