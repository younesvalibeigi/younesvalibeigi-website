/* ==========================================================================
   stimuli-config.js  -  everything the DorsalNet gallery needs.
   Edit this file to change folder names, colors, level count or loss values.
   ========================================================================== */

window.STIMULI_CONFIG = {
  // Where the stimulus folders live, relative to the page (project pages are two levels down: projects/dorsalnet/).
  basePath: "../../stimuli/",

  // Levels run 1 (noisiest) to maxLevel (closest to the optimum). Level 0 is the optimum pair.
  maxLevel: 25,

  // Levels 1-6 are the pairs that were shown to participants in the human experiment.
  humanLevels: [1, 2, 3, 4, 5, 6],

  // File naming inside each folder: level_<n>_basic_animation_<class>.gif
  fileName: function (level, classIndex) {
    return "level_" + level + "_basic_animation_" + classIndex + ".gif";
  },

  // Border colors from the paper figures. animation_0 = category 1, animation_1 = category 2.
  classes: [
    { label: "Category 1", color: "#91bfdb" },
    { label: "Category 2", color: "#fc8d59" }
  ],

  // Border opacity: noisiest level = minOpacity, level maxLevel = maxOpacity, optimum = 1.
  minOpacity: 0.2,
  maxOpacity: 0.95,
  borderWidth: 6,        // px, at the default stimulus size
  defaultSize: 64,       // px, side length of one stimulus

  layers: [
    {
      id: "res0",
      folder: "res0_Inhb_False_classifierPCA2__nex_2_var_22",
      color: "#a888c0",          // paper color for res0
      deepColor: "#783090",
      optimizationImage: "assets/img/dorsalnet/optimization_res0.png", // optimization curves (site image, not in the stimulus folder)
      // Loss reported for each level. Level 0 is the optimum pair's own objective.
      // Level 25 had no value in the HTML you sent; fill it in here if you have it.
      losses: {
      0: -66.52,
      1: 263.1,
      2: 254.09,
      3: 247.92,
      4: 242.64,
      5: 236.99,
      6: 231.02,
      7: 234.17,
      8: 228.86,
      9: 218.26,
      10: 210.35,
      11: 203.82,
      12: 198.61,
      13: 194.41,
      14: 188.67,
      15: 183.62,
      16: 183.41,
      17: 183.69,
      18: 170.34,
      19: 166.12,
      20: 162.09,
      21: 162.35,
      22: 158.75,
      23: 155.05,
      24: 160.43,
      25: null
      }
    },
    {
      id: "res2",
      folder: "res2_Inhb_False_classifierPCA2__nex_2_var_22",
      color: "#78b878",          // paper color for res2
      deepColor: "#008830",
      optimizationImage: "assets/img/dorsalnet/optimization_res2.png",
      losses: {
      0: -68.84,
      1: 296.06,
      2: 279.08,
      3: 269.59,
      4: 264.06,
      5: 263.18,
      6: 258.99,
      7: 248.76,
      8: 250.73,
      9: 237.65,
      10: 232.72,
      11: 229.64,
      12: 237.54,
      13: 234.02,
      14: 217.77,
      15: 213.69,
      16: 209.6,
      17: 210.94,
      18: 207.89,
      19: 214.49,
      20: 195.89,
      21: 191.75,
      22: 195.35,
      23: 185.43,
      24: 188.96,
      25: null
      }
    }
  ]
};
