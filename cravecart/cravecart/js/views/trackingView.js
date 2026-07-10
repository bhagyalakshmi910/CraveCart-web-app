/* ==========================================================================
   Tracking view — live-ish order status, driven by cart.js's demo timer.
   ========================================================================== */

import { ORDER_STAGES, ADDRESSES } from "../data.js";
import * as cart from "../cart.js";
import { navigate } from "../router.js";

let tickTimer = null;
let ratingValue = 0;

export function renderTracking(root) {
  const order = cart.getOrder();

  if (!order) {
    root.innerHTML = `
      <div class="empty-state">
        <p class="empty-emoji">🛵</p>
        <p>No order in progress.</p>
        <button type="button" class="btn-punch" id="go-menu">Browse the menu</button>
      </div>
    `;
    root.querySelector("#go-menu").addEventListener("click", () => navigate("#/"));
    return;
  }

  ratingValue = 0;
  paint(root);

  const unsubscribe = cart.subscribe(() => paint(root));
  clearInterval(tickTimer);
  tickTimer = setInterval(() => paint(root, { tickOnly: true }), 1000);

  return () => {
    clearInterval(tickTimer);
    unsubscribe();
  };
}

function paint(root, { tickOnly = false } = {}) {
  const order = cart.getOrder();
  if (!order) return;

  if (tickOnly) {
    const elapsedEl = root.querySelector("#elapsed");
    if (elapsedEl) elapsedEl.textContent = elapsedLabel(order.placedAt);
    return;
  }

  const address = ADDRESSES.find((a) => a.id === order.addressId) || ADDRESSES[0];
  const stageIndex = order.stageIndex;
  const isDelivered = stageIndex === ORDER_STAGES.length - 1;

  root.innerHTML = `
    <div class="view-header">
      <h1 class="view-title">Order ${order.id}</h1>
      <span class="elapsed" id="elapsed">${elapsedLabel(order.placedAt)}</span>
    </div>

    <p class="track-caption">Demo timeline — stages advance quickly for preview purposes.</p>

    <section class="track-progress">
      <div class="track-line">
        <div class="track-line-fill" style="width:${(stageIndex / (ORDER_STAGES.length - 1)) * 100}%"></div>
        <div class="track-rider" style="left:${(stageIndex / (ORDER_STAGES.length - 1)) * 100}%">🛵</div>
      </div>
      <ol class="track-stages">
        ${ORDER_STAGES.map((s, i) => `
          <li class="track-stage ${i <= stageIndex ? "is-done" : ""} ${i === stageIndex ? "is-current" : ""}">
            <span class="track-dot"></span>
            <span class="track-stage-label">${s.label}</span>
            <span class="track-stage-detail">${s.detail}</span>
          </li>
        `).join("")}
      </ol>
    </section>

    <section class="ticket-wrap">
      <div class="ticket">
        <div class="ticket-head">
          <div class="t-brand">CraveCart</div>
          <div class="t-meta">ORDER ${order.id} · DELIVER TO ${address.label.toUpperCase()}</div>
        </div>
        <ul class="ticket-lines">
          ${order.items.map((it) => `
            <li class="ticket-line">
              <span class="ticket-line-name">${it.qty} × ${it.name}</span>
              <span class="ticket-line-amount">€${(it.price * it.qty).toFixed(2)}</span>
            </li>
          `).join("")}
        </ul>
        <div class="ticket-totals">
          <div class="ticket-totals-row grand"><span>Total paid</span><span>€${order.bill.toPay.toFixed(2)}</span></div>
        </div>
      </div>
    </section>

    ${isDelivered ? ratingSectionHtml() : ""}

    <button type="button" class="btn-secondary btn-new-order" id="new-order">Start a new order</button>
  `;

  if (isDelivered) {
    wireRating(root);
  }

  root.querySelector("#new-order").addEventListener("click", () => {
    cart.resetOrder();
    navigate("#/");
  });
}

function elapsedLabel(placedAt) {
  const secs = Math.max(0, Math.floor((Date.now() - placedAt) / 1000));
  return `Placed ${secs}s ago`;
}

function ratingSectionHtml() {
  return `
    <section class="rating-card">
      <p>Rate your order</p>
      <div class="rating-stars" id="rating-stars" role="radiogroup" aria-label="Rate your order out of 5">
        ${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="star" data-value="${n}" role="radio" aria-checked="false" aria-label="${n} star${n > 1 ? "s" : ""}">★</button>`).join("")}
      </div>
      <p class="rating-thanks" id="rating-thanks" hidden>Thanks for the feedback!</p>
    </section>
  `;
}

function wireRating(root) {
  const stars = root.querySelectorAll(".star");
  stars.forEach((star) => {
    star.addEventListener("click", () => {
      ratingValue = Number(star.dataset.value);
      stars.forEach((s) => {
        const active = Number(s.dataset.value) <= ratingValue;
        s.classList.toggle("is-active", active);
        s.setAttribute("aria-checked", String(active));
      });
      root.querySelector("#rating-thanks").hidden = false;
    });
  });
}
