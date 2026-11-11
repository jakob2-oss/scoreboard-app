import { useEffect, useState } from 'react';
import { useApp } from '../store';

export function Toast() {
  const { toast } = useApp();
  const [shown, setShown] = useState<number | null>(null);
  useEffect(() => {
    if (!toast) return;
    setShown(toast.n);
    const t = setTimeout(() => setShown(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);
  if (!toast || shown !== toast.n) return null;
  return <div className="toast" role="status">{toast.text}</div>;
}
