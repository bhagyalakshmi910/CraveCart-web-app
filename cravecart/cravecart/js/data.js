/* ==========================================================================
   Static data: menu, restaurant profile, coupons.
   Kept separate from logic/rendering so the "content" of the app can change
   without touching behavior — same idea as swapping a real API in later.
   ========================================================================== */

export const RESTAURANT = {
  name: "CraveCart",
  cuisine: "American · Burgers · Diner",
  rating: 4.3,
  ratingCount: 2300,
  etaMinutes: [25, 30],
  deliveryFee: 2.5,
  freeDeliveryThreshold: 25,
  address: "12 Flat-Top Lane, Galway",
};

export const ADDRESSES = [
  { id: "home", label: "Home", detail: "Bay area, Galway" },
  { id: "work", label: "Work", detail: "Business District, Galway" },
];

/** Menu data — same SKUs/prices/names as the original notebook, extended
 *  with the metadata a delivery listing actually needs. */
export const MENU = {
  sku1:  { name: "Hamburger",      price: 6.51, category: "Mains",  veg: false, tags: [] },
  sku2:  { name: "Cheeseburger",   price: 7.75, category: "Mains",  veg: false, tags: ["bestseller"] },
  sku5:  { name: "Sub",            price: 5.87, category: "Mains",  veg: false, tags: [] },
  sku4:  { name: "Fries",          price: 2.39, category: "Sides",  veg: true,  tags: ["popular"] },
  sku10: { name: "Sauce",          price: 0.75, category: "Sides",  veg: true,  tags: [] },
  sku7:  { name: "Fountain Drink", price: 3.45, category: "Drinks", veg: true,  tags: [] },
  sku3:  { name: "Milkshake",      price: 5.99, category: "Sweets", veg: true,  tags: ["bestseller"] },
  sku6:  { name: "Ice Cream",      price: 1.55, category: "Sweets", veg: true,  tags: [] },
  sku8:  { name: "Cookie",         price: 3.15, category: "Sweets", veg: true,  tags: [] },
  sku9:  { name: "Brownie",        price: 2.46, category: "Sweets", veg: true,  tags: ["popular"] },
};

export const CATEGORY_ORDER = ["Mains", "Sides", "Drinks", "Sweets"];

export const COUPONS = {
  WELCOME10: {
    code: "WELCOME10",
    description: "10% off, up to €5",
    apply: (itemTotal) => Math.min(itemTotal * 0.1, 5),
  },
  FREESHIP: {
    code: "FREESHIP",
    description: "Free delivery on this order",
    apply: () => 0, // handled as a delivery-fee override, see cart.js
  },
};

export const ORDER_STAGES = [
  { key: "placed",   label: "Order placed",     detail: "The kitchen has your ticket." },
  { key: "preparing", label: "Preparing",        detail: "Your food is on the flat-top." },
  { key: "out",       label: "Out for delivery", detail: "Rider is on the way." },
  { key: "delivered", label: "Delivered",        detail: "Enjoy your food!" },
];
