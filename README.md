# Younes Valibeigi: personal and research website

Plain HTML, CSS and JavaScript. No build step, no installs. Four pages:

| Page | File |
|---|---|
| Home (About, short CV) | `index.html` |
| Cardiac closed loop (PLOS Comp Bio 2026) | `projects/cardiac/index.html` |
| Synthesized stimuli (DorsalNet) | `projects/dorsalnet/index.html` |
| V4 microstimulation and in vivo closed loop | `projects/v4/index.html` |

## 1. Run it on your computer

No server and no install. Double-click `index.html` and the site opens in your browser, simulations included. (A local server also works: `python3 -m http.server`, then open http://localhost:8000.)

The simulations need WebGL 2, which current Chrome, Edge, Firefox and Safari have.

## 2. Folder map

```
index.html
projects/                   projects hub; projects/cardiac, projects/dorsalnet, projects/v4 (each folder has an index.html)
assets/
  css/
    base.css                colors, fonts, type scale   (edit colors here)
    layout.css              nav, hero, sections, footer
    components.css          buttons, figures, timeline, tables, code blocks
    stimuli.css             DorsalNet gallery styling
  js/
    data/site-config.js     links (LinkedIn, GitHub, email, repos) and the nav menu
    data/stimuli-config.js  folder names, colors, levels, loss values
    core/                   nav/footer, neuron background (neuron-bg.js), lightbox
    pages/                  gallery and loss chart code, and sim-embed.js (loads the simulations)
  sim/                      the two live simulations (see section 6)
  img/
    banner/hero-banner.png  your banner (already in place)
    cardiac/                Fig 1, 2, 3, 6 (already in place)
    dorsalnet/              PCA figures and the two optimization curves (in place)
    invivo/                 V4 page images: task, monopolar vs bipolar, domains, closed loop (in place)
stimuli/                    YOU ADD: the two stimulus folders
```

## 3. Images already in place

Nothing to add. To swap an image, overwrite the file keeping the same name:

| File | Where it shows |
|---|---|
| `assets/img/banner/hero-banner.png` | Home page banner |
| `assets/img/cardiac/fig1_concept.png`, `fig2_system_overview.png`, `fig3_ca_model.png`, `fig6_optical_setup.png` | Cardiac page |
| `assets/img/dorsalnet/pca_res0.png`, `pca_res2.png` | DorsalNet page, activation-space figures |
| `assets/img/dorsalnet/optimization_res0.png`, `optimization_res2.png` | DorsalNet page, optimization curves next to each loss chart |
| `assets/img/invivo/task_dms.png`, `monopolar_vs_bipolar.png`, `domain_selectivity.png` | V4 page, the three images at the top |
| `assets/img/invivo/closed_loop_generative.png` | V4 page, closed-loop figure |

If an image file is missing, the page shows a dashed slot naming the file to save.

## 4. Stimulus folders (DorsalNet page)

Copy your two folders into `stimuli/`, keeping the names:

```
stimuli/res0_Inhb_False_classifierPCA2__nex_2_var_22/
stimuli/res2_Inhb_False_classifierPCA2__nex_2_var_22/
```

Each folder needs only the GIFs (the loss values and curves are drawn from `stimuli-config.js` and the images above):

- `level_0_basic_animation_0.gif` and `level_0_basic_animation_1.gif` (optimum pair)
- `level_1_...` through `level_25_basic_animation_0.gif` / `_1.gif`

Display order is optimum, then level 25 down to level 1. Border colors: category 1 `#91bfdb`, category 2 `#fc8d59`, fading to 0.2 opacity at level 1. Levels 1 to 6 are tagged as shown to participants. Missing files show a labeled empty tile, so a partial upload does not break the page.

To change anything (folder names, number of levels, colors, opacity range, tile size, the loss chart values), edit `assets/js/data/stimuli-config.js`. Level 25 has no loss value in the source file, so it is `null` and is skipped in the chart.

The animated background of branching neurons is `assets/js/core/neuron-bg.js`. Its settings (colors, number of neurons, speed) are at the top of the file. It stands still if the visitor's device asks for reduced motion.

## 5. Editing text and links

- Links (LinkedIn, GitHub, email, repositories, paper): `assets/js/data/site-config.js`. Change a link once and it updates on every page.
- Page text: edit the HTML in each page. Sections are marked with comments.
- DorsalNet repository link (VPL_DorsalNet): `dorsalnetRepo` in `site-config.js`.
- Colors: `assets/css/base.css`, the `:root` block. Each page has its own accent through `data-accent` on `<body>`.

## 6. Live simulations (cardiac page)

Under "The model is swappable" the cardiac page shows two live simulations, each with its control bar beside the canvas. Each one is a small page of its own, shown in an iframe:

```
assets/sim/
  shared/            library used by both: Abubu/ (GPU framework, colormaps), require.js,
                     assets-common.js (packed shaders and colormaps), shader-inline.js and
                     image-inline.js (read those packed assets), sim-page.js and sim-page.css
  ca2d/              2D tissue: index.html, app/main.js (model and controls), app/shaders/ (GPU code), app/assets.js
  ca3d/              3D heart:  index.html, app/main.js, app/shaders/, app/structure.png (heart shape), app/assets.js
tools/build_sim_assets.py     packs shaders and images into the assets*.js files
```

**Why no server is needed.** Your original code loaded each shader and image file over the network, which a page opened from disk cannot do. The shaders and images are now packed into script files (`assets-common.js`, `app/assets.js`), and the two small loaders `shader-inline.js` and `image-inline.js` read from those. Your `main.js` files and the Abubu library are otherwise unchanged.

**After you edit a shader** (a `.frag` or `.vert` file) or replace `structure.png` or a colormap, run this once from the site folder, then reload:

```
python3 tools/build_sim_assets.py
```

Model numbers (radius, threshold, grid size, colors, default speed) are at the top of each `app/main.js`; those need no rebuild.

- Open `assets/sim/ca2d/index.html` or `assets/sim/ca3d/index.html` directly to run one on its own.
- The iframes are in `projects/cardiac/index.html` (search for `try-it`). The loader is `assets/js/pages/sim-embed.js`. An iframe only starts loading when it is close to the screen, and a simulation pauses while it is off screen.
- Changes made to your original code: control bar placed beside the canvas, FPS counter removed, a "Draw" menu and a "Clear blocks" button added (so blocks work on a phone, where there is no Shift key), touch support in 2D, mouse-wheel zoom off by default in 3D (so the page still scrolls), one starting wave, and click positions measured from the canvas's drawn size (in `shared/Abubu/Abubu.js`, marked "Website patch").
- Where WebGL 2 is missing, the panel says so instead of showing a blank box.

## 7. Publish on GitHub Pages

1. Create a repository named `younesvalibeigi.github.io` and upload everything in this folder (with your stimuli added).
2. Settings, Pages, deploy from the `main` branch, root folder.
3. The site appears at https://younesvalibeigi.github.io.

Stimulus GIFs can add up. GitHub allows repositories up to a few GB, but keep an eye on size (2 x 26 pairs of GIFs).

## 8. Notes

- Fonts (Bricolage Grotesque, Source Serif 4) load from Google Fonts, so they need an internet connection. Offline, the site falls back to system fonts.
- Unpublished work (DorsalNet, V4) is described in plain language only, with no results.
- The Behavior_MonkeyLogic repository link may point to a private repository; check it before publishing.
