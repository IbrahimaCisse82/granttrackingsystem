import { useEffect, useState } from 'react';

const KEY = 'gtgs.onboarding.seen';

function readSeen(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) || '[]'));
  } catch {
    return new Set();
  }
}

export function useOnboarding(moduleId: string) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = readSeen();
    if (!seen.has(moduleId)) setShow(true);
  }, [moduleId]);

  const dismiss = () => {
    const seen = readSeen();
    seen.add(moduleId);
    localStorage.setItem(KEY, JSON.stringify([...seen]));
    setShow(false);
  };

  const reset = () => {
    localStorage.removeItem(KEY);
  };

  return { show, dismiss, reset };
}
