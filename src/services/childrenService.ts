import { Child } from '@/domain/types';
import { storage } from './storage';

export const childrenService = {
  getAll(): Child[] {
    return storage.getChildren();
  },

  getById(id: string): Child | undefined {
    return storage.getChildById(id);
  },

  create(childData: Omit<Child, 'id' | 'created_at' | 'updated_at'>): Child {
    const id = `child-${Date.now()}`;
    const newChild: Child = {
      ...childData,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const current = storage.getChildren();
    storage.saveChildren([...current, newChild]);
    return newChild;
  },

  update(id: string, updates: Partial<Omit<Child, 'id'>>): Child {
    const current = storage.getChildren();
    const existing = current.find((c) => c.id === id);
    if (!existing) {
      throw new Error(`Child with id ${id} not found`);
    }
    const updated: Child = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    storage.saveChildren(current.map((c) => (c.id === id ? updated : c)));
    return updated;
  },

  delete(id: string): void {
    const current = storage.getChildren();
    if (current.length <= 1) {
      throw new Error('Không thể xóa bé duy nhất trong gia đình!');
    }
    storage.saveChildren(current.filter((c) => c.id !== id));
    
    // If active child was deleted, switch to first remaining
    const settings = storage.getSettings();
    if (settings.activeChildId === id) {
      const remaining = current.filter((c) => c.id !== id);
      storage.saveSettings({ ...settings, activeChildId: remaining[0].id });
    }
  },

  getChildStats(childId: string) {
    const templates = storage.getTemplates().filter((t) => t.child_id === childId);
    const activeTemplate = templates.find((t) => t.status === 'active') || templates[0];
    const entries = activeTemplate
      ? storage.getEntries().filter((e) => e.timetable_id === activeTemplate.id)
      : [];
    const extraSchedules = storage.getExtraSchedules().filter((e) => e.child_id === childId && e.active);
    const achievements = storage.getAchievements().filter((a) => a.child_id === childId);
    const assessmentPlans = storage.getAssessmentPlans().filter((p) => p.child_id === childId);

    return {
      templateCount: templates.length,
      weeklyLessonsCount: entries.length,
      extraClassesCount: extraSchedules.length,
      achievementsCount: achievements.length,
      assessmentsCount: assessmentPlans.length,
    };
  },
};
