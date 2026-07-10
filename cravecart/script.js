/* ==========================================================================
   CraveCart — app logic
   Ports the notebook's menu/cart/checkout functions to an interactive UI.
   State lives in memory only (no storage APIs), same as a real register
   session that starts fresh each time the till is opened.
   ========================================================================== */

const APP_NAME = "CraveCart";
const SALES_TAX = 0.07;

/** Menu data — same SKUs/prices/names as the original notebook, plus a
 *  category so the board can group items the way a diner menu actually does. */
const MENU = {
  sku1:  { name: "Hamburger",      price: 6.51, category: "Mains" },
  sku2:  { name: "Cheeseburger",   price: 7.75, category: "Mains" },
  sku5:  { name: "Sub",            price: 5.87, category: "Mains" },
  sku4:  { name: "Fries",          price: 2.39, category: "Sides" },
  sku10: { name: "Sauce",          price: 0.75, category: "Sides" },
  sku7:  { name: "Fountain Drink", price: 3.45, category: "Drinks" },
  sku3:  { name: "Milkshake",      price: 5.99, category: "Sweets" },
  sku6:  { name: "Ice Cream",      price: 1.55, category: "Sweets" },
  sku8:  { name: "Cookie",         price: 3.15, category: "Sweets" },
  sku9:  { name: "Brownie",        price: 2.46, category: "Sweets" },
};

const CATEGORY_ORDER = ["Mains", "Sides", "Drinks", "Sweets"];

/** cart: { [sku]: quantity } */
const cart = {};

const euro = (n) => `€${n.toFixed(2)}`;

// ---------------------------------------------------------------------------
// Menu board
// ---------------------------------------------------------------------------

function renderMenu() {
  const board = document.getElementById("menu-board");
  board.innerHTML = "";

  for (const category of CATEGORY_ORDER) {
    const skus = Object.keys(MENU).filter((sku) => MENU[sku].category === category);
    if (skus.length === 0) continue;

    const section = document.createElement("section");
    section.className = "menu-category";
    section.setAttribute("aria-labelledby", `cat-${category}`);

    const heading = document.createElement("h2");
    heading.className = "category-eyebrow";
    heading.id = `cat-${category}`;
    heading.textContent = category;
    section.appendChild(heading);

    const grid = document.createElement("div");
    grid.className = "menu-grid";

    for (const sku of skus) {
      grid.appendChild(renderMenuCard(sku));
    }

    section.appendChild(grid);
    board.appendChild(section);
  }
}

function renderMenuCard(sku) {
  const item = MENU[sku];
  const card = document.createElement("article");
  card.className = "menu-card";
  card.dataset.sku = sku;

  const qty = cart[sku] || 0;

  card.innerHTML = `
    <div class="menu-card-top">
      <span class="menu-card-name">${item.name}</span>
      <span class="menu-card-price">${euro(item.price)}</span>
    </div>
    <div class="menu-card-controls">
      <div class="stepper" role="group" aria-label="Quantity for ${item.name}">
        <button type="button" class="stepper-minus" aria-label="Remove one ${item.name}" ${qty === 0 ? "disabled" : ""}>&minus;</button>
        <span class="stepper-qty">${qty}</span>
        <button type="button" class="stepper-plus" aria-label="Add one ${item.name}">+</button>
      </div>
      <span class="menu-card-added ${qty > 0 ? "is-visible" : ""}">on ticket</span>
    </div>
  `;

  card.querySelector(".stepper-plus").addEventListener("click", () => {
    changeQuantity(sku, (cart[sku] || 0) + 1);
  });
  card.querySelector(".stepper-minus").addEventListener("click", () => {
    changeQuantity(sku, Math.max(0, (cart[sku] || 0) - 1));
  });

  return card;
}

