'use client';
import { useEffect, useState } from 'react';
let _setToast: ((msg: string, type?: string) => void) | null = null;
export function toast(msg: string, type = 'ok') { _setToast?.(msg, type); }
export function ToastHost() {
  const [t, setT] = useState<{ msg: string; type: string } | null>(null);
  useEffect(() => {
    _setToast = (msg, type = 'ok') => { setT({ msg, type }); setTimeout(() => setT(null), 2800); };
    return () => { _setToast = null; };
  }, []);
  if (!t) return null;
  return <div className={`toast ${t.type === 'ok' ? 'tok2' : 'terr'}`}>{t.msg}</div>;
}
