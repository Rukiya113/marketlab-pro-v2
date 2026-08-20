'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { CanonicalInstrumentId } from '@/lib/market/events';

export type WorkspaceTab =
  | 'WORKSPACE'
  | 'CHART'
  | 'X-RAY'
  | 'SPLIT'
  | 'OPTIONS'
  | 'TRADES';

type WorkstationContextValue = {
  instrumentId: CanonicalInstrumentId;
  setInstrumentId: (id: CanonicalInstrumentId) => void;
  workspaceTab: WorkspaceTab;
  setWorkspaceTab: (tab: WorkspaceTab) => void;
};

const DEFAULT = 'IN:NSE:INDEX:NIFTY50' as const;

const Context = createContext<WorkstationContextValue | null>(null);

export function WorkstationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [instrumentId, setInstrumentIdState] =
    useState<CanonicalInstrumentId>(DEFAULT);

  const [workspaceTab, setWorkspaceTab] =
    useState<WorkspaceTab>('WORKSPACE');

  useEffect(() => {
    const saved = window.localStorage.getItem('marketlab-instrument');

    if (saved?.startsWith('IN:')) {
      setInstrumentIdState(saved as CanonicalInstrumentId);
    }
  }, []);

  const setInstrumentId = (id: CanonicalInstrumentId) => {
    setInstrumentIdState(id);
    window.localStorage.setItem('marketlab-instrument', id);
  };

  const value = useMemo(
    () => ({
      instrumentId,
      setInstrumentId,
      workspaceTab,
      setWorkspaceTab,
    }),
    [instrumentId, workspaceTab],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useWorkstation() {
  const value = useContext(Context);

  if (!value) {
    throw new Error(
      'useWorkstation must be used inside WorkstationProvider',
    );
  }

  return value;
}