import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'lb_expanded_view';
const EVENT = 'lb_expanded_view_changed';

const read = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

const apply = (v: boolean) => {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.expanded = v ? 'true' : 'false';
  }
};

export const useExpandedView = () => {
  const [expanded, setExpanded] = useState<boolean>(() => read());

  useEffect(() => {
    apply(expanded);
  }, [expanded]);

  useEffect(() => {
    const onChange = () => setExpanded(read());
    window.addEventListener(EVENT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  const toggle = useCallback(() => {
    const next = !read();
    try {
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch {}
    apply(next);
    setExpanded(next);
    window.dispatchEvent(new CustomEvent(EVENT));
  }, []);

  return { expanded, toggle };
};
