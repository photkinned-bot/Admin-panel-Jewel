import React from 'react';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  LogOut,
  Upload,
  Layers,
  Menu
} from 'lucide-react';
import { useWorkshop } from '../context/WorkshopContext';
import { isInsideIframe } from '../lib/googleAuth';
import { clsx } from 'clsx';

interface HeaderBarProps {
  onOpenSheetsTab: () => void;
  onOpenSidebar: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ onOpenSheetsTab, onOpenSidebar }) => {
  const {
    user,
    isConnectedToSheets,
    spreadsheetTitle,
    spreadsheetUrl,
    isSyncing,
    isLoading,
    lastSyncTime,
    syncToSheets,
    signIn,
    signOut,
    syncToast,
    isPopupBlocked,
    syncError,
    dismissError,
  } = useWorkshop();

  const inIframe = typeof window !== 'undefined' && isInsideIframe();

  return (
    <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-zinc-200">
      {/* Toast banner if active */}
      {syncToast && (
        <div className="bg-emerald-600 text-white px-4 py-1.5 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 size={14} />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Popup Blocked Warning Modal/Banner */}
      {isPopupBlocked && (
        <div className="bg-amber-500 text-zinc-950 px-4 py-2.5 text-xs font-medium border-b border-amber-600/30 flex flex-wrap items-center justify-between gap-3 shadow-md animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={17} className="text-zinc-950 shrink-0" />
            <span>
              <strong>Браузер заблокував спливаюче вікно Google:</strong> Для входу відкрийте застосунок в окремій вкладці.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={typeof window !== 'undefined' ? window.location.href : '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-zinc-950 text-white hover:bg-zinc-800 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span>Відкрити в новій вкладці</span>
              <ExternalLink size={12} />
            </a>
            <button
              onClick={dismissError}
              className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/40 text-zinc-900 rounded-lg text-xs font-bold transition-colors"
            >
              Закрити
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Connection Badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-2 hover:bg-zinc-100 rounded-xl text-zinc-700 transition-colors"
          >
            <Menu size={20} />
          </button>

          {isConnectedToSheets ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenSheetsTab}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 transition-all text-left group"
                title="Налаштування Google Таблиці"
              >
                <div className="relative">
                  <FileSpreadsheet size={16} className="text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span className={clsx(
                    "absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full",
                    isSyncing ? "bg-amber-500 animate-ping" : "bg-emerald-500"
                  )} />
                </div>
                <div className="hidden sm:block">
                  <span className="font-semibold text-zinc-900 block leading-none truncate max-w-[160px] md:max-w-[220px]">
                    {spreadsheetTitle || 'Google Таблиця'}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-normal">
                    {isSyncing ? 'Синхронізація...' : lastSyncTime ? `Синхр: ${new Date(lastSyncTime).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}` : 'Підключено'}
                  </span>
                </div>
              </button>

              {spreadsheetUrl && (
                <a
                  href={spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden md:flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-600 hover:text-zinc-900 transition-colors"
                  title="Відкрити в Google Таблицях"
                >
                  <ExternalLink size={13} />
                  <span className="font-medium text-[11px]">Таблиця</span>
                </a>
              )}

              <button
                onClick={syncToSheets}
                disabled={isSyncing || isLoading}
                className="p-1.5 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-600 hover:text-zinc-900 rounded-xl transition-all disabled:opacity-50"
                title="Синхронізувати зараз"
              >
                <RefreshCw size={14} className={clsx(isSyncing && "animate-spin text-emerald-600")} />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenSheetsTab}
              className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs font-bold text-amber-900 transition-all"
            >
              <FileSpreadsheet size={15} className="text-amber-600" />
              <span className="hidden sm:inline">Локальний режим • Підключити Google Таблицю</span>
              <span className="sm:hidden">Підключити Таблицю</span>
            </button>
          )}
        </div>

        {/* Right: User Authentication / Status */}
        <div className="flex items-center gap-2">
          {inIframe && (
            <a
              href={typeof window !== 'undefined' ? window.location.href : '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 transition-colors"
              title="Відкрити в окремій вкладці для повної підтримки Google Auth"
            >
              <ExternalLink size={13} />
              <span>Окрема вкладка</span>
            </a>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-2.5 py-1 bg-zinc-50 rounded-xl border border-zinc-200">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-5 h-5 rounded-full" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px] font-bold">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-medium text-zinc-700 hidden sm:inline max-w-[120px] truncate">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
              </div>
              <button
                onClick={signOut}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors"
                title="Вийти з Google"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={signIn}
              className="px-3 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <ShieldCheck size={14} />
              <span>Google Вхід</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
