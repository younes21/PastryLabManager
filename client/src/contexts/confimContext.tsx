import React, { createContext, useContext, useState } from "react";

type ConfirmFunction = (title: string, message: string) => Promise<boolean>;

let globalConfirm: ConfirmFunction | null = null;

const ConfirmContext = createContext<ConfirmFunction | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [resolver, setResolver] = useState<(v: boolean) => void>();

  const confirm: ConfirmFunction = (title, message) => {
    setTitle(title);
    setMessage(message);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  };

  // ⚡ expose globalement la fonction
  globalConfirm = confirm;

  const handleClose = (result: boolean) => {
    setIsOpen(false);
    resolver?.(result);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {isOpen && (
      <div 
      className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:p-6 bg-gradient-to-br from-black/50 via-black/60 to-black/70  animate-in fade-in duration-300"
      onClick={() => handleClose(false)}
    >
      <div 
        className="relative bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-3xl shadow-2xl w-full sm:max-w-lg lg:max-w-xl overflow-hidden transform animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent décoratif en haut */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600"></div>
        
        {/* Cercles décoratifs en arrière-plan */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange-500/5 rounded-full blur-3xl"></div>
        
        <div className="relative p-6 sm:p-8 lg:p-10">
          {/* Icône avec animation */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl animate-pulse"></div>
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30 transform transition-transform duration-300 hover:scale-110">
                <svg 
                  className="w-10 h-10 sm:w-12 sm:h-12 text-white" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2.5} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Contenu */}
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-3 sm:mb-4">
              {title}
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              {message}
            </p>
          </div>

          {/* Séparateur subtil */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-6"></div>

          {/* Boutons avec design premium */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={() => handleClose(false)}
              className="group relative flex-1 px-6 py-3.5 sm:py-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm sm:text-base overflow-hidden transition-all duration-300  hover:border-gray-300 dark:hover:border-gray-600"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <svg className="w-5 h-5 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Annuler
              </span>
              <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            
            <button
              onClick={() => handleClose(true)}
              className="group relative flex-1 px-6 py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 text-white font-semibold text-sm sm:text-base shadow-lg shadow-orange-500/40 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <svg className="w-5 h-5 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Confirmer
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-orange-700 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
      )}
    </ConfirmContext.Provider>
  );
}

// 🧠 Hook classique pour composants React
export function useGlobalConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useGlobalConfirm must be used inside ConfirmProvider");
  return ctx;
}

// 🌍 Fonction globale utilisable même hors React
export function confirmGlobal(title: string, message: string): Promise<boolean> {
  if (!globalConfirm) {
    console.warn("⚠️ confirmGlobal() appelé avant le montage du ConfirmProvider");
    return Promise.resolve(false);
  }
  return globalConfirm(title, message);
}
