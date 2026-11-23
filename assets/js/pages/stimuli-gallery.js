/* ==========================================================================
   stimuli-gallery.js  -  builds the stimulus gallery for each layer.
   Reads everything from window.STIMULI_CONFIG (assets/js/data/stimuli-config.js).

   Mount points in the HTML:
     <div data-gallery="res0"></div>          one gallery per layer id
     <input id="stim-size" type="range">      optional size slider
     <span data-class-color="0|1"></span>     optional legend swatches
   Order shown: optimum pair (level 0), then maxLevel down to level 1.
   ========================================================================== */

(function () {
  var C = window.STIMULI_CONFIG;
  if (!C) return;

  function rgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return "rgba(" + (n >> 16) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }

  // Border opacity: level 0 (optimum) = 1; level 1 (noisiest) = minOpacity; maxLevel = maxOpacity.
  function opacityFor(level) {
    if (level === 0) return 1;
    return C.minOpacity + (C.maxOpacity - C.minOpacity) * (level - 1) / (C.maxLevel - 1);
  }

  function makeStim(layer, level, classIndex) {
    var box = document.createElement("div");
    box.className = "stim";
    box.style.borderColor = rgba(C.classes[classIndex].color, opacityFor(level));

    var img = document.createElement("img");
    img.loading = "lazy";
    img.decoding = "async";
    img.src = C.basePath + layer.folder + "/" + C.fileName(level, classIndex);
    img.alt = layer.id + " level " + level + ", " + C.classes[classIndex].label;
    img.addEventListener("error", function () {
      box.classList.add("is-missing");
      box.textContent = "level " + level + " missing";
    });
    box.appendChild(img);
    return box;
  }

  function makePair(layer, level) {
    var pair = document.createElement("div");
    pair.className = "pair" + (level === 0 ? " pair--optimum" : "");

    var imgs = document.createElement("div");
    imgs.className = "pair__imgs";
    imgs.appendChild(makeStim(layer, level, 0));
    imgs.appendChild(makeStim(layer, level, 1));
    pair.appendChild(imgs);

    var name = document.createElement("div");
    name.className = "pair__name";
    name.textContent = level === 0 ? "Optimum pair" : "Level " + level;
    pair.appendChild(name);

    if (C.humanLevels.indexOf(level) !== -1) {
      var tag = document.createElement("span");
      tag.className = "pair__human";
      tag.textContent = "shown to participants";
      pair.appendChild(tag);
    }
    return pair;
  }

  // ----- Build each gallery -----
  document.querySelectorAll("[data-gallery]").forEach(function (mount) {
    var layer = C.layers.filter(function (l) { return l.id === mount.dataset.gallery; })[0];
    if (!layer) return;

    mount.classList.add("gallery");
    mount.style.setProperty("--stim-size", C.defaultSize + "px");
    mount.style.setProperty("--b", C.borderWidth + "px");

    var grid = document.createElement("div");
    grid.className = "gallery__grid";
    var order = [0];
    for (var l = C.maxLevel; l >= 1; l--) order.push(l);
    order.forEach(function (level) { grid.appendChild(makePair(layer, level)); });
    mount.appendChild(grid);
  });

  // ----- Size slider (applies to every gallery) -----
  var slider = document.getElementById("stim-size");
  if (slider) {
    slider.value = C.defaultSize;
    slider.addEventListener("input", function () {
      document.querySelectorAll("[data-gallery]").forEach(function (m) {
        m.style.setProperty("--stim-size", slider.value + "px");
      });
    });
  }

  // ----- Legend swatches -----
  document.querySelectorAll("[data-class-color]").forEach(function (s) {
    s.style.setProperty("--swatch", C.classes[Number(s.dataset.classColor)].color);
  });
  document.querySelectorAll("[data-fade-bar]").forEach(function (b) {
    var c = C.classes[Number(b.dataset.fadeBar)].color;
    b.style.background = "linear-gradient(90deg," + rgba(c, C.minOpacity) + "," + rgba(c, C.maxOpacity) + ")";
  });
})();
