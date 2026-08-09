let pendingItem = null;

export const setPendingReelItem = (item) => {
  pendingItem = item;
};

export const getPendingReelItem = () => pendingItem;

export const clearPendingReelItem = () => {
  pendingItem = null;
};
