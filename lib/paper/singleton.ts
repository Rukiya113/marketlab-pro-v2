import { PaperBroker } from './broker';

declare global {
  // eslint-disable-next-line no-var
  var __marketLabPaperBroker: PaperBroker | undefined;
}

export const paperBroker =
  globalThis.__marketLabPaperBroker ??
  (globalThis.__marketLabPaperBroker = new PaperBroker());
