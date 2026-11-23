/* ==========================================================================
   sim-page.js  -  small helper shared by the two simulation pages.
   (AMD module, loaded through require.js as 'SimPage'.)

   What it does:
     noStats          a stand-in for the FPS counter the original code used
     mountPanel(p)    puts a dat.GUI control panel into <div id="panel"> beside the canvas
     watchVisible(el) tells the simulation whether it is on screen, so it pauses off screen
     reportHeight()   tells the parent page how tall this page is (the page resizes the iframe)
   ========================================================================== */
define([], function () {
  var api = {};

  api.noStats = { update: function () {}, domElement: document.createElement("div") };

  api.mountPanel = function (panel, id) {
    document.getElementById(id || "panel").appendChild(panel.domElement);
  };

  // Calls cb(true/false) when the element enters or leaves the screen (or the tab is hidden).
  api.watchVisible = function (el, cb) {
    var inView = true, tabOn = true;
    function emit() { cb(inView && tabOn); }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[entries.length - 1].isIntersecting; emit();
      }, { threshold: 0.02 }).observe(el);
    }
    document.addEventListener("visibilitychange", function () { tabOn = !document.hidden; emit(); });
  };

  api.reportHeight = function () {
    var root = document.querySelector(".sim");
    function send() {
      var h = Math.ceil(root.getBoundingClientRect().height) + 12;
      if (window.parent !== window) window.parent.postMessage({ type: "sim-height", name: window.name, height: h }, "*");
    }
    if ("ResizeObserver" in window) new ResizeObserver(send).observe(root);
    window.addEventListener("load", send);
    send();
  };

  return api;
});
