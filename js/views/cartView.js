/* ==========================================================================
   Cart view — address, coupon, and the bill, rendered as the diner ticket
   (the one visual signature carried over from the original build).
   ========================================================================== */

import { MENU, ADDRESSES } from "../data.js";
import * as cart from "../cart.js";
import { navigate } from "../router.js";

export function renderCart(root) {
  let wasEmpty = null; // unknown yet, forces a first full paint

  const rerender = () => {
    const isEmpty = cart.isCartEmpty();
    if (isEmpty !== wasEmpty) {
      // Structure changed (empty <-> full) — repaint everything.
      wasEmpty = isEmpty;
      paint(root);
    } else if (!isEmpty) {
      // Same structure, just refresh the parts that can change: items,
      // bill, and the coupon message. Leaves any in-progress typing alone.
      renderItems(root);
      renderBill(root);
    }
  };

  rerender();
  // Single subscription for the life of this view.
  return cart.subscribe(rerender);
}

function paint(root) {
  if (cart.isCartEmpty()) {
    root.innerHTML = `
      <div class="view-header">
        <button type="button" class="link-back" id="back-home">&larr; Back to menu</button>
      </div>
      <div class="empty-state">
        <p class="empty-emoji">🧾</p>
        <p>Your cart is empty.</p>
        <button type="button" class="btn-punch" id="go-menu">Browse the menu</button>
      </div>
    `;
    root.querySelector("#back-home").addEventListener("click", () => navigate("#/"));
    root.querySelector("#go-menu").addEventListener("click", () => navigate("#/"));
    return;
  }

  root.innerHTML = `
    <div class="view-header">
      <button type="button" class="link-back" id="back-home">&larr; Back to menu</button>
      <h1 class="view-title">Your cart</h1>
    </div>

    <section class="address-card">
      <span class="address-label">Deliver to</span>
      <div class="address-options" id="address-options"></div>
    </section>

    <section class="items-card" id="items-card"></section>

    <section class="coupon-card">
      <div class="coupon-input-row">
        <input type="text" id="coupon-input" placeholder="Enter coupon code" aria-label="Coupon code" />
        <button type="button" class="btn-secondary" id="coupon-apply">Apply</button>
      </div>
      <p class="coupon-msg" id="coupon-msg" role="status"></p>
    </section>

    <section class="ticket-wrap">
      <div class="ticket" id="bill-ticket"></div>
    </section>

    <button type="button" class="btn-punch btn-place-order" id="place-order">Place order</button>
  `;

  root.querySelector("#back-home").addEventListener("click", () => navigate("#/"));

  renderAddresses(root);
  renderItems(root);
  renderBill(root);

  root.querySelector("#coupon-apply").addEventListener("click", () => {
    const input = root.querySelector("#coupon-input");
    const result = cart.applyCoupon(input.value);
    const msg = root.querySelector("#coupon-msg");
    msg.textContent = result.message;
    msg.classList.toggle("is-error", !result.ok);
    if (result.ok) input.value = "";
  });

  root.querySelector("#place-order").addEventListener("click", () => {
    cart.placeOrder();
    navigate("#/track");
  });
}

function renderAddresses(root) {
  const wrap = root.querySelector("#address-options");
  wrap.innerHTML = ADDRESSES.map((a) => `
    <label class="address-option">
      <input type="radio" name="address" value="${a.id}" ${cart.getAddressId() === a.id ? "checked" : ""} />
      <span><strong>${a.label}</strong> — ${a.detail}</span>
    </label>
  `).join("");

  wrap.querySelectorAll("input[type=radio]").forEach((radio) => {
    radio.addEventListener("change", (e) => cart.setAddress(e.target.value));
  });
}

function renderItems(root) {
  const card = root.querySelector("#items-card");
  const snapshot = cart.getCartSnapshot();

  card.innerHTML = Object.keys(snapshot).map((sku) => {
    const item = MENU[sku];
    const qty = snapshot[sku];
    return `
      <div class="cart-item-row" data-sku="${sku}">
        <div class="cart-item-name">
          <span class="veg-dot ${item.veg ? "veg" : "nonveg"}" aria-hidden="true"></span>
          ${item.name}
        </div>
        <div class="stepper" role="group" aria-label="Quantity for ${item.name}">
          <button type="button" class="stepper-minus" aria-label="Remove one ${item.name}">&minus;</button>
          <span class="stepper-qty">${qty}</span>
          <button type="button" class="stepper-plus" aria-label="Add one ${item.name}">+</button>
        </div>
        <div class="cart-item-price">€${(item.price * qty).toFixed(2)}</div>
      </div>
    `;
  }).join("");

  card.querySelectorAll(".cart-item-row").forEach((row) => {
    const sku = row.dataset.sku;
    row.querySelector(".stepper-plus").addEventListener("click", () => cart.addOne(sku));
    row.querySelector(".stepper-minus").addEventListener("click", () => cart.removeOne(sku));
  });
}

function renderBill(root) {
  const ticket = root.querySelector("#bill-ticket");
  if (!ticket) return;
  const bill = cart.calcBill();

  ticket.innerHTML = `
    <div class="ticket-head">
      <div class="t-brand">CraveCart</div>
      <div class="t-meta">BILL SUMMARY</div>
    </div>
    <div class="ticket-totals">
      <div class="ticket-totals-row"><span>Item total</span><span>€${bill.itemTotal.toFixed(2)}</span></div>
      <div class="ticket-totals-row"><span>Delivery fee</span><span>${bill.deliveryFee === 0 ? "FREE" : `€${bill.deliveryFee.toFixed(2)}`}</span></div>
      <div class="ticket-totals-row"><span>Taxes &amp; charges</span><span>€${bill.taxes.toFixed(2)}</span></div>
      ${bill.discount > 0 ? `<div class="ticket-totals-row discount"><span>Discount${bill.coupon ? ` (${bill.coupon.code})` : ""}</span><span>&minus;€${bill.discount.toFixed(2)}</span></div>` : ""}
      <div class="ticket-totals-row grand"><span>To pay</span><span>€${bill.toPay.toFixed(2)}</span></div>
    </div>
  `;
}
