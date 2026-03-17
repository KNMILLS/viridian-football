import { NextResponse } from 'next/server';

export async function POST(): Promise<NextResponse> {
  // TODO: bind user to team in league_users via Supabase.
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
