//Shared confirm modal - resolves true only when the dialog's "confirm" button is pressed.
//Escape, Cancel, or clicking the backdrop all resolve false.
const confirmDialog = (dialog) => new Promise((resolve) => {
  if (!dialog.dataset.ready) {
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) dialog.close();
    });
    dialog.dataset.ready = "true";
  }
  dialog.returnValue = "";
  dialog.addEventListener("close", () => resolve(dialog.returnValue === "confirm"), { once: true });
  dialog.showModal();
});

export { confirmDialog };
