import { useEffect, useState } from 'react';
import { useApp } from '../store';

export function Toast() {
  const { toast } = useApp();
  const [shown, setShown] = useState<number | null>(null);
  useEffect(() => {
    if (!toast) return;
    setShown(toast.n);
    const t = setTimeout(() => setShown(null), toast.otter ? 3200 : 1800);
    return () => clearTimeout(t);
  }, [toast]);
  if (!toast || shown !== toast.n) return null;
  return <div className={'toast' + (toast.otter ? ' otter' : '')} role="status">{toast.otter && <span className="otter-ic" aria-hidden="true" />}{toast.text}</div>;
}
