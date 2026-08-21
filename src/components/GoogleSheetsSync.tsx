import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Link as LinkIcon, 
  LogOut, 
  Download, 
  Upload, 
  Copy, 
  Check, 
  Sparkles,
  ShieldCheck,
  TableProperties,
  ArrowRight,
  Database,
  Layers
} from 'lucide-react';
import { useWorkshop } from '../context/WorkshopContext';
import { clsx } from 'clsx';

export const GoogleSheetsSync: React.FC = () => {
  const {
    orders,
    catalog,
    inventory,
    isSyncing,
    isLoading,
    syncError,
    lastSyncTime,
    user,
    hasToken,
    spreadsheetId,
    spreadsheetTitle,
    spreadsheetUrl,
    isConnectedToSheets,
    signIn,
    signOut,
    createSheet,
    connectSheet,
    disconnectSheet,
    syncToSheets,
    pullFromSheets,
  } = useWorkshop();

  const [customSheetInput, setCustomSheetInput] = useState('');
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [isConnectingCustom, setIsConnectingCustom] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (spreadsheetUrl) {
      navigator.clipboard.writeText(spreadsheetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreateNewSheet = async () => {
    try {
      setIsCreatingCustom(true);
      await createSheet();
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingCustom(false);
    }
  };

  const handleConnectExisting = async () => {
    if (!customSheetInput.trim()) return;
    try {
      setIsConnectingCustom(true);
      await connectSheet(customSheetInput);
      setCustomSheetInput('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsConnectingCustom(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <FileSpreadsheet size={24} />
            </span>
            <h2 className="serif text-3xl font-light">Google Таблиці як База Даних</h2>
          </div>
          <p className="text-zinc-500 text-sm">
            Застосунок працює повністю без сторонніх баз даних, синхронізуючи всі дані напряму з вашим Google Диском.
          </p>
        </div>

        {user ? (
          <div className="flex items-center gap-3 bg-white border border-zinc-200 p-2 rounded-2xl shadow-sm">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || ''} className="w-9 h-9 rounded-xl object-cover" />
            ) : (
              <div className="w-9 h-9 bg-zinc-900 text-white rounded-xl flex items-center justify-center font-bold text-sm">
                {(user.displayName || user.email || 'G')[0].toUpperCase()}
              </div>
            )}
            <div className="text-left pr-2">
              <p className="text-xs font-bold text-zinc-900 leading-tight">{user.displayName || 'Google Користувач'}</p>
              <p className="text-[11px] text-zinc-500 truncate max-w-[140px]">{user.email}</p>
            </div>
            <button
              onClick={signOut}
              className="p-2 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 rounded-xl transition-colors"
              title="Вийти з Google"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={signIn}
            className="bg-black text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-lg shadow-black/10"
          >
            <ShieldCheck size={18} />
            Авторизуватися через Google
          </button>
        )}
      </div>

      {/* Error alert if any */}
      {syncError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex flex-col sm:flex-row items-start justify-between gap-3 text-sm animate-in fade-in">
          <div className="flex items-start gap-3 flex-1">
            <AlertCircle size={20} className="shrink-0 mt-0.5 text-rose-600" />
            <div>
              <p className="font-bold">Повідомлення авторизації / синхронізації</p>
              <p className="text-rose-700 mt-0.5 leading-relaxed">{syncError}</p>
            </div>
          </div>
          {(syncError.includes('Popup') || syncError.includes('popup') || syncError.includes('вікно')) && (
            <div className="flex items-center gap-2 mt-2 sm:mt-0 self-end sm:self-center shrink-0">
              <button
                onClick={() => window.open(window.location.href, '_blank')}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <ExternalLink size={13} />
                <span>Відкрити в новій вкладці</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Primary Connection Status Card */}
      <div className="luxury-card border-2 border-zinc-100 bg-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-zinc-100">
          <div className="flex items-start gap-4">
            <div className={clsx(
              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
              isConnectedToSheets ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-zinc-100 text-zinc-400"
            )}>
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={clsx(
                  "w-2.5 h-2.5 rounded-full animate-pulse",
                  isConnectedToSheets ? "bg-emerald-500" : "bg-amber-500"
                )} />
                <h3 className="font-bold text-lg text-zinc-900">
                  {isConnectedToSheets ? (spreadsheetTitle || 'Підключена Google Таблиця') : 'Таблицю ще не підключено'}
                </h3>
              </div>
              <p className="text-xs text-zinc-500">
                {isConnectedToSheets 
                  ? `ID: ${spreadsheetId}`
                  : 'Створіть нову таблицю або підключіть існуючу, щоб активувати збереження даних.'}
              </p>
              {lastSyncTime && (
                <p className="text-[11px] text-zinc-400 mt-1">
                  Остання синхронізація: <span className="font-semibold text-zinc-600">{new Date(lastSyncTime).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isConnectedToSheets ? (
              <>
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copied ? 'Скопійовано' : 'Копіювати ID'}</span>
                </button>
                {spreadsheetUrl && (
                  <a
                    href={spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-emerald-200"
                  >
                    <ExternalLink size={14} />
                    <span>Відкрити в Google Sheets</span>
                  </a>
                )}
                <button
                  onClick={disconnectSheet}
                  className="px-3 py-2.5 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors"
                >
                  Відключити
                </button>
              </>
            ) : null}
          </div>
        </div>

        {/* Action Buttons for Sync */}
        <div className="pt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={syncToSheets}
              disabled={isSyncing || isLoading}
              className="bg-black text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all shadow-md shadow-black/10 disabled:opacity-50"
            >
              <Upload size={16} className={isSyncing ? 'animate-bounce' : ''} />
              <span>{isSyncing ? 'Збереження в Google...' : 'Зберегти дані в таблицю'}</span>
            </button>

            <button
              onClick={pullFromSheets}
              disabled={isSyncing || isLoading || !isConnectedToSheets}
              className="bg-white border border-zinc-200 text-zinc-800 px-5 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-zinc-50 transition-all disabled:opacity-50"
            >
              <Download size={16} className={isLoading ? 'animate-spin' : ''} />
              <span>{isLoading ? 'Завантаження...' : 'Оновити з таблиці'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-500 justify-end">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Автозбереження змін у фоновому режимі активне</span>
          </div>
        </div>
      </div>

      {/* Sheets Content Structure Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Orders Card */}
        <div className="luxury-card border border-zinc-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 font-bold text-zinc-900">
              <span className="text-lg">📋</span>
              <span>Аркуш «Замовлення»</span>
            </div>
            <span className="bg-zinc-100 text-zinc-800 text-xs font-bold px-2.5 py-1 rounded-full">
              {orders.length} записів
            </span>
          </div>
          <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
            Повний виробничий журнал: номери, клієнти, телефони, статуси етапів, дедлайни, суми, аванси, склад матеріалів та примітки.
          </p>
          <div className="bg-zinc-50 rounded-xl p-3 text-[11px] text-zinc-600 font-mono space-y-1">
            <div className="flex justify-between">
              <span>Активних:</span>
              <span className="font-bold text-zinc-900">{orders.filter(o => o.status !== 'COMPLETED').length}</span>
            </div>
            <div className="flex justify-between">
              <span>Сума виручки:</span>
              <span className="font-bold text-emerald-700">₴{orders.reduce((s, o) => s + (o.totalAmount || 0), 0).toLocaleString('uk-UA')}</span>
            </div>
          </div>
        </div>

        {/* Catalog Card */}
        <div className="luxury-card border border-zinc-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 font-bold text-zinc-900">
              <span className="text-lg">💎</span>
              <span>Аркуш «Каталог»</span>
            </div>
            <span className="bg-zinc-100 text-zinc-800 text-xs font-bold px-2.5 py-1 rounded-full">
              {catalog.length} моделей
            </span>
          </div>
          <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
            Бібліотека моделей прикрас: артикули, назви дизайнів, складність виконання, вартість роботи майстра та базові матеріали.
          </p>
          <div className="bg-zinc-50 rounded-xl p-3 text-[11px] text-zinc-600 font-mono space-y-1">
            <div className="flex justify-between">
              <span>Середня вартість роботи:</span>
              <span className="font-bold text-zinc-900">
                ₴{catalog.length > 0 ? Math.round(catalog.reduce((s, c) => s + (c.baseLaborCost || 0), 0) / catalog.length).toLocaleString('uk-UA') : 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Складність:</span>
              <span className="font-bold text-amber-700">{catalog.filter(c => c.complexity === 'HIGH').length} високої</span>
            </div>
          </div>
        </div>

        {/* Inventory Card */}
        <div className="luxury-card border border-zinc-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 font-bold text-zinc-900">
              <span className="text-lg">📦</span>
              <span>Аркуш «Склад»</span>
            </div>
            <span className="bg-zinc-100 text-zinc-800 text-xs font-bold px-2.5 py-1 rounded-full">
              {inventory.length} позицій
            </span>
          </div>
          <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
            Облік матеріалів: метали (золото/срібло), каміння (діаманти/сапфіри), хімія для родіювання та розрахунок загальної вартості залишків.
          </p>
          <div className="bg-zinc-50 rounded-xl p-3 text-[11px] text-zinc-600 font-mono space-y-1">
            <div className="flex justify-between">
              <span>Вартість складу:</span>
              <span className="font-bold text-emerald-700">
                ₴{inventory.reduce((s, i) => s + ((i.quantity || 0) * (i.price || 0)), 0).toLocaleString('uk-UA')}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Критичні залишки:</span>
              <span className="font-bold text-rose-600">{inventory.filter(i => i.status === 'CRITICAL' || i.status === 'LOW').length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Connect or Create Spreadsheet section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Card */}
        <div className="luxury-card bg-zinc-900 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-zinc-800 rounded-xl text-emerald-400">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base">Створити нову таблицю в Google Диску</h3>
              <p className="text-xs text-zinc-400">В 1 клік формує всі 4 аркуші з кольоровими ярликами та формулами</p>
            </div>
          </div>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            Система автоматично створить таблицю під назвою «JewelMaster Pro — База Даних», закріпить заголовки та вивантажить поточні дані.
          </p>
          <button
            onClick={handleCreateNewSheet}
            disabled={isCreatingCustom || isSyncing}
            className="w-full bg-white text-zinc-900 hover:bg-zinc-100 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isCreatingCustom ? (
              <RefreshCw className="animate-spin text-zinc-900" size={16} />
            ) : (
              <Plus size={16} />
            )}
            <span>{isCreatingCustom ? 'Створення таблиці...' : 'Створити Google Таблицю'}</span>
          </button>
        </div>

        {/* Connect Existing Card */}
        <div className="luxury-card bg-white border border-zinc-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-zinc-100 rounded-xl text-zinc-700">
              <LinkIcon size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900">Підключити існуючу таблицю</h3>
              <p className="text-xs text-zinc-500">Вставте посилання або ID таблиці Google</p>
            </div>
          </div>
          <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
            Ви можете підключити будь-яку раніше створену таблицю для спільної роботи кількох ювелірів або синхронізації з іншого пристрою.
          </p>
          <div className="space-y-3">
            <input
              type="text"
              value={customSheetInput}
              onChange={(e) => setCustomSheetInput(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/1aB2c..."
              className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-black"
            />
            <button
              onClick={handleConnectExisting}
              disabled={isConnectingCustom || !customSheetInput.trim()}
              className="w-full bg-black text-white hover:bg-zinc-800 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isConnectingCustom ? (
                <RefreshCw className="animate-spin text-white" size={14} />
              ) : (
                <ArrowRight size={14} />
              )}
              <span>{isConnectingCustom ? 'Підключення...' : 'Підключити за посиланням'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
