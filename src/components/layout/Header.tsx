import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChild } from '@/context/ChildContext';
import { useTheme } from '@/context/ThemeContext';
import { useKidMode } from '@/context/KidModeContext';
import { ChevronDown, Palette, Check, Sun, Moon, ShieldAlert, AlertCircle } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { AppTheme } from '@/domain/types';
import { formatChildDisplayName } from '@/lib/childNameHelper';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { childrenList, activeChild, setActiveChildId } = useChild();
  const { theme, setTheme, availableThemes, colorMode, setColorMode } = useTheme();
  const { isKidMode, enterKidMode, exitKidMode } = useKidMode();
  
  const [isChildMenuOpen, setIsChildMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const handleConfirmExit = () => {
    const ok = exitKidMode(pinInput.trim() || undefined);
    if (ok) {
      setShowExitModal(false);
      setPinInput('');
      setPinError(false);
      navigate('/');
    } else {
      setPinError(true);
    }
  };


  return (
    <header className="sticky top-0 z-30 bg-app-surface/90 backdrop-blur-md border-b border-app-border px-4 py-2.5 flex items-center justify-between no-print">
      {/* Child Switcher Dropdown */}
      <div className="relative">
        <button
          onClick={() => {
            setIsChildMenuOpen(!isChildMenuOpen);
            setIsThemeMenuOpen(false);
          }}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-theme-md bg-app-card border border-app-border hover:bg-black/5 dark:hover:bg-white/5 transition-all shadow-theme-sm text-left"
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 overflow-hidden"
            style={{ backgroundColor: activeChild.color || '#2563EB' }}
          >
            {activeChild.avatar_url?.startsWith('data:') || activeChild.avatar_url?.startsWith('http') ? (
              <img src={activeChild.avatar_url} alt={activeChild.name} className="w-full h-full object-cover" />
            ) : (
              activeChild.avatar_url === 'girl' ? '👧' : '👦'
            )}
          </div>
          <div>
            <div className="text-xs font-bold text-content-primary flex items-center gap-1">
              <span>{formatChildDisplayName(activeChild)}</span>
              <ChevronDown className="w-3.5 h-3.5 text-content-muted" />
            </div>
            <div className="text-[10px] text-content-muted">
              {activeChild.class_name} • {activeChild.school_name}
            </div>
          </div>
        </button>

        {isChildMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsChildMenuOpen(false)}
            />
            <div className="absolute left-0 mt-2 w-64 bg-app-card border border-app-border rounded-theme-md shadow-theme-lg p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="text-[11px] font-bold text-content-muted px-2 py-1 uppercase tracking-wider">
                Chọn hồ sơ học sinh
              </div>
              <div className="space-y-1 mt-1">
                {childrenList.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setActiveChildId(c.id);
                      setIsChildMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-theme-sm text-left text-xs font-bold transition-colors ${
                      c.id === activeChild.id
                        ? 'bg-primary-light text-primary'
                        : 'text-content-primary hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] overflow-hidden"
                        style={{ backgroundColor: c.color }}
                      >
                        {c.avatar_url?.startsWith('data:') || c.avatar_url?.startsWith('http') ? (
                          <img src={c.avatar_url} alt={c.name} className="w-full h-full object-cover" />
                        ) : (
                          c.avatar_url === 'girl' ? '👧' : '👦'
                        )}
                      </div>
                      <div>
                        <div>{formatChildDisplayName(c)}</div>
                        <div className="text-[10px] text-content-muted font-normal">
                          {c.class_name} ({c.birthYear})
                        </div>
                      </div>
                    </div>
                    {c.id === activeChild.id && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right Controls: Theme Quick Switcher */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => {
              setIsThemeMenuOpen(!isThemeMenuOpen);
              setIsChildMenuOpen(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-theme-md bg-app-card border border-app-border hover:bg-black/5 dark:hover:bg-white/5 text-xs font-bold text-content-primary shadow-theme-sm transition-colors"
            title="Đổi chủ đề giao diện"
          >
            <Palette className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">Giao diện:</span>
            <span>{availableThemes.find((t) => t.id === theme)?.name.split('/')[0]}</span>
            <ChevronDown className="w-3.5 h-3.5 text-content-muted" />
          </button>

          {isThemeMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsThemeMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-app-card border border-app-border rounded-theme-md shadow-theme-lg p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[11px] font-bold text-content-muted px-2 py-1 uppercase tracking-wider">
                  Chủ đề giao diện
                </div>
                <div className="space-y-1 mt-1">
                  {availableThemes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTheme(t.id as AppTheme);
                        setIsThemeMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-theme-sm text-left text-xs font-bold transition-colors ${
                        t.id === theme
                          ? 'bg-primary-light text-primary'
                          : 'text-content-primary hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{t.icon}</span>
                        <div>
                          <div>{t.name}</div>
                        </div>
                      </div>
                      {t.id === theme && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Kid Mode Toggle Button */}
        {isKidMode ? (
          <button
            onClick={() => setShowExitModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-theme-md bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-theme-sm transition-all animate-pulse"
            title="Đang ở Góc của Con - Bấm để về chế độ Ba Mẹ"
          >
            <span>🎒 Góc của Con</span>
            <span className="text-[10px] bg-white/25 px-1.5 py-0.2 rounded font-bold">Thoát</span>
          </button>
        ) : (
          <button
            onClick={() => {
              enterKidMode();
              navigate('/kid-corner');
            }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-theme-md bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold text-xs shadow-theme-sm hover:brightness-105 transition-all"
            title="Chuyển sang chế độ Góc của Con (ẩn học phí & riêng tư)"
          >
            <span>🎒</span>
            <span className="hidden sm:inline">Góc của Con</span>
          </button>
        )}

        {/* Quick Light / Dark Mode Toggle */}
        <button
          onClick={() => {
            const nextMode = colorMode === 'dark' ? 'light' : 'dark';
            setColorMode(nextMode);
          }}
          className="flex items-center justify-center w-8 h-8 rounded-theme-md bg-app-card border border-app-border hover:bg-black/5 dark:hover:bg-white/5 text-content-primary shadow-theme-sm transition-colors"
          title={colorMode === 'dark' ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối'}
          aria-label="Toggle light/dark mode"
        >
          {colorMode === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180 duration-200" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600 animate-in spin-in-180 duration-200" />
          )}
        </button>
      </div>

      {/* Parent PIN Exit Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-app-surface border border-app-border rounded-2xl shadow-theme-pop w-full max-w-sm p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-content-primary">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Trở lại chế độ Ba Mẹ</h3>
                <p className="text-xs text-content-muted">Bảo vệ riêng tư tài chính & học phí</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-content-secondary">
                Nhập mã PIN ba mẹ (Mặc định: 1234 hoặc bấm xác nhận):
              </label>
              <input
                type="password"
                maxLength={8}
                placeholder="1234"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                className="w-full px-3 py-2 text-center text-lg font-mono tracking-widest rounded-xl border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {pinError && (
                <p className="text-[11px] text-red-500 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Mã PIN không đúng. Vui lòng thử lại!
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-app-border">
              <Button variant="outline" size="sm" onClick={() => setShowExitModal(false)}>
                Ở lại góc của con
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirmExit}>
                Xác nhận
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
