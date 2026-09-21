import React, { useState, useEffect } from 'react';
import { useChild } from '@/context/ChildContext';
import { storage } from '@/services/storage';
import { Card } from '@/design-system/components/Card';
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
import { TimetableEntry, TimetableTemplate, WeekdayNumber, SessionType, SubjectItem } from '@/domain/types';

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
  const [newSubjColor, setNewSubjColor] = useState('#2563EB');

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
  const extraSchedules = storage.getExtraSchedules().filter((e) => e.child_id === activeChild.id && e.active);

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
      color: newSubjColor,
      is_custom: true,
      category: 'core',
    });
    setSubjectList(storage.getSubjects());
    setNewSubjName('');
    setNewSubjCode('');
    if (editingSlot) {
      setFormSubject(added.name);
    }
  };

  const handleDeleteCustomSubject = (id: string) => {
    storage.deleteSubject(id);
    setSubjectList(storage.getSubjects());
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
        <div className="bg-app-card border border-app-border rounded-xl p-3 flex items-center gap-3 shadow-theme-sm">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-lg">
            📚
          </div>
          <div>
            <div className="text-[11px] text-content-muted font-medium">Tổng tiết học</div>
            <div className="text-sm md:text-base font-extrabold text-content-primary">
              {activeEntries.length} tiết / tuần
            </div>
          </div>
        </div>

        <div className="bg-app-card border border-app-border rounded-xl p-3 flex items-center gap-3 shadow-theme-sm">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-lg">
            ☀️
          </div>
          <div>
            <div className="text-[11px] text-content-muted font-medium">Buổi sáng</div>
            <div className="text-sm md:text-base font-extrabold text-content-primary">
              {activeEntries.filter((e) => e.session === 'morning').length} tiết
            </div>
          </div>
        </div>

        <div className="bg-app-card border border-app-border rounded-xl p-3 flex items-center gap-3 shadow-theme-sm">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold text-lg">
            🌤️
          </div>
          <div>
            <div className="text-[11px] text-content-muted font-medium">Buổi chiều</div>
            <div className="text-sm md:text-base font-extrabold text-content-primary">
              {activeEntries.filter((e) => e.session === 'afternoon').length} tiết
            </div>
          </div>
        </div>

        <div className="bg-app-card border border-app-border rounded-xl p-3 flex items-center gap-3 shadow-theme-sm">
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold text-lg">
            🌙
          </div>
          <div>
            <div className="text-[11px] text-content-muted font-medium">Lớp học thêm</div>
            <div className="text-sm md:text-base font-extrabold text-content-primary">
              {extraSchedules.length} lớp học
            </div>
          </div>
        </div>
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
        <div className="min-w-[860px] mt-4">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-xs font-bold text-white bg-blue-700 rounded-tl-lg w-28 text-center border border-white/20">
                  Buổi
                </th>
                <th className="p-2 text-xs font-bold text-white bg-blue-600 w-16 text-center border border-white/20">
                  Tiết
                </th>
                <th className="p-2 text-xs font-bold text-white bg-blue-500 w-24 text-center border border-white/20">
                  Thời gian
                </th>
                {weekdays.map((w) => {
                  const conf = DAY_HEADER_COLORS[w];
                  return (
                    <th
                      key={w}
                      className="p-2 text-xs font-extrabold text-white text-center border border-white/20 uppercase tracking-wide"
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
                  <tr key={`morning-${period}`} className="border-b border-slate-100 hover:bg-slate-50/50">
                    {idx === 0 && (
                      <td
                        rowSpan={4}
                        className="p-2 text-center bg-amber-50 border border-slate-200 align-middle"
                      >
                        <div className="text-2xl mb-1">☀️</div>
                        <div className="text-xs font-black text-amber-800 uppercase">Buổi sáng</div>
                        <div className="text-[10px] text-amber-700 font-mono">(7:00 – 11:30)</div>
                      </td>
                    )}
                    <td className="p-2 text-center font-bold text-xs text-slate-700 bg-slate-50 border border-slate-200">
                      Tiết {period}
                    </td>
                    <td className="p-2 text-center text-[11px] font-mono text-slate-600 bg-slate-50 border border-slate-200">
                      {times}
                    </td>
                    {weekdays.map((weekday) => {
                      const entry = activeEntries.find(
                        (e) => e.session === 'morning' && e.weekday === weekday && e.period === period
                      );
                      const slotKey = `morning-${weekday}-${period}`;
                      const isDropTarget = dropTargetKey === slotKey;

                      if (!entry) {
                        return (
                          <td
                            key={weekday}
                            onDragOver={isEditMode ? (e) => handleDragOver(e, slotKey) : undefined}
                            onDragLeave={isEditMode ? handleDragLeave : undefined}
                            onDrop={isEditMode ? (e) => handleDrop(e, weekday, 'morning', period) : undefined}
                            onClick={isEditMode ? () => openSlotEditor(weekday, 'morning', period) : undefined}
                            onDoubleClick={() => openSlotEditor(weekday, 'morning', period)}
                            title={isEditMode ? 'Nhấp để thêm môn' : 'Nhấp đúp để chỉnh sửa nhanh'}
                            className={`p-1.5 text-center border border-slate-200 transition-colors ${
                              isEditMode
                                ? 'cursor-pointer hover:bg-blue-50/70 border-dashed border-blue-200'
                                : 'text-slate-300 hover:bg-slate-50 cursor-pointer'
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
                          onDoubleClick={() => openSlotEditor(weekday, 'morning', period, entry)}
                          title={isEditMode ? 'Kéo thả hoặc nhấp để sửa' : 'Nhấp đúp để chỉnh sửa nhanh'}
                          className={`p-1 border border-slate-200 relative group transition-all ${
                            isDropTarget ? 'ring-2 ring-primary ring-inset bg-blue-50' : ''
                          }`}
                        >
                          <div
                            draggable={isEditMode}
                            onDragStart={() => handleDragStart(entry)}
                            onClick={isEditMode ? () => openSlotEditor(weekday, 'morning', period, entry) : undefined}
                            className={`p-1.5 rounded-lg border ${meta.bgClass} ${meta.borderClass} text-center min-h-[46px] flex flex-col justify-center transition-all ${
                              isEditMode
                                ? 'cursor-grab active:cursor-grabbing hover:shadow-md ring-1 ring-black/5 hover:scale-[1.02]'
                                : 'hover:shadow-sm cursor-pointer'
                            }`}
                          >
                            {/* Grip handle indicator in edit mode */}
                            {isEditMode && (
                              <div className="absolute top-1 left-1 opacity-40 group-hover:opacity-100 text-slate-500">
                                <GripVertical className="w-3 h-3" />
                              </div>
                            )}

                            {/* Delete Button in edit mode */}
                            {isEditMode && (
                              <button
                                onClick={(e) => handleDeleteSlot(entry.id, e)}
                                title="Xoá môn"
                                className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
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
                  <tr key={`afternoon-${period}`} className="border-b border-slate-100 hover:bg-slate-50/50">
                    {idx === 0 && (
                      <td
                        rowSpan={3}
                        className="p-2 text-center bg-sky-50 border border-slate-200 align-middle"
                      >
                        <div className="text-2xl mb-1">☁️</div>
                        <div className="text-xs font-black text-sky-800 uppercase">Buổi chiều</div>
                        <div className="text-[10px] text-sky-700 font-mono">(13:30 – 17:00)</div>
                      </td>
                    )}
                    <td className="p-2 text-center font-bold text-xs text-slate-700 bg-slate-50 border border-slate-200">
                      Tiết {period}
                    </td>
                    <td className="p-2 text-center text-[11px] font-mono text-slate-600 bg-slate-50 border border-slate-200">
                      {times}
                    </td>
                    {weekdays.map((weekday) => {
                      const entry = activeEntries.find(
                        (e) => e.session === 'afternoon' && e.weekday === weekday && e.period === period
                      );
                      const slotKey = `afternoon-${weekday}-${period}`;
                      const isDropTarget = dropTargetKey === slotKey;

                      if (!entry) {
                        return (
                          <td
                            key={weekday}
                            onDragOver={isEditMode ? (e) => handleDragOver(e, slotKey) : undefined}
                            onDragLeave={isEditMode ? handleDragLeave : undefined}
                            onDrop={isEditMode ? (e) => handleDrop(e, weekday, 'afternoon', period) : undefined}
                            onClick={isEditMode ? () => openSlotEditor(weekday, 'afternoon', period) : undefined}
                            onDoubleClick={() => openSlotEditor(weekday, 'afternoon', period)}
                            title={isEditMode ? 'Nhấp để thêm môn' : 'Nhấp đúp để chỉnh sửa nhanh'}
                            className={`p-1.5 text-center border border-slate-200 transition-colors ${
                              isEditMode
                                ? 'cursor-pointer hover:bg-blue-50/70 border-dashed border-blue-200'
                                : 'text-slate-300 hover:bg-slate-50 cursor-pointer'
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
                          onDoubleClick={() => openSlotEditor(weekday, 'afternoon', period, entry)}
                          title={isEditMode ? 'Kéo thả hoặc nhấp để sửa' : 'Nhấp đúp để chỉnh sửa nhanh'}
                          className={`p-1 border border-slate-200 relative group transition-all ${
                            isDropTarget ? 'ring-2 ring-primary ring-inset bg-blue-50' : ''
                          }`}
                        >
                          <div
                            draggable={isEditMode}
                            onDragStart={() => handleDragStart(entry)}
                            onClick={isEditMode ? () => openSlotEditor(weekday, 'afternoon', period, entry) : undefined}
                            className={`p-1.5 rounded-lg border ${meta.bgClass} ${meta.borderClass} text-center min-h-[46px] flex flex-col justify-center transition-all ${
                              isEditMode
                                ? 'cursor-grab active:cursor-grabbing hover:shadow-md ring-1 ring-black/5 hover:scale-[1.02]'
                                : 'hover:shadow-sm cursor-pointer'
                            }`}
                          >
                            {isEditMode && (
                              <div className="absolute top-1 left-1 opacity-40 group-hover:opacity-100 text-slate-500">
                                <GripVertical className="w-3 h-3" />
                              </div>
                            )}

                            {isEditMode && (
                              <button
                                onClick={(e) => handleDeleteSlot(entry.id, e)}
                                title="Xoá môn"
                                className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
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
                  <tr key={`evening-${period}`} className="border-b border-slate-100 hover:bg-slate-50/50">
                    {idx === 0 && (
                      <td
                        rowSpan={2}
                        className="p-2 text-center bg-indigo-50 border border-slate-200 align-middle"
                      >
                        <div className="text-2xl mb-1">🌙</div>
                        <div className="text-xs font-black text-indigo-800 uppercase">Buổi tối</div>
                        <div className="text-[10px] text-indigo-700 font-mono">(17:15 – 21:30)</div>
                      </td>
                    )}
                    <td className="p-2 text-center font-bold text-xs text-slate-700 bg-slate-50 border border-slate-200">
                      Ca {period}
                    </td>
                    <td className="p-2 text-center text-[11px] font-mono text-slate-600 bg-slate-50 border border-slate-200">
                      {times}
                    </td>
                    {weekdays.map((weekday) => {
                      const extra = extraSchedules.find((ex) => {
                        if (!ex.weekdays.includes(weekday)) return false;
                        if (idx === 0 && ex.start_time.startsWith('17')) return true;
                        if (
                          idx === 1 &&
                          (ex.start_time.startsWith('19') || (ex.start_time.startsWith('08') && weekday === 8))
                        )
                          return true;
                        return false;
                      });

                      if (!extra) {
                        return (
                          <td key={weekday} className="p-1.5 text-center text-slate-300 border border-slate-200">
                            —
                          </td>
                        );
                      }

                      const meta = getSubjectMeta(extra.name);
                      return (
                        <td key={weekday} className="p-1 border border-slate-200">
                          <div
                            className={`p-1.5 rounded-lg border ${meta.bgClass} ${meta.borderClass} text-center min-h-[46px] flex flex-col justify-center`}
                          >
                            <div className={`text-xs font-bold ${meta.textClass} leading-tight`}>
                              {extra.name}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {extra.start_time} – {extra.end_time}
                            </div>
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
            <div className="flex items-center gap-2 mb-2 font-bold text-xs text-blue-900">
              <span className="text-base">📋</span>
              <span className="uppercase tracking-wider">LỊCH HỌC THÊM</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {extraSchedules.map((ex) => (
                <div key={ex.id} className="bg-white/80 p-2.5 rounded-lg border border-blue-100">
                  <div className="font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{ex.name}:</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1 pl-3.5 font-mono">
                    {ex.weekdays.map((w) => (w === 8 ? 'Chủ nhật' : `Thứ ${w}`)).join(', ')} | {ex.start_time} –{' '}
                    {ex.end_time}
                  </div>
                </div>
              ))}
              {extraSchedules.length === 0 && (
                <div className="text-xs text-slate-400 italic">Chưa đăng ký lớp học thêm nào</div>
              )}
            </div>
          </div>

          {/* Bulletin Note pinned with red pushpin */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 relative shadow-sm">
            <div className="absolute -top-3 right-4">
              <PushPin size={24} />
            </div>
            <div className="font-bold text-xs text-amber-900 mb-1.5 flex items-center gap-1">
              <span>📌</span>
              <span>Ghi chú viết tắt</span>
            </div>
            <ul className="text-[10px] text-amber-800 space-y-1">
              <li>• <strong>TANN:</strong> Tiếng Anh, nói chung</li>
              <li>• <strong>KNS:</strong> Kỹ năng sống</li>
              <li>• <strong>SHL:</strong> Sinh hoạt lớp</li>
              <li>• <strong>HĐTN:</strong> Hoạt động trải nghiệm hướng nghiệp</li>
              <li>• <strong>CN:</strong> Công nghệ</li>
              <li>• <strong>(S):</strong> Sinh học | <strong>(Lí):</strong> Vật lí</li>
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
                <span>Cấu Hình Danh Mục Môn Học</span>
              </h3>
              <button
                onClick={() => setIsSubjectModalOpen(false)}
                className="p-1 rounded-lg text-content-muted hover:text-content-primary hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-content-secondary">
              Danh sách các môn học dùng trong Thời Khóa Biểu. Bạn có thể thêm các môn học đặc thù, câu lạc bộ hoặc môn ngoại khóa mới bất kỳ lúc nào.
            </p>

            {/* Quick Add Form */}
            <form onSubmit={handleAddNewSubject} className="p-3 bg-app-card/60 rounded-xl border border-app-border space-y-2 text-xs">
              <div className="font-bold text-content-primary flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-primary" />
                <span>Thêm môn học mới</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Tên môn (VD: STEM Robotics)"
                  value={newSubjName}
                  onChange={(e) => setNewSubjName(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  type="text"
                  placeholder="Mã viết tắt (VD: STEM)"
                  value={newSubjCode}
                  onChange={(e) => setNewSubjCode(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-1 focus:ring-primary"
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

            {/* Subject List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-64">
              <div className="text-[11px] font-bold text-content-muted uppercase tracking-wider">
                Môn học hiện có ({subjectList.length})
              </div>
              <div className="grid grid-cols-2 gap-2">
                {subjectList.map((s) => (
                  <div
                    key={s.id}
                    className="p-2 rounded-lg border border-app-border bg-app-card flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      <div className="truncate">
                        <span className="font-bold text-content-primary">{s.name}</span>
                        {s.code && <span className="text-[10px] text-content-muted ml-1">({s.code})</span>}
                      </div>
                    </div>
                    {s.is_custom && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomSubject(s.id)}
                        className="p-1 text-content-muted hover:text-red-500 rounded"
                        title="Xóa môn này"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-app-border">
              <Button type="button" variant="primary" size="sm" onClick={() => setIsSubjectModalOpen(false)}>
                Hoàn tất
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
