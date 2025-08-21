
import { useLayout } from '@/contexts/LayoutContext';
import { useEffect } from 'react';


export function usePageTitle(title: string) {
  const { setTitle } = useLayout();
  
  useEffect(() => {
    setTitle(title);
  }, [title, setTitle]);
}