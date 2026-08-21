import React, { useState } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Database, 
  Globe, 
  CreditCard,
  Check,
  Save,
  AlertCircle,
  Download,
  Upload,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { clsx } from 'clsx';
import { MOCK_ORDERS, MOCK_CATALOG } from '../constants';
import { GoogleSheetsSync } from './GoogleSheetsSync';

const SETTINGS_TABS = [
  { id: 'profile', label: 'Профіль', icon: User },
  { id: 'google-sheets', label: 'Google Таблиці', icon: FileSpreadsheet },
  { id: 'database', label: 'База даних', icon: Database },
];

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('google-sheets');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1000);
  };

  const handleExport = () => {
    const data = {
      orders: MOCK_ORDERS,
      catalog: MOCK_CATALOG,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jewelmaster_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (re) => {
          try {
            const content = JSON.parse(re.target?.result as string);
            console.log('Imported data:', content);
            alert('Дані успішно імпортовані (демо-режим: дані виведені в консоль)');
          } catch (err) {
            alert('Помилка при читанні файлу');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="serif text-3xl font-light">Налаштування</h2>
          <p className="text-zinc-500 text-sm">Керуйте вашим профілем та параметрами майстерні.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-black text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-lg shadow-black/10 disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
          {isSaving ? 'Збереження...' : 'Зберегти зміни'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 luxury-card p-4">
          <nav className="space-y-1">
            {SETTINGS_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium",
                    isActive 
                      ? "bg-zinc-900 text-white" 
                      : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                  )}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {showSuccess && (
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 animate-in fade-in slide-in-from-top-2">
              <Check size={20} />
              <p className="text-sm font-bold">Налаштування успішно збережено!</p>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="luxury-card">
              <h3 className="font-bold text-lg mb-6">Загальні налаштування</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Назва майстерні</label>
                  <input 
                    type="text" 
                    defaultValue="JewelMaster Pro"
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl outline-none focus:ring-2 focus:ring-black/5 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Валюта</label>
                  <select className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl outline-none focus:ring-2 focus:ring-black/5 transition-all">
                    <option>UAH (₴)</option>
                    <option>USD ($)</option>
                    <option>EUR (€)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Email для сповіщень</label>
                  <input 
                    type="email" 
                    defaultValue="master@jewelmaster.pro"
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl outline-none focus:ring-2 focus:ring-black/5 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Мова інтерфейсу</label>
                  <select className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl outline-none focus:ring-2 focus:ring-black/5 transition-all">
                    <option>Українська</option>
                    <option>English</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'google-sheets' && (
            <GoogleSheetsSync />
          )}

          {activeTab === 'database' && (
            <div className="space-y-6">
              <div className="luxury-card">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                  <Database size={20} className="text-zinc-400" />
                  Резервне копіювання та експорт
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={handleExport}
                    className="flex items-center justify-between p-6 bg-zinc-50 rounded-2xl border border-zinc-100 hover:bg-zinc-100 transition-all group"
                  >
                    <div className="text-left">
                      <p className="font-bold text-sm group-hover:text-black transition-colors">Експорт даних</p>
                      <p className="text-xs text-zinc-400">Завантажити всі дані у форматі JSON</p>
                    </div>
                    <Download size={20} className="text-zinc-300 group-hover:text-black transition-colors" />
                  </button>
                  <button 
                    onClick={handleImport}
                    className="flex items-center justify-between p-6 bg-zinc-50 rounded-2xl border border-zinc-100 hover:bg-zinc-100 transition-all group"
                  >
                    <div className="text-left">
                      <p className="font-bold text-sm group-hover:text-black transition-colors">Імпорт даних</p>
                      <p className="text-xs text-zinc-400">Відновити дані з файлу резервної копії</p>
                    </div>
                    <Upload size={20} className="text-zinc-300 group-hover:text-black transition-colors" />
                  </button>
                </div>
              </div>

              <div className="luxury-card border-rose-100 bg-rose-50/10">
                <h3 className="font-bold text-lg mb-2 text-rose-900">Небезпечна зона</h3>
                <p className="text-sm text-zinc-500 mb-6">Видалення даних або скидання налаштувань неможливо відмінити.</p>
                <div className="flex gap-4">
                  <button className="px-6 py-2 border border-rose-200 text-rose-600 rounded-xl font-bold text-sm hover:bg-rose-50 transition-all">
                    Очистити базу даних
                  </button>
                  <button className="px-6 py-2 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition-all">
                    Видалити акаунт
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'profile' && activeTab !== 'database' && (
            <div className="luxury-card flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300 mb-4">
                <Settings size={32} />
              </div>
              <h3 className="font-bold text-lg">Розділ у розробці</h3>
              <p className="text-zinc-500 text-sm max-w-xs mx-auto mt-2">Ці налаштування стануть доступними у наступному оновленні.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
