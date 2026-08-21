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
  ExternalLink,
  ShoppingBag,
  ArrowRight,
  Scale,
  Sparkles,
  LayoutGrid,
  List,
  Calendar as CalendarIcon,
  Phone,
  User as UserIcon,
  Edit3,
  Trash2,
  Info
} from 'lucide-react';
import { CatalogItem } from '../types';
import { useWorkshop } from '../context/WorkshopContext';

interface CatalogProps {
  onNavigate?: (tab: string) => void;
}

export const Catalog: React.FC<CatalogProps> = ({ onNavigate }) => {
  const { 
    catalog: items, 
    addCatalogItem, 
    updateCatalogItem, 
    deleteCatalogItem, 
    createOrderFromCatalogItem,
    pullCatalogFromSheets,
    syncToSheets, 
    isSyncing,
    isLoading,
    isConnectedToSheets,
    spreadsheetTitle,
    spreadsheetUrl,
    catalogSheetName,
  } = useWorkshop();

  const [searchQuery, setSearchQuery] = useState('');
  const [complexityFilter, setComplexityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<CatalogItem>>({});

  // Quick Order Modal
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderModelItem, setOrderModelItem] = useState<CatalogItem | null>(null);
  const [orderFormData, setOrderFormData] = useState({
    clientName: '',
    clientPhone: '',
    deadline: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    size: '17.5',
    metal: 'Золото 585',
    weight: 3.5,
    totalAmount: 3500,
    advance: 1000,
    notes: '',
  });

  const handleOpenEditModal = (item: CatalogItem | null) => {
    setSelectedItem(item);
    if (item) {
      setEditFormData({
        ...item,
        weight: item.weight || item.baseMaterials?.[0]?.weight || 3.5,
        metal: item.metal || item.baseMaterials?.[0]?.name || 'Золото 585',
        price: item.price || item.baseLaborCost || 3500,
      });
    } else {
      setEditFormData({
        modelId: `MOD-${String(items.length + 1).padStart(3, '0')}`,
        name: '',
        description: '',
        complexity: 'MEDIUM',
        baseLaborCost: 3500,
        price: 3500,
        metal: 'Золото 585',
        weight: 3.5,
        photos: [{ url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80' }],
        baseMaterials: [{ id: 'm1', name: 'Золото 585', weight: 3.5, unit: 'g', type: 'metal' }]
      });
    }
    setIsEditModalOpen(true);
  };

  const handleOpenOrderModal = (item: CatalogItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOrderModelItem(item);
    const itemMetal = item.metal || item.baseMaterials?.[0]?.name || 'Золото 585';
    const itemWeight = item.weight || item.baseMaterials?.[0]?.weight || 3.5;
    const basePrice = item.price || item.baseLaborCost || 3500;
    
    setOrderFormData({
      clientName: '',
      clientPhone: '',
      deadline: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      size: '17.5',
      metal: itemMetal,
      weight: itemWeight,
      totalAmount: basePrice,
      advance: Math.round(basePrice * 0.3),
      notes: `Замовлення за моделлю ${item.modelId} (${item.name}).`,
    });
    setIsOrderModalOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      const payload: Partial<CatalogItem> = {
        ...editFormData,
        baseMaterials: [{
          id: `m-${Date.now()}`,
          name: editFormData.metal || 'Золото 585',
          weight: Number(editFormData.weight) || 3.5,
          unit: 'g',
          type: 'metal'
        }],
        baseLaborCost: Number(editFormData.baseLaborCost) || Number(editFormData.price) || 3500,
        price: Number(editFormData.price) || Number(editFormData.baseLaborCost) || 3500,
      };

      if (selectedItem) {
        await updateCatalogItem(selectedItem.id, payload);
      } else {
        await addCatalogItem(payload);
      }
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Error saving item:', err);
      setIsEditModalOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    if (!confirm('Ви впевнені, що хочете видалити цю модель з каталогу?')) return;

    try {
      await deleteCatalogItem(selectedItem.id);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderModelItem) return;
    if (!orderFormData.clientName.trim()) {
      alert('Будь ласка, вкажіть ім\'я клієнта.');
      return;
    }

    try {
      await createOrderFromCatalogItem(orderModelItem, {
        clientName: orderFormData.clientName,
        clientPhone: orderFormData.clientPhone,
        deadline: orderFormData.deadline,
        totalAmount: Number(orderFormData.totalAmount) || 0,
        advance: Number(orderFormData.advance) || 0,
        size: orderFormData.size,
        metal: orderFormData.metal,
        weight: Number(orderFormData.weight) || 0,
        notes: orderFormData.notes,
      });

      setIsOrderModalOpen(false);
      // If navigation is provided, give user option to go to orders
      if (onNavigate) {
        // Optional quick switch
      }
    } catch (err) {
      console.error('Error creating order from catalog:', err);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setEditFormData(prev => ({
          ...prev,
          photos: [{ url: base64String }]
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSyncPull = async () => {
    await pullCatalogFromSheets();
  };

  const filteredItems = items.filter(item => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      (item.name || '').toLowerCase().includes(query) ||
      (item.modelId || '').toLowerCase().includes(query) ||
      (item.description || '').toLowerCase().includes(query) ||
      (item.metal || '').toLowerCase().includes(query);
    
    const matchesComplexity = complexityFilter === 'ALL' || item.complexity === complexityFilter;
    const matchesCategory = categoryFilter === 'ALL' || (item.category && item.category.toLowerCase().includes(categoryFilter.toLowerCase()));
    
    return matchesSearch && matchesComplexity && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Google Sheets Sync & Status Bar */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-zinc-900 text-sm md:text-base">
                {isConnectedToSheets ? (spreadsheetTitle || 'Google Таблиця') : 'Локальний каталог'}
              </h3>
              {isConnectedToSheets && (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-bold">
                  {catalogSheetName || '💎 Каталог'} ({items.length} моделей)
                </span>
              )}
            </div>
            <p className="text-zinc-500 text-xs mt-0.5">
              {isConnectedToSheets 
                ? 'Дані моделей синхронізуються із Google Таблицею. Ви можете обрати модель та в 1 клік додати її у замовлення.'
                : 'Підключіть Google Таблицю у розділі «Синхронізація», щоб завантажувати моделі прямо з таблиці.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {isConnectedToSheets ? (
            <>
              <button 
                onClick={handleSyncPull}
                disabled={isLoading || isSyncing}
                className="flex-1 md:flex-initial px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                title="Оновити та підтягнути моделі з Google Таблиці"
              >
                <RefreshCw size={14} className={isLoading ? "animate-spin text-emerald-600" : "text-emerald-700"} />
                <span>{isLoading ? 'Завантаження...' : 'Оновити з Таблиці'}</span>
              </button>

              <button 
                onClick={syncToSheets}
                disabled={isSyncing || isLoading}
                className="flex-1 md:flex-initial px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                title="Зберегти поточні зміни в Google Таблицю"
              >
                <FileSpreadsheet size={14} className="text-zinc-600" />
                <span>{isSyncing ? 'Збереження...' : 'Синхронізувати'}</span>
              </button>

              {spreadsheetUrl && (
                <a
                  href={spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-600 hover:text-zinc-900 rounded-xl transition-colors"
                  title="Відкрити Google Таблицю в новій вкладці"
                >
                  <ExternalLink size={15} />
                </a>
              )}
            </>
          ) : (
            <button 
              onClick={() => onNavigate?.('sheets')}
              className="px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
            >
              <FileSpreadsheet size={14} />
              <span>Підключити Google Таблицю</span>
            </button>
          )}

          <button 
            onClick={() => handleOpenEditModal(null)}
            className="px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm shrink-0"
          >
            <Plus size={15} />
            <span>Нова модель</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input 
            type="text" 
            placeholder="Пошук моделі за назвою, артикулом або металом..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-black/5 transition-all text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <select 
            value={complexityFilter}
            onChange={(e) => setComplexityFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 outline-none focus:ring-2 focus:ring-black/5"
          >
            <option value="ALL">Вся складність</option>
            <option value="LOW">Низька</option>
            <option value="MEDIUM">Середня</option>
            <option value="HIGH">Висока</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-white border border-zinc-200 rounded-xl p-1 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-zinc-100 text-zinc-900 font-bold' : 'text-zinc-400 hover:text-zinc-700'}`}
              title="Відображення картками з фото"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-zinc-100 text-zinc-900 font-bold' : 'text-zinc-400 hover:text-zinc-700'}`}
              title="Компактний список"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Catalog Cards with Photos */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white border border-zinc-200 rounded-2xl">
          <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto text-zinc-400 mb-3">
            <Gem size={26} />
          </div>
          <h3 className="font-bold text-base text-zinc-800 mb-1">Моделей не знайдено</h3>
          <p className="text-zinc-500 text-xs max-w-md mx-auto mb-5">
            {isConnectedToSheets 
              ? 'Натисніть «Оновити з Таблиці» для завантаження списку виробів або додайте нову модель вручну.'
              : 'Додайте нову модель або підключіть Google Таблицю з вашим каталогом.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            {isConnectedToSheets && (
              <button
                onClick={handleSyncPull}
                className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl font-bold text-xs inline-flex items-center gap-2"
              >
                <RefreshCw size={14} />
                Оновити з Google Таблиці
              </button>
            )}
            <button
              onClick={() => handleOpenEditModal(null)}
              className="px-4 py-2 bg-black text-white rounded-xl font-bold text-xs inline-flex items-center gap-1.5 hover:bg-zinc-800"
            >
              <Plus size={14} />
              Додати модель
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredItems.map((item) => {
            const photoUrl = item.photos?.[0]?.url;
            const itemMetal = item.metal || item.baseMaterials?.[0]?.name || 'Золото 585';
            const itemWeight = item.weight || item.baseMaterials?.[0]?.weight || 3.5;
            const price = item.price || item.baseLaborCost || 3500;

            return (
              <div 
                key={item.id} 
                className="group bg-white rounded-2xl border border-zinc-200 hover:border-zinc-300 hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden text-left"
              >
                {/* Photo Thumbnail Container */}
                <div className="relative aspect-[4/3] bg-zinc-100 overflow-hidden">
                  {photoUrl ? (
                    <img 
                      src={photoUrl} 
                      alt={item.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      onError={(e) => {
                        // Fallback image if broken URL
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300 gap-1">
                      <Gem size={32} />
                      <span className="text-[10px] text-zinc-400 font-medium">Без фото</span>
                    </div>
                  )}

                  {/* Article Badge */}
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2.5 py-1 bg-black/75 backdrop-blur-md text-white rounded-lg text-[10px] font-mono font-bold tracking-wider shadow-sm">
                      {item.modelId || 'MOD'}
                    </span>
                  </div>

                  {/* Complexity indicator */}
                  <div className="absolute top-2.5 right-2.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
                      item.complexity === 'HIGH' 
                        ? 'bg-rose-500/90 text-white' 
                        : item.complexity === 'MEDIUM' 
                        ? 'bg-amber-500/90 text-white' 
                        : 'bg-emerald-500/90 text-white'
                    }`}>
                      {item.complexity === 'HIGH' ? 'Складна' : item.complexity === 'MEDIUM' ? 'Середня' : 'Проста'}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 leading-snug line-clamp-1 group-hover:text-amber-900 transition-colors">
                      {item.name || 'Ювелірна модель'}
                    </h3>

                    {/* Metadata chips: Metal & Weight */}
                    <div className="flex items-center gap-2 mt-2 text-zinc-600 text-xs">
                      <span className="inline-flex items-center gap-1 font-medium bg-zinc-50 border border-zinc-100 px-2 py-0.5 rounded-md">
                        <Gem size={11} className="text-amber-600" />
                        <span>{itemMetal}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium bg-zinc-50 border border-zinc-100 px-2 py-0.5 rounded-md">
                        <Scale size={11} className="text-zinc-500" />
                        <span>{itemWeight} г</span>
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-zinc-500 text-xs mt-2 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Price & Actions */}
                  <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold block leading-none">Робота / Ціна</span>
                      <span className="font-bold text-sm text-zinc-900">
                        ₴{price.toLocaleString('uk-UA')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
                        title="Редагувати параметри моделі"
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        onClick={(e) => handleOpenOrderModal(item, e)}
                        className="px-3 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm group-hover:bg-zinc-900"
                        title="Створити замовлення за цією моделлю"
                      >
                        <Sparkles size={13} className="text-amber-300" />
                        <span>У замовлення</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Compact List View */
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="divide-y divide-zinc-100">
            {filteredItems.map((item) => {
              const photoUrl = item.photos?.[0]?.url;
              const itemMetal = item.metal || item.baseMaterials?.[0]?.name || 'Золото 585';
              const itemWeight = item.weight || item.baseMaterials?.[0]?.weight || 3.5;
              const price = item.price || item.baseLaborCost || 3500;

              return (
                <div 
                  key={item.id}
                  className="p-3.5 sm:p-4 hover:bg-zinc-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-xl bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {photoUrl ? (
                        <img 
                          src={photoUrl} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Gem size={20} className="text-zinc-300" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-zinc-500">{item.modelId}</span>
                        <h4 className="font-bold text-sm text-zinc-900">{item.name}</h4>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.complexity === 'HIGH' ? 'bg-rose-100 text-rose-700' : item.complexity === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {item.complexity}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                        <span>{itemMetal}</span>
                        <span>•</span>
                        <span>{itemWeight} г</span>
                        {item.description && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[200px] sm:max-w-[320px]">{item.description}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className="text-right">
                      <span className="font-bold text-sm text-zinc-900 block">₴{price.toLocaleString('uk-UA')}</span>
                      <span className="text-[10px] text-zinc-400">робота</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        onClick={(e) => handleOpenOrderModal(item, e)}
                        className="px-3.5 py-1.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <Sparkles size={13} className="text-amber-300" />
                        <span>Додати в замовлення</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* QUICK ORDER MODAL ("Створити замовлення за моделлю з каталогу") */}
      {isOrderModalOpen && orderModelItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-zinc-200">
            <form onSubmit={handleCreateOrder}>
              {/* Modal Header */}
              <div className="p-5 sm:p-6 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-zinc-900">
                      Створити замовлення за моделлю
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Артикул: {orderModelItem.modelId} • {orderModelItem.name}
                    </p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setIsOrderModalOpen(false)}
                  className="p-2 hover:bg-zinc-200 rounded-full transition-colors text-zinc-500"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 sm:p-6 space-y-4 max-h-[72vh] overflow-y-auto">
                {/* Selected Model Preview Card */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3.5 flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-xl bg-white border border-zinc-200 overflow-hidden shrink-0">
                    {orderModelItem.photos?.[0]?.url ? (
                      <img 
                        src={orderModelItem.photos[0].url} 
                        alt="" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-300">
                        <Gem size={22} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs sm:text-sm text-zinc-900 truncate">{orderModelItem.name}</h4>
                    <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{orderModelItem.description || 'Базовий дизайн з каталогу'}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] font-semibold text-zinc-700">
                      <span>Базова ціна: ₴{(orderModelItem.price || orderModelItem.baseLaborCost || 3500).toLocaleString('uk-UA')}</span>
                    </div>
                  </div>
                </div>

                {/* Client Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-600 flex items-center gap-1">
                      <UserIcon size={12} />
                      <span>ПІБ Клієнта *</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="Олена Ковальчук"
                      value={orderFormData.clientName}
                      onChange={(e) => setOrderFormData({ ...orderFormData, clientName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-black text-xs sm:text-sm font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-600 flex items-center gap-1">
                      <Phone size={12} />
                      <span>Телефон</span>
                    </label>
                    <input 
                      type="tel" 
                      placeholder="+38 (067) 123-45-67"
                      value={orderFormData.clientPhone}
                      onChange={(e) => setOrderFormData({ ...orderFormData, clientPhone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-black text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {/* Specs: Size, Metal, Weight */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-600">Розмір / Довжина</label>
                    <input 
                      type="text" 
                      placeholder="17.5"
                      value={orderFormData.size}
                      onChange={(e) => setOrderFormData({ ...orderFormData, size: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-black text-xs sm:text-sm font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-600">Метал</label>
                    <select 
                      value={orderFormData.metal}
                      onChange={(e) => setOrderFormData({ ...orderFormData, metal: e.target.value })}
                      className="w-full px-2.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-black text-xs font-medium"
                    >
                      <option value="Золото 585">Золото 585</option>
                      <option value="Золото 750">Золото 750</option>
                      <option value="Біле золото 585">Біле золото 585</option>
                      <option value="Срібло 925">Срібло 925</option>
                      <option value="Платина 950">Платина 950</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-600">Вага (г)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={orderFormData.weight}
                      onChange={(e) => setOrderFormData({ ...orderFormData, weight: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-black text-xs sm:text-sm font-medium"
                    />
                  </div>
                </div>

                {/* Deadline & Financials */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-600 flex items-center gap-1">
                      <CalendarIcon size={12} />
                      <span>Дедлайн</span>
                    </label>
                    <input 
                      type="date" 
                      value={orderFormData.deadline}
                      onChange={(e) => setOrderFormData({ ...orderFormData, deadline: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-black text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-600">Вартість (₴)</label>
                    <input 
                      type="number" 
                      value={orderFormData.totalAmount}
                      onChange={(e) => setOrderFormData({ ...orderFormData, totalAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-black text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-600">Аванс (₴)</label>
                    <input 
                      type="number" 
                      value={orderFormData.advance}
                      onChange={(e) => setOrderFormData({ ...orderFormData, advance: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-black text-xs font-bold text-emerald-700"
                    />
                  </div>
                </div>

                {/* Balance indicator */}
                <div className="px-3.5 py-2 bg-zinc-100/70 rounded-xl flex items-center justify-between text-xs font-medium">
                  <span className="text-zinc-600">Залишок до сплати:</span>
                  <span className="font-bold text-zinc-900">
                    ₴{Math.max(0, (orderFormData.totalAmount || 0) - (orderFormData.advance || 0)).toLocaleString('uk-UA')}
                  </span>
                </div>

                {/* Notes & Special Requests */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-600">
                    Примітки, вставки та побажання клієнта
                  </label>
                  <textarea 
                    rows={2}
                    placeholder="Наприклад: вставка діамант 0.05 ct, внутрішнє гравірування дати, покриття родієм..."
                    value={orderFormData.notes}
                    onChange={(e) => setOrderFormData({ ...orderFormData, notes: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-black text-xs resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-6 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="px-4 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 rounded-xl font-bold text-xs transition-colors"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-black hover:bg-zinc-800 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
                >
                  <CheckCircle2 size={15} />
                  <span>Створити замовлення</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT / ADD MODEL MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-zinc-200">
            <div className="p-5 sm:p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
              <div>
                <span className="text-xs font-mono font-bold text-zinc-400 block">{editFormData.modelId}</span>
                <h3 className="font-bold text-lg text-zinc-900">
                  {selectedItem ? `Редагувати: ${selectedItem.name}` : 'Додати нову модель'}
                </h3>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                className="p-2 hover:bg-zinc-200 rounded-full transition-colors text-zinc-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-600">Артикул моделі</label>
                  <input 
                    type="text" 
                    value={editFormData.modelId || ''} 
                    onChange={(e) => setEditFormData({ ...editFormData, modelId: e.target.value })}
                    placeholder="MOD-001" 
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-black text-xs sm:text-sm font-mono font-bold" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-600">Назва моделі *</label>
                  <input 
                    type="text" 
                    value={editFormData.name || ''} 
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    placeholder="напр. Каблучка «Аврора»" 
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-black text-xs sm:text-sm font-medium" 
                  />
                </div>
              </div>

              {/* Photo Input (URL or Upload) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-600">Фотографія моделі</label>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 rounded-xl bg-zinc-100 border border-zinc-200 overflow-hidden flex items-center justify-center shrink-0">
                    {editFormData.photos?.[0]?.url ? (
                      <img 
                        src={editFormData.photos[0].url} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer" 
                      />
                    ) : (
                      <Camera className="text-zinc-300" size={24} />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input 
                      type="text"
                      placeholder="Посилання на фото або Google Drive URL..."
                      value={editFormData.photos?.[0]?.url || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, photos: [{ url: e.target.value }] })}
                      className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-black"
                    />
                    <label className="inline-block px-3 py-1 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-xs font-bold cursor-pointer transition-colors text-zinc-700">
                      Або завантажити файл з комп'ютера
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Metal, Weight, Price, Complexity */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-600">Метал</label>
                  <input 
                    type="text"
                    value={editFormData.metal || 'Золото 585'}
                    onChange={(e) => setEditFormData({ ...editFormData, metal: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-600">Вага (г)</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={editFormData.weight || 3.5}
                    onChange={(e) => setEditFormData({ ...editFormData, weight: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-600">Робота/Ціна (₴)</label>
                  <input 
                    type="number"
                    value={editFormData.price || editFormData.baseLaborCost || 3500}
                    onChange={(e) => setEditFormData({ ...editFormData, price: Number(e.target.value), baseLaborCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-600">Складність</label>
                  <select 
                    value={editFormData.complexity || 'MEDIUM'}
                    onChange={(e) => setEditFormData({ ...editFormData, complexity: e.target.value as any })}
                    className="w-full px-2.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="LOW">Низька</option>
                    <option value="MEDIUM">Середня</option>
                    <option value="HIGH">Висока</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-600">Опис моделі</label>
                <textarea 
                  rows={3} 
                  value={editFormData.description || ''} 
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  placeholder="Опишіть особливості форми, профілю, каміння та технології..." 
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-black text-xs resize-none" 
                />
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between gap-3">
              {selectedItem ? (
                <>
                  <button 
                    type="button"
                    onClick={handleDelete} 
                    className="px-4 py-2.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl font-bold text-xs hover:bg-rose-100 transition-all flex items-center gap-1.5"
                  >
                    <Trash2 size={14} />
                    <span>Видалити</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="px-4 py-2.5 bg-white border border-zinc-200 text-zinc-700 rounded-xl font-bold text-xs hover:bg-zinc-100 transition-colors"
                    >
                      Скасувати
                    </button>
                    <button 
                      type="button"
                      onClick={handleSaveEdit} 
                      className="px-5 py-2.5 bg-black text-white rounded-xl font-bold text-xs hover:bg-zinc-800 transition-all shadow-sm"
                    >
                      Зберегти зміни
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-end gap-2 w-full">
                  <button 
                    type="button"
                    onClick={() => setIsEditModalOpen(false)} 
                    className="px-4 py-2.5 bg-white border border-zinc-200 rounded-xl font-bold text-xs hover:bg-zinc-100 transition-colors"
                  >
                    Скасувати
                  </button>
                  <button 
                    type="button"
                    onClick={handleSaveEdit} 
                    className="px-5 py-2.5 bg-black text-white rounded-xl font-bold text-xs hover:bg-zinc-800 transition-all shadow-sm"
                  >
                    Зберегти модель
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

