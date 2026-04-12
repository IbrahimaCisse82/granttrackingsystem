import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useDarkMode() {
  const { user } = useAuth();
  const [darkMode, setDarkModeState] = useState(() => {
    try { return localStorage.getItem('gh-gts-dark-mode') === 'true'; } catch { return false; }
  });

  // Load from DB on login
  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('dark_mode').eq('user_id', user.id).single().then(({ data }) => {
      if (data) {
        setDarkModeState(data.dark_mode);
        localStorage.setItem('gh-gts-dark-mode', String(data.dark_mode));
      }
    });
  }, [user]);

  // Apply to DOM
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('gh-gts-dark-mode', String(darkMode));
  }, [darkMode]);

  const setDarkMode = useCallback((value: boolean) => {
    setDarkModeState(value);
    if (user) {
      supabase.from('profiles').update({ dark_mode: value }).eq('user_id', user.id).then();
    }
  }, [user]);

  const toggle = useCallback(() => setDarkMode(!darkMode), [darkMode, setDarkMode]);

  return { darkMode, setDarkMode, toggle };
}
