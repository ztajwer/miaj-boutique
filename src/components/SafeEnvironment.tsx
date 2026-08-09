"use client";

import { Component, type ReactNode } from "react";
import { Environment, type EnvironmentProps } from "@react-three/drei";

class EnvironmentErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn("[SafeEnvironment] HDRI Environment map failed to load:", error.message);
  }

  render() {
    if (this.state.hasError) {
      return <Environment preset="city" environmentIntensity={0.6} background={false} />;
    }
    return this.props.children;
  }
}

export default function SafeEnvironment(props: EnvironmentProps) {
  return (
    <EnvironmentErrorBoundary>
      <Environment {...props} />
    </EnvironmentErrorBoundary>
  );
}
