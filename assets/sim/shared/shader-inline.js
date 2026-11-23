/* ==========================================================================
   shader-inline.js  -  replaces the original 'shader!' loader.

   The original loader fetched each .frag/.vert file over the network, which a
   page opened from disk (file://) cannot do. This version reads the shader
   text from window.SIM_ASSETS.shaders, which is filled by assets-common.js and
   app/assets.js (made by tools/build_sim_assets.py).

   Usage stays the same:  define(['shader!compShader.frag'], function (src) { src.value ... })
   ========================================================================== */
define({
  load: function (name, req, onload) {
    var A = window.SIM_ASSETS && window.SIM_ASSETS.shaders;
    var text = A && A[name];
    if (typeof text !== "string") {
      var err = new Error("Shader not found in SIM_ASSETS: " + name + " (run tools/build_sim_assets.py)");
      if (onload.error) onload.error(err); else throw err;
      return;
    }
    function Shader(value) { this.value = value; }
    // same helper as the original loader: set or add a #define line
    Shader.prototype.define = function (def, value) {
      var regexp = new RegExp("#define " + def + " .*", "g");
      var line = "#define " + def + (value ? " " + value : "");
      if (this.value.match(regexp)) this.value = this.value.replace(regexp, line);
      else this.value = line + "\n" + this.value;
    };
    onload(new Shader(text));
  }
});
