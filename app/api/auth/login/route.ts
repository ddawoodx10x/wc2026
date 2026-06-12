import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase';
import { createHash } from 'crypto';

function hash(pw: string) {
  return createHash('sha256').update(pw + 'wc2026').digest('hex');
}

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  const sb = adminSupabase();
  const { data, error } = await sb.from('users')
    .select('id,username,is_admin')
    .eq('username', username)
    .eq('password_hash', hash(password))
    .single();
  if (error || !data) return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  return NextResponse.json({ user: data });
}
