/* ==========================================================================
   sim-embed.js  -  loads the two live simulations on the cardiac page.

   Each simulation is a small page (assets/sim/ca2d and assets/sim/ca3d) shown
   in an <iframe data-sim="...">. This script
     - loads an iframe only when it is close to the screen,
     - resizes it to the height the simulation reports,
     (The simulations carry their own shaders and images, so they also run
       when the site is opened straight from disk.)
   ========================================================================== */

(function () {
  var frames = [].slice.call(document.querySelectorAll("iframe[data-sim]"));
  if (!frames.length) return;

  function load(f) {
    if (f.getAttribute("src")) return;
    f.setAttribute("src", f.dataset.sim);
  }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { load(e.target); io.unobserve(e.target); }
      });
    }, { rootMargin: "300px" });
    frames.forEach(function (f) { io.observe(f); });
  } else {
    frames.forEach(load);
  }

  // The simulation pages tell us how tall they are.
  window.addEventListener("message", function (e) {
    var d = e.data;
    if (!d || d.type !== "sim-height") return;
    frames.forEach(function (f) {
      if (f.contentWindow === e.source) f.style.height = d.height + "px";
    });
  });
})();
