import { NextResponse } from 'next/server';

export async function POST(): Promise<NextResponse> {
  // TODO: create league, seed engine state, persist via Supabase.
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
