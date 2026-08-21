import { getAccessToken, googleSignIn } from './googleAuth';
import { Order, OrderStatus, CatalogItem, Material, Photo, Payment, Expense } from '../types';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  status: 'OK' | 'LOW' | 'CRITICAL';
  price: number;
  updatedAt?: string;
}

export interface WorkshopData {
  orders: Order[];
  catalog: CatalogItem[];
  inventory: InventoryItem[];
}

export interface SyncResult {
  success: boolean;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  message?: string;
  timestamp?: string;
  recordsCount?: {
    orders?: number;
    catalog?: number;
    inventory?: number;
  };
}

const STORAGE_KEYS = {
  SPREADSHEET_ID: 'jewelmaster_google_spreadsheet_id',
  SPREADSHEET_TITLE: 'jewelmaster_google_spreadsheet_title',
  LAST_SYNC: 'jewelmaster_google_last_sync',
  LOCAL_ORDERS: 'jewelmaster_local_orders',
  LOCAL_CATALOG: 'jewelmaster_local_catalog',
  LOCAL_INVENTORY: 'jewelmaster_local_inventory',
};

export const getSavedSpreadsheetId = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.SPREADSHEET_ID);
};

export const getSavedSpreadsheetTitle = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.SPREADSHEET_TITLE);
};

export const getLastSyncTime = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
};

export const saveSpreadsheetInfo = (id: string, title?: string) => {
  localStorage.setItem(STORAGE_KEYS.SPREADSHEET_ID, id);
  if (title) localStorage.setItem(STORAGE_KEYS.SPREADSHEET_TITLE, title);
  localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
};

export const clearSpreadsheetInfo = () => {
  localStorage.removeItem(STORAGE_KEYS.SPREADSHEET_ID);
  localStorage.removeItem(STORAGE_KEYS.SPREADSHEET_TITLE);
  localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
};

// Local storage caching for offline/instant speed
export const getLocalData = (
  fallbackOrders: Order[],
  fallbackCatalog: CatalogItem[],
  fallbackInventory: InventoryItem[]
): WorkshopData => {
  try {
    const ordersStr = localStorage.getItem(STORAGE_KEYS.LOCAL_ORDERS);
    const catalogStr = localStorage.getItem(STORAGE_KEYS.LOCAL_CATALOG);
    const inventoryStr = localStorage.getItem(STORAGE_KEYS.LOCAL_INVENTORY);

    return {
      orders: ordersStr ? JSON.parse(ordersStr) : fallbackOrders,
      catalog: catalogStr ? JSON.parse(catalogStr) : fallbackCatalog,
      inventory: inventoryStr ? JSON.parse(inventoryStr) : fallbackInventory,
    };
  } catch (err) {
    console.error('Error reading local cache:', err);
    return {
      orders: fallbackOrders,
      catalog: fallbackCatalog,
      inventory: fallbackInventory,
    };
  }
};