function changeQuantity(sku, newQty) {
  const item = MENU[sku];
  const hadItem = sku in cart;

  if (newQty <= 0) {
    delete cart[sku];
    if (hadItem) announce(`Removed ${item.name} from the ticket.`);
  } else {
    cart[sku] = newQty;
    announce(`${hadItem ? "Updated" : "Added"} ${item.name} — now ${newQty} on the ticket.`);
  }

  syncMenuCard(sku);
  renderTicket();
}

function syncMenuCard(sku) {
  const card = document.querySelector(`.menu-card[data-sku="${sku}"]`);
  if (!card) return;
  const qty = cart[sku] || 0;
  card.querySelector(".stepper-qty").textContent = qty;
  card.querySelector(".stepper-minus").disabled = qty === 0;
  card.querySelector(".menu-card-added").classList.toggle("is-visible", qty > 0);
}

// ---------------------------------------------------------------------------
// Ticket (cart) panel
// ---------------------------------------------------------------------------

function calcTotals() {
  let subtotal = 0;
  for (const sku in cart) {
    subtotal += MENU[sku].price * cart[sku];
  }
  const tax = subtotal * SALES_TAX;
  return { subtotal, tax, total: subtotal + tax };
}

function renderTicket() {
  const linesEl = document.getElementById("ticket-lines");
  const skus = Object.keys(cart);

  if (skus.length === 0) {
    linesEl.innerHTML = `<li class="ticket-empty">🎟️ Ticket's empty — tap a + on the board.</li>`;
  } else {
    linesEl.innerHTML = "";
    for (const sku of skus) {
      const item = MENU[sku];
      const qty = cart[sku];
      const lineTotal = item.price * qty;

      const li = document.createElement("li");
      li.className = "ticket-line";
      li.innerHTML = `
        <span class="ticket-line-name">${qty} × ${item.name}</span>
        <span class="ticket-line-amount">${euro(lineTotal)}</span>
        <span class="ticket-line-sub">
          <span>${euro(item.price)} each</span>
          <button type="button" class="ticket-line-remove">remove</button>
        </span>
      `;
      li.querySelector(".ticket-line-remove").addEventListener("click", () => {
        changeQuantity(sku, 0);
      });
      linesEl.appendChild(li);
    }
  }

  const { subtotal, tax, total } = calcTotals();
  document.getElementById("t-subtotal").textContent = euro(subtotal);
  document.getElementById("t-tax").textContent = euro(tax);
  document.getElementById("t-total").textContent = euro(total);

  const hasItems = skus.length > 0;
  document.getElementById("btn-checkout").disabled = !hasItems;
  document.getElementById("btn-clear").hidden = !hasItems;
}

function clearCart({ silent = false } = {}) {
  for (const sku of Object.keys(cart)) {
    delete cart[sku];
    syncMenuCard(sku);
  }
  renderTicket();
  if (!silent) announce("Ticket cleared.");
}

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------

function checkout() {
  if (Object.keys(cart).length === 0) return;

  const stamp = document.getElementById("ticket-stamp");
  stamp.classList.remove("is-shown");
  // force reflow so the animation can restart if triggered twice quickly
  void stamp.offsetWidth;
  stamp.classList.add("is-shown");

  const orderNumber = `A${Math.floor(100 + Math.random() * 900)}`;
  showToast(`Order #${orderNumber} sent to the kitchen. Thanks!`);
  announce(`Checkout complete. Order number ${orderNumber}.`);

  setTimeout(() => {
    stamp.classList.remove("is-shown");
    clearCart({ silent: true });
  }, 1400);
}

// ---------------------------------------------------------------------------
// Small UI helpers
// ---------------------------------------------------------------------------

let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("is-shown");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-shown"), 2600);
}

function announce(message) {
  const region = document.getElementById("live-region");
  region.textContent = message;
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

function init() {
  document.getElementById("app-name").textContent = APP_NAME;
  renderMenu();
  renderTicket();

  document.getElementById("btn-checkout").addEventListener("click", checkout);
  document.getElementById("btn-clear").addEventListener("click", () => clearCart());
}

document.addEventListener("DOMContentLoaded", init);
