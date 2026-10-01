import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { ShieldAlert, Lock, Eye, EyeOff, AlertCircle, Trash2, CheckCircle2, KeyRound } from 'lucide-react';
import { Button } from '@/design-system/components/Button';

export interface AdminConfirmOptions {
  title?: string;
  message?: string;
  itemName?: string;
  confirmText?: string;
  isDanger?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface AdminConfirmContextType {
  confirmAdminAction: (options: AdminConfirmOptions) => void;
  confirmDelete: (options: {
    title?: string;
    message?: string;
    itemName?: string;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
  }) => void;
  adminPin: string;
  setAdminPin: (newPin: string) => void;
  verifyAdminPin: (pin: string) => boolean;
}

const STORAGE_KEYS = {
  ADMIN_PIN: 'ktt_parent_pin',
};

const DEFAULT_PIN = '0075';

const AdminConfirmContext = createContext<AdminConfirmContextType | undefined>(undefined);

export const AdminConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminPin, setAdminPinState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ADMIN_PIN) || DEFAULT_PIN;
    } catch {
      return DEFAULT_PIN;
    }
  });

  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<AdminConfirmOptions | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPinInput('');
      setPinError(null);
      setShowPin(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const setAdminPin = (newPin: string) => {
    const cleaned = newPin.trim();
    setAdminPinState(cleaned);
    try {
      localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, cleaned);
    } catch (e) {
      console.warn('Failed to persist admin PIN:', e);
    }
  };

  const verifyAdminPin = (pin: string): boolean => {
    const trimmed = pin.trim();
    if (!trimmed) return false;
    return trimmed === adminPin;
  };

  const confirmAdminAction = (opts: AdminConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
  };

  const confirmDelete = (opts: {
    title?: string;
    message?: string;
    itemName?: string;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
  }) => {
    confirmAdminAction({
      title: opts.title || 'Xác nhận xoá dữ liệu',
      message: opts.message || 'Thao tác này sẽ xoá vĩnh viễn dữ liệu trên máy và Supabase Cloud.',
      itemName: opts.itemName,
      confirmText: 'Xác nhận xoá',
      isDanger: true,
      onConfirm: opts.onConfirm,
      onCancel: opts.onCancel,
    });
  };

  const handleClose = () => {
    if (isProcessing) return;
    if (options?.onCancel) {
      options.onCancel();
    }
    setIsOpen(false);
    setOptions(null);
  };

  const handleVerifyAndSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pinInput.trim()) {
      setPinError('Vui lòng nhập mã PIN Admin');
      return;
    }

    if (!verifyAdminPin(pinInput)) {
      setPinError('Mã PIN Admin không chính xác. Vui lòng thử lại!');
      setPinInput('');
      inputRef.current?.focus();
      return;
    }

    // PIN is correct
    setIsProcessing(true);
    setPinError(null);
    try {
      if (options?.onConfirm) {
        await options.onConfirm();
      }
      setIsOpen(false);
      setOptions(null);
    } catch (err: any) {
      setPinError(`Lỗi thực hiện: ${err?.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AdminConfirmContext.Provider
      value={{
        confirmAdminAction,
        confirmDelete,
        adminPin,
        setAdminPin,
        verifyAdminPin,
      }}
    >
      {children}

      {/* Global Admin Confirmation Modal */}
      {isOpen && options && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-theme-pop w-full max-w-md space-y-4 animate-in zoom-in-95 duration-150 relative">
            <div className="flex items-start gap-3.5">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  options.isDanger
                    ? 'bg-rose-500/15 text-rose-500 dark:bg-rose-500/20'
                    : 'bg-amber-500/15 text-amber-500 dark:bg-amber-500/20'
                }`}
              >
                {options.isDanger ? (
                  <ShieldAlert className="w-6 h-6" />
                ) : (
                  <KeyRound className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    Bảo mật Admin
                  </span>
                </div>
                <h3 className="text-base font-bold text-content-primary mt-1">
                  {options.title || 'Xác nhận quyền Admin'}
                </h3>
                {options.itemName && (
                  <div className="mt-1.5 inline-block text-xs font-bold px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 text-content-primary border border-app-border truncate max-w-full">
                    {options.itemName}
                  </div>
                )}
                <p className="text-xs text-content-secondary mt-1.5 leading-relaxed">
                  {options.message || 'Vui lòng nhập mã PIN Admin để xác nhận thao tác nhạy cảm này:'}
                </p>
              </div>
            </div>

            <form onSubmit={handleVerifyAndSubmit} className="space-y-3.5 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-content-primary">
                  Mã PIN Admin / Phụ Huynh:
                </label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    type={showPin ? 'text' : 'password'}
                    maxLength={10}
                    placeholder="••••"
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      setPinError(null);
                    }}
                    className={`w-full px-4 py-2.5 text-center text-xl font-mono tracking-widest rounded-xl border bg-app-bg text-content-primary focus:outline-none focus:ring-2 transition-all ${
                      pinError
                        ? 'border-rose-500 ring-1 ring-rose-500'
                        : 'border-app-border focus:ring-primary'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-content-muted hover:text-content-primary rounded-lg transition-colors"
                    title={showPin ? 'Ẩn mã PIN' : 'Hiện mã PIN'}
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {pinError && (
                  <p className="text-[11px] text-rose-500 font-bold flex items-center gap-1.5 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{pinError}</span>
                  </p>
                )}
              </div>

              <div className="text-[11px] text-content-muted bg-black/5 dark:bg-white/5 p-2.5 rounded-xl border border-app-subtle flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span>
                  Khóa PIN an toàn ngăn trẻ nhỏ hoặc người dùng vô tình xoá nhầm dữ liệu học tập và nhật ký quan trọng.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-app-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                  disabled={isProcessing}
                >
                  Huỷ bỏ
                </Button>
                <Button
                  type="submit"
                  variant={options.isDanger ? 'danger' : 'primary'}
                  size="sm"
                  icon={options.isDanger ? <Trash2 className="w-3.5 h-3.5" /> : undefined}
                  disabled={isProcessing || !pinInput.trim()}
                >
                  {isProcessing ? 'Đang xử lý...' : (options.confirmText || 'Xác nhận')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminConfirmContext.Provider>
  );
};

export const useAdminConfirm = (): AdminConfirmContextType => {
  const context = useContext(AdminConfirmContext);
  if (!context) {
    throw new Error('useAdminConfirm must be used within an AdminConfirmProvider');
  }
  return context;
};
