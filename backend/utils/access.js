/** Pure authorization helpers shared by orders, reviews and admin checks. */

export function isAdmin(user) {
  return Boolean(user && Array.isArray(user.roles) && user.roles.includes("admin"));
}

export function sameId(a, b) {
  const left = a?._id || a;
  const right = b?._id || b;
  if (!left || !right) return false;
  return left.toString() === right.toString();
}

export function isOrderBuyer(order, user) {
  return sameId(order?.buyer, user?._id);
}

export function isOrderSeller(order, user) {
  return sameId(order?.seller, user?._id);
}

export function canViewOrder(order, user) {
  return isOrderBuyer(order, user) || isOrderSeller(order, user) || isAdmin(user);
}

const TRANSITIONS = {
  pending: ["processing", "cancelled"],
  payment_processing: ["processing", "cancelled"],
  paid: ["processing", "refunded"],
  processing: ["shipped", "cancelled", "refunded"],
  shipped: ["delivered", "returned"],
  delivered: ["refunded"],
  returned: ["refunded"],
  cancelled: [],
  refunded: [],
};

/** Buyer/admin cancellation via POST /cancel (anything before shipping). */
export function canCancelOrder(order, user) {
  if (!canViewOrder(order, user)) return false;
  if (!["pending", "payment_processing", "paid", "processing"].includes(order?.status)) {
    return false;
  }
  return isAdmin(user) || isOrderBuyer(order, user);
}

/** Buyer may only cancel a pending order through PATCH /status. */
export function canBuyerCancelPending(order, user) {
  return isOrderBuyer(order, user) && order?.status === "pending";
}

export function canSetOrderStatus(order, user, nextStatus) {
  if (!canViewOrder(order, user)) return false;

  if (nextStatus === "cancelled") {
    if (isAdmin(user)) return canCancelOrder(order, user);
    if (canBuyerCancelPending(order, user)) return true;
    return isOrderSeller(order, user) && order?.status === "processing";
  }

  // A buyer cannot move an order forward (only cancel a pending one).
  if (isOrderBuyer(order, user) && !isAdmin(user)) return false;
  return (TRANSITIONS[order?.status] || []).includes(nextStatus);
}

export function shippingStatusForOrderStatus(status) {
  if (status === "shipped") return "in_transit";
  if (status === "delivered" || status === "returned") return status;
  return "not_shipped";
}

export function canRespondToReview(review, user) {
  return sameId(review?.seller, user?._id);
}

export function canManageAddress(address, user) {
  return sameId(address?.user, user?._id);
}
