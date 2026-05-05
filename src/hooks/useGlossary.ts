import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  module: string | null;
}

export function useGlossary() {
  return useQuery({
    queryKey: ['glossary'],
    queryFn: async (): Promise<GlossaryTerm[]> => {
      const { data, error } = await supabase
        .from('glossary')
        .select('id, term, definition, module')
        .order('term');
      if (error) throw error;
      return (data || []) as GlossaryTerm[];
    },
    staleTime: 30 * 60 * 1000,
  });
}
