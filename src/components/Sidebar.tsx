import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Gem, 
  Settings, 
  Calendar,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Панель', icon: LayoutDashboard },
  { id: 'orders', label: 'Замовлення', icon: Package },
  { id: 'catalog', label: 'Каталог', icon: Gem },
  { id: 'inventory', label: 'Склад', icon: Sparkles },
  { id: 'sheets', label: 'Google Таблиці', icon: FileSpreadsheet },
  { id: 'calendar', label: 'Календар', icon: Calendar },
  { id: 'settings', label: 'Налаштування', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <div className={clsx(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-zinc-200 transition-transform duration-300 lg:sticky lg:translate-x-0 lg:z-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-12 px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white">
                <Gem size={24} />
              </div>
              <div>
                <h1 className="font-serif text-xl font-bold leading-none">JewelMaster</h1>
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mt-1">Professional Pro</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 lg:hidden text-zinc-400 hover:text-zinc-900">
              <Sparkles className="rotate-45" size={20} />
            </button>
          </div>

          <nav className="flex-1 space-y-2">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    onClose();
                  }}
                  className={clsx(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group relative",
                    isActive 
                      ? "bg-zinc-900 text-white shadow-xl shadow-zinc-200" 
                      : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                  )}
                >
                  <Icon size={20} className={clsx("transition-transform", isActive ? "scale-110" : "group-hover:scale-110")} />
                  <span className="font-medium text-sm">{item.label}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="active-pill"
                      className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-zinc-100 px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 overflow-hidden">
                <img src="https://picsum.photos/seed/avatar/100/100" alt="User" referrerPolicy="no-referrer" />
              </div>
              <div>
                <p className="text-sm font-bold">Майстер Ювелір</p>
                <p className="text-xs text-zinc-400">Адміністратор</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
