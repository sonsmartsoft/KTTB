import React, { useState, useEffect } from 'react';
import { useChild } from '@/context/ChildContext';
import { storage } from '@/services/storage';
import { Card } from '@/design-system/components/Card';
import { KpiGradientCard } from '@/design-system/components/KpiGradientCard';
import { Badge } from '@/design-system/components/Badge';
import { Button } from '@/design-system/components/Button';
import {
  Printer,
  Calendar,
  BookOpen,
  Clock,
  Edit3,
  Check,
  X,
  Plus,
  Trash2,
  Copy,
  GripVertical,
  RotateCcw,
  Sparkles,
  Settings2,
  Tag,
  Layers,
} from 'lucide-react';
import { DAY_HEADER_COLORS, getSubjectMeta } from '@/design-system/tokens/colors';
import { MascotBoy } from '@/design-system/illustrations/MascotBoy';
import { MascotGirl } from '@/design-system/illustrations/MascotGirl';
import { BookStack } from '@/design-system/illustrations/BookStack';
import { PushPin, SpeechBubble, MotivationalRibbon } from '@/design-system/illustrations/DecorativeBadges';
import { TimetableEntry, TimetableTemplate, WeekdayNumber, SessionType, SubjectItem, TimetableLegendItem, ExtraSchedule } from '@/domain/types';
import { SEED_TIMETABLE_LEGEND } from '@/services/seedData';

const MORNING_TIMES = ['7:00 – 7:45', '8:45 – 9:30', '9:50 – 10:35', '10:55 – 11:40'];
const AFTERNOON_TIMES = ['13:30 – 14:15', '14:35 – 15:20', '15:40 – 16:25'];

