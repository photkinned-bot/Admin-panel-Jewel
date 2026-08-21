import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  Gem,
  Layers,
  MoreHorizontal,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  Trash2,
  Edit2,
  X
} from 'lucide-react';
import { clsx } from 'clsx';
import { useWorkshop, InventoryItem } from '../context/WorkshopContext';

export const Inventory: React.FC = () => {
  const { 
    inventory, 
    addInventoryItem, 
    updateInventoryItem, 
    deleteInventoryItem, 
    syncToSheets, 
    isSyncing 
  } = useWorkshop();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  
  // Transaction Modal (Income / Expense)
  const [isTransModalOpen, setIsTransModalOpen] = useState(false);
  const [transType, setTransType] = useState<'in' | 'out'>('in');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [transAmount, setTransAmount] = useState<number>(0);
  const [transComment, setTransComment] = useState<string>('');

  // Item Create / Edit Modal
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemFormData, setItemFormData] = useState<Partial<InventoryItem>>({
    name: '',
    category: 'Метали',
    quantity: 0,
    unit: 'г',
    price: 0,
    status: 'OK'
  });

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = 
      (item.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalValuation = inventory.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0);
  const lowStockCount = inventory.filter(item => item.status === 'LOW').length;
  const criticalStockCount = inventory.filter(item => item.status === 'CRITICAL').length;

  const handleOpenTransaction = (type: 'in' | 'out') => {
    setTransType(type);
    setSelectedItemId(inventory[0]?.id || '');
    setTransAmount(0);
    setTransComment('');
    setIsTransModalOpen(true);
  };

  const handleConfirmTransaction = async () => {
    const target = inventory.find(i => i.id === selectedItemId);
    if (!target) return;

    let newQuantity = transType === 'in' 
      ? (target.quantity || 0) + Number(transAmount)
      : Math.max(0, (target.quantity || 0) - Number(transAmount));

    let newStatus: 'OK' | 'LOW' | 'CRITICAL' = 'OK';
    if (newQuantity <= 0) newStatus = 'CRITICAL';
    else if (newQuantity < (target.unit === 'г' ? 20 : 5)) newStatus = 'LOW';

    await updateInventoryItem(target.id, {
      quantity: Math.round(newQuantity * 100) / 100,
      status: newStatus
    });

    setIsTransModalOpen(false);
  };

  const handleOpenItemModal = (item: InventoryItem | null) => {
    setEditingItem(item);
    setItemFormData(item || {
      name: '',
      category: 'Метали',
      quantity: 0,
      unit: 'г',
      price: 0,
      status: 'OK'
    });
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async () => {
    if (!itemFormData.name) return;
    if (editingItem) {
      await updateInventoryItem(editingItem.id, itemFormData);
    } else {
      await addInventoryItem(itemFormData);
    }
    setIsItemModalOpen(false);
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Видалити цю позицію зі складу?')) return;
    await deleteInventoryItem(id);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="serif text-3xl font-light">Склад матеріалів</h2>
          <p className="text-zinc-500 text-sm">
            Пряма синхронізація з аркушем «📦 Склад» вашої Google Таблиці.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={syncToSheets}
            disabled={isSyncing}
            className="bg-white text-zinc-800 border border-zinc-200 px-4 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-zinc-50 transition-all shadow-sm disabled:opacity-50"
            title="Оновити склад в Google Sheets"
          >
            {isSyncing ? (
              <RefreshCw className="animate-spin text-emerald-600" size={18} />
            ) : (
              <FileSpreadsheet className="text-emerald-600" size={18} />
            )}
            <span>{isSyncing ? 'Збереження...' : 'Google Sheets'}</span>
          </button>
          
          <button 
            onClick={() => handleOpenTransaction('out')}
            className="bg-white border border-zinc-200 text-zinc-900 px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-zinc-50 transition-all"
          >
            <ArrowDownRight size={18} className="text-rose-500" />
            Списання
          </button>

          <button 
            onClick={() => handleOpenTransaction('in')}
            className="bg-zinc-900 text-white px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-zinc-800 transition-all"
          >
            <ArrowUpRight size={18} className="text-emerald-400" />
            Прихід
          </button>

          <button 
            onClick={() => handleOpenItemModal(null)}
            className="bg-black text-white px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-lg shadow-black/10"
          >
            <Plus size={18} />
            Нова позиція
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="luxury-card bg-emerald-50/40 border-emerald-200">
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Оціночна вартість залишків</p>
          <p className="text-2xl font-bold text-emerald-800">₴{Math.round(totalValuation).toLocaleString('uk-UA')}</p>
        </div>
        <div className="luxury-card bg-amber-50/40 border-amber-200">
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Низький запас</p>
          <p className="text-2xl font-bold text-amber-800">{lowStockCount} позицій</p>
        </div>
        <div className="luxury-card bg-rose-50/40 border-rose-200">
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Критичний рівень</p>
          <p className="text-2xl font-bold text-rose-800">{criticalStockCount} позицій</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text" 
            placeholder="Пошук матеріалу за назвою або категорією..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-black/5 transition-all text-sm"
          />
        </div>
        <select 
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm font-bold text-zinc-600 outline-none focus:ring-2 focus:ring-black/5 transition-all"
        >
          <option value="ALL">Всі категорії ({inventory.length})</option>
          <option value="Метали">Метали</option>
          <option value="Камені">Камені / Вставки</option>
          <option value="Хімія">Хімія та покриття</option>
          <option value="Розхідники">Витратні матеріали</option>
        </select>
      </div>

      {/* Inventory Table Container */}
      <div className="bg-white rounded-[2rem] border border-zinc-100 overflow-hidden shadow-sm">
        {filteredInventory.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto text-zinc-400 mb-4">
              <Layers size={28} />
            </div>
            <h3 className="font-bold text-lg text-zinc-800 mb-1">Позицій не знайдено</h3>
            <p className="text-zinc-500 text-sm max-w-md mx-auto mb-6">
              Додайте новий матеріал на склад або підключіть Google Таблицю для синхронізації.
            </p>
            <button
              onClick={() => handleOpenItemModal(null)}
              className="px-6 py-2.5 bg-black text-white rounded-xl font-bold text-sm inline-flex items-center gap-2 hover:bg-zinc-800"
            >
              <Plus size={16} />
              Додати матеріал
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/50">
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">Матеріал</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">Категорія</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">Кількість на залишку</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">Статус</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">Ціна за од.</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">Сумарно</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {filteredInventory.map((item) => (
                    <tr key={item.id} className="group hover:bg-zinc-50/80 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-500">
                            {item.category === 'Метали' ? <Layers size={18} /> : <Gem size={18} />}
                          </div>
                          <p className="font-bold text-sm text-zinc-900 whitespace-nowrap">{item.name}</p>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-xs font-medium text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded-lg whitespace-nowrap">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-bold text-zinc-900 whitespace-nowrap">{item.quantity} {item.unit}</p>
                      </td>
                      <td className="px-8 py-5">
                        <span className={clsx(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap",
                          item.status === 'OK' ? "bg-emerald-50 text-emerald-700" :
                          item.status === 'LOW' ? "bg-amber-50 text-amber-700" :
                          "bg-rose-50 text-rose-700"
                        )}>
                          {item.status === 'OK' ? 'Норма' : item.status === 'LOW' ? 'Мало' : 'Критично'}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-medium text-zinc-600 whitespace-nowrap">₴{(item.price || 0).toLocaleString('uk-UA')}</p>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-bold text-zinc-900 whitespace-nowrap">₴{Math.round((item.quantity || 0) * (item.price || 0)).toLocaleString('uk-UA')}</p>
                      </td>
                      <td className="px-8 py-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => handleOpenItemModal(item)}
                            className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                            title="Редагувати"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button 
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Видалити"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-zinc-100">
              {filteredInventory.map((item) => (
                <div key={item.id} className="p-5 space-y-3 hover:bg-zinc-50 active:bg-zinc-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-500">
                        {item.category === 'Метали' ? <Layers size={16} /> : <Gem size={16} />}
                      </div>
                      <p className="font-bold text-sm text-zinc-900">{item.name}</p>
                    </div>
                    <span className={clsx(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      item.status === 'OK' ? "bg-emerald-50 text-emerald-700" :
                      item.status === 'LOW' ? "bg-amber-50 text-amber-700" :
                      "bg-rose-50 text-rose-700"
                    )}>
                      {item.status === 'OK' ? 'Норма' : item.status === 'LOW' ? 'Мало' : 'Критично'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
                    <div>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase">Категорія</p>
                      <p className="font-medium text-zinc-700 truncate">{item.category}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase">Залишок</p>
                      <p className="font-bold text-zinc-900">{item.quantity} {item.unit}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase">Вартість</p>
                      <p className="font-bold text-emerald-700">₴{Math.round((item.quantity || 0) * (item.price || 0)).toLocaleString('uk-UA')}</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
                    <button
                      onClick={() => handleOpenItemModal(item)}
                      className="px-3 py-1 bg-zinc-100 text-zinc-700 rounded-lg text-xs font-semibold"
                    >
                      Редагувати
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Transaction Modal (Прихід / Списання) */}
      {isTransModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <h3 className="serif text-2xl font-light">
                {transType === 'in' ? 'Прихід матеріалу' : 'Списання матеріалу'}
              </h3>
              <button onClick={() => setIsTransModalOpen(false)} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 md:p-8 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Оберіть матеріал</label>
                <select 
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-black text-sm font-semibold"
                >
                  {inventory.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.quantity} {item.unit} на складі)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Кількість для {transType === 'in' ? 'приходу' : 'списання'}</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={transAmount || ''} 
                  onChange={(e) => setTransAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00" 
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-black text-sm font-bold" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Примітка / Причина</label>
                <input 
                  type="text" 
                  value={transComment}
                  onChange={(e) => setTransComment(e.target.value)}
                  placeholder={transType === 'in' ? 'Поставка від постачальника...' : 'Витрачено на замовлення ORD-2025...'} 
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-black text-sm" 
                />
              </div>
            </div>

            <div className="p-6 md:p-8 bg-zinc-50/70 border-t border-zinc-100 flex gap-4">
              <button onClick={() => setIsTransModalOpen(false)} className="flex-1 py-3.5 bg-white border border-zinc-200 rounded-2xl font-bold text-sm hover:bg-zinc-100 transition-all">
                Скасувати
              </button>
              <button 
                onClick={handleConfirmTransaction} 
                className={clsx(
                  "flex-1 py-3.5 text-white rounded-2xl font-bold text-sm transition-all shadow-lg",
                  transType === 'in' ? "bg-black hover:bg-zinc-800 shadow-black/10" : "bg-rose-600 hover:bg-rose-700 shadow-rose-200"
                )}
              >
                Підтвердити операцію
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New / Edit Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <h3 className="serif text-2xl font-light">
                {editingItem ? 'Редагувати матеріал' : 'Додати новий матеріал'}
              </h3>
              <button onClick={() => setIsItemModalOpen(false)} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Назва матеріалу</label>
                <input 
                  type="text" 
                  value={itemFormData.name || ''} 
                  onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                  placeholder="напр. Золото 585 або Діаманти 0.1ct" 
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-black text-sm" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Категорія</label>
                  <select 
                    value={itemFormData.category}
                    onChange={(e) => setItemFormData({ ...itemFormData, category: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-black text-sm font-semibold"
                  >
                    <option value="Метали">Метали</option>
                    <option value="Камені">Камені</option>
                    <option value="Хімія">Хімія</option>
                    <option value="Розхідники">Розхідники</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Одиниця виміру</label>
                  <input 
                    type="text" 
                    value={itemFormData.unit || 'г'} 
                    onChange={(e) => setItemFormData({ ...itemFormData, unit: e.target.value })}
                    placeholder="г, шт, мл, карат" 
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-black text-sm" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Кількість на складі</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={itemFormData.quantity ?? 0} 
                    onChange={(e) => setItemFormData({ ...itemFormData, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-black text-sm font-bold" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Ціна за 1 од. (₴)</label>
                  <input 
                    type="number" 
                    value={itemFormData.price ?? 0} 
                    onChange={(e) => setItemFormData({ ...itemFormData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-black text-sm font-bold" 
                  />
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 bg-zinc-50/70 border-t border-zinc-100 flex gap-4">
              <button onClick={() => setIsItemModalOpen(false)} className="flex-1 py-3.5 bg-white border border-zinc-200 rounded-2xl font-bold text-sm hover:bg-zinc-100 transition-all">
                Скасувати
              </button>
              <button 
                onClick={handleSaveItem} 
                className="flex-1 py-3.5 bg-black text-white rounded-2xl font-bold text-sm hover:bg-zinc-800 transition-all shadow-lg shadow-black/10"
              >
                Зберегти
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
