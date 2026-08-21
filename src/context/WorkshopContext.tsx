import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Order, CatalogItem, OrderStatus } from '../types';
import { MOCK_ORDERS, MOCK_CATALOG, MOCK_INVENTORY } from '../constants';
import { 
  InventoryItem, 
  WorkshopData, 
  getLocalData, 
  saveLocalData, 
  getSavedSpreadsheetId, 
  getSavedSpreadsheetTitle, 
  getLastSyncTime, 
  readAllFromGoogleSheets, 
  syncAllToGoogleSheets, 
  createJewelMasterSpreadsheet, 
  saveSpreadsheetInfo, 
  clearSpreadsheetInfo,
  getSpreadsheetDetails
} from '../lib/googleSheets';
import { subscribeAuth, googleSignIn, googleLogout, getCurrentUser } from '../lib/googleAuth';
import { User } from 'firebase/auth';

export type { InventoryItem };

interface WorkshopContextType {
  // Data
  orders: Order[];
  catalog: CatalogItem[];
  inventory: InventoryItem[];

  // Sync State
  isSyncing: boolean;
  isLoading: boolean;
  syncError: string | null;
  lastSyncTime: string | null;
  syncToast: string | null;
  isPopupBlocked: boolean;
  dismissError: () => void;

  // Google Connection
  user: User | null;
  hasToken: boolean;
  spreadsheetId: string | null;
  spreadsheetTitle: string | null;
  spreadsheetUrl: string | null;
  isConnectedToSheets: boolean;

  // Actions - Google Auth & Sheets
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  createSheet: (title?: string) => Promise<string>;
  connectSheet: (urlOrId: string) => Promise<void>;
  disconnectSheet: () => void;
  syncToSheets: () => Promise<void>;
  pullFromSheets: () => Promise<void>;

  // Actions - Orders
  addOrder: (order: Partial<Order>) => Promise<Order>;
  updateOrder: (id: string, updates: Partial<Order>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;

  // Actions - Catalog
  addCatalogItem: (item: Partial<CatalogItem>) => Promise<CatalogItem>;
  updateCatalogItem: (id: string, updates: Partial<CatalogItem>) => Promise<void>;
  deleteCatalogItem: (id: string) => Promise<void>;

  // Actions - Inventory
  addInventoryItem: (item: Partial<InventoryItem>) => Promise<InventoryItem>;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  adjustInventoryQuantity: (id: string, delta: number) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
}

const WorkshopContext = createContext<WorkshopContextType | null>(null);

export const WorkshopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initial local state
  const initialLocal = getLocalData(MOCK_ORDERS, MOCK_CATALOG, MOCK_INVENTORY);
  
