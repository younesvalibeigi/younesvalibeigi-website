/* ==========================================================================
   site-config.js  -  links and navigation used on every page.
   Any <a data-link="name"> in the HTML gets its href from SITE.links below,
   so a repository link only has to change here.
   ========================================================================== */

window.SITE = {
  name: "Younes Valibeigi",
  shortName: "YV",

  links: {
    linkedin: "https://www.linkedin.com/in/younes-valibeigi/",
    github: "https://github.com/younesvalibeigi",
    email: "mailto:younes.valibeigi@mail.mcgill.ca",

    cardiacPaper: "https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1014590",
    cardiacRepo: "https://github.com/younesvalibeigi/Coupled-Cardiac-System",

    // Temporary repository. Replace when the cleaned-up version is ready.
    dorsalnetRepo: "https://github.com/younesvalibeigi/VPL_DorsalNet",
    
    dorsalnetData: "https://github.com/younesvalibeigi/younesvalibeigi-website/releases/download/paper-data-v1/Paper_Data.zip",

    behaviorRepo: "https://github.com/younesvalibeigi/Behavior_MonkeyLogic"
  },

  // Paths are relative to the site root; layout.js adds "../" on inner pages.
  nav: [
  { id: "home", label: "About", href: "./" },
  { id: "projects", label: "Projects", href: "projects/",
    children: ["cardiac", "dorsalnet", "v4"] }
]
};
