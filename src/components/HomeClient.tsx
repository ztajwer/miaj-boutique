"use client";

import { Component, type ReactNode } from "react";
import dynamic from "next/dynamic";

const Experience = dynamic(() => import("@/components/Experience"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-maj-cream">
      <div className="animate-pulse font-serif text-lg tracking-widest text-[#D4AF37]">
        MIAJ BOUTIQUE
      </div>
      <p className="mt-4 font-sans text-[10px] uppercase tracking-[0.3em] text-[#3E2723]/60">
        Loading...
      </p>
    </div>
  ),
});

class HomeErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error("[HomeClient]", error);
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-maj-cream">
          <p className="font-serif text-lg tracking-wide text-maj-brown">MIAJ Boutique</p>
          <p className="max-w-xs px-6 text-center font-sans text-[10px] leading-relaxed tracking-wide text-maj-brown/60">
            Something went wrong loading the experience. Try a hard refresh.
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ failed: false });
              window.location.reload();
            }}
            className="font-sans text-[10px] uppercase tracking-[0.3em] text-maj-gold"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function HomeClient() {
  return (
    <HomeErrorBoundary>
      <div className="w-full min-h-screen bg-maj-cream">
        <Experience />
      </div>
    </HomeErrorBoundary>
  );
}
