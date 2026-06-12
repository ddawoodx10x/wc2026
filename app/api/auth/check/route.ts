import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase';
export async function POST(req: NextRequest) {
  const { username } = await req.json();
  const { data } = await adminSupabase().from('users').select('id').eq('username', username).single();
  return NextResponse.json({ exists: !!data });
}
