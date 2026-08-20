import { JournalStore } from './store';

declare global {
  var __marketLabJournalStore: JournalStore | undefined;
}

export const journalStore =
  globalThis.__marketLabJournalStore ??
  (globalThis.__marketLabJournalStore = new JournalStore());
