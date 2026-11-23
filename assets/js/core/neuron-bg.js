/* ==========================================================================
   neuron-bg.js  -  glowing neurons with branching dendrites behind the page.

   Each neuron is drawn once into a small image (a "sprite"): a cell body,
   several branching dendrites and one longer axon with terminal dots. The
   sprites then drift and rotate very slowly, and now and then a spike travels
   along a branch and makes the cell body flash.

   Things you can tweak (top of the file):
     COLORS       neon palette
     DENSITY      neurons per pixel of screen area (smaller = more neurons)
     MAX_NEURONS  upper limit on big screens
     DRIFT        drift speed in px per frame
   ========================================================================== */

(function () {
  var canvas = document.getElementById("neuron-bg");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");

  var COLORS = ["#1de9f0", "#3d7bff", "#b44dff", "#ff7b1c", "#ffd21a"];
  var DENSITY = 1 / 95000;
  var MIN_NEURONS = 5;
  var MAX_NEURONS = 16;
  var DRIFT = 0.07;
  var SPIN = 0.00012;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var w, h, neurons = [], pulses = [], running = true;

  function rnd(a, b) { return a + Math.random() * (b - a); }

  function hexA(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return "rgba(" + (n >> 16) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }

  /* ---- build one neuron image ---------------------------------------- */
  function buildNeuron(color, R) {
    var sc = Math.min(window.devicePixelRatio || 1, 1.5);
    var sprite = document.createElement("canvas");
    sprite.width = sprite.height = Math.ceil(2 * R * sc);
    var g = sprite.getContext("2d");
    g.scale(sc, sc);
    g.translate(R, R);
    g.lineCap = "round";

    var paths = [];   // polylines from the cell body out to each tip (used for spikes)

    // one branch: draws a curved segment, then splits into smaller branches
    function grow(x, y, ang, len, wd, depth, trail, forkChance) {
      var bend = rnd(-0.6, 0.6);
      var cx = x + Math.cos(ang) * len * 0.55, cy = y + Math.sin(ang) * len * 0.55;
      var ang2 = ang + bend;
      var ex = x + Math.cos(ang2) * len, ey = y + Math.sin(ang2) * len;

      g.strokeStyle = hexA(color, 0.78);
      g.shadowColor = color; g.shadowBlur = 7;
      g.lineWidth = Math.max(wd, 0.6);
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(cx, cy, ex, ey); g.stroke();

      trail.push({ x: cx, y: cy }, { x: ex, y: ey });

      var stop = depth <= 0 || len < 7 || (depth <= 2 && Math.random() < 0.22);
      if (stop) {
        // terminal dot
        g.shadowBlur = 8; g.fillStyle = hexA(color, 0.9);
        g.beginPath(); g.arc(ex, ey, Math.max(wd * 0.9, 1.2), 0, Math.PI * 2); g.fill();
        paths.push(trail);
        return;
      }
      var kids = Math.random() < forkChance ? 3 : 2;
      for (var k = 0; k < kids; k++) {
        var spread = kids === 2 ? (k === 0 ? -1 : 1) * rnd(0.35, 0.8) : (k - 1) * rnd(0.5, 0.8);
        grow(ex, ey, ang2 + spread, len * rnd(0.72, 0.88), wd * 0.74, depth - 1, trail.slice(), forkChance);
      }
    }

    // dendrites: evenly spread around the cell body with some jitter
    var n = Math.round(rnd(5, 8));
    var base = rnd(0, Math.PI * 2);
    for (var i = 0; i < n; i++) {
      var a = base + (i / n) * Math.PI * 2 + rnd(-0.25, 0.25);
      grow(Math.cos(a) * 7, Math.sin(a) * 7, a, R * rnd(0.20, 0.28), rnd(2.4, 3.2), 4, [{ x: 0, y: 0 }], 0.2);
    }
    // axon: longer, thinner, forks only a little
    var ax = base + Math.PI / n + rnd(-0.3, 0.3);
    grow(Math.cos(ax) * 7, Math.sin(ax) * 7, ax, R * 0.36, 1.7, 2, [{ x: 0, y: 0 }], 0.05);

    // cell body: soft halo, body, bright core
    g.shadowBlur = 0;
    var halo = g.createRadialGradient(0, 0, 2, 0, 0, 30);
    halo.addColorStop(0, hexA(color, 0.35)); halo.addColorStop(1, hexA(color, 0));
    g.fillStyle = halo; g.beginPath(); g.arc(0, 0, 30, 0, Math.PI * 2); g.fill();

    g.shadowColor = color; g.shadowBlur = 18;
    var body = g.createRadialGradient(0, 0, 0, 0, 0, 9);
    body.addColorStop(0, "rgba(255,255,255,0.95)");
    body.addColorStop(0.45, hexA(color, 0.95));
    body.addColorStop(1, hexA(color, 0.55));
    g.fillStyle = body; g.beginPath(); g.arc(0, 0, 8.5, 0, Math.PI * 2); g.fill();

    return { sprite: sprite, paths: paths };
  }

  /* ---- scene ---------------------------------------------------------- */
  function resize() {
    w = window.innerWidth; h = window.innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var count = Math.max(MIN_NEURONS, Math.min(MAX_NEURONS, Math.round(w * h * DENSITY)));
    var baseR = Math.max(150, Math.min(230, Math.min(w, h) * 0.34));
    neurons = []; pulses = [];
    for (var i = 0; i < count; i++) {
      var depth = rnd(0.45, 1);                 // smaller and fainter = farther away
      var color = COLORS[i % COLORS.length];
      var R = baseR;
      var built = buildNeuron(color, R);
      var a = Math.random() * Math.PI * 2;
      neurons.push({
        sprite: built.sprite, paths: built.paths, color: color, R: R,
        x: rnd(0, w), y: rnd(0, h),
        vx: Math.cos(a) * DRIFT * depth, vy: Math.sin(a) * DRIFT * depth,
        ang: Math.random() * Math.PI * 2, spin: rnd(-1, 1) * SPIN,
        scale: depth, alpha: 0.35 + depth * 0.55, flash: 0
      });
    }
    // draw far ones first
    neurons.sort(function (p, q) { return p.scale - q.scale; });
  }

  function toScreen(nr, p) {
    var c = Math.cos(nr.ang), s = Math.sin(nr.ang);
    return { x: nr.x + (p.x * c - p.y * s) * nr.scale, y: nr.y + (p.x * s + p.y * c) * nr.scale };
  }

  function startPulse() {
    var nr = neurons[Math.floor(Math.random() * neurons.length)];
    if (!nr.paths.length) return;
    var path = nr.paths[Math.floor(Math.random() * nr.paths.length)];
    var inward = Math.random() < 0.7;           // tips toward the cell body, like a dendrite input
    pulses.push({ nr: nr, pts: inward ? path.slice().reverse() : path.slice(), pos: 0, inward: inward });
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);

    neurons.forEach(function (nr) {
      ctx.save();
      ctx.globalAlpha = nr.alpha;
      ctx.translate(nr.x, nr.y);
      ctx.rotate(nr.ang);
      ctx.scale(nr.scale, nr.scale);
      ctx.drawImage(nr.sprite, -nr.R, -nr.R, nr.R * 2, nr.R * 2);
      ctx.restore();

      if (nr.flash > 0.02) {
        var g = ctx.createRadialGradient(nr.x, nr.y, 0, nr.x, nr.y, 46 * nr.scale);
        g.addColorStop(0, hexA(nr.color, 0.75 * nr.flash)); g.addColorStop(1, hexA(nr.color, 0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(nr.x, nr.y, 46 * nr.scale, 0, Math.PI * 2); ctx.fill();
        nr.flash *= 0.94;
      }

      if (!reduceMotion) {
        nr.x += nr.vx; nr.y += nr.vy; nr.ang += nr.spin;
        var m = nr.R * nr.scale;
        if (nr.x < -m) nr.x = w + m; if (nr.x > w + m) nr.x = -m;
        if (nr.y < -m) nr.y = h + m; if (nr.y > h + m) nr.y = -m;
      }
    });

    if (!reduceMotion) {
      if (pulses.length < 6 && Math.random() < 0.035) startPulse();
      pulses = pulses.filter(function (p) { return p.pos < p.pts.length - 1; });
      pulses.forEach(function (p) {
        p.pos += 0.22;
        var i = Math.min(Math.floor(p.pos), p.pts.length - 2), f = p.pos - i;
        var a = p.pts[i], b = p.pts[i + 1];
        var s = toScreen(p.nr, { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f });
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.shadowColor = p.nr.color; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.arc(s.x, s.y, 2.2 * p.nr.scale + 0.6, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        if (p.pos >= p.pts.length - 2 && p.inward) p.nr.flash = 1;
      });
    }
  }

  var looping = false;
  function loop() {
    if (!running || reduceMotion) { looping = false; return; }
    frame();
    requestAnimationFrame(loop);
  }
  function start() { if (!looping && !reduceMotion) { looping = true; requestAnimationFrame(loop); } }

  resize();
  frame();
  start();

  // Rebuild only when the width changes or the height changes a lot, so the
  // phone address bar sliding in and out while scrolling does not reshuffle the cells.
  var lastW = w, lastH = h;
  window.addEventListener("resize", function () {
    if (window.innerWidth === lastW && Math.abs(window.innerHeight - lastH) < 160) return;
    lastW = window.innerWidth; lastH = window.innerHeight;
    resize();
    if (reduceMotion) frame();
  });
  document.addEventListener("visibilitychange", function () {
    running = !document.hidden;
    if (running) start();
  });
})();