export const saveLocalData = (data: Partial<WorkshopData>) => {
  try {
    if (data.orders) localStorage.setItem(STORAGE_KEYS.LOCAL_ORDERS, JSON.stringify(data.orders));
    if (data.catalog) localStorage.setItem(STORAGE_KEYS.LOCAL_CATALOG, JSON.stringify(data.catalog));
    if (data.inventory) localStorage.setItem(STORAGE_KEYS.LOCAL_INVENTORY, JSON.stringify(data.inventory));
  } catch (err) {
    console.warn('Could not save to localStorage:', err);
  }
};

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  let token = await getAccessToken();
  if (!token) {
    const authResult = await googleSignIn();
    if (!authResult?.accessToken) {
      throw new Error('Необхідна авторизація в Google для доступу до таблиць.');
    }
    token = authResult.accessToken;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 401) {
    const authResult = await googleSignIn();
    if (!authResult?.accessToken) {
      throw new Error('Сесія Google закінчилася. Будь ласка, увійдіть знову.');
    }
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${authResult.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  return response;
}

// Helpers for serializing/deserializing complex types
function safeJsonStringify(obj: any): string {
  try {
    return JSON.stringify(obj || []);
  } catch {
    return '[]';
  }
}

function safeJsonParse<T>(str: string, fallback: T): T {
  if (!str) return fallback;
  try {
    const parsed = JSON.parse(str);
    return parsed !== undefined ? parsed : fallback;
  } catch {
    // If it's a plain string list separated by commas or semicolons
    if (typeof fallback === 'object' && Array.isArray(fallback) && typeof str === 'string' && str.trim()) {
      return str.split(';').map(item => ({ name: item.trim() })) as unknown as T;
    }
    return fallback;
  }
}

/**
 * Creates a brand new Google Spreadsheet configured for JewelMaster Pro
 */
export async function createJewelMasterSpreadsheet(customTitle?: string): Promise<{ id: string; url: string; title: string }> {
  const title = customTitle || `JewelMaster Pro — База Даних (${new Date().toLocaleDateString('uk-UA')})`;

  const payload = {
    properties: {
      title,
      locale: 'uk_UA',
      autoRecalc: 'ON_CHANGE',
      defaultFormat: {
        textFormat: {
          fontFamily: 'Roboto',
        },
      },
    },
    sheets: [
      {
        properties: {
          sheetId: 0,
          title: '📋 Замовлення',
          gridProperties: { frozenRowCount: 1, columnCount: 16 },
          tabColor: { red: 0.1, green: 0.1, blue: 0.12 },
        },
      },
      {
        properties: {
          sheetId: 1,
          title: '💎 Каталог',
          gridProperties: { frozenRowCount: 1, columnCount: 10 },
          tabColor: { red: 0.85, green: 0.65, blue: 0.13 },
        },
      },
      {
        properties: {
          sheetId: 2,
          title: '📦 Склад Матеріалів',
          gridProperties: { frozenRowCount: 1, columnCount: 10 },
          tabColor: { red: 0.2, green: 0.6, blue: 0.4 },
        },
      },
      {
        properties: {
          sheetId: 3,
          title: '📊 Зведена Аналітика',
          gridProperties: { frozenRowCount: 1, columnCount: 8 },
          tabColor: { red: 0.3, green: 0.4, blue: 0.8 },
        },
      },
    ],
  };

  const res = await fetchWithAuth('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Не вдалося створити Google Таблицю.');
  }

  const data = await res.json();
  const id = data.spreadsheetId;
  const url = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${id}/edit`;

  saveSpreadsheetInfo(id, title);
  return { id, url, title };
}

/**
 * Ensures required sheets exist in spreadsheet
 */
async function ensureSheetsExist(spreadsheetId: string): Promise<void> {
  const metaRes = await fetchWithAuth(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`);
  if (!metaRes.ok) return;
  const meta = await metaRes.json();
  const existingSheetTitles: string[] = (meta.sheets || []).map((s: any) => s.properties?.title || '');

  const neededSheets = [
    { title: '📋 Замовлення' },
    { title: '💎 Каталог' },
    { title: '📦 Склад Матеріалів' },
    { title: '📊 Зведена Аналітика' },
  ];

  const requests: any[] = [];
  for (const needed of neededSheets) {
    const exists = existingSheetTitles.some(t => 
      t === needed.title || 
      t.toLowerCase().includes(needed.title.replace(/[^\p{L}\s]/gu, '').trim().toLowerCase())
    );
    if (!exists) {
      requests.push({
        addSheet: {
          properties: {
            title: needed.title,
            gridProperties: { frozenRowCount: 1 },
          },
        },
      });
    }
  }

  if (requests.length > 0) {
    await fetchWithAuth(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      body: JSON.stringify({ requests }),
    });
  }
}

/**
 * Reads all data directly from the Google Sheet
 */
