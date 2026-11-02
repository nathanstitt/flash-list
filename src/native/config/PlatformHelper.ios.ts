import { isRN083OrAbove } from "./versionCheck";
import { OffsetCorrection } from "./OffsetCorrection";

const PlatformConfig = {
  defaultDrawDistance: 250,
  offsetCorrection: "anchor" as OffsetCorrection,
  rendersItemsInIndexOrder: false,
  trackAverageRenderTimeForOffsetProjection: false,
  isRN083OrAbove: isRN083OrAbove(),
  invertedTransformStyle: { transform: [{ scaleY: -1 }] } as const,
  invertedTransformStyleHorizontal: { transform: [{ scaleX: -1 }] } as const,
};

export { PlatformConfig };
