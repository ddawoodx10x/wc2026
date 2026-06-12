import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  const sb = adminSupabase();
  const { data: user } = await sb.from('users').select('is_admin').eq('id', userId!).single();
  if (!user?.is_admin) return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  const { data } = await sb.from('predictions')
    .select('*,user:users(username),fixture:fixtures(*)')
    .order('fixture_id');
  return NextResponse.json({ predictions: data || [] });
}
