import { NextRequest, NextResponse } from 'next/server';
import { paperBroker } from '@/lib/paper/singleton';
import type { PaperOrderRequest } from '@/lib/paper/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = (await request.json()) as PaperOrderRequest;
  const order = paperBroker.submit(body);
  return NextResponse.json(order, { status: order.status === 'REJECTED' ? 400 : 201 });
}
