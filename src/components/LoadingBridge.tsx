"use client";

import { useEffect } from "react";
import * as THREE from "three";
import { useLoadingState } from "@/context/LoadingContext";

export default function LoadingBridge() {
  const { setProgress } = useLoadingState();

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const manager = THREE.DefaultLoadingManager;

    const origOnStart = manager.onStart;
    const origOnLoad = manager.onLoad;
    const origOnProgress = manager.onProgress;
    const origOnError = manager.onError;

    manager.onStart = (url, loaded, total) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => setProgress(total === 0 ? 100 : (loaded / total) * 100, true), 0);
      if (origOnStart) origOnStart(url, loaded, total);
    };

    manager.onLoad = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => setProgress(100, false), 0);
      if (origOnLoad) origOnLoad();
    };

    manager.onProgress = (url, loaded, total) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => setProgress(total === 0 ? 100 : (loaded / total) * 100, true), 0);
      if (origOnProgress) origOnProgress(url, loaded, total);
    };

    manager.onError = (url) => {
      if (origOnError) origOnError(url);
    };

    return () => {
      manager.onStart = origOnStart;
      manager.onLoad = origOnLoad;
      manager.onProgress = origOnProgress;
      manager.onError = origOnError;
      clearTimeout(timeout);
    };
  }, [setProgress]);

  return null;
}
