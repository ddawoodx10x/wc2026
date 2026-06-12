import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  const sb = adminSupabase();
  let q = sb.from('predictions').select('*,fixture:fixtures(*)');
  if (userId) q = q.eq('user_id', userId);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ predictions: data });
}

export async function POST(req: NextRequest) {
  const { userId, fixtureId, homeScore, awayScore } = await req.json();
  const sb = adminSupabase();
  // Check kickoff hasn't passed
  const { data: fx } = await sb.from('fixtures').select('kickoff_utc,match_number').eq('id', fixtureId).single();
  if (!fx) return NextResponse.json({ error: 'Fixture not found' }, { status: 404 });
  
  const now = new Date();
  const ko = new Date(fx.kickoff_utc);
  // Match 1 special: locked at 23:00 Saudi (20:00 UTC on Jun 11)
  if (fx.match_number === 1) {
    const lockTime = new Date('2026-06-11T20:00:00Z');
    if (now >= lockTime) return NextResponse.json({ error: 'Predictions locked 🔒' }, { status: 403 });
  } else if (now >= ko) {
    return NextResponse.json({ error: 'Match started — prediction locked 🔒' }, { status: 403 });
  }

  const { data, error } = await sb.from('predictions').upsert({
    user_id: userId, fixture_id: fixtureId,
    home_score: homeScore, away_score: awayScore,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,fixture_id' }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ prediction: data });
}
