import { DEFAULT_SETTINGS } from './defaults';
import { normalizeSettings } from './validate';
import type { MarketLabSettings, SettingsEnvelope } from './types';

export class SettingsStore {
  private settings: MarketLabSettings = structuredClone(DEFAULT_SETTINGS);
  private updatedAt = Date.now();
  private source: SettingsEnvelope['source'] = 'DEFAULT';

  get(): SettingsEnvelope {
    return {
      settings: structuredClone(this.settings),
      updatedAt: this.updatedAt,
      source: this.source,
    };
  }

  set(value: Partial<MarketLabSettings>): SettingsEnvelope {
    this.settings = normalizeSettings(value);
    this.updatedAt = Date.now();
    this.source = 'MEMORY';
    return this.get();
  }

  reset(): SettingsEnvelope {
    this.settings = structuredClone(DEFAULT_SETTINGS);
    this.updatedAt = Date.now();
    this.source = 'DEFAULT';
    return this.get();
  }
}
