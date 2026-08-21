import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Gem, 
  Layers, 
  ChevronRight, 
  Camera, 
  X, 
  FileSpreadsheet, 
  RefreshCw, 
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { CatalogItem } from '../types';
import { useWorkshop } from '../context/WorkshopContext';

export const Catalog: React.FC = () => {
  const { 
    catalog: items, 
    addCatalogItem, 
    updateCatalogItem, 
    deleteCatalogItem, 
    syncToSheets, 
    isSyncing 
  } = useWorkshop();

  const [searchQuery, setSearchQuery] = useState('');
  const [complexityFilter, setComplexityFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [formData, setFormData] = useState<Partial<CatalogItem>>({});

  const handleOpenModal = (item: CatalogItem | null) => {
    setSelectedItem(item);
    setFormData(item || {
      modelId: `MOD-${String(items.length + 1).padStart(3, '0')}`,
      name: '',
      description: '',
      complexity: 'MEDIUM',
      baseLaborCost: 3500,
      photos: [{ url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80' }],
      baseMaterials: [{ id: 'm1', name: 'Золото 585', weight: 3.5, unit: 'g', type: 'metal' }]
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (selectedItem) {
        await updateCatalogItem(selectedItem.id, formData);
      } else {
        await addCatalogItem(formData);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving item:', err);
      setIsModalOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    if (!confirm('Ви впевнені, що хочете видалити цю модель з каталогу?')) return;

    try {
      await deleteCatalogItem(selectedItem.id);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error deleting item:', err);
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

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.modelId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesComplexity = complexityFilter === 'ALL' || item.complexity === complexityFilter;
    return matchesSearch && matchesComplexity;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="serif text-3xl font-light">Каталог моделей</h2>
          <p className="text-zinc-500 text-sm">
            Пряма синхронізація з аркушем «💎 Каталог» вашої Google Таблиці.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={syncToSheets}
            disabled={isSyncing}
            className="bg-white text-zinc-800 border border-zinc-200 px-4 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-zinc-50 transition-all shadow-sm disabled:opacity-50"
            title="Оновити каталог в Google Sheets"
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
            Додати модель
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text" 
            placeholder="Пошук за назвою або артикулом..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-black/5 transition-all text-sm"
          />
        </div>
        <select 
          value={complexityFilter}
          onChange={(e) => setComplexityFilter(e.target.value)}
          className="px-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm font-bold text-zinc-600 outline-none focus:ring-2 focus:ring-black/5 transition-all"
        >
          <option value="ALL">Всі рівні складності ({items.length})</option>
          <option value="LOW">Низька</option>
          <option value="MEDIUM">Середня</option>
          <option value="HIGH">Висока</option>
        </select>
      </div>

      {/* Grid of Catalog Cards */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 px-4 luxury-card bg-white">
          <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto text-zinc-400 mb-4">
            <Gem size={28} />
          </div>
          <h3 className="font-bold text-lg text-zinc-800 mb-1">Моделей не знайдено</h3>
          <p className="text-zinc-500 text-sm max-w-md mx-auto mb-6">
            Додайте нову модель або завантажте готові з підключеної Google Таблиці.
          </p>
          <button
            onClick={() => handleOpenModal(null)}
            className="px-6 py-2.5 bg-black text-white rounded-xl font-bold text-sm inline-flex items-center gap-2 hover:bg-zinc-800"
          >
            <Plus size={16} />
            Додати модель
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item) => (
            <div 
              key={item.id} 
              onClick={() => handleOpenModal(item)}
              className="luxury-card group cursor-pointer overflow-hidden p-0 bg-white hover:shadow-xl transition-all"
            >
              <div className="aspect-[4/3] overflow-hidden relative bg-zinc-100">
                {item.photos && item.photos[0] ? (
                  <img 
                    src={item.photos[0].url} 
                    alt={item.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-300">
                    <Gem size={40} />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white/95 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm text-zinc-900 font-mono">
                    {item.modelId}
                  </span>
                </div>
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="bg-white text-zinc-900 px-5 py-2 rounded-full font-bold text-xs shadow-md">
                    Редагувати
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-zinc-900">{item.name}</h3>
                  <span className={item.complexity === 'HIGH' ? 'text-rose-500' : item.complexity === 'MEDIUM' ? 'text-amber-500' : 'text-emerald-500'} title={`Складність: ${item.complexity}`}>
                    <Layers size={18} />
                  </span>
                </div>
                <p className="text-zinc-500 text-sm line-clamp-2 mb-4">{item.description || 'Опис відсутній.'}</p>
                <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                  <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                    <Gem size={14} className="text-zinc-400" />
                    <span>{item.baseMaterials?.[0]?.name || 'Матеріали'}</span>
                  </div>
                  <p className="font-bold text-sm text-zinc-900">₴{(item.baseLaborCost || 0).toLocaleString('uk-UA')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Catalog Item */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <div>
                <span className="text-xs font-mono font-bold text-zinc-400 block">{formData.modelId}</span>
                <h3 className="serif text-2xl font-light">
                  {selectedItem ? `Модель: ${selectedItem.name}` : 'Додати модель до каталогу'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Артикул</label>
                  <input 
                    type="text" 
                    value={formData.modelId || ''} 
                    onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
                    placeholder="MOD-001" 
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-black text-sm font-mono" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Назва моделі</label>
                  <input 
                    type="text" 
                    value={formData.name || ''} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="напр. Перстень «Аврора»" 
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-black text-sm" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Опис моделі</label>
                <textarea 
                  rows={3} 
                  value={formData.description || ''} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Детальний опис дизайну, конструкції та пропорцій..." 
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-black text-sm resize-none" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Фото моделі</label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-2xl bg-zinc-100 border border-zinc-200 overflow-hidden flex items-center justify-center shrink-0">
                    {formData.photos?.[0]?.url ? (
                      <img src={formData.photos[0].url} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Camera className="text-zinc-300" size={32} />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-xs text-zinc-500">Завантажте фото моделі для відображення в каталозі.</p>
                    <label className="inline-block px-4 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-xs font-bold cursor-pointer transition-colors">
                      Обрати файл
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Складність</label>
                  <select 
                    value={formData.complexity}
                    onChange={(e) => setFormData({ ...formData, complexity: e.target.value as any })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-black text-sm font-semibold"
                  >
                    <option value="LOW">Низька</option>
                    <option value="MEDIUM">Середня</option>
                    <option value="HIGH">Висока</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Базова вартість роботи (₴)</label>
                  <input 
                    type="number" 
                    value={formData.baseLaborCost || ''} 
                    onChange={(e) => setFormData({ ...formData, baseLaborCost: Number(e.target.value) })}
                    placeholder="3500" 
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-black text-sm font-bold" 
                  />
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 bg-zinc-50/70 border-t border-zinc-100 flex gap-4">
              {selectedItem ? (
                <>
                  <button onClick={handleDelete} className="flex-1 py-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl font-bold text-sm hover:bg-rose-100 transition-all">
                    Видалити
                  </button>
                  <button onClick={handleSave} className="flex-1 py-3.5 bg-black text-white rounded-2xl font-bold text-sm hover:bg-zinc-800 transition-all shadow-lg shadow-black/10">
                    Зберегти зміни
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 bg-white border border-zinc-200 rounded-2xl font-bold text-sm hover:bg-zinc-100 transition-all">
                    Скасувати
                  </button>
                  <button onClick={handleSave} className="flex-1 py-3.5 bg-black text-white rounded-2xl font-bold text-sm hover:bg-zinc-800 transition-all shadow-lg shadow-black/10">
                    Зберегти модель
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
