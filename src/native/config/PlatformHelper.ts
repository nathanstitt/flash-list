import { OffsetCorrection } from "./OffsetCorrection";

const PlatformConfig = {
  defaultDrawDistance: 250,
  offsetCorrection: "scrollTo" as OffsetCorrection,
  trackAverageRenderTimeForOffsetProjection: false,
  isRN083OrAbove: true,
  invertedTransformStyle: { transform: [{ scaleY: -1 }] } as const,
  invertedTransformStyleHorizontal: { transform: [{ scaleX: -1 }] } as const,
};

export { PlatformConfig };
