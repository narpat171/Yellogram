let pendingId = null;

export const setPendingReelId = (id) => {
  pendingId = id;
};

export const takePendingReelId = () => {
  const id = pendingId;
  pendingId = null;
  return id;
};
