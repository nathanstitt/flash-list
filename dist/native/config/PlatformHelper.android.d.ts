import { OffsetCorrection } from "./OffsetCorrection";
declare const PlatformConfig: {
    defaultDrawDistance: number;
    offsetCorrection: OffsetCorrection;
    rendersItemsInIndexOrder: boolean;
    trackAverageRenderTimeForOffsetProjection: boolean;
    isRN083OrAbove: boolean;
    invertedTransformStyle: {
        readonly transform: readonly [{
            readonly rotate: "180deg";
        }];
    };
    invertedTransformStyleHorizontal: {
        readonly transform: readonly [{
            readonly rotate: "180deg";
        }];
    };
};
export { PlatformConfig };
//# sourceMappingURL=PlatformHelper.android.d.ts.map