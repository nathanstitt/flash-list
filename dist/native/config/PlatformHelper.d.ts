import { OffsetCorrection } from "./OffsetCorrection";
declare const PlatformConfig: {
    defaultDrawDistance: number;
    offsetCorrection: OffsetCorrection;
    rendersItemsInIndexOrder: boolean;
    trackAverageRenderTimeForOffsetProjection: boolean;
    isRN083OrAbove: boolean;
    invertedTransformStyle: {
        readonly transform: readonly [{
            readonly scaleY: -1;
        }];
    };
    invertedTransformStyleHorizontal: {
        readonly transform: readonly [{
            readonly scaleX: -1;
        }];
    };
};
export { PlatformConfig };
//# sourceMappingURL=PlatformHelper.d.ts.map