import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase';
import { USERS_LIST, calcPoints } from '@/lib/fixtures-data';

export async function GET() {
  const sb = adminSupabase();
  const [usersRes, predsRes, fxRes] = await Promise.all([
    sb.from('users').select('id,username'),
    sb.from('predictions').select('user_id,fixture_id,home_score,away_score'),
    sb.from('fixtures').select('id,home_score,away_score,status'),
  ]);

  const users = usersRes.data || [];
  const preds = predsRes.data || [];
  const fixtures = fxRes.data || [];

  // Build score lookup
  const scoreMap: Record<string, { h: number; a: number }> = {};
  fixtures.forEach(f => {
    if (f.home_score !== null && f.away_score !== null) {
      scoreMap[f.id] = { h: f.home_score, a: f.away_score };
    }
  });

  const leaderboard = USERS_LIST.map(ul => {
    const user = users.find(u => u.username === ul.name);
    if (!user) return { name: ul.name, emoji: ul.emoji, pts: 0, exact: 0, correct: 0, wrong: 0, total: 0, rank: 0 };
    const userPreds = preds.filter(p => p.user_id === user.id);
    let pts = 0, exact = 0, correct = 0, wrong = 0;
    userPreds.forEach(p => {
      const sc = scoreMap[p.fixture_id];
      if (!sc) return;
      const pt = calcPoints(p.home_score, p.away_score, sc.h, sc.a);
      pts += pt;
      if (pt === 3) exact++;
      else if (pt === 2) correct++;
      else wrong++;
    });
    return { id: user.id, name: ul.name, emoji: ul.emoji, pts, exact, correct, wrong, total: userPreds.length, rank: 0 };
  }).sort((a, b) => b.pts - a.pts).map((e, i) => ({ ...e, rank: i + 1 }));

  return NextResponse.json({ leaderboard });
}
