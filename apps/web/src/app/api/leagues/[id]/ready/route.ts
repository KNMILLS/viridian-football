import { NextResponse } from 'next/server';

export async function POST(): Promise<NextResponse> {
  // TODO: toggle league_users.is_ready for current user/team.
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
