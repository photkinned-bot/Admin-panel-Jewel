import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Camera,
  X,
  FileSpreadsheet,
  RefreshCw,
  Phone,
  Calendar as CalendarIcon,
  DollarSign
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { useWorkshop } from '../context/WorkshopContext';
import { clsx } from 'clsx';

const StatusBadge = ({ status }: { status: OrderStatus }) => {
  const config = {
    [OrderStatus.ACCEPTED]: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Прийнято' },
    [OrderStatus.IN_PROGRESS]: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'В роботі' },
    [OrderStatus.CASTING]: { bg: 'bg-purple-50', text: 'text-purple-600', label: 'Литво' },
    [OrderStatus.STONE_SETTING]: { bg: 'bg-indigo-50', text: 'text-indigo-600', label: 'Закріпка' },
    [OrderStatus.POLISHING]: { bg: 'bg-cyan-50', text: 'text-cyan-600', label: 'Полірування' },
    [OrderStatus.COMPLETED]: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Готово' },
  };

  const { bg, text, label } = config[status] || config[OrderStatus.ACCEPTED];

  return (
    <span className={clsx("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", bg, text)}>
      {label}
    </span>
  );
};

export const OrderList: React.FC = () => {
  const { 
    orders, 
    addOrder, 
    updateOrder, 
    deleteOrder, 
    syncToSheets, 
    isSyncing,
    isConnectedToSheets,
    spreadsheetUrl
  } = useWorkshop();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState<Partial<Order>>({});

  const handleOpenModal = (order: Order | null) => {
    setSelectedOrder(order);
    setFormData(order || {
      orderNumber: `ORD-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, '0')}`,
      status: OrderStatus.ACCEPTED,
      createdAt: new Date().toISOString(),
      materials: [{ id: 'm1', name: 'Золото 585', weight: 4.0, unit: 'g', type: 'metal' }],
      photos: [{ url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80' }],
      payments: [],
      expenses: [],
      totalAmount: 0,
      advance: 0,
      deadline: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      itemName: '',
      clientName: '',
      clientPhone: '',
      description: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (selectedOrder) {
        await updateOrder(selectedOrder.id, formData);
      } else {
        await addOrder(formData);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving order:', err);
      setIsModalOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedOrder) return;
    if (!confirm('Ви впевнені, що хочете видалити це замовлення?')) return;

    try {
      await deleteOrder(selectedOrder.id);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error deleting order:', err);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({
          ...prev,
          photos: [{ url: base64String }]
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      (order.orderNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.clientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.itemName || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Primary Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="serif text-3xl font-light">Замовлення</h2>
          <p className="text-zinc-500 text-sm">
            Пряма синхронізація з аркушем «📋 Замовлення» вашої Google Таблиці.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={syncToSheets}
            disabled={isSyncing}
            className="bg-white text-zinc-800 border border-zinc-200 px-4 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-zinc-50 transition-all shadow-sm disabled:opacity-50"
            title="Синхронізувати з Google Sheets"
          >
            {isSyncing ? (
              <RefreshCw className="animate-spin text-emerald-600" size={18} />
            ) : (
              <FileSpreadsheet className="text-emerald-600" size={18} />
            )}
            <span>{isSyncing ? 'Збереження...' : 'Google Sheets'}</span>
          </button>

          <button 
            onClick={() => handleOpenModal(null)}
            className="bg-black text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-lg shadow-black/10"
          >
            <Plus size={18} />
            Нове замовлення
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text" 
            placeholder="Пошук за номером, клієнтом або виробом..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-black/5 transition-all text-sm"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm font-bold text-zinc-600 outline-none focus:ring-2 focus:ring-black/5 transition-all"
        >
          <option value="ALL">Всі статуси ({orders.length})</option>
          <option value={OrderStatus.ACCEPTED}>Прийнято</option>
          <option value={OrderStatus.IN_PROGRESS}>В роботі</option>
          <option value={OrderStatus.CASTING}>Литво</option>
          <option value={OrderStatus.STONE_SETTING}>Закріпка</option>
          <option value={OrderStatus.POLISHING}>Полірування</option>
          <option value={OrderStatus.COMPLETED}>Готово</option>
        </select>
      </div>

      {/* Orders Table Container */}
      <div className="bg-white rounded-[2rem] border border-zinc-100 overflow-hidden shadow-sm">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto text-zinc-400 mb-4">
              <Search size={28} />
            </div>
            <h3 className="font-bold text-lg text-zinc-800 mb-1">Замовлень не знайдено</h3>
            <p className="text-zinc-500 text-sm max-w-md mx-auto mb-6">
              {searchQuery || statusFilter !== 'ALL' 
                ? 'Спробуйте змінити пошуковий запит або скинути фільтри.' 
                : 'Створіть ваше перше замовлення або імпортуйте дані з Google Таблиці.'}
            </p>
            <button
              onClick={() => handleOpenModal(null)}
              className="px-6 py-2.5 bg-black text-white rounded-xl font-bold text-sm inline-flex items-center gap-2 hover:bg-zinc-800"
            >
              <Plus size={16} />
              Додати замовлення
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/50">
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">Номер / Виріб</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">Клієнт</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">Статус</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">Дедлайн</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">Сума / Аванс</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {filteredOrders.map((order) => (
                    <tr 
                      key={order.id} 
                      onClick={() => handleOpenModal(order)}
                      className="group hover:bg-zinc-50/80 transition-colors cursor-pointer"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-zinc-100 overflow-hidden shrink-0 border border-zinc-100">
                            {order.photos && order.photos[0] ? (
                              <img src={order.photos[0].url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-300">
                                <Camera size={20} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-mono text-xs text-zinc-400 font-bold">{order.orderNumber}</p>
                            <p className="font-bold text-zinc-900 text-sm group-hover:text-black">{order.itemName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-bold text-zinc-900">{order.clientName}</p>
                        <p className="text-xs text-zinc-400">{order.clientPhone || '—'}</p>
                      </td>
                      <td className="px-8 py-5">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-600 font-medium">
                          <Clock size={14} className="text-zinc-400" />
                          <span>{order.deadline || '—'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-bold text-zinc-900">₴{(order.totalAmount || 0).toLocaleString('uk-UA')}</p>
                        <p className="text-[11px] text-emerald-600 font-medium">Аванс: ₴{(order.advance || 0).toLocaleString('uk-UA')}</p>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="p-2 text-zinc-400 group-hover:text-zinc-900 transition-colors inline-block">
                          <ChevronRight size={18} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-zinc-100">
              {filteredOrders.map((order) => (
                <div 
                  key={order.id}
                  onClick={() => handleOpenModal(order)}
                  className="p-4 space-y-3 hover:bg-zinc-50 active:bg-zinc-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-zinc-100 overflow-hidden shrink-0 border border-zinc-100">
                        {order.photos && order.photos[0] ? (
                          <img src={order.photos[0].url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-300">
                            <Camera size={18} />
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="font-mono text-[10px] text-zinc-400 font-bold block">{order.orderNumber}</span>
                        <h4 className="font-bold text-zinc-900 text-sm leading-tight">{order.itemName}</h4>
                        <p className="text-xs text-zinc-500 mt-0.5">{order.clientName}</p>
                      </div>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-50">
                    <span className="text-zinc-500 flex items-center gap-1">
                      <Clock size={12} /> {order.deadline || 'Без дедлайну'}
                    </span>
                    <span className="font-bold text-zinc-900">
                      ₴{(order.totalAmount || 0).toLocaleString('uk-UA')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal for Creating / Editing Order */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 my-8">
            <div className="p-6 md:p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <div>
                <span className="text-xs font-mono font-bold text-zinc-400 block">{formData.orderNumber}</span>
                <h3 className="serif text-2xl font-light">
                  {selectedOrder ? 'Редагувати замовлення' : 'Нове замовлення'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-zinc-200 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Назва виробу</label>
                  <input 
                    type="text" 
                    value={formData.itemName || ''} 
                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                    placeholder="напр. Обручка з діамантом"
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-black text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Статус</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as OrderStatus })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-black text-sm font-semibold"
                  >
                    <option value={OrderStatus.ACCEPTED}>Прийнято</option>
                    <option value={OrderStatus.IN_PROGRESS}>В роботі</option>
                    <option value={OrderStatus.CASTING}>Литво</option>
                    <option value={OrderStatus.STONE_SETTING}>Закріпка</option>
                    <option value={OrderStatus.POLISHING}>Полірування</option>
                    <option value={OrderStatus.COMPLETED}>Готово</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Клієнт</label>
                  <input 
                    type="text" 
                    value={formData.clientName || ''} 
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    placeholder="ПІБ клієнта"
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-black text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Телефон клієнта</label>
                  <input 
                    type="text" 
                    value={formData.clientPhone || ''} 
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    placeholder="+380 99 000 00 00"
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-black text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Дедлайн</label>
                  <input 
                    type="date" 
                    value={formData.deadline || ''} 
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-black text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Сума (₴)</label>
                  <input 
                    type="number" 
                    value={formData.totalAmount ?? 0} 
                    onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-black text-sm font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Аванс (₴)</label>
                  <input 
                    type="number" 
                    value={formData.advance ?? 0} 
                    onChange={(e) => setFormData({ ...formData, advance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-black text-sm font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Опис та техзавдання</label>
                <textarea 
                  value={formData.description || ''} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Деталі виготовлення, розмір, проба металу, особливості форми..."
                  rows={2}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-black text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Примітки майстра</label>
                <textarea 
                  value={formData.notes || ''} 
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Внутрішні коментарі, особливості сплаву або закріпки..."
                  rows={2}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-black text-sm"
                />
              </div>

              {/* Photo attachment */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Фото / Ескіз</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-zinc-100 rounded-2xl overflow-hidden border border-zinc-200 shrink-0">
                    {formData.photos && formData.photos[0] ? (
                      <img src={formData.photos[0].url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400">
                        <Camera size={24} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-xs text-zinc-500">Завантажте фото або вставте посилання на зображення.</p>
                    <label className="inline-block px-4 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-xs font-bold cursor-pointer transition-colors">
                      Обрати файл
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 md:p-8 bg-zinc-50/70 border-t border-zinc-100 flex gap-4">
              {selectedOrder ? (
                <>
                  <button 
                    onClick={handleDelete} 
                    className="flex-1 py-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl font-bold text-sm hover:bg-rose-100 transition-all"
                  >
                    Видалити
                  </button>
                  <button 
                    onClick={handleSave} 
                    className="flex-1 py-3.5 bg-black text-white rounded-2xl font-bold text-sm hover:bg-zinc-800 transition-all shadow-lg shadow-black/10"
                  >
                    Зберегти зміни
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setIsModalOpen(false)} 
                    className="flex-1 py-3.5 bg-white border border-zinc-200 rounded-2xl font-bold text-sm hover:bg-zinc-100 transition-all"
                  >
                    Скасувати
                  </button>
                  <button 
                    onClick={handleSave} 
                    className="flex-1 py-3.5 bg-black text-white rounded-2xl font-bold text-sm hover:bg-zinc-800 transition-all shadow-lg shadow-black/10"
                  >
                    Створити замовлення
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
