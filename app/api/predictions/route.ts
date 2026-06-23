import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase';

const AMMAR_USERNAME = 'Ammar';

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
  const { data: fx } = await sb.from('fixtures').select('kickoff_utc,match_number').eq('id', fixtureId).single();
  if (!fx) return NextResponse.json({ error: 'Fixture not found' }, { status: 404 });

  const now = new Date();
  const ko = new Date(fx.kickoff_utc);
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

export async function PATCH(req: NextRequest) {
  const { userId, fixtureId, isLocked, username } = await req.json();
  if (username !== AMMAR_USERNAME) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  const sb = adminSupabase();
  if (!isLocked) {
    const { data: fx } = await sb.from('fixtures').select('home_score').eq('id', fixtureId).single();
    if (fx && fx.home_score !== null && fx.home_score !== undefined) {
      return NextResponse.json({ error: 'Cannot unlock after final score' }, { status: 403 });
    }
  }
  const { data, error } = await sb.from('predictions')
    .update({ is_locked: isLocked, updated_at: new Date().toISOString() })
    .eq('user_id', userId).eq('fixture_id', fixtureId)
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ prediction: data });
}
