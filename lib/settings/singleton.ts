import { SettingsStore } from './store';

declare global {
  var __marketLabSettingsStore: SettingsStore | undefined;
}

export const settingsStore =
  globalThis.__marketLabSettingsStore ??
  (globalThis.__marketLabSettingsStore = new SettingsStore());
