'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading) router.replace(user ? '/fixtures' : '/login');
  }, [user, loading, router]);
  return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh' }}><span style={{ fontSize:48, animation:'float 1s ease-in-out infinite', display:'inline-block' }}>⚽</span></div>;
}