export const TimetablePage: React.FC = () => {
  const { activeChild } = useChild();

  const isGirl = activeChild.avatar_url?.includes('girl') || activeChild.nickname === 'Bé Băng';

  // Dynamic Subjects state from storage
  const [subjectList, setSubjectList] = useState<SubjectItem[]>(() => storage.getSubjects());
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjCode, setNewSubjCode] = useState('');
  const [newSubjNote, setNewSubjNote] = useState('');
  const [newSubjColor, setNewSubjColor] = useState('#2563EB');

  // Editing Subject in Modal
  const [editingSubjId, setEditingSubjId] = useState<string | null>(null);
  const [editSubjName, setEditSubjName] = useState('');
  const [editSubjCode, setEditSubjCode] = useState('');
  const [editSubjNote, setEditSubjNote] = useState('');
  const [editSubjColor, setEditSubjColor] = useState('#2563EB');

  // Dynamic Timetable Legend / Ghi chú viết tắt
  const [legendList, setLegendList] = useState<TimetableLegendItem[]>(() => storage.getTimetableLegend());
  const [isLegendModalOpen, setIsLegendModalOpen] = useState(false);
  const [newLegendCode, setNewLegendCode] = useState('');
  const [newLegendNote, setNewLegendNote] = useState('');
  const [editingLegendId, setEditingLegendId] = useState<string | null>(null);
  const [editLegendCode, setEditLegendCode] = useState('');
  const [editLegendNote, setEditLegendNote] = useState('');

  // Templates of active child
  const templates = storage.getTemplates().filter((t) => t.child_id === activeChild.id);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');

  // Keep selectedTemplateId in sync when child changes
  useEffect(() => {
    if (templates.length > 0 && (!selectedTemplateId || !templates.some((t) => t.id === selectedTemplateId))) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [activeChild.id, templates]);

  const activeTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0] || null;

  // Edit Mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [draftEntries, setDraftEntries] = useState<TimetableEntry[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync draftEntries when activeTemplate changes or when entering edit mode
  useEffect(() => {
    if (activeTemplate) {
      const current = storage.getEntries().filter((e) => e.timetable_id === activeTemplate.id);
      setDraftEntries(current);
      setHasUnsavedChanges(false);
    }
  }, [activeTemplate?.id]);

  // Drag and Drop state
  const [draggedEntry, setDraggedEntry] = useState<TimetableEntry | null>(null);
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);

  // Quick Edit Modal state
  const [editingSlot, setEditingSlot] = useState<{
    entry?: TimetableEntry;
    weekday: WeekdayNumber;
    session: SessionType;
    period: number;
    defaultTimes: string;
  } | null>(null);

  const [formSubject, setFormSubject] = useState('');
  const [formTeacher, setFormTeacher] = useState('');
  const [formRoom, setFormRoom] = useState('');
  const [formNote, setFormNote] = useState('');

  // Duplicate Version Modal state
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [dupName, setDupName] = useState('');
  const [dupSemester, setDupSemester] = useState('HK2');
  const [dupValidFrom, setDupValidFrom] = useState('2027-01-01');
  const [dupValidTo, setDupValidTo] = useState('2027-05-31');

  // Extra classes for evening
  const [extraList, setExtraList] = useState<ExtraSchedule[]>(() =>
    storage.getExtraSchedules().filter((e) => e.child_id === activeChild.id && e.active)
  );

  useEffect(() => {
    setExtraList(storage.getExtraSchedules().filter((e) => e.child_id === activeChild.id && e.active));
  }, [activeChild.id]);

  // Extra Class Modal State
  const [editingExtra, setEditingExtra] = useState<ExtraSchedule | null>(null);
  const [isNewExtraModalOpen, setIsNewExtraModalOpen] = useState(false);
  const [formExtraName, setFormExtraName] = useState('');
  const [formExtraNote, setFormExtraNote] = useState('');
  const [formExtraWeekdays, setFormExtraWeekdays] = useState<WeekdayNumber[]>([2]);
  const [formExtraSession, setFormExtraSession] = useState<SessionType>('evening');
  const [formExtraStartTime, setFormExtraStartTime] = useState('17:15');
  const [formExtraEndTime, setFormExtraEndTime] = useState('19:15');
  const [formExtraColor, setFormExtraColor] = useState('#DB2777');

  const openEditExtraModal = (extra: ExtraSchedule) => {
    setEditingExtra(extra);
    setIsNewExtraModalOpen(false);
    setFormExtraName(extra.name);
    setFormExtraNote(extra.note || '');
    setFormExtraWeekdays([...extra.weekdays]);
    setFormExtraStartTime(extra.start_time);
    setFormExtraEndTime(extra.end_time);
    const sess: SessionType =
      extra.session || (extra.start_time < '12:00' ? 'morning' : extra.start_time < '17:00' ? 'afternoon' : 'evening');
    setFormExtraSession(sess);
    setFormExtraColor(extra.color || '#DB2777');
  };

  const openCreateExtraModal = (
    defaultWeekday?: WeekdayNumber,
    defaultCa?: 1 | 2,
    defaultSession?: SessionType
  ) => {
    setEditingExtra(null);
    setIsNewExtraModalOpen(true);
    setFormExtraName('');
    setFormExtraNote('');
    setFormExtraWeekdays(defaultWeekday ? [defaultWeekday] : [4, 7]);

    const sess =
      defaultSession || (defaultCa ? 'evening' : defaultWeekday === 8 ? 'morning' : 'evening');
    setFormExtraSession(sess);

    if (sess === 'morning') {
      setFormExtraStartTime('08:00');
      setFormExtraEndTime('10:00');
    } else if (sess === 'afternoon') {
      setFormExtraStartTime('14:00');
      setFormExtraEndTime('16:00');
    } else if (defaultCa === 2) {
      setFormExtraStartTime('19:15');
      setFormExtraEndTime('21:15');
    } else {
      setFormExtraStartTime('17:15');
      setFormExtraEndTime('19:15');
    }
    setFormExtraColor('#DB2777');
  };

  const handleSaveExtra = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formExtraName.trim() || formExtraWeekdays.length === 0) return;

    const deducedSession: SessionType =
      formExtraSession ||
      (formExtraStartTime < '12:00' ? 'morning' : formExtraStartTime < '17:00' ? 'afternoon' : 'evening');

    if (editingExtra) {
      storage.updateExtraSchedule(editingExtra.id, {
        name: formExtraName.trim(),
        note: formExtraNote.trim() || undefined,
        weekdays: formExtraWeekdays,
        session: deducedSession,
        start_time: formExtraStartTime,
        end_time: formExtraEndTime,
        color: formExtraColor,
      });
    } else {
      storage.addExtraSchedule({
        child_id: activeChild.id,
        name: formExtraName.trim(),
        category: 'other',
        session: deducedSession,
        weekdays: formExtraWeekdays,
        start_time: formExtraStartTime,
        end_time: formExtraEndTime,
        note: formExtraNote.trim() || undefined,
        color: formExtraColor,
        active: true,
      });
    }

    setExtraList(storage.getExtraSchedules().filter((e) => e.child_id === activeChild.id && e.active));
    setEditingExtra(null);
    setIsNewExtraModalOpen(false);
  };

  const handleDeleteExtra = (extraId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xoá lớp học thêm này?')) {
      storage.deleteExtraSchedule(extraId);
      setExtraList(storage.getExtraSchedules().filter((e) => e.child_id === activeChild.id && e.active));
      setEditingExtra(null);
      setIsNewExtraModalOpen(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const weekdays = [2, 3, 4, 5, 6, 7, 8] as const;

  // Toggle Edit Mode
  const handleEnterEditMode = () => {
    if (activeTemplate) {
      const current = storage.getEntries().filter((e) => e.timetable_id === activeTemplate.id);
      setDraftEntries(current);
      setHasUnsavedChanges(false);
    }
    setIsEditMode(true);
  };

  const handleCancelEditMode = () => {
    if (activeTemplate) {
      const original = storage.getEntries().filter((e) => e.timetable_id === activeTemplate.id);
      setDraftEntries(original);
    }
    setHasUnsavedChanges(false);
    setIsEditMode(false);
    setEditingSlot(null);
  };

  const handleSaveChanges = () => {
    if (!activeTemplate) return;
    storage.setEntriesForTimetable(activeTemplate.id, draftEntries);
    setHasUnsavedChanges(false);
    setIsEditMode(false);
    setEditingSlot(null);
  };

  // Open Edit Modal for a slot
  const openSlotEditor = (
    weekday: WeekdayNumber,
    session: SessionType,
    period: number,
    existingEntry?: TimetableEntry
  ) => {
    const defaultTimes = session === 'morning' ? MORNING_TIMES[period - 1] : AFTERNOON_TIMES[period - 1];
    setEditingSlot({
      entry: existingEntry,
      weekday,
      session,
      period,
      defaultTimes: defaultTimes || '07:00 – 07:45',
    });
    setFormSubject(existingEntry?.subject || '');
    setFormTeacher(existingEntry?.teacher || '');
    setFormRoom(existingEntry?.room || '');
    setFormNote(existingEntry?.note || '');
  };

  const handleAddNewSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjName.trim()) return;
    const added = storage.addSubject({
      name: newSubjName.trim(),
      code: newSubjCode.trim() || undefined,
      note: newSubjNote.trim() || undefined,
      color: newSubjColor,
      is_custom: true,
      category: 'core',
    });
    setSubjectList(storage.getSubjects());
    setNewSubjName('');
    setNewSubjCode('');
    setNewSubjNote('');
    if (editingSlot) {
      setFormSubject(added.name);
    }
  };

  const handleStartEditSubject = (subj: SubjectItem) => {
    setEditingSubjId(subj.id);
    setEditSubjName(subj.name);
    setEditSubjCode(subj.code || '');
    setEditSubjNote(subj.note || '');
    setEditSubjColor(subj.color || '#2563EB');
  };

  const handleCancelEditSubject = () => {
    setEditingSubjId(null);
    setEditSubjName('');
    setEditSubjCode('');
    setEditSubjNote('');
  };

  const handleSaveEditSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubjId || !editSubjName.trim()) return;
    const oldSubj = subjectList.find((s) => s.id === editingSubjId);
    const oldName = oldSubj?.name;
    const newName = editSubjName.trim();

    storage.updateSubject(editingSubjId, {
      name: newName,
      code: editSubjCode.trim() || undefined,
      note: editSubjNote.trim() || undefined,
      color: editSubjColor,
    });

    if (oldName && oldName !== newName) {
      storage.renameSubjectAcrossTimetables(oldName, newName);
      setDraftEntries((prev) =>
        prev.map((item) => (item.subject === oldName ? { ...item, subject: newName } : item))
      );
      if (formSubject === oldName) {
        setFormSubject(newName);
      }
    }

    setSubjectList(storage.getSubjects());
    handleCancelEditSubject();
  };

  const handleDeleteSubject = (subj: SubjectItem) => {
    if (window.confirm(`Bạn có chắc chắn muốn xoá môn "${subj.name}" khỏi danh mục?`)) {
      storage.deleteSubject(subj.id);
      setSubjectList(storage.getSubjects());
      if (editingSubjId === subj.id) {
        handleCancelEditSubject();
      }
    }
  };

  // Legend Handlers
  const handleAddLegendItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLegendCode.trim() || !newLegendNote.trim()) return;
    storage.addTimetableLegendItem({
      code: newLegendCode.trim(),
      note: newLegendNote.trim(),
    });
    setLegendList(storage.getTimetableLegend());
    setNewLegendCode('');
    setNewLegendNote('');
  };

  const handleStartEditLegend = (item: TimetableLegendItem) => {
    setEditingLegendId(item.id);
    setEditLegendCode(item.code);
    setEditLegendNote(item.note);
  };

  const handleCancelEditLegend = () => {
    setEditingLegendId(null);
    setEditLegendCode('');
    setEditLegendNote('');
  };

  const handleSaveEditLegend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLegendId || !editLegendCode.trim() || !editLegendNote.trim()) return;
    storage.updateTimetableLegendItem(editingLegendId, {
      code: editLegendCode.trim(),
      note: editLegendNote.trim(),
    });
    setLegendList(storage.getTimetableLegend());
    handleCancelEditLegend();
  };

  const handleDeleteLegendItem = (id: string) => {
    storage.deleteTimetableLegendItem(id);
    setLegendList(storage.getTimetableLegend());
    if (editingLegendId === id) {
      handleCancelEditLegend();
    }
  };

  const handleSyncLegendFromSubjects = () => {
    const fromSubjects: TimetableLegendItem[] = subjectList
      .filter((s) => s.code && s.note)
      .map((s) => ({
        id: `leg-sync-${s.id}`,
        code: s.code || s.name,
        note: s.note || s.name,
      }));
    if (fromSubjects.length > 0) {
      storage.saveTimetableLegend(fromSubjects);
      setLegendList(fromSubjects);
    }
  };

  const handleResetLegendDefault = () => {
    storage.saveTimetableLegend(SEED_TIMETABLE_LEGEND);
    setLegendList(SEED_TIMETABLE_LEGEND);
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot || !activeTemplate || !formSubject.trim()) return;

    const [startTime, endTime] = editingSlot.defaultTimes.split(' – ').map((s) => s.trim());

    let updatedList: TimetableEntry[] = [];
    if (editingSlot.entry) {
      // Update existing entry
      updatedList = draftEntries.map((item) =>
        item.id === editingSlot.entry!.id
          ? {
              ...item,
              subject: formSubject.trim(),
              teacher: formTeacher.trim() || undefined,
              room: formRoom.trim() || undefined,
              note: formNote.trim() || undefined,
            }
          : item
      );
    } else {
      // Add new entry
      const newEntry: TimetableEntry = {
        id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        timetable_id: activeTemplate.id,
        weekday: editingSlot.weekday,
        session: editingSlot.session,
        period: editingSlot.period,
        start_time: startTime || '07:00',
        end_time: endTime || '07:45',
        subject: formSubject.trim(),
        teacher: formTeacher.trim() || undefined,
        room: formRoom.trim() || undefined,
        note: formNote.trim() || undefined,
      };
      updatedList = [...draftEntries, newEntry];
    }

    setDraftEntries(updatedList);
    if (!isEditMode) {
      // Direct quick edit mode saved directly!
      storage.setEntriesForTimetable(activeTemplate.id, updatedList);
    } else {
      setHasUnsavedChanges(true);
    }
    setEditingSlot(null);
  };

  const handleDeleteSlot = (entryId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDraftEntries((prev) => prev.filter((item) => item.id !== entryId));
    setHasUnsavedChanges(true);
  };

  // Drag and Drop Logic
  const handleDragStart = (entry: TimetableEntry) => {
    setDraggedEntry(entry);
  };

  const handleDragOver = (e: React.DragEvent, slotKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dropTargetKey !== slotKey) {
      setDropTargetKey(slotKey);
    }
  };

  const handleDragLeave = () => {
    setDropTargetKey(null);
  };

  const handleDrop = (
    e: React.DragEvent,
    targetWeekday: WeekdayNumber,
    targetSession: SessionType,
    targetPeriod: number
  ) => {
    e.preventDefault();
    setDropTargetKey(null);
    if (!draggedEntry) return;

    const existingAtTarget = draftEntries.find(
      (item) =>
        item.weekday === targetWeekday &&
        item.session === targetSession &&
        item.period === targetPeriod &&
        item.id !== draggedEntry.id
    );

    const targetTimes =
      targetSession === 'morning'
        ? MORNING_TIMES[targetPeriod - 1]?.split(' – ')
        : AFTERNOON_TIMES[targetPeriod - 1]?.split(' – ');

    const [tStartTime, tEndTime] = targetTimes || ['07:00', '07:45'];

    if (existingAtTarget) {
      // SWAP positions
      setDraftEntries((prev) =>
        prev.map((item) => {
          if (item.id === draggedEntry.id) {
            return {
              ...item,
              weekday: targetWeekday,
              session: targetSession,
              period: targetPeriod,
              start_time: tStartTime,
              end_time: tEndTime,
            };
          }
          if (item.id === existingAtTarget.id) {
            return {
              ...item,
              weekday: draggedEntry.weekday,
              session: draggedEntry.session,
              period: draggedEntry.period,
              start_time: draggedEntry.start_time,
              end_time: draggedEntry.end_time,
            };
          }
          return item;
        })
      );
    } else {
      // MOVE to empty slot
      setDraftEntries((prev) =>
        prev.map((item) => {
          if (item.id === draggedEntry.id) {
            return {
              ...item,
              weekday: targetWeekday,
              session: targetSession,
              period: targetPeriod,
              start_time: tStartTime,
              end_time: tEndTime,
            };
          }
          return item;
        })
      );
    }

    setHasUnsavedChanges(true);
    setDraggedEntry(null);
  };

  // Duplicate Timetable Handler
  const handleOpenDuplicateModal = () => {
    if (!activeTemplate) return;
    setDupName(`${activeTemplate.name} (Bản sao HK2)`);
    setDupSemester('HK2');
    setDupValidFrom('2027-01-01');
    setDupValidTo('2027-05-31');
    setIsDuplicateModalOpen(true);
  };

  const handleConfirmDuplicate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTemplate) return;
    try {
      const newTemplate = storage.duplicateTemplate(
        activeTemplate.id,
        dupName.trim(),
        dupSemester.trim(),
        dupValidFrom,
        dupValidTo
      );
      setSelectedTemplateId(newTemplate.id);
      setIsDuplicateModalOpen(false);
    } catch (err) {
      console.error('Failed to duplicate:', err);
    }
  };

  const activeEntries = isEditMode ? draftEntries : activeTemplate
    ? storage.getEntries().filter((e) => e.timetable_id === activeTemplate.id)
    : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl md:text-2xl font-bold font-display text-content-primary flex items-center gap-2">
              <span>Thời Khóa Biểu Tuần</span>
            </h2>

            {/* Version Switcher Dropdown */}
            {templates.length > 0 && (
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                disabled={isEditMode}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-app-border bg-app-surface text-content-primary focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              >
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name} ({tpl.semester}) — {tpl.valid_from} đến {tpl.valid_to}
                  </option>
                ))}
              </select>
            )}

            {activeTemplate && <Badge variant="primary">{activeTemplate.semester}</Badge>}
          </div>

          <p className="text-xs text-content-secondary mt-1">
            {activeChild.name} • {activeChild.class_name} • {activeChild.school_name} (
            {activeTemplate?.school_year || '2026–2027'})
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Duplicate Version Button */}
          {!isEditMode && activeTemplate && (
            <Button
              variant="outline"
              size="sm"
              icon={<Copy className="w-4 h-4" />}
              onClick={handleOpenDuplicateModal}
              title="Nhân bản sang học kỳ mới"
            >
              Nhân bản TKB
            </Button>
          )}

          {/* Print Button */}
          {!isEditMode && (
            <Button variant="outline" size="sm" icon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
              In A4
            </Button>
          )}

          {/* Subject Manager Button */}
          {!isEditMode && (
            <Button
              variant="outline"
              size="sm"
              icon={<Settings2 className="w-4 h-4" />}
              onClick={() => setIsSubjectModalOpen(true)}
              title="Cấu hình danh mục môn học"
            >
              Môn học
            </Button>
          )}

          {/* EDIT MODE TOGGLE BUTTON */}
          {!isEditMode ? (
            <Button
              variant="primary"
              size="sm"
              icon={<Edit3 className="w-4 h-4" />}
              onClick={handleEnterEditMode}
              className="shadow-sm"
            >
              Chỉnh sửa TKB
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={<X className="w-4 h-4" />}
                onClick={handleCancelEditMode}
              >
                Huỷ bỏ
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Check className="w-4 h-4" />}
                onClick={handleSaveChanges}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-theme-md"
              >
                Lưu thay đổi {hasUnsavedChanges && '●'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Notice when in Edit Mode */}
      {isEditMode && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-amber-900 shadow-sm animate-in fade-in slide-in-from-top-2 no-print">
          <div className="flex items-center gap-2.5 text-xs md:text-sm font-medium">
            <span className="text-xl">✏️</span>
            <div>
              <strong className="font-bold">Đang ở Chế độ Chỉnh sửa:</strong> Bạn có thể{' '}
              <span className="underline decoration-amber-500 font-semibold">kéo-thả môn học</span> để hoán đổi
              vị trí giữa các tiết, click trực tiếp vào ô để sửa hoặc bấm nút <span className="font-bold">(+)</span>{' '}
              để thêm môn.
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={handleCancelEditMode} className="text-xs">
              Huỷ
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveChanges}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
            >
              Lưu thay đổi
            </Button>
          </div>
        </div>
      )}

      {/* Weekly Stats KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 no-print">
        <KpiGradientCard
          colorType="blue"
          icon={BookOpen}
          title="TỔNG TIẾT HỌC"
          value={activeEntries.length}
          unit="tiết / tuần"
          subtitle="Tất cả buổi học"
          size="compact"
        />
        <KpiGradientCard
          colorType="amber"
          icon={Clock}
          title="BUỔI SÁNG"
          value={activeEntries.filter((e) => e.session === 'morning').length}
          unit="tiết"
          subtitle="Ca sáng (7:00–11:40)"
          size="compact"
          progressPercent={activeEntries.length > 0 ? Math.round((activeEntries.filter((e) => e.session === 'morning').length / activeEntries.length) * 100) : 0}
          progressLabel="Tỷ lệ buổi sáng"
        />
        <KpiGradientCard
          colorType="cyan"
          icon={Calendar}
          title="BUỔI CHIỀU"
          value={activeEntries.filter((e) => e.session === 'afternoon').length}
          unit="tiết"
          subtitle="Ca chiều (13:30–16:25)"
          size="compact"
          progressPercent={activeEntries.length > 0 ? Math.round((activeEntries.filter((e) => e.session === 'afternoon').length / activeEntries.length) * 100) : 0}
          progressLabel="Tỷ lệ buổi chiỀu"
        />
        <KpiGradientCard
          colorType="purple"
          icon={Sparkles}
          title="LẬp HỌC THÊM"
          value={extraList.length}
          unit="lớp"
          subtitle="Hoạt động ngoại khóa"
          size="compact"
          badgeText={extraList.length > 0 ? `${extraList.length} môn` : 'Chưa có'}
        />
      </div>

      {/* Hero A4 Infographic Layout matching sample.png */}
      <div className="timetable-print-container bg-white border border-app-border rounded-theme-card p-4 md:p-6 shadow-theme-md overflow-x-auto">
        {/* Infographic Header with mascot & slogans */}
        <div className="flex items-center justify-between pb-6 border-b border-blue-100 relative">
          {/* Left Mascot & Speech Bubble */}
          <div className="hidden lg:flex items-center gap-3">
            {isGirl ? <MascotGirl size={110} /> : <MascotBoy size={110} />}
            <SpeechBubble
              text="Cố gắng mỗi ngày để chạm tới ước mơ! ♡"
              subtext="Năm học 2026 - 2027"
              className="max-w-[190px]"
            />
          </div>

          {/* Central 3D Banner */}
          <div className="text-center flex-1">
            <h1 className="text-2xl md:text-4xl font-extrabold text-blue-600 font-display tracking-tight drop-shadow-sm">
              THỜI KHÓA BIỂU
            </h1>
            <div className="inline-block mt-1">
              <span className="text-2xl md:text-3xl font-black px-4 py-1 rounded-xl bg-amber-400 text-blue-900 border-2 border-blue-900 shadow-theme-pop uppercase font-display">
                {activeChild.class_name}
              </span>
            </div>
            <div className="mt-2 text-xs font-bold text-rose-500">
              ♥ Năm học {activeTemplate?.school_year || '2026 - 2027'} ({activeTemplate?.semester || 'HK1'}) ♥
            </div>
          </div>

          {/* Right Mascot & Quote */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="text-right">
              <MotivationalRibbon text="Học tốt, Rèn luyện tốt" subtext="Cùng nhau tiến bộ! ♡" />
            </div>
            <BookStack size={95} />
          </div>
        </div>

        {/* Timetable Matrix Grid */}
        <div className="w-full overflow-x-auto rounded-2xl bg-slate-100/90 dark:bg-slate-900/70 p-2 border border-slate-200/80 shadow-sm mt-4">
          <table className="w-full table-fixed border-collapse">
            <colgroup>
              <col style={{ width: '84px' }} />
              <col style={{ width: '56px' }} />
              <col style={{ width: '92px' }} />
              {weekdays.map((w) => (
                <col key={w} style={{ width: 'calc((100% - 232px) / 7)' }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th className="p-2 text-xs font-bold text-white bg-blue-700 rounded-tl-xl text-center border-2 border-white tracking-wide">
                  Buổi
                </th>
                <th className="p-2 text-xs font-bold text-white bg-blue-600 text-center border-2 border-white tracking-wide">
                  Tiết
                </th>
                <th className="p-2 text-xs font-bold text-white bg-blue-500 text-center border-2 border-white tracking-wide">
                  Thời gian
                </th>
                {weekdays.map((w, idx) => {
                  const conf = DAY_HEADER_COLORS[w];
                  const isLast = idx === weekdays.length - 1;
                  return (
                    <th
                      key={w}
                      className={`p-2 text-xs font-extrabold text-white text-center border-2 border-white uppercase tracking-wider ${isLast ? 'rounded-tr-xl' : ''}`}
                      style={{ backgroundColor: conf.bg }}
                    >
                      {conf.label}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {/* SÁNG (Morning 4 periods) */}
              {[1, 2, 3, 4].map((period, idx) => {
                const times = MORNING_TIMES[idx];
                return (
                  <tr key={`morning-${period}`} className="border-b border-white hover:bg-slate-50/50">
                    {idx === 0 && (
                      <td
                        rowSpan={4}
                        className="p-2 text-center bg-amber-50/90 border-2 border-white align-middle"
                      >
                        <div className="text-2xl mb-1">☀️</div>
                        <div className="text-xs font-black text-amber-800 uppercase">Buổi sáng</div>
                        <div className="text-[10px] text-amber-700 font-mono">(7:00 – 11:30)</div>
                      </td>
                    )}
                    <td className="p-2 text-center font-bold text-xs text-slate-700 bg-slate-50/90 border-2 border-white">
                      Tiết {period}
                    </td>
                    <td className="p-2 text-center text-[11px] font-mono text-slate-600 bg-slate-50/90 border-2 border-white">
                      {times}
                    </td>
                    {weekdays.map((weekday) => {
                      const entry = activeEntries.find(
                        (e) => e.session === 'morning' && e.weekday === weekday && e.period === period
                      );
                      const slotKey = `morning-${weekday}-${period}`;
                      const isDropTarget = dropTargetKey === slotKey;

                      // Check if day has school entries in morning
                      const hasSchoolEntryInMorning = activeEntries.some(
                        (e) => e.session === 'morning' && e.weekday === weekday
                      );
                      const morningExtra = extraList.find(
                        (ex) =>
                          ex.weekdays.includes(weekday) &&
                          (ex.session === 'morning' || ex.start_time < '12:00')
                      );

                      if (!hasSchoolEntryInMorning && morningExtra) {
                        if (idx === 0) {
                          const meta = getSubjectMeta(morningExtra.name);
                          return (
                            <td
                              key={weekday}
                              rowSpan={4}
                              onClick={() => openEditExtraModal(morningExtra)}
                              title="Lớp học thêm buổi sáng — Nhấp để chỉnh sửa"
                              className="p-1 border-2 border-white align-middle cursor-pointer group relative bg-amber-50/20"
                            >
                              <div
                                className={`p-2 rounded-lg border ${meta.bgClass} ${meta.borderClass} text-center min-h-[140px] flex flex-col justify-center transition-all group-hover:shadow-md group-hover:scale-[1.01] relative`}
                              >
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-80 text-slate-400 hover:text-primary transition-opacity">
                                  <Edit3 className="w-3 h-3" />
                                </div>
                                <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                                  <span>☀️</span>
                                  <span>Học thêm sáng</span>
                                </div>
                                <div className={`text-xs font-bold ${meta.textClass} leading-tight`}>
                                  {morningExtra.name}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono mt-1 font-semibold">
                                  {morningExtra.start_time} – {morningExtra.end_time}
                                </div>
                                {morningExtra.note && (
                                  <div
                                    className="text-[9px] text-amber-900 bg-amber-100/90 px-1 py-0.5 rounded border border-amber-200/70 mt-1.5 truncate max-w-full font-normal leading-tight text-center"
                                    title={`Ghi chú: ${morningExtra.note}`}
                                  >
                                    📝 {morningExtra.note}
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        }
                        return null;
                      }

                      if (!entry) {
                        return (
                          <td
                            key={weekday}
                            onDragOver={isEditMode ? (e) => handleDragOver(e, slotKey) : undefined}
                            onDragLeave={isEditMode ? handleDragLeave : undefined}
                            onDrop={isEditMode ? (e) => handleDrop(e, weekday, 'morning', period) : undefined}
                            onClick={() => {
                              if (weekday === 8) {
                                openCreateExtraModal(8, undefined, 'morning');
                              } else {
                                openSlotEditor(weekday, 'morning', period);
                              }
                            }}
                            title={weekday === 8 ? 'Nhấp để thêm lớp học thêm buổi sáng' : 'Nhấp để thêm môn học'}
                            className={`p-1.5 text-center border-2 border-white transition-colors cursor-pointer hover:bg-blue-50/60 ${
                              isEditMode
                                ? 'border-dashed border-blue-200'
                                : 'text-slate-300'
                            } ${isDropTarget ? 'bg-blue-100 border-2 border-primary' : ''}`}
                          >
                            {isEditMode ? (
                              <div className="min-h-[46px] rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary">
                                <Plus className="w-4 h-4" />
                              </div>
                            ) : (
                              '—'
                            )}
                          </td>
                        );
                      }

                      const meta = getSubjectMeta(entry.subject);
                      return (
                        <td
                          key={weekday}
                          onDragOver={isEditMode ? (e) => handleDragOver(e, slotKey) : undefined}
                          onDragLeave={isEditMode ? handleDragLeave : undefined}
                          onDrop={isEditMode ? (e) => handleDrop(e, weekday, 'morning', period) : undefined}
                          onClick={() => openSlotEditor(weekday, 'morning', period, entry)}
                          title="Nhấp để chỉnh sửa môn & ghi chú tiết học"
                          className={`p-1 border-2 border-white relative group transition-all cursor-pointer ${
                            isDropTarget ? 'ring-2 ring-primary ring-inset bg-blue-50' : ''
                          }`}
                        >
                          <div
                            draggable={isEditMode}
                            onDragStart={() => handleDragStart(entry)}
                            className={`p-1.5 rounded-lg border ${meta.bgClass} ${meta.borderClass} text-center min-h-[46px] flex flex-col justify-center transition-all ${
                              isEditMode
                                ? 'cursor-grab active:cursor-grabbing hover:shadow-md ring-1 ring-black/5 hover:scale-[1.02]'
                                : 'hover:shadow-md hover:scale-[1.01]'
                            }`}
                          >
                            {/* Grip handle indicator in edit mode */}
                            {isEditMode && (
                              <div className="absolute top-1 left-1 opacity-40 group-hover:opacity-100 text-slate-500">
                                <GripVertical className="w-3 h-3" />
                              </div>
                            )}

                            {/* Quick Edit hint on hover */}
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-80 text-slate-400 hover:text-primary transition-opacity">
                              <Edit3 className="w-3 h-3" />
                            </div>

                            {/* Delete Button in edit mode */}
                            {isEditMode && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSlot(entry.id, e);
                                }}
                                title="Xoá môn"
                                className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            )}

                            <div className={`text-xs font-bold ${meta.textClass} leading-tight`}>
                              {entry.subject}
                            </div>
                            {entry.teacher && (
                              <div className="text-[10px] text-slate-500 mt-0.5 leading-none">
                                - {entry.teacher}
                              </div>
                            )}
                            {entry.room && (
                              <div className="text-[9px] text-slate-400 mt-0.5 font-mono leading-none">
                                P.{entry.room}
                              </div>
                            )}
                            {entry.note && (
                              <div
                                className="text-[9px] text-amber-900 bg-amber-100/90 px-1 py-0.5 rounded border border-amber-200/70 mt-1 truncate max-w-full font-normal leading-tight text-center flex items-center justify-center gap-0.5 shadow-2xs"
                                title={`Ghi chú: ${entry.note}`}
                              >
                                <span className="shrink-0 text-[10px]">📝</span>
                                <span className="truncate">{entry.note}</span>
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {/* CHIỀU (Afternoon 3 periods) */}
              {[1, 2, 3].map((period, idx) => {
                const times = AFTERNOON_TIMES[idx];
                return (
                  <tr key={`afternoon-${period}`} className="border-b border-white hover:bg-slate-50/50">
                    {idx === 0 && (
                      <td
                        rowSpan={3}
                        className="p-2 text-center bg-sky-50 border-2 border-white align-middle"
                      >
                        <div className="text-2xl mb-1">☁️</div>
                        <div className="text-xs font-black text-sky-800 uppercase">Buổi chiều</div>
                        <div className="text-[10px] text-sky-700 font-mono">(13:30 – 17:00)</div>
                      </td>
                    )}
                    <td className="p-2 text-center font-bold text-xs text-slate-700 bg-slate-50 border-2 border-white">
                      Tiết {period}
                    </td>
                    <td className="p-2 text-center text-[11px] font-mono text-slate-600 bg-slate-50 border-2 border-white">
                      {times}
                    </td>
                    {weekdays.map((weekday) => {
                      const entry = activeEntries.find(
                        (e) => e.session === 'afternoon' && e.weekday === weekday && e.period === period
                      );
                      const slotKey = `afternoon-${weekday}-${period}`;
                      const isDropTarget = dropTargetKey === slotKey;

                      // Check if day has school entries in afternoon
                      const hasSchoolEntryInAfternoon = activeEntries.some(
                        (e) => e.session === 'afternoon' && e.weekday === weekday
                      );
                      const afternoonExtra = extraList.find(
                        (ex) =>
                          ex.weekdays.includes(weekday) &&
                          (ex.session === 'afternoon' ||
                            (ex.start_time >= '12:00' && ex.start_time < '17:00'))
                      );

                      if (!hasSchoolEntryInAfternoon && afternoonExtra) {
                        if (idx === 0) {
                          const meta = getSubjectMeta(afternoonExtra.name);
                          return (
                            <td
                              key={weekday}
                              rowSpan={3}
                              onClick={() => openEditExtraModal(afternoonExtra)}
                              title="Lớp học thêm buổi chiều — Nhấp để chỉnh sửa"
                              className="p-1 border-2 border-white align-middle cursor-pointer group relative bg-sky-50/20"
                            >
                              <div
                                className={`p-2 rounded-lg border ${meta.bgClass} ${meta.borderClass} text-center min-h-[110px] flex flex-col justify-center transition-all group-hover:shadow-md group-hover:scale-[1.01] relative`}
                              >
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-80 text-slate-400 hover:text-primary transition-opacity">
                                  <Edit3 className="w-3 h-3" />
                                </div>
                                <div className="text-[10px] font-bold text-sky-700 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                                  <span>☁️</span>
                                  <span>Học thêm chiều</span>
                                </div>
                                <div className={`text-xs font-bold ${meta.textClass} leading-tight`}>
                                  {afternoonExtra.name}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono mt-1 font-semibold">
                                  {afternoonExtra.start_time} – {afternoonExtra.end_time}
                                </div>
                                {afternoonExtra.note && (
                                  <div
                                    className="text-[9px] text-amber-900 bg-amber-100/90 px-1 py-0.5 rounded border border-amber-200/70 mt-1.5 truncate max-w-full font-normal leading-tight text-center"
                                    title={`Ghi chú: ${afternoonExtra.note}`}
                                  >
                                    📝 {afternoonExtra.note}
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        }
                        return null;
                      }

                      if (!entry) {
                        return (
                          <td
                            key={weekday}
                            onDragOver={isEditMode ? (e) => handleDragOver(e, slotKey) : undefined}
                            onDragLeave={isEditMode ? handleDragLeave : undefined}
                            onDrop={isEditMode ? (e) => handleDrop(e, weekday, 'afternoon', period) : undefined}
                            onClick={() => {
                              if (weekday === 8) {
                                openCreateExtraModal(8, undefined, 'afternoon');
                              } else {
                                openSlotEditor(weekday, 'afternoon', period);
                              }
                            }}
                            title={weekday === 8 ? 'Nhấp để thêm lớp học thêm buổi chiều' : 'Nhấp để thêm môn học'}
                            className={`p-1.5 text-center border-2 border-white transition-colors cursor-pointer hover:bg-blue-50/60 ${
                              isEditMode
                                ? 'border-dashed border-blue-200'
                                : 'text-slate-300'
                            } ${isDropTarget ? 'bg-blue-100 border-2 border-primary' : ''}`}
                          >
                            {isEditMode ? (
                              <div className="min-h-[46px] rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary">
                                <Plus className="w-4 h-4" />
                              </div>
                            ) : (
                              '—'
                            )}
                          </td>
                        );
                      }

                      const meta = getSubjectMeta(entry.subject);
                      return (
                        <td
                          key={weekday}
                          onDragOver={isEditMode ? (e) => handleDragOver(e, slotKey) : undefined}
                          onDragLeave={isEditMode ? handleDragLeave : undefined}
                          onDrop={isEditMode ? (e) => handleDrop(e, weekday, 'afternoon', period) : undefined}
                          onClick={() => openSlotEditor(weekday, 'afternoon', period, entry)}
                          title="Nhấp để chỉnh sửa môn & ghi chú tiết học"
                          className={`p-1 border-2 border-white relative group transition-all cursor-pointer ${
                            isDropTarget ? 'ring-2 ring-primary ring-inset bg-blue-50' : ''
                          }`}
                        >
                          <div
                            draggable={isEditMode}
                            onDragStart={() => handleDragStart(entry)}
                            className={`p-1.5 rounded-lg border ${meta.bgClass} ${meta.borderClass} text-center min-h-[46px] flex flex-col justify-center transition-all ${
                              isEditMode
                                ? 'cursor-grab active:cursor-grabbing hover:shadow-md ring-1 ring-black/5 hover:scale-[1.02]'
                                : 'hover:shadow-md hover:scale-[1.01]'
                            }`}
                          >
                            {isEditMode && (
                              <div className="absolute top-1 left-1 opacity-40 group-hover:opacity-100 text-slate-500">
                                <GripVertical className="w-3 h-3" />
                              </div>
                            )}

                            {/* Quick Edit hint on hover */}
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-80 text-slate-400 hover:text-primary transition-opacity">
                              <Edit3 className="w-3 h-3" />
                            </div>

                            {/* Delete Button in edit mode */}
                            {isEditMode && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSlot(entry.id, e);
                                }}
                                title="Xoá môn"
                                className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            )}

                            <div className={`text-xs font-bold ${meta.textClass} leading-tight`}>
                              {entry.subject}
                            </div>
                            {entry.teacher && (
                              <div className="text-[10px] text-slate-500 mt-0.5 leading-none">
                                - {entry.teacher}
                              </div>
                            )}
                            {entry.room && (
                              <div className="text-[9px] text-slate-400 mt-0.5 font-mono leading-none">
                                P.{entry.room}
                              </div>
                            )}
                            {entry.note && (
                              <div
                                className="text-[9px] text-amber-900 bg-amber-100/90 px-1 py-0.5 rounded border border-amber-200/70 mt-1 truncate max-w-full font-normal leading-tight text-center flex items-center justify-center gap-0.5 shadow-2xs"
                                title={`Ghi chú: ${entry.note}`}
                              >
                                <span className="shrink-0 text-[10px]">📝</span>
                                <span className="truncate">{entry.note}</span>
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {/* TỐI / HỌC THÊM (Evening 2 rows) */}
              {[1, 2].map((period, idx) => {
                const times = ['17:15 – 19:15', '19:15 – 21:15'][idx];
                return (
                  <tr key={`evening-${period}`} className="border-b border-white hover:bg-slate-50/50">
                    {idx === 0 && (
                      <td
                        rowSpan={2}
                        className="p-2 text-center bg-indigo-50 border-2 border-white align-middle"
                      >
                        <div className="text-2xl mb-1">🌙</div>
                        <div className="text-xs font-black text-indigo-800 uppercase">Buổi tối</div>
                        <div className="text-[10px] text-indigo-700 font-mono">(17:15 – 21:30)</div>
                      </td>
                    )}
                    <td className="p-2 text-center font-bold text-xs text-slate-700 bg-slate-50 border-2 border-white">
                      Ca {period}
                    </td>
                    <td className="p-2 text-center text-[11px] font-mono text-slate-600 bg-slate-50 border-2 border-white">
                      {times}
                    </td>
                    {weekdays.map((weekday) => {
                      const isEvening = (ex: ExtraSchedule) => {
                        if (ex.session === 'morning' || ex.session === 'afternoon') return false;
                        const hour = parseInt(ex.start_time.split(':')[0], 10);
                        return hour >= 16;
                      };

                      const dayEveningExtras = extraList.filter(
                        (ex) => ex.weekdays.includes(weekday) && isEvening(ex)
                      );

                      const extra = dayEveningExtras.find((ex) => {
                        if (idx === 0) return ex.start_time < '19:15';
                        if (idx === 1) return ex.start_time >= '19:15';
                        return false;
                      });

                      if (!extra) {
                        return (
                          <td
                            key={weekday}
                            onClick={() => openCreateExtraModal(weekday, (idx + 1) as 1 | 2, 'evening')}
                            title={`Nhấp để thêm lớp học thêm Ca ${period} (${times})`}
                            className="p-1.5 text-center text-slate-300 border-2 border-white hover:bg-indigo-50/50 cursor-pointer transition-colors"
                          >
                            —
                          </td>
                        );
                      }

                      const meta = getSubjectMeta(extra.name);
                      return (
                        <td
                          key={weekday}
                          onClick={() => openEditExtraModal(extra)}
                          title="Nhấp để chỉnh sửa tên & thời gian lớp học thêm"
                          className="p-1 border-2 border-white cursor-pointer group relative"
                        >
                          <div
                            className={`p-1.5 rounded-lg border ${meta.bgClass} ${meta.borderClass} text-center min-h-[46px] flex flex-col justify-center transition-all group-hover:shadow-md group-hover:scale-[1.01] relative`}
                          >
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-80 text-slate-400 hover:text-primary transition-opacity">
                              <Edit3 className="w-3 h-3" />
                            </div>
                            <div className={`text-xs font-bold ${meta.textClass} leading-tight`}>
                              {extra.name}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {extra.start_time} – {extra.end_time}
                            </div>
                            {extra.note && (
                              <div
                                className="text-[9px] text-amber-900 bg-amber-100/90 px-1 py-0.5 rounded border border-amber-200/70 mt-1 truncate max-w-full font-normal leading-tight text-center"
                                title={`Ghi chú: ${extra.note}`}
                              >
                                📝 {extra.note}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom Infographic Module: Lịch học thêm clipboard + Pinned Ghi chú */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 pt-4 border-t border-slate-100">
          {/* Extra Classes Board */}
          <div className="md:col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3.5 relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-bold text-xs text-blue-900">
                <span className="text-base">📋</span>
                <span className="uppercase tracking-wider">LỊCH HỌC THÊM</span>
              </div>
              <button
                type="button"
                onClick={() => openCreateExtraModal()}
                className="text-[11px] font-semibold text-blue-800 hover:text-blue-950 bg-blue-200/60 hover:bg-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors border border-blue-300 shadow-2xs"
                title="Thêm lớp học thêm mới"
              >
                <Plus className="w-3 h-3" />
                <span>Thêm lớp</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {extraList.map((ex) => (
                <div
                  key={ex.id}
                  onClick={() => openEditExtraModal(ex)}
                  className="bg-white/90 hover:bg-white p-2.5 rounded-lg border border-blue-100 hover:border-blue-300 transition-all cursor-pointer group flex items-start justify-between gap-2 shadow-2xs"
                  title="Nhấp để chỉnh sửa tên & lịch học"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="truncate">{ex.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1 pl-3.5 font-mono">
                      {ex.weekdays.map((w) => (w === 8 ? 'Chủ nhật' : `Thứ ${w}`)).join(', ')} | {ex.start_time} –{' '}
                      {ex.end_time}
                    </div>
                    {ex.note && (
                      <div className="text-[10px] text-slate-500 mt-1 pl-3.5 italic">
                        {ex.note}
                      </div>
                    )}
                  </div>
                  <div className="text-slate-400 group-hover:text-primary transition-colors p-1 shrink-0">
                    <Edit3 className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
              {extraList.length === 0 && (
                <div className="text-xs text-slate-400 italic py-2">
                  Chưa đăng ký lớp học thêm nào. Bấm "Thêm lớp" để thêm.
                </div>
              )}
            </div>
          </div>

          {/* Bulletin Note pinned with red pushpin */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 relative shadow-sm">
            <div className="absolute -top-3 right-4">
              <PushPin size={24} />
            </div>
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                <span>📌</span>
                <span>Ghi chú viết tắt & Tên môn</span>
              </div>
              <button
                type="button"
                onClick={() => setIsLegendModalOpen(true)}
                className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 bg-amber-200/60 hover:bg-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors border border-amber-300 shadow-2xs"
                title="Chỉnh sửa ghi chú viết tắt tên các môn"
              >
                <Edit3 className="w-3 h-3" />
                <span>Chỉnh sửa</span>
              </button>
            </div>
            <ul className="text-[10px] text-amber-800 space-y-1">
              {legendList.map((item) => (
                <li key={item.id}>
                  • <strong>{item.code}:</strong> {item.note}
                </li>
              ))}
              {legendList.length === 0 && (
                <li className="text-[11px] text-amber-600 italic">Chưa có ghi chú nào. Bấm Chỉnh sửa để thêm.</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* QUICK SLOT EDIT MODAL */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-theme-pop w-full max-w-md space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-app-border">
              <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span>{editingSlot.entry ? 'Chỉnh Sửa Tiết Học' : 'Thêm Tiết Học Mới'}</span>
              </h3>
              <button
                onClick={() => setEditingSlot(null)}
                className="p-1 rounded-lg text-content-muted hover:text-content-primary hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-content-secondary">
              Buổi: <strong className="text-primary">{editingSlot.session === 'morning' ? 'Sáng' : 'Chiều'}</strong> •{' '}
              {editingSlot.weekday === 8 ? 'Chủ nhật' : `Thứ ${editingSlot.weekday}`} • Tiết {editingSlot.period} (
              {editingSlot.defaultTimes})
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-3 text-xs">
              {/* Subject Presets / Custom Input */}
              <div className="space-y-1.5">
                <label className="font-bold text-content-primary">Môn học *</label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tên môn học..."
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {/* Dynamic Subject Quick Pills */}
                <div className="flex flex-wrap gap-1 mt-1 max-h-24 overflow-y-auto pt-1">
                  {subjectList.map((sub) => (
                    <button
                      type="button"
                      key={sub.id}
                      onClick={() => setFormSubject(sub.name)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                        formSubject === sub.name
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-app-surface text-content-secondary border-app-border hover:border-primary/40'
                      }`}
                    >
                      {sub.name}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsSubjectModalOpen(true)}
                    className="px-2 py-0.5 rounded text-[11px] font-bold border border-dashed border-primary text-primary hover:bg-primary/5 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Thêm môn mới...
                  </button>
                </div>
              </div>

              {/* Teacher */}
              <div className="space-y-1">
                <label className="font-bold text-content-primary">Giáo viên phụ trách</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Cô Hà, Thầy Nam..."
                  value={formTeacher}
                  onChange={(e) => setFormTeacher(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Room */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Phòng học</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 204, Nhà đa năng..."
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Ghi chú</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Mang đồ dùng vẽ..."
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingSlot(null)}>
                  Đóng
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingSlot.entry ? 'Cập nhật' : 'Thêm vào bảng'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DUPLICATE TIMETABLE VERSION MODAL */}
      {isDuplicateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-theme-pop w-full max-w-md space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-app-border">
              <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
                <Copy className="w-5 h-5 text-primary" />
                <span>Nhân Bản Thời Khóa Biểu</span>
              </h3>
              <button
                onClick={() => setIsDuplicateModalOpen(false)}
                className="p-1 rounded-lg text-content-muted hover:text-content-primary hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-content-secondary">
              Tạo một phiên bản mới sao chép toàn bộ môn học từ{' '}
              <strong className="text-content-primary">{activeTemplate?.name}</strong> để bạn dễ dàng điều chỉnh cho
              học kỳ tiếp theo mà không làm mất lịch sử cũ.
            </p>

            <form onSubmit={handleConfirmDuplicate} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-content-primary">Tên phiên bản mới *</label>
                <input
                  type="text"
                  required
                  value={dupName}
                  onChange={(e) => setDupName(e.target.value)}
                  placeholder="Ví dụ: TKB 6A5 — HK2"
                  className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-content-primary">Học kỳ</label>
                <select
                  value={dupSemester}
                  onChange={(e) => setDupSemester(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="HK1">Học kỳ 1</option>
                  <option value="HK2">Học kỳ 2</option>
                  <option value="Hè">Học kỳ Hè</option>
                  <option value="Tạm thời">Lịch tạm thời</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Hiệu lực từ ngày *</label>
                  <input
                    type="date"
                    required
                    value={dupValidFrom}
                    onChange={(e) => setDupValidFrom(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Hiệu lực đến ngày *</label>
                  <input
                    type="date"
                    required
                    value={dupValidTo}
                    onChange={(e) => setDupValidTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsDuplicateModalOpen(false)}>
                  Huỷ
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Tạo phiên bản mới
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBJECT CONFIGURATION MODAL */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-theme-pop w-full max-w-lg space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-app-border">
              <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-primary" />
                <span>Cấu Hình & Chỉnh Sửa Danh Mục Môn Học</span>
              </h3>
              <button
                onClick={() => {
                  setIsSubjectModalOpen(false);
                  handleCancelEditSubject();
                }}
                className="p-1 rounded-lg text-content-muted hover:text-content-primary hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-content-secondary">
              Quản lý danh sách các môn học dùng trong Thời Khóa Biểu. Bạn có thể sửa tên môn, mã viết tắt, ghi chú giải thích và đổi màu sắc cho từng môn bất kỳ lúc nào.
            </p>

            {/* Edit Mode or Add Form */}
            {editingSubjId ? (
              <form onSubmit={handleSaveEditSubject} className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 space-y-2 text-xs">
                <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Chỉnh sửa thông tin môn học</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCancelEditSubject}
                    className="text-[11px] text-content-muted hover:text-content-primary underline"
                  >
                    Huỷ bỏ
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-content-secondary font-medium block mb-0.5">Tên môn học *</label>
                    <input
                      type="text"
                      required
                      placeholder="Tên môn (VD: Toán, STEM...)"
                      value={editSubjName}
                      onChange={(e) => setEditSubjName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-content-secondary font-medium block mb-0.5">Mã viết tắt</label>
                    <input
                      type="text"
                      placeholder="Mã viết tắt (VD: TOAN, TANN...)"
                      value={editSubjCode}
                      onChange={(e) => setEditSubjCode(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-content-secondary font-medium block mb-0.5">Ghi chú / Diễn giải viết tắt</label>
                  <input
                    type="text"
                    placeholder="Diễn giải (VD: Tiếng Anh, nói chung | Sinh học | Vật lí...)"
                    value={editSubjNote}
                    onChange={(e) => setEditSubjNote(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-content-muted text-[11px]">Màu thẻ:</span>
                    {['#2563EB', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#64748B'].map((clr) => (
                      <button
                        type="button"
                        key={clr}
                        onClick={() => setEditSubjColor(clr)}
                        className={`w-5 h-5 rounded-full border ${editSubjColor === clr ? 'ring-2 ring-primary scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: clr }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={handleCancelEditSubject} className="text-xs py-1">
                      Huỷ
                    </Button>
                    <Button type="submit" variant="primary" size="sm" className="text-xs py-1">
                      Lưu cập nhật
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              /* Quick Add Form */
              <form onSubmit={handleAddNewSubject} className="p-3 bg-app-card/60 rounded-xl border border-app-border space-y-2 text-xs">
                <div className="font-bold text-content-primary flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-primary" />
                  <span>Thêm môn học mới</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-content-secondary font-medium block mb-0.5">Tên môn học *</label>
                    <input
                      type="text"
                      required
                      placeholder="Tên môn (VD: STEM Robotics)"
                      value={newSubjName}
                      onChange={(e) => setNewSubjName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-content-secondary font-medium block mb-0.5">Mã viết tắt</label>
                    <input
                      type="text"
                      placeholder="Mã viết tắt (VD: STEM)"
                      value={newSubjCode}
                      onChange={(e) => setNewSubjCode(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-content-secondary font-medium block mb-0.5">Ghi chú / Diễn giải tên môn</label>
                  <input
                    type="text"
                    placeholder="Diễn giải viết tắt hoặc ghi chú môn..."
                    value={newSubjNote}
                    onChange={(e) => setNewSubjNote(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-content-muted text-[11px]">Màu thẻ:</span>
                    {['#2563EB', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#64748B'].map((clr) => (
                      <button
                        type="button"
                        key={clr}
                        onClick={() => setNewSubjColor(clr)}
                        className={`w-5 h-5 rounded-full border ${newSubjColor === clr ? 'ring-2 ring-primary scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: clr }}
                      />
                    ))}
                  </div>
                  <Button type="submit" variant="primary" size="sm" className="text-xs py-1">
                    Thêm môn
                  </Button>
                </div>
              </form>
            )}

            {/* Subject List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-64">
              <div className="text-[11px] font-bold text-content-muted uppercase tracking-wider flex items-center justify-between">
                <span>Danh sách môn ({subjectList.length})</span>
                <span className="text-[10px] font-normal lowercase text-content-muted">Bấm bút chì để sửa tên, mã, ghi chú</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {subjectList.map((s) => (
                  <div
                    key={s.id}
                    className={`p-2 rounded-lg border transition-all flex items-center justify-between text-xs ${
                      editingSubjId === s.id
                        ? 'border-amber-400 bg-amber-500/10 ring-1 ring-amber-400'
                        : 'border-app-border bg-app-card hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden min-w-0 pr-1">
                      <span className="w-3 h-3 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: s.color }} />
                      <div className="truncate">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-content-primary truncate">{s.name}</span>
                          {s.code && <span className="text-[10px] text-content-muted shrink-0">({s.code})</span>}
                        </div>
                        {s.note && (
                          <div className="text-[10px] text-content-secondary truncate" title={s.note}>
                            {s.note}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEditSubject(s)}
                        className="p-1 text-content-muted hover:text-primary rounded hover:bg-primary/10 transition-colors"
                        title={`Sửa môn ${s.name}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubject(s)}
                        className="p-1 text-content-muted hover:text-rose-500 rounded hover:bg-rose-50 transition-colors"
                        title={`Xoá môn ${s.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-app-border">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsSubjectModalOpen(false);
                  handleCancelEditSubject();
                }}
              >
                Hoàn tất
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TIMETABLE LEGEND / GHI CHÚ VIẾT TẮT MODAL */}
      {isLegendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-theme-pop w-full max-w-lg space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-app-border">
              <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
                <span className="text-lg">📌</span>
                <span>Chỉnh Sửa Ghi Chú Viết Tắt & Tên Môn Học</span>
              </h3>
              <button
                onClick={() => setIsLegendModalOpen(false)}
                className="p-1 rounded-lg text-content-muted hover:text-content-primary hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-content-secondary">
              Tùy chỉnh danh sách chú thích ký hiệu viết tắt hiển thị trên bảng Thời Khóa Biểu (Ví dụ: TANN là Tiếng Anh, KNS là Kỹ năng sống, SHL là Sinh hoạt lớp...).
            </p>

            {/* Quick Actions */}
            <div className="flex items-center justify-between gap-2 p-2 bg-app-card/70 rounded-xl border border-app-border text-xs">
              <span className="text-[11px] text-content-muted font-medium">Tiện ích nhanh:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSyncLegendFromSubjects}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1"
                  title="Tự động lấy các môn có mã và ghi chú đưa vào danh sách viết tắt"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Đồng bộ từ môn học</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetLegendDefault}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-content-muted hover:text-content-primary bg-black/5 hover:bg-black/10 transition-colors flex items-center gap-1"
                  title="Khôi phục ghi chú viết tắt mẫu mặc định"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Mẫu chuẩn</span>
                </button>
              </div>
            </div>

            {/* Add new legend note */}
            <form onSubmit={handleAddLegendItem} className="p-3 bg-app-card/60 rounded-xl border border-app-border space-y-2 text-xs">
              <div className="font-bold text-content-primary flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-primary" />
                <span>Thêm chú thích viết tắt mới</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Ký hiệu (VD: TANN)"
                  value={newLegendCode}
                  onChange={(e) => setNewLegendCode(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-1 focus:ring-primary col-span-1 font-bold"
                />
                <input
                  type="text"
                  required
                  placeholder="Ý nghĩa / Ghi chú (VD: Tiếng Anh, nói chung)"
                  value={newLegendNote}
                  onChange={(e) => setNewLegendNote(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-1 focus:ring-primary col-span-2"
                />
              </div>
              <div className="flex justify-end pt-1">
                <Button type="submit" variant="primary" size="sm" className="text-xs py-1">
                  Thêm chú thích
                </Button>
              </div>
            </form>

            {/* Legend List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-60">
              <div className="text-[11px] font-bold text-content-muted uppercase tracking-wider">
                Danh sách ghi chú ({legendList.length})
              </div>
              <div className="space-y-1.5">
                {legendList.map((item) => {
                  const isEditing = editingLegendId === item.id;
                  if (isEditing) {
                    return (
                      <form
                        key={item.id}
                        onSubmit={handleSaveEditLegend}
                        className="p-2 rounded-lg border border-amber-400 bg-amber-500/10 flex items-center gap-2 text-xs"
                      >
                        <input
                          type="text"
                          required
                          value={editLegendCode}
                          onChange={(e) => setEditLegendCode(e.target.value)}
                          className="w-24 px-2 py-1 rounded border border-app-border bg-app-bg text-content-primary font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <input
                          type="text"
                          required
                          value={editLegendNote}
                          onChange={(e) => setEditLegendNote(e.target.value)}
                          className="flex-1 px-2 py-1 rounded border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button
                          type="submit"
                          className="px-2 py-1 bg-primary text-primary-foreground rounded text-[11px] font-bold"
                        >
                          Lưu
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEditLegend}
                          className="px-2 py-1 bg-black/5 hover:bg-black/10 rounded text-[11px]"
                        >
                          Huỷ
                        </button>
                      </form>
                    );
                  }
                  return (
                    <div
                      key={item.id}
                      className="p-2 rounded-lg border border-app-border bg-app-card flex items-center justify-between text-xs hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="font-bold text-content-primary shrink-0 bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">
                          {item.code}
                        </span>
                        <span className="text-content-secondary truncate">{item.note}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEditLegend(item)}
                          className="p-1 text-content-muted hover:text-primary rounded hover:bg-primary/10 transition-colors"
                          title="Sửa ghi chú này"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLegendItem(item.id)}
                          className="p-1 text-content-muted hover:text-rose-500 rounded hover:bg-rose-50 transition-colors"
                          title="Xoá ghi chú này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-app-border">
              <Button type="button" variant="primary" size="sm" onClick={() => setIsLegendModalOpen(false)}>
                Hoàn tất
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chỉnh sửa / Thêm mới Lớp học thêm */}
      {(editingExtra || isNewExtraModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-app-card border border-app-border rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-app-border">
              <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
                <span className="text-xl">
                  {formExtraSession === 'morning' ? '☀️' : formExtraSession === 'afternoon' ? '☁️' : '🌙'}
                </span>
                <span>{editingExtra ? 'Chỉnh Sửa Lớp Học Thêm' : 'Thêm Lớp Học Thêm Mới'}</span>
              </h3>
              <button
                onClick={() => {
                  setEditingExtra(null);
                  setIsNewExtraModalOpen(false);
                }}
                className="p-1 rounded-lg text-content-muted hover:text-content-primary hover:bg-black/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExtra} className="space-y-3.5 text-xs">
              {/* Tên lớp học thêm */}
              <div className="space-y-1">
                <label className="font-bold text-content-primary">Tên môn / Lớp học thêm *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Tiếng Anh giao tiếp & ngữ pháp, Toán tư duy..."
                  value={formExtraName}
                  onChange={(e) => setFormExtraName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Các ngày học trong tuần */}
              <div className="space-y-1">
                <label className="font-bold text-content-primary">Các ngày học trong tuần *</label>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {([2, 3, 4, 5, 6, 7, 8] as WeekdayNumber[]).map((day) => {
                    const isSelected = formExtraWeekdays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => {
                          if (isSelected) {
                            if (formExtraWeekdays.length > 1) {
                              setFormExtraWeekdays(formExtraWeekdays.filter((d) => d !== day));
                            }
                          } else {
                            setFormExtraWeekdays([...formExtraWeekdays, day].sort((a, b) => a - b));
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors border ${
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                            : 'bg-app-surface text-content-secondary border-app-border hover:border-primary/40'
                        }`}
                      >
                        {day === 8 ? 'Chủ nhật' : `Thứ ${day}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Buổi trong ngày */}
              <div className="space-y-1">
                <label className="font-bold text-content-primary">Buổi trong ngày *</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: 'morning', label: '☀️ Sáng', hint: '08:00 – 10:00' },
                      { id: 'afternoon', label: '☁️ Chiều', hint: '14:00 – 16:00' },
                      { id: 'evening', label: '🌙 Tối', hint: '17:15 – 21:15' },
                    ] as const
                  ).map((s) => {
                    const isSelected = formExtraSession === s.id;
                    return (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => {
                          setFormExtraSession(s.id);
                          if (s.id === 'morning') {
                            setFormExtraStartTime('08:00');
                            setFormExtraEndTime('10:00');
                          } else if (s.id === 'afternoon') {
                            setFormExtraStartTime('14:00');
                            setFormExtraEndTime('16:00');
                          } else {
                            setFormExtraStartTime('17:15');
                            setFormExtraEndTime('19:15');
                          }
                        }}
                        className={`p-2 rounded-lg text-xs font-bold text-center border transition-all ${
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                            : 'bg-app-surface text-content-secondary border-app-border hover:border-primary/40'
                        }`}
                      >
                        <div>{s.label}</div>
                        <div
                          className={`text-[10px] font-normal ${
                            isSelected ? 'text-primary-foreground/80' : 'text-content-muted'
                          }`}
                        >
                          {s.hint}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Thời gian */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Giờ bắt đầu</label>
                  <input
                    type="time"
                    required
                    value={formExtraStartTime}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormExtraStartTime(val);
                      if (val < '12:00') setFormExtraSession('morning');
                      else if (val < '17:00') setFormExtraSession('afternoon');
                      else setFormExtraSession('evening');
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Giờ kết thúc</label>
                  <input
                    type="time"
                    required
                    value={formExtraEndTime}
                    onChange={(e) => setFormExtraEndTime(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Ghi chú / Địa điểm */}
              <div className="space-y-1">
                <label className="font-bold text-content-primary">Ghi chú / Địa điểm / Giáo viên</label>
                <input
                  type="text"
                  placeholder="VD: Cô Mai, Phòng 204, Trung tâm..."
                  value={formExtraNote}
                  onChange={(e) => setFormExtraNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-app-border">
                {editingExtra ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteExtra(editingExtra.id)}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xoá lớp</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingExtra(null);
                      setIsNewExtraModalOpen(false);
                    }}
                  >
                    Huỷ
                  </Button>
                  <Button type="submit" variant="primary" size="sm" className="font-bold">
                    {editingExtra ? 'Lưu thay đổi' : 'Thêm lớp học'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
