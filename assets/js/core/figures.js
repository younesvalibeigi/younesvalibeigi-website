/* ==========================================================================
   figures.js  -  small helpers shared by all pages:
   1. img[data-asset]  : if the file is missing, show a dashed slot that tells
                         you exactly where to save it.
   2. .fig__frame img  : click to enlarge.
   3. .code button     : copy the code block.
   ========================================================================== */

(function () {
  // ----- 1. Missing-image slots -----
  function showSlot(img) {
    var slot = document.createElement("div");
    slot.className = "slot";
    var path = img.dataset.asset;
    slot.innerHTML = "<strong>" + (img.dataset.label || "Image goes here") + "</strong>" +
                     "<span>Save the file as</span><code>" + path + "</code>";
    img.replaceWith(slot);
  }
  document.querySelectorAll("img[data-asset]").forEach(function (img) {
    img.addEventListener("error", function () { showSlot(img); });
    if (img.complete && img.naturalWidth === 0) showSlot(img);
  });

  // ----- 2. Lightbox -----
  var box = document.createElement("div");
  box.className = "lightbox";
  box.innerHTML = "<img alt=''>";
  document.body.appendChild(box);
  var boxImg = box.querySelector("img");
  function close() { box.classList.remove("is-open"); }
  box.addEventListener("click", close);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  document.querySelectorAll(".fig__frame img").forEach(function (img) {
    img.addEventListener("click", function () {
      boxImg.src = img.src; boxImg.alt = img.alt; box.classList.add("is-open");
    });
  });

  // ----- 3. Copy buttons -----
  document.querySelectorAll(".code button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.parentElement.querySelector("pre").innerText;
      if (navigator.clipboard) navigator.clipboard.writeText(text);
      btn.textContent = "Copied";
      setTimeout(function () { btn.textContent = "Copy"; }, 1400);
    });
  });
})();
