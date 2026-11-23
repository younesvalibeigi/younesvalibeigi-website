/* ==========================================================================
   loss-chart.js  -  loss-per-level line chart plus the optimization image
   for each layer (assets/img/dorsalnet/optimization_res0.png and _res2.png).

   Mount point: <div data-loss="res0"></div>
   Chart data come from STIMULI_CONFIG.layers[].losses (levels 1..maxLevel).
   Level 0 (the optimum pair) is left out, because its
   value comes from a different objective and would squash the axis.
   ========================================================================== */

(function () {
  var C = window.STIMULI_CONFIG;
  if (!C) return;
  var NS = "http://www.w3.org/2000/svg";

  function svgEl(name, attrs) {
    var e = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  function buildChart(layer) {
    var W = 600, H = 300, m = { l: 56, r: 18, t: 18, b: 48 };
    var pw = W - m.l - m.r, ph = H - m.t - m.b;

    var pts = [];
    for (var lv = 1; lv <= C.maxLevel; lv++) {
      var v = layer.losses[lv];
      if (v !== null && v !== undefined) pts.push({ level: lv, loss: v });
    }
    var lo = Math.min.apply(null, pts.map(function (p) { return p.loss; }));
    var hi = Math.max.apply(null, pts.map(function (p) { return p.loss; }));
    var pad = (hi - lo) * 0.08;
    lo = Math.floor((lo - pad) / 10) * 10;
    hi = Math.ceil((hi + pad) / 10) * 10;

    function x(level) { return m.l + (level - 1) / (C.maxLevel - 1) * pw; }
    function y(loss) { return m.t + (1 - (loss - lo) / (hi - lo)) * ph; }

    var svg = svgEl("svg", { viewBox: "0 0 " + W + " " + H, role: "img",
      "aria-label": "Loss at each optimization level for " + layer.id });

    // shaded band for the levels shown to participants
    var hl = C.humanLevels;
    var bx = x(hl[0]) - 8, bw = x(hl[hl.length - 1]) - x(hl[0]) + 16;
    svg.appendChild(svgEl("rect", { class: "band", x: bx, y: m.t, width: bw, height: ph }));
    var bl = svgEl("text", { class: "band-label", x: bx + 4, y: m.t + 14 });
    bl.textContent = "shown to participants";
    svg.appendChild(bl);

    // y grid and labels
    var g = svgEl("g", { class: "grid" }), ax = svgEl("g", { class: "axis" });
    var step = (hi - lo) / 4;
    for (var i = 0; i <= 4; i++) {
      var val = lo + step * i, yy = y(val);
      g.appendChild(svgEl("line", { x1: m.l, x2: W - m.r, y1: yy, y2: yy }));
      var t = svgEl("text", { x: m.l - 8, y: yy + 4, "text-anchor": "end" });
      t.textContent = Math.round(val);
      ax.appendChild(t);
    }
    svg.appendChild(g);

    // x labels
    [1, 5, 10, 15, 20, C.maxLevel].forEach(function (lv) {
      var t = svgEl("text", { x: x(lv), y: H - m.b + 18, "text-anchor": "middle" });
      t.textContent = lv;
      ax.appendChild(t);
    });
    var xl = svgEl("text", { x: m.l + pw / 2, y: H - 6, "text-anchor": "middle" });
    xl.textContent = "Optimization level (1 = noisiest, " + C.maxLevel + " = closest to optimum)";
    ax.appendChild(xl);
    var yl = svgEl("text", { x: 14, y: m.t + ph / 2, "text-anchor": "middle",
      transform: "rotate(-90 14 " + (m.t + ph / 2) + ")" });
    yl.textContent = "Loss";
    ax.appendChild(yl);
    svg.appendChild(ax);

    // line (broken where a level has no value) and points
    var d = "", pen = false;
    for (var lv2 = 1; lv2 <= C.maxLevel; lv2++) {
      var val2 = layer.losses[lv2];
      if (val2 === null || val2 === undefined) { pen = false; continue; }
      d += (pen ? "L" : "M") + x(lv2).toFixed(1) + " " + y(val2).toFixed(1) + " ";
      pen = true;
    }
    svg.appendChild(svgEl("path", { class: "line", d: d }));
    pts.forEach(function (p) {
      var c = svgEl("circle", { class: "dot", cx: x(p.level), cy: y(p.loss), r: 3.6 });
      var tt = svgEl("title"); tt.textContent = "Level " + p.level + ": loss " + p.loss;
      c.appendChild(tt);
      svg.appendChild(c);
    });
    return svg;
  }

  function figure(layer, file, label, caption) {
    var path = file;
    var f = document.createElement("figure");
    f.className = "fig";
    f.innerHTML =
      '<div class="fig__frame"><img src="../' + path + '" alt="' + label + '" data-asset="' + path +
      '" data-label="' + label + '"></div><figcaption>' + caption + "</figcaption>";
    return f;
  }

  document.querySelectorAll("[data-loss]").forEach(function (mount) {
    var layer = C.layers.filter(function (l) { return l.id === mount.dataset.loss; })[0];
    if (!layer) return;

    var wrap = document.createElement("div");
    wrap.className = "losses";

    var chart = document.createElement("figure");
    chart.className = "loss-chart";
    chart.appendChild(buildChart(layer));
    var cap = document.createElement("figcaption");
    cap.textContent = "Loss at each optimization level.";
    chart.appendChild(cap);
    wrap.appendChild(chart);

    var imgs = document.createElement("div");
    imgs.className = "losses__images";
    imgs.appendChild(figure(layer, layer.optimizationImage, layer.id + " optimization curves",
      "<strong>Optimization.</strong> Loss in res0 and res2, and their total, over training epochs."));
    wrap.appendChild(imgs);

    mount.appendChild(wrap);
  });
})();
