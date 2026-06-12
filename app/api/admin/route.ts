import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase';

// Update fixture score and recalculate points
export async function POST(request: NextRequest) {
  try {
    const { userId, fixtureId, homeScore, awayScore, action } = await request.json();

    const supabase = adminSupabase();

    // Verify admin
    const { data: user } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (!user?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (action === 'update_score') {
      // Update fixture
      const { error: fErr } = await supabase
        .from('fixtures')
        .update({
          home_score: homeScore,
          away_score: awayScore,
          status: 'finished',
          updated_at: new Date().toISOString(),
        })
        .eq('id', fixtureId);

      if (fErr) throw fErr;

      // Recalculate points for this fixture
      await recalculatePoints(supabase, fixtureId, homeScore, awayScore);

      return NextResponse.json({ success: true });
    }

    if (action === 'recalculate_all') {
      const { data: finishedFixtures } = await supabase
        .from('fixtures')
        .select('id, home_score, away_score')
        .eq('status', 'finished')
        .not('home_score', 'is', null);

      for (const fixture of finishedFixtures || []) {
        await recalculatePoints(supabase, fixture.id, fixture.home_score, fixture.away_score);
      }

      return NextResponse.json({ success: true, recalculated: finishedFixtures?.length || 0 });
    }

    if (action === 'update_fixture') {
      const { matchData } = await request.json().catch(() => ({}));
      return NextResponse.json({ error: 'Use PATCH for fixture updates' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

async function recalculatePoints(supabase: any, fixtureId: string, homeScore: number, awayScore: number) {
  const { data: predictions } = await supabase
    .from('predictions')
    .select('id, home_score, away_score')
    .eq('fixture_id', fixtureId);

  for (const pred of predictions || []) {
    let points = 0;
    if (pred.home_score === homeScore && pred.away_score === awayScore) {
      points = 3; // exact score
    } else {
      const actualResult = homeScore > awayScore ? 'H' : homeScore < awayScore ? 'A' : 'D';
      const predResult = pred.home_score > pred.away_score ? 'H' : pred.home_score < pred.away_score ? 'A' : 'D';
      if (actualResult === predResult) points = 1; // correct outcome
    }

    await supabase
      .from('predictions')
      .update({ points, is_locked: true })
      .eq('id', pred.id);
  }
}

// GET all predictions for admin view
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const supabase = adminSupabase();

    const { data: adminUser } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (!adminUser?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('predictions')
      .select('*, user:users(username), fixture:fixtures(*)')
      .order('fixture_id');

    if (error) throw error;
    return NextResponse.json({ predictions: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH - update fixture details
export async function PATCH(request: NextRequest) {
  try {
    const { userId, fixtureId, updates } = await request.json();
    const supabase = adminSupabase();

    const { data: user } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (!user?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { error } = await supabase
      .from('fixtures')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', fixtureId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
