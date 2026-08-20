'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useWorkstation } from './WorkstationProvider';
import type { PaperBrokerSnapshot, PaperOrderRequest } from '@/lib/paper/types';
import styles from './PaperTradingWorkspace.module.css';
import PaperDerivativeTicket from './PaperDerivativeTicket';

const EMPTY: PaperBrokerSnapshot | null = null;

export default function PaperTradingWorkspace() {
  const { instrumentId } = useWorkstation();
  const [state, setState] = useState<PaperBrokerSnapshot | null>(EMPTY);
  const [symbol, setSymbol] = useState('NIFTY 50');
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [type, setType] = useState<PaperOrderRequest['type']>('MARKET');
  const [quantity, setQuantity] = useState(1);
  const [limitPrice, setLimitPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [message, setMessage] = useState('');
  const [autoState, setAutoState] = useState('CHECKING');

  const refresh = () =>
    fetch('/api/paper/state', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data: PaperBrokerSnapshot) => setState(data))
      .catch(() => setState(null));

  useEffect(() => {
    void refresh();
    const checkAuto = () => fetch('/api/settings',{cache:'no-store'}).then(r=>r.json()).then(d=>setAutoState(d.settings.system.emergencyKillSwitch?'KILL SWITCH':d.settings.system.autoExecutionEnabled?'AUTO PAPER ARMED':'MANUAL')).catch(()=>setAutoState('UNAVAILABLE'));
    void checkAuto();
    const id = window.setInterval(() => { void refresh(); void checkAuto(); }, 2000);
    return () => window.clearInterval(id);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage('');

    const payload: PaperOrderRequest = {
      instrumentId,
      symbol,
      side,
      type,
      quantity,
      limitPrice: limitPrice ? Number(limitPrice) : null,
      stopPrice: stopPrice ? Number(stopPrice) : null,
    };

    const response = await fetch('/api/paper/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const order = await response.json();
    setMessage(
      response.ok
        ? `Paper order ${order.status}: ${order.id}`
        : order.rejectionReason ?? 'Paper order rejected',
    );
    await refresh();
  }

  return (
    <main className={styles.root}>
      <div className={styles.header}>
        <div>
          <h1>PAPER TRADING</h1>
          <p>Simulation only. No order is sent to Upstox or any live broker.</p>
        </div>
        <span className={styles.mode}>PAPER · {autoState}</span>
      </div>

      <div className={styles.cards}>
        <Metric label="EQUITY" value={money(state?.account.equity)} />
        <Metric label="REALIZED" value={money(state?.account.realizedPnl)} />
        <Metric label="UNREALIZED" value={money(state?.account.unrealizedPnl)} />
        <Metric label="CHARGES" value={money(state?.account.estimatedCharges)} />
        <Metric label="OPEN RISK" value={money(state?.account.openRisk)} />
        <Metric label="TRADES" value={String(state?.trades.length ?? 0)} />
      </div>

      <section className={styles.panel}>
        <h3>NEW PAPER ORDER</h3>
        <form className={styles.form} onSubmit={submit}>
          <input value={symbol} onChange={(e) => setSymbol(e.target.value)} />
          <select value={side} onChange={(e) => setSide(e.target.value as 'BUY' | 'SELL')}>
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
          <select value={type} onChange={(e) => setType(e.target.value as PaperOrderRequest['type'])}>
            <option value="MARKET">MARKET</option>
            <option value="LIMIT">LIMIT</option>
            <option value="STOP">STOP</option>
            <option value="STOP_LIMIT">STOP LIMIT</option>
          </select>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
          <input
            placeholder="Limit price"
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
          />
          <input
            placeholder="Stop price"
            value={stopPrice}
            onChange={(e) => setStopPrice(e.target.value)}
          />
          <button type="submit">SUBMIT PAPER ORDER</button>
        </form>
        <div className={styles.notice}>
          {message || 'Orders fill only after a real canonical quote is ingested. No synthetic price is generated.'}
        </div>
      </section>

      <PaperDerivativeTicket />

      <div className={styles.grid}>
        <TablePanel title="OPEN POSITIONS">
          {state?.positions.length ? (
            <table className={styles.table}>
              <thead>
                <tr><th>SYMBOL</th><th>QTY</th><th>AVG</th><th>LTP</th><th>NET P&L</th><th>MAE</th><th>MFE</th></tr>
              </thead>
              <tbody>
                {state.positions.map((position) => (
                  <tr key={position.instrumentId}>
                    <td>{position.symbol}</td>
                    <td>{position.quantity}</td>
                    <td>{position.averagePrice.toFixed(2)}</td>
                    <td>{position.lastPrice?.toFixed(2) ?? '—'}</td>
                    <td>{money(position.netPnl)}</td>
                    <td>{money(position.mae)}</td>
                    <td>{money(position.mfe)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <Empty text="No open paper positions." />}
        </TablePanel>

        <TablePanel title="ORDERS">
          {state?.orders.length ? (
            <table className={styles.table}>
              <thead>
                <tr><th>TIME</th><th>SYMBOL</th><th>SIDE</th><th>TYPE</th><th>QTY</th><th>STATUS</th><th>AVG</th></tr>
              </thead>
              <tbody>
                {state.orders.slice(0, 20).map((order) => (
                  <tr key={order.id}>
                    <td>{new Date(order.createdAt).toLocaleTimeString()}</td>
                    <td>{order.symbol}</td>
                    <td>{order.side}</td>
                    <td>{order.type}</td>
                    <td>{order.quantity}</td>
                    <td>{order.status}</td>
                    <td>{order.averageFillPrice?.toFixed(2) ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <Empty text="No paper orders." />}
        </TablePanel>

        <TablePanel title="TRADE HISTORY">
          {state?.trades.length ? (
            <table className={styles.table}>
              <thead>
                <tr><th>SYMBOL</th><th>SIDE</th><th>QTY</th><th>ENTRY</th><th>EXIT</th><th>NET P&L</th></tr>
              </thead>
              <tbody>
                {state.trades.slice(0, 30).map((trade) => (
                  <tr key={trade.id}>
                    <td>{trade.symbol}</td>
                    <td>{trade.side}</td>
                    <td>{trade.quantity}</td>
                    <td>{trade.entryPrice.toFixed(2)}</td>
                    <td>{trade.exitPrice.toFixed(2)}</td>
                    <td>{money(trade.netPnl)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <Empty text="No completed paper trades." />}
        </TablePanel>

        <TablePanel title="EXECUTION RULES">
          <div className={styles.notice}>
            Market orders use the real bid/ask or last quote. Limit and stop orders wait for
            executable real quotes. Slippage and charges are explicit estimates. This subsystem
            never claims a simulated fill is an Upstox broker fill.
          </div>
        </TablePanel>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.card}>
      <small>{label}</small>
      <b>{value}</b>
    </div>
  );
}

function TablePanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.panel}>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <div className={styles.empty}>{text}</div>;
}

function money(value: number | undefined): string {
  return value == null
    ? '—'
    : value.toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
      });
}
