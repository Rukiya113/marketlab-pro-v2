import { settingsStore } from '@/lib/settings/singleton';
import type { RuntimePolicy } from './contracts';

export function getRuntimePolicy(): RuntimePolicy {
  const settings = settingsStore.get().settings;

  return {
    asura: settings.asura,
    sentinel: settings.sentinel,
    portfolio: settings.portfolio,
    options: settings.options,
    paper: settings.paper,
    system: settings.system,
  };
}
