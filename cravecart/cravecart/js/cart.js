/* ==========================================================================
   Cart + order state.
   A tiny pub-sub store: views subscribe once and re-render whenever state
   changes, instead of every button handler manually poking the DOM.
   Everything lives in memory for the session — nothing is persisted.
   ========================================================================== */

import { MENU, RESTAURANT, COUPONS, ORDER_STAGES } from "./data.js";

const listeners = new Set();

const state = {
  cart: {},              // { [sku]: quantity }
  addressId: "home",
  couponCode: null,
  order: null,           // set once an order is placed: { id, items, bill, placedAt, stageIndex }
};

function notify() {
  for (const fn of listeners) fn(state);
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ---------------------------------------------------------------------------
// Cart mutations
// ---------------------------------------------------------------------------

export function getQuantity(sku) {
  return state.cart[sku] || 0;
}

export function setQuantity(sku, qty) {
  if (qty <= 0) {
    delete state.cart[sku];
  } else {
    state.cart[sku] = qty;
  }
  notify();
}

export function addOne(sku) {
  setQuantity(sku, getQuantity(sku) + 1);
}

export function removeOne(sku) {
  setQuantity(sku, getQuantity(sku) - 1);
}

export function removeItem(sku) {
  setQuantity(sku, 0);
}

export function clearCart() {
  state.cart = {};
  state.couponCode = null;
  notify();
}

export function cartItemCount() {
  return Object.values(state.cart).reduce((sum, q) => sum + q, 0);
}

export function isCartEmpty() {
  return Object.keys(state.cart).length === 0;
}

// ---------------------------------------------------------------------------
// Address
// ---------------------------------------------------------------------------

export function setAddress(id) {
  state.addressId = id;
  notify();
}

export function getAddressId() {
  return state.addressId;
}

// ---------------------------------------------------------------------------
// Coupon
// ---------------------------------------------------------------------------

export function applyCoupon(rawCode) {
  const code = (rawCode || "").trim().toUpperCase();
  if (!code) return { ok: false, message: "Enter a code first." };
  if (!COUPONS[code]) return { ok: false, message: `"${code}" isn't a valid code.` };
  state.couponCode = code;
  notify();
  return { ok: true, message: `${code} applied.` };
}

export function removeCoupon() {
  state.couponCode = null;
  notify();
}

export function getCoupon() {
  return state.couponCode ? COUPONS[state.couponCode] : null;
}

// ---------------------------------------------------------------------------
// Bill calculation
// ---------------------------------------------------------------------------

const TAX_RATE = 0.07;

export function calcBill() {
  let itemTotal = 0;
  for (const sku in state.cart) {
    itemTotal += MENU[sku].price * state.cart[sku];
  }

  const coupon = getCoupon();
  let deliveryFee = itemTotal >= RESTAURANT.freeDeliveryThreshold ? 0 : RESTAURANT.deliveryFee;
  let discount = 0;

  if (coupon) {
    if (coupon.code === "FREESHIP") {
      deliveryFee = 0;
    } else {
      discount = coupon.apply(itemTotal);
    }
  }

  const taxes = itemTotal * TAX_RATE;
  const toPay = Math.max(0, itemTotal + deliveryFee + taxes - discount);

  return { itemTotal, deliveryFee, taxes, discount, toPay, coupon };
}

// ---------------------------------------------------------------------------
// Order placement + demo tracking simulation
// ---------------------------------------------------------------------------

let trackingTimer = null;

export function placeOrder() {
  const bill = calcBill();
  const items = Object.keys(state.cart).map((sku) => ({
    sku,
    name: MENU[sku].name,
    price: MENU[sku].price,
    qty: state.cart[sku],
  }));

  state.order = {
    id: `CC-${Math.floor(1000 + Math.random() * 9000)}`,
    items,
    bill,
    addressId: state.addressId,
    placedAt: Date.now(),
    stageIndex: 0,
  };

  state.cart = {};
  state.couponCode = null;
  notify();

  startTrackingSimulation();
  return state.order;
}

/** Advances order.stageIndex over a short demo timeline so the tracking
 *  view has something live to show, rather than a static mock. */
function startTrackingSimulation() {
  clearInterval(trackingTimer);
  const stepDurationMs = 4000; // sped up for demo purposes

  trackingTimer = setInterval(() => {
    if (!state.order) {
      clearInterval(trackingTimer);
      return;
    }
    if (state.order.stageIndex >= ORDER_STAGES.length - 1) {
      clearInterval(trackingTimer);
      return;
    }
    state.order.stageIndex += 1;
    notify();
  }, stepDurationMs);
}

export function getOrder() {
  return state.order;
}

export function resetOrder() {
  clearInterval(trackingTimer);
  state.order = null;
  notify();
}

export function getCartSnapshot() {
  return { ...state.cart };
}
