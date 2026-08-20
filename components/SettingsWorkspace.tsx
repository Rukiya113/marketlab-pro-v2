'use client';

import { useEffect, useState } from 'react';
import type { MarketLabSettings, SettingsEnvelope } from '@/lib/settings/types';
import styles from './SettingsWorkspace.module.css';
import { useTheme } from './ThemeProvider';

export default function SettingsWorkspace() {
  const [settings, setSettings] = useState<MarketLabSettings | null>(null);
  const [message, setMessage] = useState('');
  const { setTheme } = useTheme();

  useEffect(() => {
    fetch('/api/settings', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data: SettingsEnvelope) => setSettings(data.settings))
      .catch(() => setMessage('Settings service unavailable.'));
  }, []);

  async function save() {
    if (!settings) return;
    const response = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    const data = await response.json() as SettingsEnvelope;
    setSettings(data.settings);
    setTheme(data.settings.general.theme);
    setMessage('Settings saved and applied to the current MarketLab runtime.');
  }

  async function reset() {
    const response = await fetch('/api/settings/reset', { method: 'POST' });
    const data = await response.json() as SettingsEnvelope;
    setSettings(data.settings);
    setTheme(data.settings.general.theme);
    setMessage('Settings restored to safe defaults.');
  }

  if (!settings) {
    return <main className={styles.root}>{message || 'Loading settings…'}</main>;
  }

  const numberField = (
    section: keyof Pick<MarketLabSettings, 'asura' | 'sentinel' | 'portfolio' | 'options' | 'paper'>,
    key: string,
    label: string,
  ) => {
    const sectionValue = settings[section] as unknown as Record<string, number>;
    return (
      <label className={styles.field}>
        <span>{label}</span>
        <input
          type="number"
          step="any"
          value={sectionValue[key]}
          onChange={(event) =>
            setSettings({
              ...settings,
              [section]: {
                ...settings[section],
                [key]: Number(event.target.value),
              },
            })
          }
        />
      </label>
    );
  };

  return (
    <main className={styles.root}>
      <div className={styles.header}>
        <div>
          <h1>SETTINGS / CONTROL CENTER</h1>
          <p>Central policy for ASURA, strategies, Sentinel, Portfolio, Options and Paper execution.</p>
        </div>
        <div className={styles.actions}>
          <button onClick={() => void reset()}>RESET SAFE DEFAULTS</button>
          <button onClick={() => void save()}>SAVE SETTINGS</button>
        </div>
      </div>

      {message && <div className={styles.notice}>{message}</div>}

      <div className={styles.grid}>
        <Panel title="GENERAL">
          <label className={styles.field}>
            <span>Theme</span>
            <select
              value={settings.general.theme}
              onChange={(event) => {
                const theme = event.target.value as MarketLabSettings['general']['theme'];
                setTheme(theme);
                setSettings({ ...settings, general: { ...settings.general, theme } });
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
                setSettings({
                  ...settings,
                  general: { ...settings.general, defaultInstrument: event.target.value },
                })
              }
            />
          </label>
        </Panel>

        <Panel title="ASURA">
          {numberField('asura', 'minOpportunityScore', 'Minimum opportunity score')}
          {numberField('asura', 'minContextScore', 'Minimum context score')}
          {numberField('asura', 'minSetupScore', 'Minimum setup score')}
          {numberField('asura', 'minExecutionScore', 'Minimum execution score')}
          {numberField('asura', 'maxUncertainty', 'Maximum uncertainty')}
        </Panel>

        <Panel title="STRATEGIES">
          <Toggle
            label="Trend Pullback"
            checked={settings.strategies.trendPullbackEnabled}
            onChange={(checked) =>
              setSettings({
                ...settings,
                strategies: { ...settings.strategies, trendPullbackEnabled: checked },
              })
            }
          />
          <Toggle
            label="Liquidity Sweep"
            checked={settings.strategies.liquiditySweepEnabled}
            onChange={(checked) =>
              setSettings({
                ...settings,
                strategies: { ...settings.strategies, liquiditySweepEnabled: checked },
              })
            }
          />
          <Toggle
            label="Breakout-Retest"
            checked={settings.strategies.breakoutRetestEnabled}
            onChange={(checked) =>
              setSettings({
                ...settings,
                strategies: { ...settings.strategies, breakoutRetestEnabled: checked },
              })
            }
          />
        </Panel>

        <Panel title="SENTINEL">
          {numberField('sentinel', 'maxFeedAgeMs', 'Max feed age ms')}
          {numberField('sentinel', 'maxSignalAgeMs', 'Max signal age ms')}
          {numberField('sentinel', 'maxSpreadPct', 'Max spread %')}
          {numberField('sentinel', 'minLiquidityScore', 'Min liquidity score')}
          {numberField('sentinel', 'minRiskReward', 'Min R:R')}
          {numberField('sentinel', 'minExpectedValueR', 'Min EV (R)')}
          {numberField('sentinel', 'maxTradesPerDay', 'Max trades/day')}
        </Panel>

        <Panel title="PORTFOLIO">
          {numberField('portfolio', 'riskPerTradePct', 'Risk per trade %')}
          {numberField('portfolio', 'maxPortfolioHeatPct', 'Max portfolio heat %')}
          {numberField('portfolio', 'maxDailyLossR', 'Daily loss limit R')}
          {numberField('portfolio', 'maxConsecutiveLosses', 'Loss streak limit')}
          {numberField('portfolio', 'maxCorrelatedExposurePct', 'Max correlated exposure %')}
        </Panel>

        <Panel title="OPTIONS">
          {numberField('options', 'preferredAbsDeltaMin', 'Preferred |Delta| min')}
          {numberField('options', 'preferredAbsDeltaMax', 'Preferred |Delta| max')}
          {numberField('options', 'maxSpreadPct', 'Max spread %')}
          {numberField('options', 'minVolume', 'Minimum volume')}
          {numberField('options', 'minOpenInterest', 'Minimum OI')}
          {numberField('options', 'maxQuoteAgeMs', 'Max quote age ms')}
          {numberField('options', 'maxDistancePct', 'Max strike distance %')}
        </Panel>

        <Panel title="PAPER TRADING">
          {numberField('paper', 'startingCapital', 'Starting capital')}
          {numberField('paper', 'slippageBps', 'Slippage bps')}
          {numberField('paper', 'chargeBps', 'Charges bps')}
          {numberField('paper', 'maxOrderQuantity', 'Max order quantity')}
        </Panel>

        <Panel title="SYSTEM">
          <label className={styles.field}>
            <span>Execution mode</span>
            <select
              value={settings.system.executionMode}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  system: {
                    ...settings.system,
                    executionMode: event.target.value as MarketLabSettings['system']['executionMode'],
                  },
                })
              }
            >
              <option value="PAPER">PAPER</option>
              <option value="SANDBOX">SANDBOX</option>
              <option value="LIVE">LIVE</option>
            </select>
          </label>
          <Toggle
            label="Auto execution"
            checked={settings.system.autoExecutionEnabled}
            onChange={(checked) => setSettings({ ...settings, system: { ...settings.system, autoExecutionEnabled: checked } })}
          />
          <Toggle
            label="Emergency kill switch"
            checked={settings.system.emergencyKillSwitch}
            onChange={(checked) => setSettings({ ...settings, system: { ...settings.system, emergencyKillSwitch: checked } })}
          />
          <Toggle
            label="Journal capture"
            checked={settings.system.journalCaptureEnabled}
            onChange={(checked) =>
              setSettings({
                ...settings,
                system: { ...settings.system, journalCaptureEnabled: checked },
              })
            }
          />
          <Toggle
            label="Diagnostics"
            checked={settings.system.diagnosticsEnabled}
            onChange={(checked) =>
              setSettings({
                ...settings,
                system: { ...settings.system, diagnosticsEnabled: checked },
              })
            }
          />
        </Panel>
      </div>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
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
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
