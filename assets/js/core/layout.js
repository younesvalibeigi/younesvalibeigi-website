/* ==========================================================================
   layout.js  -  builds the navigation and footer on every page and fills in
   data-link hrefs from SITE.links. Each page sets on <body>:
     data-root="../"   (path back to the site root; "" for index.html)
     data-page="home|cardiac|dorsalnet|v4"
   ========================================================================== */

(function () {
  var body = document.body;
  var root = body.dataset.root || "";
  var current = body.dataset.page;

  // ----- Navigation -----
  var nav = document.createElement("header");
  nav.className = "nav";
  var items = SITE.nav.map(function (n) {
    var isCur = n.id === current || (n.children && n.children.indexOf(current) > -1);
    var cur = isCur ? ' aria-current="page"' : "";
    return '<li><a href="' + root + n.href + '"' + cur + ">" + n.label + "</a></li>";
  }).join("");
  nav.innerHTML =
    '<div class="wrap nav__bar">' +
      '<a class="nav__brand" href="' + root + './">' + SITE.name + "</a>" +
      '<button class="nav__toggle" type="button" aria-expanded="false" aria-controls="nav-links">Menu</button>' +
      '<ul class="nav__links" id="nav-links">' + items + "</ul>" +
    "</div>";
  var page = document.querySelector(".page");
  page.insertBefore(nav, page.firstChild);

  var toggle = nav.querySelector(".nav__toggle");
  var links = nav.querySelector(".nav__links");
  toggle.addEventListener("click", function () {
    var open = links.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  // ----- Footer -----
  var year = new Date().getFullYear();
  var footer = document.createElement("footer");
  footer.className = "footer";
  footer.innerHTML =
    '<div class="wrap footer__row">' +
      "<span>" + SITE.name + ", PhD candidate, McGill University and the Montreal Neurological Institute</span>" +
      '<span class="footer__links">' +
        '<a href="' + SITE.links.linkedin + '" target="_blank" rel="noopener">LinkedIn</a>' +
        '<a href="' + SITE.links.github + '" target="_blank" rel="noopener">GitHub</a>' +
        '<a href="' + SITE.links.email + '">Email</a>' +
      "</span>" +
      "<span>&copy; " + year + "</span>" +
    "</div>";
  page.appendChild(footer);

  // ----- data-link hrefs -----
  document.querySelectorAll("a[data-link]").forEach(function (a) {
    var url = SITE.links[a.dataset.link];
    if (url) {
      a.href = url;
      if (url.indexOf("http") === 0) { a.target = "_blank"; a.rel = "noopener"; }
    }
  });

  // ----- Opening the site straight from a folder (file://) -----
  // Browsers only open a folder's index.html automatically on a web server.
  // Online, links like "projects/" are enough. From a file, add index.html.
  if (location.protocol === "file:") {
    document.querySelectorAll("a[href]").forEach(function (a) {
      var h = a.getAttribute("href");
      if (/^(https?:|mailto:|#)/.test(h)) return;
      if (h.slice(-1) === "/") a.setAttribute("href", h + "index.html");
    });
  }
})();
