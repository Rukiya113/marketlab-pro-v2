import type { CanonicalInstrumentId } from '@/lib/market/events';
import {
  captureIntelligencePayload,
  capturePaperSnapshot,
} from '@/lib/journal/capture';
import { paperBroker } from '@/lib/paper/singleton';
import { settingsStore } from '@/lib/settings/singleton';

export function captureRuntimeIntelligence(
  instrumentId: CanonicalInstrumentId,
  payload: unknown,
): void {
  if (!settingsStore.get().settings.system.journalCaptureEnabled) return;
  captureIntelligencePayload(instrumentId, payload);
}

export function captureRuntimePaperState(): void {
  if (!settingsStore.get().settings.system.journalCaptureEnabled) return;
  capturePaperSnapshot(paperBroker.snapshot());
}
