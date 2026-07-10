/* ==========================================================================
   Home view — the restaurant page: hero, search + filters, offers, menu.
   ========================================================================== */

import { MENU, CATEGORY_ORDER, RESTAURANT, COUPONS } from "../data.js";
import * as cart from "../cart.js";
import { navigate } from "../router.js";

let searchTerm = "";
let activeCategory = "All";

export function renderHome(root) {
  root.innerHTML = `
    <section class="hero">
      <div class="hero-cover" aria-hidden="true"></div>
      <div class="hero-info">
        <h1 class="hero-name">${RESTAURANT.name}</h1>
        <p class="hero-cuisine">${RESTAURANT.cuisine}</p>
        <div class="hero-stats">
          <span class="stat stat-rating">★ ${RESTAURANT.rating.toFixed(1)} <span class="stat-dim">(${(RESTAURANT.ratingCount / 1000).toFixed(1)}k+)</span></span>
          <span class="stat-sep">·</span>
          <span class="stat">${RESTAURANT.etaMinutes[0]}–${RESTAURANT.etaMinutes[1]} min</span>
          <span class="stat-sep">·</span>
          <span class="stat">${RESTAURANT.deliveryFee === 0 ? "Free delivery" : `€${RESTAURANT.deliveryFee.toFixed(2)} delivery`}</span>
        </div>
        <p class="hero-address">📍 Deliver to: ${RESTAURANT.address}</p>
      </div>
    </section>

    <section class="offers-rail" aria-label="Offers">
      ${Object.values(COUPONS).map((c) => `
        <div class="offer-card">
          <span class="offer-code">${c.code}</span>
          <span class="offer-desc">${c.description}</span>
        </div>
      `).join("")}
    </section>

    <section class="search-row">
      <div class="search-box">
        <span aria-hidden="true">🔍</span>
        <input type="search" id="menu-search" placeholder="Search dishes on this menu" value="${searchTerm}" aria-label="Search menu" />
      </div>
    </section>

    <nav class="chip-row" aria-label="Filter by category">
      ${["All", ...CATEGORY_ORDER].map((cat) => `
        <button type="button" class="chip ${cat === activeCategory ? "is-active" : ""}" data-cat="${cat}">${cat}</button>
      `).join("")}
    </nav>

    <div id="menu-board"></div>

    <div class="cart-bar-slot"></div>
  `;

  root.querySelector("#menu-search").addEventListener("input", (e) => {
    searchTerm = e.target.value;
    renderMenuBoard(root);
  });

  root.querySelectorAll(".chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.cat;
      renderMenuBoard(root);
      root.querySelectorAll(".chip").forEach((b) => b.classList.toggle("is-active", b === btn));
    });
  });

  renderMenuBoard(root);
  renderCartBar(root);

  const unsubscribe = cart.subscribe(() => {
    syncAllSteppers(root);
    renderCartBar(root);
  });

  return unsubscribe;
}

function filteredSkus() {
  const term = searchTerm.trim().toLowerCase();
  return Object.keys(MENU).filter((sku) => {
    const item = MENU[sku];
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    const matchesSearch = !term || item.name.toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
  });
}

function renderMenuBoard(root) {
  const board = root.querySelector("#menu-board");
  const skus = filteredSkus();

  if (skus.length === 0) {
    board.innerHTML = `<p class="no-results">No dishes match "${searchTerm}". Try a different search or category.</p>`;
    return;
  }

  const byCategory = {};
  for (const sku of skus) {
    const cat = MENU[sku].category;
    (byCategory[cat] ||= []).push(sku);
  }

  board.innerHTML = CATEGORY_ORDER.filter((cat) => byCategory[cat]?.length).map((cat) => `
    <section class="menu-category" aria-labelledby="cat-${cat}">
      <h2 class="category-eyebrow" id="cat-${cat}">${cat}</h2>
      <div class="menu-grid">
        ${byCategory[cat].map(menuCardHtml).join("")}
      </div>
    </section>
  `).join("");

  board.querySelectorAll(".menu-card").forEach((card) => {
    const sku = card.dataset.sku;
    card.querySelector(".stepper-plus").addEventListener("click", () => cart.addOne(sku));
    card.querySelector(".stepper-minus").addEventListener("click", () => cart.removeOne(sku));
  });
}

function menuCardHtml(sku) {
  const item = MENU[sku];
  const qty = cart.getQuantity(sku);
  const badges = item.tags.map((t) => `<span class="badge badge-${t}">${t === "bestseller" ? "Bestseller" : "Popular"}</span>`).join("");

  return `
    <article class="menu-card" data-sku="${sku}">
      <div class="menu-card-top">
        <span class="veg-dot ${item.veg ? "veg" : "nonveg"}" title="${item.veg ? "Veg" : "Non-veg"}" aria-hidden="true"></span>
        <span class="menu-card-name">${item.name}</span>
      </div>
      ${badges ? `<div class="menu-card-badges">${badges}</div>` : ""}
      <div class="menu-card-bottom">
        <span class="menu-card-price">€${item.price.toFixed(2)}</span>
        <div class="stepper" role="group" aria-label="Quantity for ${item.name}">
          <button type="button" class="stepper-minus" aria-label="Remove one ${item.name}" ${qty === 0 ? "disabled" : ""}>&minus;</button>
          <span class="stepper-qty">${qty}</span>
          <button type="button" class="stepper-plus" aria-label="Add one ${item.name}">+</button>
        </div>
      </div>
    </article>
  `;
}

function syncAllSteppers(root) {
  root.querySelectorAll(".menu-card").forEach((card) => {
    const sku = card.dataset.sku;
    const qty = cart.getQuantity(sku);
    card.querySelector(".stepper-qty").textContent = qty;
    card.querySelector(".stepper-minus").disabled = qty === 0;
  });
}

function renderCartBar(root) {
  const slot = root.querySelector(".cart-bar-slot");
  if (!slot) return;

  const count = cart.cartItemCount();
  if (count === 0) {
    slot.innerHTML = "";
    return;
  }

  const { toPay } = cart.calcBill();
  slot.innerHTML = `
    <button type="button" class="cart-bar">
      <span>${count} item${count > 1 ? "s" : ""} · €${toPay.toFixed(2)}</span>
      <span class="cart-bar-cta">View cart →</span>
    </button>
  `;
  slot.querySelector(".cart-bar").addEventListener("click", () => navigate("#/cart"));
}
