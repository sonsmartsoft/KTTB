import React, { createContext, useContext, useState, useEffect } from 'react';
import { Child } from '@/domain/types';
import { storage } from '@/services/storage';

interface ChildContextType {
  childrenList: Child[];
  activeChild: Child;
  setActiveChildId: (id: string) => void;
  refreshChildren: () => void;
  addChild: (child: Omit<Child, 'id'>) => Promise<boolean>;
  updateChild: (child: Child) => Promise<boolean>;
  isSyncing: boolean;
}

const ChildContext = createContext<ChildContextType | undefined>(undefined);

export const ChildProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [childrenList, setChildrenList] = useState<Child[]>(() => {
    storage.init();
    return storage.getChildren();
  });
  const [activeChildId, setActiveChildIdState] = useState<string>(() => {
    return storage.getSettings().activeChildId || childrenList[0]?.id || 'child-trung-quan';
  });
  const [isSyncing, setIsSyncing] = useState(true);

  // Sync from Supabase cloud on mount (non-blocking — app still usable during sync)
  useEffect(() => {
    let cancelled = false;
    storage.syncFromCloud().then(() => {
      if (cancelled) return;
      // Refresh lists & active child view setup from localStorage (now populated with cloud data)
      setChildrenList(storage.getChildren());
      const syncedSettings = storage.getSettings();
      if (syncedSettings.activeChildId) {
        setActiveChildIdState(syncedSettings.activeChildId);
      }
      setIsSyncing(false);
    }).catch(() => {
      if (!cancelled) setIsSyncing(false);
    });

    const handleUpdated = () => {
      setChildrenList(storage.getChildren());
      const s = storage.getSettings();
      if (s.activeChildId) {
        setActiveChildIdState(s.activeChildId);
      }
    };
    window.addEventListener('ktt-children-updated', handleUpdated);
    window.addEventListener('ktt-cloud-synced', handleUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener('ktt-children-updated', handleUpdated);
      window.removeEventListener('ktt-cloud-synced', handleUpdated);
    };
  }, []);

  const refreshChildren = () => {
    setChildrenList(storage.getChildren());
  };

  const setActiveChildId = (id: string) => {
    setActiveChildIdState(id);
    const settings = storage.getSettings();
    storage.saveSettings({ ...settings, activeChildId: id });
  };

  const addChild = async (newChildData: Omit<Child, 'id'>): Promise<boolean> => {
    const id = `child-${Date.now()}`;
    const newChild: Child = { ...newChildData, id };
    const updated = [...childrenList, newChild];
    setChildrenList(updated);
    setActiveChildId(id);
    return storage.saveChildren(updated);
  };

  const updateChild = async (updatedChild: Child): Promise<boolean> => {
    const updated = childrenList.map((c) => (c.id === updatedChild.id ? updatedChild : c));
    setChildrenList(updated);
    return storage.saveChildren(updated);
  };

  const activeChild =
    childrenList.find((c) => c.id === activeChildId) ||
    childrenList[0] || {
      id: 'child-default',
      name: 'Bé',
      nickname: 'Bé',
      birthYear: 2015,
      school_name: 'Trường học',
      grade: 'Lớp 6',
      class_name: '6A5',
      avatar_url: 'boy',
      color: '#2563EB',
      active: true,
    };

  return (
    <ChildContext.Provider
      value={{
        childrenList,
        activeChild,
        setActiveChildId,
        refreshChildren,
        addChild,
        updateChild,
        isSyncing,
      }}
    >
      {/* Subtle sync banner — non-blocking, shows only ~1-2 seconds on load */}
      {isSyncing && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            background: 'linear-gradient(90deg, #2563EB 0%, #7C3AED 100%)',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 600,
            padding: '5px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            letterSpacing: '0.02em',
          }}
        >
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            style={{ animation: 'spin 0.9s linear infinite', flexShrink: 0 }}
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          Đang đồng bộ dữ liệu từ cloud…
        </div>
      )}
      {children}
    </ChildContext.Provider>
  );
};

export const useChild = (): ChildContextType => {
  const context = useContext(ChildContext);
  if (!context) {
    throw new Error('useChild must be used within a ChildProvider');
  }
  return context;
};
