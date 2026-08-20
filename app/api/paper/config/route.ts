import {NextResponse} from 'next/server';
import {currentPaperBrokerConfig} from '@/lib/paper/runtime-config';
export const dynamic='force-dynamic';
export async function GET(){return NextResponse.json(currentPaperBrokerConfig(),{headers:{'Cache-Control':'no-store'}})}
