"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import LineShelfProductMini from "./LineShelfProductMini";
import { PRODUCTS, type ProductId } from "@/lib/products";
import { getModelUrl } from "@/lib/modelAssets";
import type { LineShelfProductConfig } from "@/lib/lineShelfProductLayout";

const CAROUSEL_PRODUCT_IDS: ProductId[] = ["pro2", "pro3", "pro4"];

const CAROUSEL_SCALES: Record<string, number> = {
  pro1: 0.33, // Heritage Ring (made smaller)
  pro2: 0.58, // Luna Bracelet (made larger)
  pro3: 0.50, // Royal Bangles
  pro4: 0.50, // Cascade Necklace
  pro5: 0.50, // Starlight Earrings
  protest: 0.50, // Custom table model
};

function getCarouselProductConfig(productId: ProductId, index: number): LineShelfProductConfig {
  const product = PRODUCTS[productId];
  return {
    slotIndex: index,
    rowIndex: 0,
    side: "left",
    tier: "middle",
    url: getModelUrl(product.modelFile),
    modelFile: product.modelFile,
    productId,
    productSizePx: 130,
    displaySize: CAROUSEL_SCALES[productId] ?? 0.48,
    isTable: true,
  };
}

export default function ProductCarousel3D() {
  const productIds: ProductId[] = CAROUSEL_PRODUCT_IDS;

  return (
    <div className="flex flex-row items-center justify-center w-full pointer-events-auto overflow-visible" style={{ gap: "10px", marginLeft: "0px", marginRight: "0px" }}>
      {productIds.map((id, idx) => {
        // Curve Logic for 3 products: 0, 1, 2
        const isEdge = idx === 0 || idx === 2;
        const isCenter = idx === 1;
        
        // Pull the center product heavily DOWN (towards the user) to sit on the front curve of the table
        // Keep the side products slightly higher to match the horseshoe shape
        const translateY = isCenter ? "160px" : "70px";
        
        // Let flexbox handle horizontal spacing, but we can add a slight spread
        const translateX = idx === 0 ? "-20px" : idx === 2 ? "20px" : "0px"; 
        
        // Make the products beautifully scaled
        const scale = isEdge ? 0.85 : 1.0;
        
        // zIndex ensures center item is on top
        const zIndex = isCenter ? 30 : 20;

        return (
          <div
            key={`${id}-${idx}`}
            className="straight-product-item relative flex items-center justify-center transition-transform duration-300"
            style={{
              ["--product-size" as any]: "var(--product-carousel-size, 140px)",
              transform: `translate(${translateX}, ${translateY}) scale(${scale})`,
              zIndex
            }}
          >
            {/* Background removed so products look like they sit directly inside/on the table glass */}
            <LineShelfProductMini config={getCarouselProductConfig(id, idx)} mountDelay={0} />
          </div>
        );
      })}
    </div>
  );
}
