import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { HeaderBar } from './components/HeaderBar';
import { Dashboard } from './components/Dashboard';
import { OrderList } from './components/OrderList';
import { Catalog } from './components/Catalog';
import { Inventory } from './components/Inventory';
import { Calendar } from './components/Calendar';
import { Settings } from './components/Settings';
import { GoogleSheetsSync } from './components/GoogleSheetsSync';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={(tab) => setActiveTab(tab)} />;
      case 'orders':
        return <OrderList />;
      case 'catalog':
        return <Catalog />;
      case 'inventory':
        return <Inventory />;
      case 'sheets':
        return <GoogleSheetsSync />;
      case 'calendar':
        return <Calendar />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900 selection:bg-zinc-900 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Header with Google Sheets Sync status & Profile */}
        <HeaderBar 
          onOpenSheetsTab={() => setActiveTab('sheets')}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />

        {/* Page Container */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
