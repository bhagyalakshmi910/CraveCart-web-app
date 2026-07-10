/* ==========================================================================
   App entry point: persistent header (with live cart badge) + router setup.
   ========================================================================== */

import { registerRoute, setOutlet, startRouter, navigate } from "./router.js";
import * as cart from "./cart.js";
import { renderHome } from "./views/home.js";
import { renderCart } from "./views/cartView.js";
import { renderTracking } from "./views/trackingView.js";

function renderHeaderCartBadge() {
  const badge = document.getElementById("header-cart-count");
  const count = cart.cartItemCount();
  badge.textContent = String(count);
  badge.hidden = count === 0;
}

function init() {
  setOutlet(document.getElementById("view-outlet"));

  registerRoute("#/", renderHome);
  registerRoute("#/cart", renderCart);
  registerRoute("#/track", renderTracking);

  document.getElementById("header-cart-btn").addEventListener("click", () => navigate("#/cart"));
  document.getElementById("brand-link").addEventListener("click", (e) => {
    e.preventDefault();
    navigate("#/");
  });

  cart.subscribe(renderHeaderCartBadge);
  renderHeaderCartBadge();

  startRouter();
}

document.addEventListener("DOMContentLoaded", init);
