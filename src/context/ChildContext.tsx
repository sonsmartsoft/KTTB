import React, { createContext, useContext, useState, useEffect } from 'react';
import { Child } from '@/domain/types';
import { storage } from '@/services/storage';

interface ChildContextType {
  childrenList: Child[];
  activeChild: Child;
  setActiveChildId: (id: string) => void;
  refreshChildren: () => void;
  addChild: (child: Omit<Child, 'id'>) => void;
  updateChild: (child: Child) => void;
}

const ChildContext = createContext<ChildContextType | undefined>(undefined);

export const ChildProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  storage.init();
  const [childrenList, setChildrenList] = useState<Child[]>(() => storage.getChildren());
  const [activeChildId, setActiveChildIdState] = useState<string>(() => {
    return storage.getSettings().activeChildId || childrenList[0]?.id || 'child-trung-quan';
  });

  const refreshChildren = () => {
    const list = storage.getChildren();
    setChildrenList(list);
  };

  const setActiveChildId = (id: string) => {
    setActiveChildIdState(id);
    const settings = storage.getSettings();
    storage.saveSettings({ ...settings, activeChildId: id });
  };

  const addChild = (newChildData: Omit<Child, 'id'>) => {
    const id = `child-${Date.now()}`;
    const newChild: Child = { ...newChildData, id };
    const updated = [...childrenList, newChild];
    storage.saveChildren(updated);
    setChildrenList(updated);
    setActiveChildId(id);
  };

  const updateChild = (updatedChild: Child) => {
    const updated = childrenList.map((c) => (c.id === updatedChild.id ? updatedChild : c));
    storage.saveChildren(updated);
    setChildrenList(updated);
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
      }}
    >
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
