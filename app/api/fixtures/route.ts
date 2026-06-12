import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase';
export async function GET() {
  const { data, error } = await adminSupabase()
    .from('fixtures').select('*').order('kickoff_utc');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ fixtures: data });
}
