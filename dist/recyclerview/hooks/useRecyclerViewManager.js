import { useEffect, useRef, useState } from "react";
import { RecyclerViewManager } from "../RecyclerViewManager";
import { VelocityTracker } from "../helpers/VelocityTracker";
/**
 * @param beforeDataUpdate - Called when a render takes new data, while the manager still holds
 * the old data and the layout that is on screen.
 */
export const useRecyclerViewManager = (props, beforeDataUpdate) => {
    var _a;
    const [recyclerViewManager] = useState(() => new RecyclerViewManager(props));
    const [velocityTracker] = useState(() => new VelocityTracker());
    const { data } = props;
    const lastSyncedProps = useRef(undefined);
    const lastSyncedData = useRef(undefined);
    if (lastSyncedData.current !== undefined && lastSyncedData.current !== data) {
        (_a = beforeDataUpdate === null || beforeDataUpdate === void 0 ? void 0 : beforeDataUpdate.current) === null || _a === void 0 ? void 0 : _a.call(beforeDataUpdate);
    }
    // A render that React discards can still mutate the manager. Track what the
    // manager actually saw so a later render can restore the committed props.
    if (lastSyncedProps.current !== props) {
        recyclerViewManager.updateProps(props);
        lastSyncedProps.current = props;
    }
    /**
     * When data changes, we need to process the data update before the render happens
     */
    if (lastSyncedData.current !== data) {
        recyclerViewManager.processDataUpdate();
        lastSyncedData.current = data;
    }
    useEffect(() => {
        recyclerViewManager.restoreIfNeeded();
        return () => {
            recyclerViewManager.dispose();
            velocityTracker.cleanUp();
        };
        // Used to perform cleanup on unmount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return { recyclerViewManager, velocityTracker };
};
//# sourceMappingURL=useRecyclerViewManager.js.map