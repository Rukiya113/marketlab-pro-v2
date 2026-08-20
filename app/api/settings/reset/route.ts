import { NextResponse } from 'next/server';
import { settingsStore } from '@/lib/settings/singleton';
import { paperBroker } from '@/lib/paper/singleton';
export const dynamic = 'force-dynamic';
export async function POST() {
  const envelope = settingsStore.reset();
  paperBroker.configure({ ...envelope.settings.paper, maxQuoteAgeMs: envelope.settings.options.maxQuoteAgeMs });
  return NextResponse.json(envelope);
}
