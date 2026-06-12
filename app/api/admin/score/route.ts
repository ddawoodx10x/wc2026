import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase';
import { calcPoints } from '@/lib/fixtures-data';

export async function POST(req: NextRequest) {
  const { userId, fixtureId, homeScore, awayScore } = await req.json();
  const sb = adminSupabase();

  // Verify admin
  const { data: user } = await sb.from('users').select('is_admin').eq('id', userId).single();
  if (!user?.is_admin) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  // Save score to fixture
  const { error: fxErr } = await sb.from('fixtures').update({
    home_score: homeScore,
    away_score: awayScore,
    status: 'finished',
    updated_at: new Date().toISOString(),
  }).eq('id', fixtureId);
  if (fxErr) return NextResponse.json({ error: fxErr.message }, { status: 500 });

  // Recalculate points for ALL predictions on this fixture
  const { data: preds } = await sb.from('predictions')
    .select('id,home_score,away_score').eq('fixture_id', fixtureId);

  if (preds && preds.length > 0) {
    const updates = preds.map(p => ({
      id: p.id,
      points: calcPoints(p.home_score, p.away_score, homeScore, awayScore),
    }));
    for (const u of updates) {
      await sb.from('predictions').update({ points: u.points }).eq('id', u.id);
    }
  }

  return NextResponse.json({ success: true, updated: preds?.length ?? 0 });
}
