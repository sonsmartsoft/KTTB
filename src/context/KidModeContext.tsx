import React, { createContext, useContext, useState, useEffect } from 'react';

interface KidModeContextType {
  isKidMode: boolean;
  enterKidMode: () => void;
  exitKidMode: (pin?: string) => boolean;
  parentPin: string;
  setParentPin: (pin: string) => void;
}

const KidModeContext = createContext<KidModeContextType | undefined>(undefined);

const STORAGE_KEYS = {
  IS_KID_MODE: 'ktt_is_kid_mode',
  PARENT_PIN: 'ktt_parent_pin',
};

export const KidModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isKidMode, setIsKidMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.IS_KID_MODE) === 'true';
    } catch {
      return false;
    }
  });

  const [parentPin, setParentPinState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.PARENT_PIN) || '0075';
    } catch {
      return '0075';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.IS_KID_MODE, String(isKidMode));
    } catch (e) {
      console.warn('Failed to persist kid mode state:', e);
    }
  }, [isKidMode]);

  const enterKidMode = () => {
    setIsKidMode(true);
  };

  const exitKidMode = (pin?: string): boolean => {
    // If PIN is provided and matches, or if no PIN is set / verified
    if (!pin || pin === parentPin) {
      setIsKidMode(false);
      return true;
    }
    return false;
  };

  const setParentPin = (newPin: string) => {
    setParentPinState(newPin);
    try {
      localStorage.setItem(STORAGE_KEYS.PARENT_PIN, newPin);
    } catch (e) {
      console.warn('Failed to persist parent PIN:', e);
    }
  };

  return (
    <KidModeContext.Provider
      value={{
        isKidMode,
        enterKidMode,
        exitKidMode,
        parentPin,
        setParentPin,
      }}
    >
      {children}
    </KidModeContext.Provider>
  );
};

export const useKidMode = (): KidModeContextType => {
  const context = useContext(KidModeContext);
  if (!context) {
    throw new Error('useKidMode must be used within a KidModeProvider');
  }
  return context;
};
