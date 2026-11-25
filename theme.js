(() => {
  const root = document.documentElement;
  const storageKey = "trustless-site-theme";
  let preferred = matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === "light" || saved === "dark") preferred = saved;
  } catch { /* The theme still works when browser storage is unavailable. */ }
  const buttons = document.querySelectorAll(".theme-switch");
  function apply(theme) {
    root.dataset.theme = theme;
    buttons.forEach(button => {
      const labels = { en: ["Use light theme", "Use dark theme"], it: ["Tema chiaro", "Tema scuro"], es: ["Tema claro", "Tema oscuro"] }[root.lang];
      button.textContent = labels[theme === "dark" ? 0 : 1];
      button.hidden = false;
    });
  }
  apply(preferred);
  const picker = document.querySelector(".locale-picker");
  if (picker) {
    document.addEventListener("click", event => {
      if (!picker.contains(event.target)) picker.open = false;
    });
    picker.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        picker.open = false;
        picker.querySelector("summary").focus();
      }
    });
    picker.querySelectorAll("a").forEach(link => {
      if (location.hash) link.hash = location.hash;
    });
  }
  buttons.forEach(button => button.addEventListener("click", () => {
    const theme = root.dataset.theme === "dark" ? "light" : "dark";
    apply(theme);
    try { localStorage.setItem(storageKey, theme); } catch { /* Session-only preference. */ }
  }));
})();
