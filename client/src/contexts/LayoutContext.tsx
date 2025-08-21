// 1. Créer le Context pour le Layout
// contexts/LayoutContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LayoutContextType {
  title: string;
  setTitle: (title: string) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState('Tableau de bord');

  return (
    <LayoutContext.Provider value={{ title, setTitle }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}