  const [orders, setOrders] = useState<Order[]>(initialLocal.orders);
  const [catalog, setCatalog] = useState<CatalogItem[]>(initialLocal.catalog);
  const [inventory, setInventory] = useState<InventoryItem[]>(initialLocal.inventory);

  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [hasToken, setHasToken] = useState<boolean>(false);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(getSavedSpreadsheetId());
  const [spreadsheetTitle, setSpreadsheetTitle] = useState<string | null>(getSavedSpreadsheetTitle());
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(getLastSyncTime());

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isPopupBlocked, setIsPopupBlocked] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  const dismissError = () => {
    setSyncError(null);
    setIsPopupBlocked(false);
  };

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstMountRef = useRef<boolean>(true);

  const showToast = (msg: string) => {
    setSyncToast(msg);
    setTimeout(() => setSyncToast(null), 4000);
  };

  // Google Auth Subscription
  useEffect(() => {
    const unsubscribe = subscribeAuth((authUser, token) => {
      setUser(authUser);
      setHasToken(!!token);
    });
    return () => unsubscribe();
  }, []);

  // Helper to trigger background sync to Google Sheets
  const triggerAutoSync = useCallback((newOrders: Order[], newCatalog: CatalogItem[], newInventory: InventoryItem[]) => {
    // Always persist to local cache first
    saveLocalData({ orders: newOrders, catalog: newCatalog, inventory: newInventory });

    const currentSheetId = getSavedSpreadsheetId();
    if (!currentSheetId) return;

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSyncing(true);
        setSyncError(null);
        await syncAllToGoogleSheets(newOrders, newCatalog, newInventory, currentSheetId);
        setLastSyncTime(new Date().toISOString());
      } catch (err: any) {
        console.warn('Auto-sync error:', err);
        setSyncError(err.message || 'Помилка автоматичної синхронізації з Google Таблицею');
      } finally {
        setIsSyncing(false);
      }
    }, 1200); // 1.2s debounce to prevent spamming Google Sheets API
  }, []);

  // Initial pull from Google Sheets if connected
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      const savedId = getSavedSpreadsheetId();
      if (savedId) {
        setIsLoading(true);
        readAllFromGoogleSheets(savedId)
          .then((data) => {
            if (data.orders.length > 0) setOrders(data.orders);
            if (data.catalog.length > 0) setCatalog(data.catalog);
            if (data.inventory.length > 0) setInventory(data.inventory);
            setLastSyncTime(new Date().toISOString());
            showToast('Дані успішно завантажено з Google Таблиці');
          })
          .catch((err) => {
            console.log('Initial sync fallback to local cache:', err.message);
          })
          .finally(() => setIsLoading(false));
      }
    }
  }, []);

  // Actions
  const signIn = async () => {
    try {
      setSyncError(null);
      setIsPopupBlocked(false);
      const res = await googleSignIn();
      if (res?.user) {
        setUser(res.user);
        setHasToken(true);
        setIsPopupBlocked(false);
        showToast(`Вхід виконано: ${res.user.displayName || res.user.email}`);

        // If spreadsheet already connected, load fresh data
        const savedId = getSavedSpreadsheetId();
        if (savedId) {
          await pullFromSheets();
        }
      }
    } catch (err: any) {
      const isBlocked = err?.code === 'auth/popup-blocked' || 
                        err?.originalError?.code === 'auth/popup-blocked' ||
                        err?.message?.toLowerCase().includes('popup');
      setIsPopupBlocked(isBlocked);
      setSyncError(err.message || 'Помилка авторизації Google');
    }
  };

  const signOut = async () => {
    await googleLogout();
    setUser(null);
    setHasToken(false);
    showToast('Вихід з Google акаунту виконано');
  };

  const createSheet = async (customTitle?: string): Promise<string> => {
    try {
      setIsSyncing(true);
      setSyncError(null);
      const res = await createJewelMasterSpreadsheet(customTitle);
      setSpreadsheetId(res.id);
      setSpreadsheetTitle(res.title);
      saveSpreadsheetInfo(res.id, res.title);

      // Immediately write current workshop data into the newly created sheet
      await syncAllToGoogleSheets(orders, catalog, inventory, res.id);
      setLastSyncTime(new Date().toISOString());
      showToast('Нову Google Таблицю створено та заповнено даними!');
      return res.id;
    } catch (err: any) {
      setSyncError(err.message || 'Помилка створення таблиці');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const connectSheet = async (urlOrId: string) => {
    try {
      setIsSyncing(true);
      setSyncError(null);

      // Extract ID from full URL if provided
      let id = urlOrId.trim();
      const match = id.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        id = match[1];
      }

      if (!id || id.length < 10) {
        throw new Error('Некоректний ID або посилання на Google Таблицю');
      }

      const details = await getSpreadsheetDetails(id);
      setSpreadsheetId(id);
      setSpreadsheetTitle(details.title);
      saveSpreadsheetInfo(id, details.title);

      // Read remote data
      const remoteData = await readAllFromGoogleSheets(id);
      if (remoteData.orders.length > 0 || remoteData.catalog.length > 0 || remoteData.inventory.length > 0) {
        setOrders(remoteData.orders);
        setCatalog(remoteData.catalog);
        setInventory(remoteData.inventory);
      } else {
        // Empty sheet, push local data to it
        await syncAllToGoogleSheets(orders, catalog, inventory, id);
      }

      setLastSyncTime(new Date().toISOString());
      showToast(`Підключено до таблиці: "${details.title}"`);
    } catch (err: any) {
      setSyncError(err.message || 'Не вдалося підключитися до таблиці');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const disconnectSheet = () => {
    clearSpreadsheetInfo();
    setSpreadsheetId(null);
    setSpreadsheetTitle(null);
    setLastSyncTime(null);
    showToast('Підключення до Google Таблиці скасовано');
  };

  const syncToSheets = async () => {
    try {
      setIsSyncing(true);
      setSyncError(null);
      await syncAllToGoogleSheets(orders, catalog, inventory, spreadsheetId || undefined);
      setLastSyncTime(new Date().toISOString());
      showToast('Дані успішно оновлено в Google Таблицях');
    } catch (err: any) {
      setSyncError(err.message || 'Помилка збереження в Google Таблицю');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  const pullFromSheets = async () => {
    try {
      setIsLoading(true);
      setSyncError(null);
      const data = await readAllFromGoogleSheets(spreadsheetId || undefined);
      setOrders(data.orders);
      setCatalog(data.catalog);
      setInventory(data.inventory);
      setLastSyncTime(new Date().toISOString());
      showToast('Дані оновлено з Google Таблиці');
    } catch (err: any) {
      setSyncError(err.message || 'Помилка зчитування з Google Таблиці');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Orders CRUD
  const addOrder = async (newOrderData: Partial<Order>): Promise<Order> => {
    const newOrder: Order = {
      id: newOrderData.id || `ord-${Date.now()}`,
      orderNumber: newOrderData.orderNumber || `ORD-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, '0')}`,
      itemName: newOrderData.itemName || 'Новий виріб',
      clientName: newOrderData.clientName || 'Клієнт',
      clientPhone: newOrderData.clientPhone || '',
      status: newOrderData.status || OrderStatus.ACCEPTED,
      deadline: newOrderData.deadline || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      totalAmount: Number(newOrderData.totalAmount) || 0,
      advance: Number(newOrderData.advance) || 0,
      materials: newOrderData.materials || [],
      photos: newOrderData.photos || [],
      payments: newOrderData.payments || [],
      expenses: newOrderData.expenses || [],
      description: newOrderData.description || '',
      notes: newOrderData.notes || '',
      createdAt: newOrderData.createdAt || new Date().toISOString(),
      catalogItemId: newOrderData.catalogItemId,
      colorTag: newOrderData.colorTag,
    };

    const nextOrders = [newOrder, ...orders];
    setOrders(nextOrders);
    triggerAutoSync(nextOrders, catalog, inventory);
    return newOrder;
  };

  const updateOrder = async (id: string, updates: Partial<Order>) => {
    const nextOrders = orders.map((o) => (o.id === id ? { ...o, ...updates } : o));
    setOrders(nextOrders);
    triggerAutoSync(nextOrders, catalog, inventory);
  };

  const deleteOrder = async (id: string) => {
    const nextOrders = orders.filter((o) => o.id !== id);
    setOrders(nextOrders);
    triggerAutoSync(nextOrders, catalog, inventory);
  };

  // Catalog CRUD
  const addCatalogItem = async (newItemData: Partial<CatalogItem>): Promise<CatalogItem> => {
    const newItem: CatalogItem = {
      id: newItemData.id || `cat-${Date.now()}`,
      modelId: newItemData.modelId || `MOD-${String(catalog.length + 1).padStart(3, '0')}`,
      name: newItemData.name || 'Нова модель',
      description: newItemData.description || '',
      baseMaterials: newItemData.baseMaterials || [],
      photos: newItemData.photos || [],
      baseLaborCost: Number(newItemData.baseLaborCost) || 0,
      complexity: newItemData.complexity || 'MEDIUM',
    };

    const nextCatalog = [newItem, ...catalog];
    setCatalog(nextCatalog);
    triggerAutoSync(orders, nextCatalog, inventory);
    return newItem;
  };

  const updateCatalogItem = async (id: string, updates: Partial<CatalogItem>) => {
    const nextCatalog = catalog.map((c) => (c.id === id ? { ...c, ...updates } : c));
    setCatalog(nextCatalog);
    triggerAutoSync(orders, nextCatalog, inventory);
  };

  const deleteCatalogItem = async (id: string) => {
    const nextCatalog = catalog.filter((c) => c.id !== id);
    setCatalog(nextCatalog);
    triggerAutoSync(orders, nextCatalog, inventory);
  };

  // Inventory CRUD
  const addInventoryItem = async (newItemData: Partial<InventoryItem>): Promise<InventoryItem> => {
    const newItem: InventoryItem = {
      id: newItemData.id || `inv-${Date.now()}`,
      name: newItemData.name || 'Новий матеріал',
      category: newItemData.category || 'Метали',
      quantity: Number(newItemData.quantity) || 0,
      unit: newItemData.unit || 'г',
      status: newItemData.status || 'OK',
      price: Number(newItemData.price) || 0,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    const nextInventory = [newItem, ...inventory];
    setInventory(nextInventory);
    triggerAutoSync(orders, catalog, nextInventory);
    return newItem;
  };

  const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
    const nextInventory = inventory.map((i) => (i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : i));
    setInventory(nextInventory);
    triggerAutoSync(orders, catalog, nextInventory);
  };

  const adjustInventoryQuantity = async (id: string, delta: number) => {
    const nextInventory = inventory.map((i) => {
      if (i.id === id) {
        const newQty = Math.max(0, Number((i.quantity + delta).toFixed(3)));
        let newStatus: 'OK' | 'LOW' | 'CRITICAL' = 'OK';
        if (newQty <= 0) newStatus = 'CRITICAL';
        else if (newQty < (i.unit === 'г' ? 10 : 5)) newStatus = 'LOW';
        return { ...i, quantity: newQty, status: newStatus, updatedAt: new Date().toISOString().split('T')[0] };
      }
      return i;
    });
    setInventory(nextInventory);
    triggerAutoSync(orders, catalog, nextInventory);
  };

  const deleteInventoryItem = async (id: string) => {
    const nextInventory = inventory.filter((i) => i.id !== id);
    setInventory(nextInventory);
    triggerAutoSync(orders, catalog, nextInventory);
  };

  const spreadsheetUrl = spreadsheetId 
    ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
    : null;

  return (
    <WorkshopContext.Provider
      value={{
        orders,
        catalog,
        inventory,
        isSyncing,
        isLoading,
        syncError,
        lastSyncTime,
        syncToast,
        isPopupBlocked,
        dismissError,
        user,
        hasToken,
        spreadsheetId,
        spreadsheetTitle,
        spreadsheetUrl,
        isConnectedToSheets: !!spreadsheetId,
        signIn,
        signOut,
        createSheet,
        connectSheet,
        disconnectSheet,
        syncToSheets,
        pullFromSheets,
        addOrder,
        updateOrder,
        deleteOrder,
        addCatalogItem,
        updateCatalogItem,
        deleteCatalogItem,
        addInventoryItem,
        updateInventoryItem,
        adjustInventoryQuantity,
        deleteInventoryItem,
      }}
    >
      {children}
    </WorkshopContext.Provider>
  );
};

export const useWorkshop = () => {
  const context = useContext(WorkshopContext);
  if (!context) {
    throw new Error('useWorkshop must be used within a WorkshopProvider');
  }
  return context;
};
