/* ==========================================================================
   Tiny hash router. No dependency, works on GitHub Pages with no server
   config since everything after the # is client-side only.
   ========================================================================== */

const routes = new Map();
let outlet = null;
let currentCleanup = null;

export function registerRoute(path, renderFn) {
  routes.set(path, renderFn);
}

export function setOutlet(el) {
  outlet = el;
}

export function navigate(path) {
  if (location.hash === path) {
    render();
  } else {
    location.hash = path;
  }
}

function currentPath() {
  const hash = location.hash || "#/";
  return routes.has(hash) ? hash : "#/";
}

function render() {
  if (typeof currentCleanup === "function") {
    currentCleanup();
    currentCleanup = null;
  }

  const path = currentPath();
  const renderFn = routes.get(path);
  if (outlet && renderFn) {
    outlet.innerHTML = "";
    // A view's render function may return a cleanup callback (unsubscribe
    // from the store, clear timers) that runs right before the next
    // navigation, so views never leak listeners into each other.
    currentCleanup = renderFn(outlet);
    outlet.scrollIntoView({ behavior: "instant", block: "start" });
    window.scrollTo({ top: 0 });
  }
}

export function startRouter() {
  window.addEventListener("hashchange", render);
  render();
}
