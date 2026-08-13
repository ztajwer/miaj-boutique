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
    canvasOpacity,
    scrollHeight,
    getOpenDistance,
    forceEnter,
  } = useExperienceScroll(ready, skipIntro);

  const handleLoadComplete = useCallback(() => {
    sessionStorage.setItem("hasWatchedIntro", "true");
    setReady(true);
  }, []);

  const onDoorScreen = ready && !entered;
  const lenisRef = useRef<any>(null);
  const hasAutoOpenedRef = useRef(false);
  const hasAutoZoomedRef = useRef(false);

  useEffect(() => {
    setShowCursorGlitter(!getDeviceProfile().lowEnd);
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
      // Clamp scroll to prevent scrolling back up into the door zone once entered
      const openDist = getOpenDistance();
      if (entered && lenis.targetScroll < openDist) {
        lenis.scrollTo(openDist, { immediate: true });
      }
      
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [ready, entered, getOpenDistance]);

  // 2. Auto-Open Doors (Fires once when ready)
  useEffect(() => {
    if (ready && !entered && !skipIntro && !hasAutoOpenedRef.current) {
      hasAutoOpenedRef.current = true;
      setTimeout(() => {
        if (lenisRef.current) {
          const openDist = getOpenDistance();
          lenisRef.current.scrollTo(openDist, {
            duration: 5.0, // Exactly 5 seconds as requested
            easing: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
          });
        }
      }, 100); // Tiny delay to ensure smooth start
    }
  }, [ready, entered, skipIntro, getOpenDistance]);

  const [autoFocus, setAutoFocus] = useState(0);

  // 3. Auto-Zoom Table/Bg (Fires once after doors are fully open and `entered` becomes true)
  useEffect(() => {
    if (entered && !skipIntro && !hasAutoZoomedRef.current) {
      hasAutoZoomedRef.current = true;
      // Wait 800ms after entering
      setTimeout(() => {
        let start = performance.now();
        let frameId: number;
        const duration = 3200; // 3.2 seconds
        const targetZoom = 0.45; // 45% zoom target
        
        const animate = (time: number) => {
          const progress = Math.min((time - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
          const currentZoom = targetZoom * eased;
          
          // Force the React state to update the visual zoom instantly (bypassing scroll engine locks)
          setAutoFocus(currentZoom);

          if (progress < 1) {
            frameId = requestAnimationFrame(animate);
          }
        };
        
        frameId = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(frameId);
      }, 800);
    }
  }, [entered, skipIntro, getOpenDistance]);

  return (
    <div className="relative h-full w-full bg-maj-cream">
      <ModelPreloader doorsReady={ready} />
      {!showCursorGlitter ? null : <CursorGlitterTrail />}
      {!skipIntro && <Loader onComplete={handleLoadComplete} />}

      {ready && (
        <div className="shop-experience boutique-hero-stage fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <ShopExperience visible={true} entered={entered} focusProgress={autoFocus} />
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
          className={`experience-scroll-layer shop-scroll-layer absolute inset-x-0 top-0 z-[45] pointer-events-none`}
        >
          <div aria-hidden style={{ height: scrollHeight || "200vh" }} />
          {entered && (
            <div className="pointer-events-auto">
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
