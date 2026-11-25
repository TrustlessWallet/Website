(() => {
  if (!window.HTMLDialogElement || !HTMLDialogElement.prototype.showModal) return;

  const labels = {
    en: ["Enlarge screenshot", "Close"],
    it: ["Ingrandisci schermata", "Chiudi"],
    es: ["Ampliar captura", "Cerrar"]
  }[document.documentElement.lang];
  const dialog = document.createElement("dialog");
  dialog.className = "screen-viewer";
  const close = document.createElement("button");
  close.type = "button";
  close.textContent = labels[1];
  const full = document.createElement("img");
  dialog.append(close, full);
  document.body.append(dialog);
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });

  const selectors = ".story-shot img, .sale-screen img, .signing-shot img, .field-photos img";
  document.querySelectorAll(selectors).forEach(image => {
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "screen-expand";
    trigger.setAttribute("aria-label", labels[0] + " · " + image.alt);
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.title = labels[0];
    image.replaceWith(trigger);
    trigger.append(image);
    trigger.addEventListener("click", () => {
      full.src = image.currentSrc || image.src;
      full.alt = image.alt;
      dialog.setAttribute("aria-label", image.alt);
      dialog.showModal();
    });
  });
})();
