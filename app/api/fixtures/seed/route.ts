import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase';
import { FIXTURES_DATA } from '@/lib/fixtures-data';
export async function POST(req: NextRequest) {
  const { key } = await req.json();
  if (key !== process.env.ADMIN_SECRET_KEY)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const sb = adminSupabase();
  const rows = FIXTURES_DATA.map(f => ({
    match_number: f.match_number,
    stage: f.stage,
    group: f.group || null,
    home_team: f.home_team,
    away_team: f.away_team,
    home_flag: f.home_flag,
    away_flag: f.away_flag,
    kickoff_utc: f.kickoff_utc,
    venue: f.venue,
    city: f.city,
    status: 'upcoming',
  }));
  const { error } = await sb.from('fixtures').upsert(rows, { onConflict: 'match_number' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ seeded: rows.length });
}
