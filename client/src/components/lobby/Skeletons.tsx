import React from "react";

export function Skeleton({ width = "100%", height = 16 }: { width?: string | number; height?: string | number }) {
  return (
    <div
      style={{
        width,
        height,
        background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
        backgroundSize: "200% 100%",
        borderRadius: 6,
        animation: "csoai-skeleton 1.5s infinite",
      }}
    />
  );
}

export function SkeletonRow() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12 }}>
      <Skeleton width="60%" height={18} />
      <Skeleton width="100%" height={14} />
      <Skeleton width="40%" height={14} />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div style={{
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    }}>
      <SkeletonRow />
    </div>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}
