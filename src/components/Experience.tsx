"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { LoadingProvider } from "@/context/LoadingContext";
import Loader from "./Loader";
import CursorGlitterTrail from "./CursorGlitterTrail";
import ModelPreloader from "./ModelPreloader";
import dynamic from "next/dynamic";
const ShopExperience = dynamic(() => import("./jewelry/ShopExperience"), { ssr: false });
const DoorSceneCanvas = dynamic(() => import("./DoorSceneCanvas"), { ssr: false });
import { getDeviceProfile } from "@/lib/deviceProfile";
import { useExperienceScroll } from "@/hooks/useExperienceScroll";
import Footer from "./Footer";
import { getShopFocusScrollRange } from "@/lib/shopScrollFocus";

function ExperienceInner() {
  const [skipIntro] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("hasWatchedIntro") === "true";
    }
    return false;
  });
  const [ready, setReady] = useState(skipIntro);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Relying on sessionStorage to correctly persist across page navigations
  }, []);

  const [showCursorGlitter, setShowCursorGlitter] = useState(false);
  const {
    scrollRef,
    progressRef,
    doorProgress,
    entered,
    focusProgress,
    scrollHeight,
    getOpenDistance,
    forceEnter,
    canvasOpacity,
  } = useExperienceScroll(ready, skipIntro, isMobile);

  const handleLoadComplete = useCallback(() => {
    sessionStorage.setItem("hasWatchedIntro", "true");
    setReady(true);
  }, []);

  const onDoorScreen = ready && !entered && !isMobile;
  const lenisRef = useRef<any>(null);

  useEffect(() => {
    setShowCursorGlitter(!getDeviceProfile().lowEnd);
    setIsMobile(getDeviceProfile().mobile);
  }, []);

  // 1. Initialize Lenis
  useEffect(() => {
    if (!ready) return;

    // Use Lenis for 100% buttery smooth scrolling on the main page and footer
    const Lenis = require("lenis").default || require("lenis");
    const lenis = new Lenis({
      eventsTarget: window,
      lerp: 0.05,
      wheelMultiplier: 0.8,
      smoothWheel: true,
      smoothTouch: true,
      touchMultiplier: 2.0,
      syncTouch: false,
    });
    lenisRef.current = lenis;

    let rafId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [ready]);

  const finalFocusProgress = focusProgress;

  return (
    <div className="relative h-full w-full bg-maj-cream">
      <ModelPreloader doorsReady={ready} />
      {!showCursorGlitter ? null : <CursorGlitterTrail />}
      {!skipIntro && <Loader onComplete={handleLoadComplete} />}

      {ready && (
        <div className="shop-experience boutique-hero-stage fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <ShopExperience visible={true} entered={entered} focusProgress={finalFocusProgress} />
        </div>
      )}

      {/* Glass doors — shown while user hasn't yet scrolled in */}
      {onDoorScreen && (
        <DoorSceneCanvas
          progressRef={progressRef}
          brightness={1}
          opacity={canvasOpacity}
        />
      )}

      {ready && (
        <div
          className={`experience-scroll-layer shop-scroll-layer relative z-[45] pointer-events-none`}
        >
          <div aria-hidden style={{ height: "100vh" }} />
          {entered && (
            <div className="pointer-events-auto w-full bg-maj-cream">
              <Footer />
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default function Experience() {
  return (
    <LoadingProvider>
      <ExperienceInner />
    </LoadingProvider>
  );
}
