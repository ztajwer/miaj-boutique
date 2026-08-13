"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getDoorOpenDistance } from "@/lib/doorFraming";
import { easeLuxuryCinematic } from "@/lib/shopScrollFocus";

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useExperienceScroll(ready: boolean, skipIntro = false, skipDoors = false) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(skipIntro || skipDoors ? 1 : 0);
  
  const [doorProgress, setDoorProgress] = useState(skipIntro || skipDoors ? 1 : 0);
  const [entered, setEntered] = useState(skipIntro || skipDoors);
  const [focusProgress, setFocusProgress] = useState(skipIntro ? 1 : 0);
  
  // Height is simply viewport + small buffer to allow scrolling footer into view
  const [scrollHeight, setScrollHeight] = useState(0);

  const getOpenDistance = useCallback(() => getDoorOpenDistance(), []);
  
  const hasStartedAnimRef = useRef(false);

  useEffect(() => {
    if (!ready) return;
    
    // Set fixed scroll height to 100vh for 3D scene + space for footer to scroll up.
    // The Experience component will place a 100vh spacer, so the footer appears naturally below.
    setScrollHeight(window.innerHeight);

    if (skipIntro || prefersReducedMotion()) {
      progressRef.current = 1;
      setDoorProgress(1);
      setEntered(true);
      setFocusProgress(1);
      return;
    }

    if (skipDoors) {
      progressRef.current = 1;
      setDoorProgress(1);
      setEntered(true);
      // Wait a moment then zoom
      if (!hasStartedAnimRef.current) {
        hasStartedAnimRef.current = true;
        setTimeout(() => {
          let start = performance.now();
          const duration = 2500;
          let raf = 0;
          const animate = (time: number) => {
            const t = Math.min(1, (time - start) / duration);
            const eased = easeLuxuryCinematic(t);
            setFocusProgress(eased);
            if (t < 1) {
              raf = requestAnimationFrame(animate);
            }
          };
          raf = requestAnimationFrame(animate);
        }, 300);
      }
      return;
    }

    // Normal Desktop flow: Doors -> Zoom
    if (!hasStartedAnimRef.current) {
      hasStartedAnimRef.current = true;
      let raf = 0;
      let start = performance.now();
      
      const DOOR_DURATION = 4000; // 4s door open
      const ZOOM_DELAY = 500;
      const ZOOM_DURATION = 3200; // 3.2s zoom in

      const animate = (time: number) => {
        const elapsed = time - start;
        
        // 1. Door Animation
        let dProg = Math.min(1, Math.max(0, elapsed / DOOR_DURATION));
        // ease in-out cubic
        dProg = dProg < 0.5 ? 4 * dProg * dProg * dProg : 1 - Math.pow(-2 * dProg + 2, 3) / 2;
        
        progressRef.current = dProg;
        setDoorProgress(dProg);

        if (elapsed >= DOOR_DURATION) {
          setEntered(true);
          
          // 2. Zoom Animation
          const zoomElapsed = elapsed - DOOR_DURATION - ZOOM_DELAY;
          if (zoomElapsed > 0) {
            const zProg = Math.min(1, zoomElapsed / ZOOM_DURATION);
            const easedZoom = easeLuxuryCinematic(zProg);
            setFocusProgress(easedZoom);
            
            if (zProg >= 1) {
              return; // Done
            }
          }
        }
        
        raf = requestAnimationFrame(animate);
      };
      
      raf = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(raf);
    }
    
  }, [ready, skipIntro, skipDoors]);

  const brightness = Math.min(1, Math.max(0, (doorProgress - 0.2) / 0.75));
  const canvasOpacity = Math.min(1, Math.max(0, 1 - (doorProgress - 0.55) / 0.45));

  const forceEnter = useCallback(() => {
    progressRef.current = 1;
    setDoorProgress(1);
    setEntered(true);
    setFocusProgress(1);
  }, []);

  return {
    scrollRef,
    progressRef,
    doorProgress,
    entered,
    focusProgress,
    scrollHeight,
    brightness,
    canvasOpacity,
    getOpenDistance,
    forceEnter,
  };
}

