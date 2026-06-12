// Save management helpers, shared by the title screen and pause menu.
const SAVE_KEYS = ['tmb-progression', 'tmb-hub', 'tmb-profile'];

export function hasSave(): boolean {
  return SAVE_KEYS.some((k) => localStorage.getItem(k) !== null);
}

export function wipeSaveAndReload() {
  for (const k of SAVE_KEYS) localStorage.removeItem(k);
  window.location.reload();
}
