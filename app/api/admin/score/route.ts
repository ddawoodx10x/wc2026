import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase';
import { calcPoints } from '@/lib/fixtures-data';

export async function POST(req: NextRequest) {
  const { userId, fixtureId, homeScore, awayScore, penaltyWinner } = await req.json();
  const sb = adminSupabase();

  const { data: user } = await sb.from('users').select('is_admin').eq('id', userId).single();
  if (!user?.is_admin) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const { error: fxErr } = await sb.from('fixtures').update({
    home_score: homeScore,
    away_score: awayScore,
    penalty_winner: penaltyWinner || null,
    status: 'finished',
    updated_at: new Date().toISOString(),
  }).eq('id', fixtureId);
  if (fxErr) return NextResponse.json({ error: fxErr.message }, { status: 500 });

  const { data: preds } = await sb.from('predictions')
    .select('id,home_score,away_score,penalty_winner').eq('fixture_id', fixtureId);

  if (preds && preds.length > 0) {
    for (const p of preds) {
      const pts = calcPoints(p.home_score, p.away_score, homeScore, awayScore, p.penalty_winner, penaltyWinner || null);
      await sb.from('predictions').update({ points: pts }).eq('id', p.id);
    }
  }

  return NextResponse.json({ success: true, updated: preds?.length ?? 0 });
}
