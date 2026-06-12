import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId, subscription } = await request.json();
    const supabase = adminSupabase();

    await supabase
      .from('users')
      .update({ push_subscription: subscription })
      .eq('id', userId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
  }
}

// Send notifications for upcoming matches (call via cron)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = adminSupabase();
    const now = new Date();
    const in10 = new Date(now.getTime() + 10 * 60 * 1000);
    const in11 = new Date(now.getTime() + 11 * 60 * 1000);

    // Find matches kicking off in ~10 minutes
    const { data: upcoming } = await supabase
      .from('fixtures')
      .select('id, home_team, away_team')
      .gte('kickoff_utc', now.toISOString())
      .lte('kickoff_utc', in11.toISOString())
      .eq('status', 'upcoming');

    if (!upcoming?.length) {
      return NextResponse.json({ notified: 0 });
    }

    let notified = 0;
    for (const fixture of upcoming) {
      // Find users who haven't predicted
      const { data: predictions } = await supabase
        .from('predictions')
        .select('user_id')
        .eq('fixture_id', fixture.id);

      const predictedUserIds = new Set((predictions || []).map((p: any) => p.user_id));

      const { data: users } = await supabase
        .from('users')
        .select('id, push_subscription')
        .not('push_subscription', 'is', null);

      for (const user of users || []) {
        if (!predictedUserIds.has(user.id) && user.push_subscription) {
          // In production, send actual web push here
          // For now, we just log it
          console.log(`Would notify ${user.id}: ${fixture.home_team} vs ${fixture.away_team}`);
          notified++;
        }
      }
    }

    return NextResponse.json({ notified });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
