/* ==========================================================================
   image-inline.js  -  replaces the original 'image!' loader.

   Images (colormaps, the heart's shape) are stored as data: addresses in
   window.SIM_ASSETS.images. Unlike image files on disk, these can be used as
   WebGL textures when the page is opened straight from disk.

   Usage stays the same:  define(['image!./structure.png'], function (img) { ... })
   ========================================================================== */
define({
  load: function (name, req, onload) {
    var A = window.SIM_ASSETS && window.SIM_ASSETS.images;
    // require.js turns './structure.png' into 'app/structure.png' and './colormaps/x.png'
    // into 'Abubu/colormaps/x.png', so strip those folder prefixes to find the entry.
    var key = name.replace(/^\.\//, "").replace(/^(Abubu|app)\//, "");
    var src = A && A[key];
    if (!src) {
      var err = new Error("Image not found in SIM_ASSETS: " + key + " (run tools/build_sim_assets.py)");
      if (onload.error) onload.error(err); else throw err;
      return;
    }
    var img = new Image();
    img.onload = function () { onload(img); };
    img.onerror = function () { if (onload.error) onload.error(new Error("Could not decode image " + key)); };
    img.src = src;
  }
});
