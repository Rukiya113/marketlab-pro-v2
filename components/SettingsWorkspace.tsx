'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { DEFAULT_SETTINGS } from '@/lib/settings/defaults';
import type {
  MarketLabSettings,
  SettingsEnvelope,
} from '@/lib/settings/types';

import styles from './SettingsWorkspace.module.css';
import { useTheme } from './ThemeProvider';

type NumericSection =
  | 'asura'
  | 'sentinel'
  | 'portfolio'
  | 'options'
  | 'paper';

export default function SettingsWorkspace() {
  const [settings, setSettings] =
    useState<MarketLabSettings>(() => structuredClone(DEFAULT_SETTINGS));

  const [message, setMessage] = useState(
    'Safe local defaults active. Synchronizing runtime settings…',
  );

  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const { setTheme } = useTheme();

  useEffect(() => {
    const controller = new AbortController();

    async function hydrate() {
      try {
        const response = await fetch('/api/settings', {
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Settings API returned ${response.status}`);
        }

        const data = (await response.json()) as SettingsEnvelope;

        setSettings(data.settings);
        setTheme(data.settings.general.theme);
        setMessage(
          data.source === 'DEFAULT'
            ? 'Safe runtime defaults loaded.'
            : 'Runtime settings synchronized.',
        );
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === 'AbortError'
        ) {
          return;
        }

        setMessage(
          'Settings service unavailable. Safe local defaults remain active.',
        );
      } finally {
        setHydrated(true);
      }
    }

    void hydrate();

    return () => controller.abort();
  }, [setTheme]);

  async function save() {
    if (saving) return;

    setSaving(true);
    setMessage('Applying settings…');

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error(`Settings API returned ${response.status}`);
      }

      const data = (await response.json()) as SettingsEnvelope;

      setSettings(data.settings);
      setTheme(data.settings.general.theme);
      setHydrated(true);
      setMessage(
        'Settings saved and applied to the current MarketLab runtime.',
      );
    } catch {
      setMessage(
        'Unable to save settings. Current local values have not been discarded.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    if (saving) return;

    setSaving(true);
    setMessage('Restoring safe defaults…');

    try {
      const response = await fetch('/api/settings/reset', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Settings API returned ${response.status}`);
      }

      const data = (await response.json()) as SettingsEnvelope;

      setSettings(data.settings);
      setTheme(data.settings.general.theme);
      setHydrated(true);
      setMessage('Settings restored to safe defaults.');
    } catch {
      const fallback = structuredClone(DEFAULT_SETTINGS);

      setSettings(fallback);
      setTheme(fallback.general.theme);
      setMessage(
        'Runtime reset unavailable. Safe defaults restored locally.',
      );
    } finally {
      setSaving(false);
    }
  }

  function updateNumeric(
    section: NumericSection,
    key: string,
    value: number,
  ) {
    setSettings((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [key]: value,
      },
    }));
  }

  function numberField(
    section: NumericSection,
    key: string,
    label: string,
  ) {
    const sectionValue = settings[section] as unknown as Record<
      string,
      number
    >;

    return (
      <label className={styles.field}>
        <span>{label}</span>

        <input
          type="number"
          step="any"
          value={sectionValue[key]}
          onChange={(event) =>
            updateNumeric(
              section,
              key,
              Number(event.target.value),
            )
          }
        />
      </label>
    );
  }

  return (
    <main className={styles.root}>
      <div className={styles.header}>
        <div>
          <h1>SETTINGS / CONTROL CENTER</h1>

          <p>
            Central runtime policy for ASURA, strategies, Sentinel,
            Portfolio, derivatives and execution.
          </p>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            disabled={saving}
            onClick={() => void reset()}
          >
            RESET SAFE DEFAULTS
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
          >
            {saving ? 'APPLYING…' : 'SAVE & APPLY'}
          </button>
        </div>
      </div>

      <div className={styles.notice}>
        <strong>
          {hydrated ? 'RUNTIME' : 'LOCAL SAFE MODE'}
        </strong>
        {' · '}
        {message}
      </div>

      <div className={styles.grid}>
        <Panel title="GENERAL">
          <label className={styles.field}>
            <span>Theme</span>

            <select
              value={settings.general.theme}
              onChange={(event) => {
                const theme =
                  event.target
                    .value as MarketLabSettings['general']['theme'];

                setTheme(theme);

                setSettings((current) => ({
                  ...current,
                  general: {
                    ...current.general,
                    theme,
                  },
                }));
              }}
            >
              <option value="light">MarketLab Light</option>
              <option value="professional">Professional</option>
              <option value="soft">Soft Contrast</option>
              <option value="dark">Terminal Dark</option>
            </select>
          </label>

          <label className={styles.field}>
            <span>Default instrument</span>

            <input
              value={settings.general.defaultInstrument}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  general: {
                    ...current.general,
                    defaultInstrument: event.target.value,
                  },
                }))
              }
            />
          </label>

          <label className={styles.field}>
            <span>Default timeframe</span>

            <select
              value={settings.general.defaultTimeframe}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  general: {
                    ...current.general,
                    defaultTimeframe:
                      event.target
                        .value as MarketLabSettings['general']['defaultTimeframe'],
                  },
                }))
              }
            >
              <option value="1m">1 minute</option>
              <option value="3m">3 minutes</option>
              <option value="5m">5 minutes</option>
              <option value="15m">15 minutes</option>
              <option value="30m">30 minutes</option>
              <option value="1h">1 hour</option>
            </select>
          </label>
        </Panel>

        <Panel title="ASURA">
          {numberField(
            'asura',
            'minOpportunityScore',
            'Minimum opportunity score',
          )}

          {numberField(
            'asura',
            'minContextScore',
            'Minimum context score',
          )}

          {numberField(
            'asura',
            'minSetupScore',
            'Minimum setup score',
          )}

          {numberField(
            'asura',
            'minExecutionScore',
            'Minimum execution score',
          )}

          {numberField(
            'asura',
            'maxUncertainty',
            'Maximum uncertainty',
          )}
        </Panel>

        <Panel title="STRATEGIES">
          <Toggle
            label="Trend Pullback"
            checked={
              settings.strategies.trendPullbackEnabled
            }
            onChange={(checked) =>
              setSettings((current) => ({
                ...current,
                strategies: {
                  ...current.strategies,
                  trendPullbackEnabled: checked,
                },
              }))
            }
          />

          <Toggle
            label="Liquidity Sweep"
            checked={
              settings.strategies.liquiditySweepEnabled
            }
            onChange={(checked) =>
              setSettings((current) => ({
                ...current,
                strategies: {
                  ...current.strategies,
                  liquiditySweepEnabled: checked,
                },
              }))
            }
          />

          <Toggle
            label="Breakout-Retest"
            checked={
              settings.strategies.breakoutRetestEnabled
            }
            onChange={(checked) =>
              setSettings((current) => ({
                ...current,
                strategies: {
                  ...current.strategies,
                  breakoutRetestEnabled: checked,
                },
              }))
            }
          />

          <label className={styles.field}>
            <span>Minimum strategy score</span>

            <input
              type="number"
              value={settings.strategies.minStrategyScore}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  strategies: {
                    ...current.strategies,
                    minStrategyScore: Number(
                      event.target.value,
                    ),
                  },
                }))
              }
            />
          </label>
        </Panel>

        <Panel title="SENTINEL">
          {numberField(
            'sentinel',
            'maxFeedAgeMs',
            'Maximum feed age (ms)',
          )}

          {numberField(
            'sentinel',
            'maxSignalAgeMs',
            'Maximum signal age (ms)',
          )}

          {numberField(
            'sentinel',
            'maxSpreadPct',
            'Maximum spread %',
          )}

          {numberField(
            'sentinel',
            'minLiquidityScore',
            'Minimum liquidity score',
          )}

          {numberField(
            'sentinel',
            'maxOptionQuoteAgeMs',
            'Maximum option quote age (ms)',
          )}

          {numberField(
            'sentinel',
            'minRiskReward',
            'Minimum risk/reward',
          )}

          {numberField(
            'sentinel',
            'minExpectedValueR',
            'Minimum expected value (R)',
          )}

          {numberField(
            'sentinel',
            'cooldownMs',
            'Trade cooldown (ms)',
          )}

          {numberField(
            'sentinel',
            'maxTradesPerDay',
            'Maximum trades/day',
          )}
        </Panel>

        <Panel title="PORTFOLIO GOVERNOR">
          {numberField(
            'portfolio',
            'riskPerTradePct',
            'Risk per trade %',
          )}

          {numberField(
            'portfolio',
            'maxPortfolioHeatPct',
            'Maximum portfolio heat %',
          )}

          {numberField(
            'portfolio',
            'maxDailyLossR',
            'Maximum daily loss (R)',
          )}

          {numberField(
            'portfolio',
            'maxConsecutiveLosses',
            'Maximum consecutive losses',
          )}

          {numberField(
            'portfolio',
            'maxCorrelatedExposurePct',
            'Maximum correlated exposure %',
          )}
        </Panel>

        <Panel title="OPTIONS / DERIVATIVES">
          {numberField(
            'options',
            'preferredAbsDeltaMin',
            'Preferred |Delta| minimum',
          )}

          {numberField(
            'options',
            'preferredAbsDeltaMax',
            'Preferred |Delta| maximum',
          )}

          {numberField(
            'options',
            'maxSpreadPct',
            'Maximum spread %',
          )}

          {numberField(
            'options',
            'minVolume',
            'Minimum volume',
          )}

          {numberField(
            'options',
            'minOpenInterest',
            'Minimum open interest',
          )}

          {numberField(
            'options',
            'maxQuoteAgeMs',
            'Maximum quote age (ms)',
          )}

          {numberField(
            'options',
            'maxDistancePct',
            'Maximum strike distance %',
          )}
        </Panel>

        <Panel title="PAPER TRADING">
          {numberField(
            'paper',
            'startingCapital',
            'Starting capital',
          )}

          {numberField(
            'paper',
            'slippageBps',
            'Slippage (bps)',
          )}

          {numberField(
            'paper',
            'chargeBps',
            'Charges (bps)',
          )}

          {numberField(
            'paper',
            'maxOrderQuantity',
            'Maximum order quantity',
          )}
        </Panel>

        <Panel title="EXECUTION / SYSTEM">
          <label className={styles.field}>
            <span>Execution mode</span>

            <select
              value={settings.system.executionMode}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  system: {
                    ...current.system,
                    executionMode:
                      event.target
                        .value as MarketLabSettings['system']['executionMode'],
                  },
                }))
              }
            >
              <option value="PAPER">PAPER</option>
              <option value="SANDBOX">SANDBOX</option>
              <option value="LIVE">
                LIVE — broker execution locked
              </option>
            </select>
          </label>

          <Toggle
            label="Automatic execution"
            checked={settings.system.autoExecutionEnabled}
            onChange={(checked) =>
              setSettings((current) => ({
                ...current,
                system: {
                  ...current.system,
                  autoExecutionEnabled: checked,
                },
              }))
            }
          />

          <Toggle
            label="Emergency kill switch"
            checked={settings.system.emergencyKillSwitch}
            onChange={(checked) =>
              setSettings((current) => ({
                ...current,
                system: {
                  ...current.system,
                  emergencyKillSwitch: checked,
                },
              }))
            }
          />

          <Toggle
            label="Automatic journal capture"
            checked={settings.system.journalCaptureEnabled}
            onChange={(checked) =>
              setSettings((current) => ({
                ...current,
                system: {
                  ...current.system,
                  journalCaptureEnabled: checked,
                },
              }))
            }
          />

          <Toggle
            label="Diagnostics"
            checked={settings.system.diagnosticsEnabled}
            onChange={(checked) =>
              setSettings((current) => ({
                ...current,
                system: {
                  ...current.system,
                  diagnosticsEnabled: checked,
                },
              }))
            }
          />
        </Panel>
      </div>
    </main>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.panel}>
      <h3>{title}</h3>
      <div className={styles.fields}>{children}</div>
    </section>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={styles.toggle}>
      <span>{label}</span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
      />
    </label>
  );
}