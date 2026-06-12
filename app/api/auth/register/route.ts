import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase';
import { createHash } from 'crypto';
import { USERS_LIST } from '@/lib/fixtures-data';

function hash(pw: string) {
  return createHash('sha256').update(pw + 'wc2026').digest('hex');
}

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!USERS_LIST.find(u => u.name === username))
    return NextResponse.json({ error: 'Name not on the list' }, { status: 403 });
  if (password.length < 4)
    return NextResponse.json({ error: 'Password too short' }, { status: 400 });
  const sb = adminSupabase();
  const existing = await sb.from('users').select('id').eq('username', username).single();
  if (existing.data)
    return NextResponse.json({ error: 'Already registered — enter your password' }, { status: 409 });
  const isAdmin = USERS_LIST.find(u => u.name === username)?.isAdmin ?? false;
  const { data, error } = await sb.from('users')
    .insert({ username, password_hash: hash(password), is_admin: isAdmin })
    .select('id,username,is_admin').single();
  if (error) return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  return NextResponse.json({ user: data });
}