export async function readAllFromGoogleSheets(spreadsheetId?: string): Promise<WorkshopData> {
  const targetId = spreadsheetId || getSavedSpreadsheetId();
  if (!targetId) throw new Error('Не вказано ID Google Таблиці');

  await ensureSheetsExist(targetId);

  // Read all 3 main sheets in batch
  const ranges = [
    encodeURIComponent("'📋 Замовлення'!A1:P1000"),
    encodeURIComponent("'💎 Каталог'!A1:J1000"),
    encodeURIComponent("'📦 Склад Матеріалів'!A1:J1000"),
  ];

  const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${targetId}/values:batchGet?ranges=${ranges.join('&ranges=')}`;
  const res = await fetchWithAuth(batchUrl);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Не вдалося завантажити дані з Google Таблиці');
  }

  const batchResponse = await res.json();
  const valueRanges = batchResponse.valueRanges || [];

  const ordersRows: any[][] = valueRanges[0]?.values || [];
  const catalogRows: any[][] = valueRanges[1]?.values || [];
  const inventoryRows: any[][] = valueRanges[2]?.values || [];

  // Parse Orders
  const parsedOrders: Order[] = [];
  if (ordersRows.length > 1) {
    for (let i = 1; i < ordersRows.length; i++) {
      const r = ordersRows[i];
      if (!r || r.length === 0 || !r[0]) continue;

      const materials: Material[] = safeJsonParse<Material[]>(r[10], []);
      const photos: Photo[] = safeJsonParse<Photo[]>(r[11], r[11] ? [{ url: r[11] }] : []);
      const payments: Payment[] = safeJsonParse<Payment[]>(r[14], []);
      const expenses: Expense[] = safeJsonParse<Expense[]>(r[15], []);

      parsedOrders.push({
        id: String(r[0] || `ord-${i}`),
        orderNumber: String(r[1] || `ORD-2024-${i}`),
        itemName: String(r[2] || 'Ювелірний виріб'),
        clientName: String(r[3] || 'Клієнт'),
        clientPhone: String(r[4] || ''),
        status: (r[5] as OrderStatus) || OrderStatus.ACCEPTED,
        deadline: String(r[6] || new Date().toISOString().split('T')[0]),
        totalAmount: Number(r[7]) || 0,
        advance: Number(r[8]) || 0,
        materials,
        photos,
        description: String(r[12] || ''),
        notes: String(r[13] || ''),
        payments,
        expenses,
        createdAt: String(r[9] || new Date().toISOString()),
      });
    }
  }

  // Parse Catalog
  const parsedCatalog: CatalogItem[] = [];
  if (catalogRows.length > 1) {
    for (let i = 1; i < catalogRows.length; i++) {
      const r = catalogRows[i];
      if (!r || r.length === 0 || !r[0]) continue;

      const baseMaterials: Material[] = safeJsonParse<Material[]>(r[5], []);
      const photos: Photo[] = safeJsonParse<Photo[]>(r[7], r[7] ? [{ url: r[7] }] : []);

      parsedCatalog.push({
        id: String(r[0] || `cat-${i}`),
        modelId: String(r[1] || `MOD-${i}`),
        name: String(r[2] || 'Модель'),
        complexity: (r[3] as 'LOW' | 'MEDIUM' | 'HIGH') || 'MEDIUM',
        baseLaborCost: Number(r[4]) || 0,
        baseMaterials,
        description: String(r[6] || ''),
        photos,
      });
    }
  }

  // Parse Inventory
  const parsedInventory: InventoryItem[] = [];
  if (inventoryRows.length > 1) {
    for (let i = 1; i < inventoryRows.length; i++) {
      const r = inventoryRows[i];
      if (!r || r.length === 0 || !r[0]) continue;

      parsedInventory.push({
        id: String(r[0] || `inv-${i}`),
        name: String(r[1] || 'Матеріал'),
        category: String(r[2] || 'Метал'),
        quantity: Number(r[3]) || 0,
        unit: String(r[4] || 'г'),
        price: Number(r[5]) || 0,
        status: (r[7] as 'OK' | 'LOW' | 'CRITICAL') || 'OK',
        updatedAt: String(r[8] || new Date().toISOString()),
      });
    }
  }

  // Cache locally
  saveLocalData({
    orders: parsedOrders,
    catalog: parsedCatalog,
    inventory: parsedInventory,
  });

  return {
    orders: parsedOrders,
    catalog: parsedCatalog,
    inventory: parsedInventory,
  };
}

/**
 * Sync / Write All Data directly to Google Sheets
 */
export async function syncAllToGoogleSheets(
  orders: Order[],
  catalog: CatalogItem[],
  inventory: InventoryItem[],
  existingSpreadsheetId?: string
): Promise<SyncResult> {
  let spreadsheetId = existingSpreadsheetId || getSavedSpreadsheetId();
  let spreadsheetUrl = '';

  if (!spreadsheetId) {
    const created = await createJewelMasterSpreadsheet();
    spreadsheetId = created.id;
    spreadsheetUrl = created.url;
  } else {
    spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    await ensureSheetsExist(spreadsheetId);
  }

  // 1. Orders Rows
  const orderHeaders = [
    'ID',
    'Номер замовлення',
    'Назва виробу',
    'Клієнт',
    'Телефон',
    'Статус',
    'Дедлайн',
    'Сума (грн)',
    'Аванс (грн)',
    'Дата створення',
    'Матеріали (JSON)',
    'Фото (JSON)',
    'Опис',
    'Примітки',
    'Платежі (JSON)',
    'Витрати (JSON)',
  ];

  const orderRows = orders.map((o) => {
    return [
      o.id || '',
      o.orderNumber || '',
      o.itemName || '',
      o.clientName || '',
      o.clientPhone || '',
      o.status || 'ACCEPTED',
      o.deadline || '',
      o.totalAmount || 0,
      o.advance || 0,
      o.createdAt || new Date().toISOString(),
      safeJsonStringify(o.materials || []),
      safeJsonStringify(o.photos || []),
      o.description || '',
      o.notes || '',
      safeJsonStringify(o.payments || []),
      safeJsonStringify(o.expenses || []),
    ];
  });

  // 2. Catalog Rows
  const catalogHeaders = [
    'ID',
    'Артикул моделі',
    'Назва',
    'Складність',
    'Базова вартість роботи (грн)',
    'Базові матеріали (JSON)',
    'Опис',
    'Фото (JSON)',
  ];

  const catalogRows = catalog.map((c) => {
    return [
      c.id || '',
      c.modelId || '',
      c.name || '',
      c.complexity || 'MEDIUM',
      c.baseLaborCost || 0,
      safeJsonStringify(c.baseMaterials || []),
      c.description || '',
      safeJsonStringify(c.photos || []),
    ];
  });

  // 3. Inventory Rows
  const inventoryHeaders = [
    'ID',
    'Назва матеріалу',
    'Категорія',
    'Кількість',
    'Одиниця виміру',
    'Ціна за одиницю (грн)',
    'Загальна вартість (грн)',
    'Статус запасу',
    'Останнє оновлення',
  ];

  const inventoryRows = inventory.map((i) => {
    const totalVal = (i.quantity || 0) * (i.price || 0);
    return [
      i.id || '',
      i.name || '',
      i.category || '',
      i.quantity || 0,
      i.unit || '',
      i.price || 0,
      totalVal,
      i.status || 'OK',
      i.updatedAt || new Date().toISOString(),
    ];
  });

  // 4. Analytics Rows
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalAdvance = orders.reduce((sum, o) => sum + (o.advance || 0), 0);
  const completedOrders = orders.filter((o) => o.status === OrderStatus.COMPLETED).length;
  const inProgressOrders = orders.filter((o) => o.status !== OrderStatus.COMPLETED).length;
  const totalInventoryValue = inventory.reduce((sum, i) => sum + (i.quantity || 0) * (i.price || 0), 0);

  const analyticsHeaders = ['Показник', 'Значення', 'Коментар'];
  const analyticsRows = [
    ['Дата останньої синхронізації', new Date().toLocaleString('uk-UA'), 'Автоматичне оновлення з JewelMaster Pro'],
    ['Загальна сума замовлень', `${totalRevenue.toLocaleString('uk-UA')} ₴`, 'Всі замовлення в реєстрі'],
    ['Отримано авансів', `${totalAdvance.toLocaleString('uk-UA')} ₴`, 'Фактично сплачено клієнтами'],
    ['Залишок до сплати (дебіторка)', `${(totalRevenue - totalAdvance).toLocaleString('uk-UA')} ₴`, 'Очікується при видачі'],
    ['Всього замовлень', orders.length, 'Штук у системі'],
    ['Замовлень у роботі', inProgressOrders, 'Активні виробничі процеси'],
    ['Виконано замовлень', completedOrders, 'Готові прикраси'],
    ['Моделей у каталозі', catalog.length, 'Позицій у бібліотеці дизайнів'],
    ['Загальна вартість складу', `${totalInventoryValue.toLocaleString('uk-UA')} ₴`, 'Оцінка металів, каміння та витратників'],
  ];

  // Batch Update all sheets
  const batchData = [
    {
      range: "'📋 Замовлення'!A1:P" + (orderRows.length + 1),
      values: [orderHeaders, ...orderRows],
    },
    {
      range: "'💎 Каталог'!A1:H" + (catalogRows.length + 1),
      values: [catalogHeaders, ...catalogRows],
    },
    {
      range: "'📦 Склад Матеріалів'!A1:I" + (inventoryRows.length + 1),
      values: [inventoryHeaders, ...inventoryRows],
    },
    {
      range: "'📊 Зведена Аналітика'!A1:C" + (analyticsRows.length + 1),
      values: [analyticsHeaders, ...analyticsRows],
    },
  ];

  // Clear trailing rows first to keep sheets clean
  const clearPromises = [
    fetchWithAuth(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'📋 Замовлення'!A1:Z1000:clear`, { method: 'POST' }),
    fetchWithAuth(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'💎 Каталог'!A1:Z1000:clear`, { method: 'POST' }),
    fetchWithAuth(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'📦 Склад Матеріалів'!A1:Z1000:clear`, { method: 'POST' }),
    fetchWithAuth(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'📊 Зведена Аналітика'!A1:Z100:clear`, { method: 'POST' }),
  ];
  await Promise.allSettled(clearPromises);

  const res = await fetchWithAuth(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: batchData,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Помилка оновлення даних у Google Таблиці');
  }

  saveSpreadsheetInfo(spreadsheetId);
  saveLocalData({ orders, catalog, inventory });

  return {
    success: true,
    spreadsheetId,
    spreadsheetUrl,
    message: 'Дані збережено та синхронізовано з Google Таблицею!',
    timestamp: new Date().toISOString(),
    recordsCount: {
      orders: orders.length,
      catalog: catalog.length,
      inventory: inventory.length,
    },
  };
}

/**
 * Check connectivity and get spreadsheet metadata
 */
export async function getSpreadsheetDetails(spreadsheetId: string): Promise<{ title: string; sheets: string[]; url: string }> {
  const res = await fetchWithAuth(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Не вдалося відкрити таблицю за вказаним ID.');
  }

  const data = await res.json();
  return {
    title: data.properties?.title || 'Google Таблиця',
    sheets: (data.sheets || []).map((s: any) => s.properties?.title || 'Аркуш'),
    url: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}
