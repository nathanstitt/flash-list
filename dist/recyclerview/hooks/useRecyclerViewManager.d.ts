import { RefObject } from "react";
import { RecyclerViewProps } from "../RecyclerViewProps";
import { RecyclerViewManager } from "../RecyclerViewManager";
import { VelocityTracker } from "../helpers/VelocityTracker";
/**
 * @param beforeDataUpdate - Called when a render takes new data, while the manager still holds
 * the old data and the layout that is on screen.
 */
export declare const useRecyclerViewManager: <T>(props: RecyclerViewProps<T>, beforeDataUpdate?: RefObject<(() => void) | undefined>) => {
    recyclerViewManager: RecyclerViewManager<T>;
    velocityTracker: VelocityTracker<unknown>;
};
//# sourceMappingURL=useRecyclerViewManager.d.ts.map