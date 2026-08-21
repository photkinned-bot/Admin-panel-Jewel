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
  CATALOG_SHEET_NAME: 'jewelmaster_catalog_sheet_name',
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

export const getSavedCatalogSheetName = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.CATALOG_SHEET_NAME);
};

export const saveCatalogSheetName = (name: string) => {
  localStorage.setItem(STORAGE_KEYS.CATALOG_SHEET_NAME, name);
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
  localStorage.removeItem(STORAGE_KEYS.CATALOG_SHEET_NAME);
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

function safeJsonParse<T>(str: any, fallback: T): T {
  if (!str) return fallback;
  if (typeof str === 'object') return str as T;
  try {
    const parsed = JSON.parse(str);
    return parsed !== undefined ? parsed : fallback;
  } catch {
    if (typeof fallback === 'object' && Array.isArray(fallback) && typeof str === 'string' && str.trim()) {
      return str.split(';').map(item => ({ name: item.trim() })) as unknown as T;
    }
    return fallback;
  }
}

/**
 * Normalizes any photo URL from Google Sheets, including:
 * - Google Drive share links (drive.google.com/file/d/..., drive.google.com/open?id=...)
 * - Formulas like =IMAGE("https://...")
 * - JSON strings like [{"url": "..."}]
 * - Direct image URLs and base64 strings
 */
export function normalizeImageUrl(input: any): string {
  if (!input) return '';
  let str = String(input).trim();

  // Strip formula wrapper =IMAGE("...") or =IMAGE('...')
  const formulaMatch = str.match(/=IMAGE\s*\(\s*["']([^"']+)["']\s*\)/i);
  if (formulaMatch && formulaMatch[1]) {
    str = formulaMatch[1].trim();
  }

  // Handle JSON array or object
  if (str.startsWith('[') || str.startsWith('{')) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (typeof parsed[0] === 'string') return normalizeImageUrl(parsed[0]);
        if (parsed[0]?.url) return normalizeImageUrl(parsed[0].url);
      } else if (parsed?.url) {
        return normalizeImageUrl(parsed.url);
      }
    } catch {
      // Continue normal parsing
    }
  }

  // Extract Google Drive File ID
  // Examples:
  // https://drive.google.com/file/d/1aB2cD3eFgHiJ/view?usp=sharing
  // https://drive.google.com/open?id=1aB2cD3eFgHiJ
  // https://drive.google.com/uc?id=1aB2cD3eFgHiJ
  const driveFileMatch = str.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (driveFileMatch && driveFileMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveFileMatch[1]}`;
  }

  const driveIdMatch = str.match(/drive\.google\.com\/(?:open|uc)\?(?:[a-zA-Z0-9_=&-]*&)?id=([a-zA-Z0-9_-]+)/i);
  if (driveIdMatch && driveIdMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveIdMatch[1]}`;
  }

  // If it contains multiple URLs separated by newline or comma, take the first valid one
  if (str.includes('\n') || (str.includes(',') && !str.startsWith('data:image'))) {
    const parts = str.split(/[\n,]/).map(s => s.trim()).filter(s => s.length > 0);
    if (parts.length > 0) {
      return normalizeImageUrl(parts[0]);
    }
  }

  return str;
}

/**
 * Normalizes photo array for Catalog Item or Order
 */
export function normalizePhotosArray(input: any): Photo[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map(p => typeof p === 'string' ? { url: normalizeImageUrl(p) } : { ...p, url: normalizeImageUrl(p.url) }).filter(p => !!p.url);
  }
  const cleanUrl = normalizeImageUrl(input);
  return cleanUrl ? [{ url: cleanUrl }] : [];
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
 * Helper to match sheet titles dynamically
 */
function findSheetTitle(sheetTitles: string[], keywords: string[], defaultTitle: string): string {
  for (const keyword of keywords) {
    const found = sheetTitles.find(t => t.toLowerCase().includes(keyword.toLowerCase()));
    if (found) return found;
  }
  return defaultTitle;
}

/**
 * Helper to find column index by synonyms
 */
function findColIndex(headers: string[], synonyms: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const h = (headers[i] || '').toLowerCase().replace(/[^a-zа-яіїєґ0-9]/gi, '').trim();
    for (const syn of synonyms) {
      const s = syn.toLowerCase().replace(/[^a-zа-яіїєґ0-9]/gi, '').trim();
      if (h === s || h.includes(s)) {
        return i;
      }
    }
  }
  return -1;
}

/**
 * Parses Catalog rows with smart dynamic header detection
 */
function parseCatalogRows(rows: any[][]): CatalogItem[] {
  if (!rows || rows.length < 2) return [];

  const headerRow = rows[0] || [];
  const headerStrings = headerRow.map(h => String(h || '').trim());

  // Dynamically locate column indices
  const idCol = findColIndex(headerStrings, ['id', 'ід']);
  const modelIdCol = findColIndex(headerStrings, ['артикул', 'код', 'модель', 'article', 'modelid', 'sku', 'номер', 'код моделі']);
  const nameCol = findColIndex(headerStrings, ['назва', 'назва моделі', 'найменування', 'виріб', 'назва виробу', 'name', 'title', 'item']);
  const complexityCol = findColIndex(headerStrings, ['складність', 'категорія складності', 'complexity', 'рівень']);
  const laborCostCol = findColIndex(headerStrings, ['базова вартість роботи', 'вартість роботи', 'ціна роботи', 'робота', 'вартість', 'ціна', 'price', 'cost', 'labor', 'laborcost']);
  const materialsCol = findColIndex(headerStrings, ['базові матеріали', 'матеріали', 'метал', 'проба', 'сплав', 'materials', 'metal']);
  const weightCol = findColIndex(headerStrings, ['вага', 'вагаг', 'вагавиробу', 'маса', 'вага металу', 'weight', 'mass']);
  const descriptionCol = findColIndex(headerStrings, ['опис', 'опис моделі', 'характеристики', 'примітки', 'description', 'notes', 'details']);
  const photoCol = findColIndex(headerStrings, ['фото', 'фото json', 'фотографія', 'зображення', 'картинка', 'посилання на фото', 'фото виробу', 'photo', 'image', 'picture', 'url', 'img']);
  const categoryCol = findColIndex(headerStrings, ['категорія', 'тип', 'вид', 'category', 'type']);

  const parsed: CatalogItem[] = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0 || r.every(cell => !cell || String(cell).trim() === '')) continue;

    // Fallbacks if columns weren't explicitly found by name
    const rawId = idCol >= 0 ? r[idCol] : (modelIdCol >= 0 ? r[modelIdCol] : `cat-${i}`);
    const rawModelId = modelIdCol >= 0 ? r[modelIdCol] : (idCol >= 0 ? r[idCol] : `MOD-${String(i).padStart(3, '0')}`);
    const rawName = nameCol >= 0 ? r[nameCol] : (r[2] || r[1] || r[0] || `Модель ${i}`);
    const rawDescription = descriptionCol >= 0 ? r[descriptionCol] : (r[6] || '');
    
    // Photo resolution
    let photos: Photo[] = [];
    if (photoCol >= 0 && r[photoCol]) {
      photos = normalizePhotosArray(r[photoCol]);
    } else if (r[7]) {
      photos = normalizePhotosArray(r[7]);
    } else {
      // Check every cell for a possible image URL
      for (const cell of r) {
        if (cell && typeof cell === 'string' && (cell.includes('http') || cell.includes('drive.google') || cell.startsWith('data:image'))) {
          photos = normalizePhotosArray(cell);
          break;
        }
      }
    }

    // Default fallback placeholder photo if none found
    if (photos.length === 0) {
      photos = [{ url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80' }];
    }

    // Labor Cost & Price
    let rawLaborCost = laborCostCol >= 0 ? Number(String(r[laborCostCol]).replace(/[^0-9.]/g, '')) : (Number(r[4]) || 3500);
    if (isNaN(rawLaborCost) || rawLaborCost === 0) rawLaborCost = 3500;

    // Materials / Metal / Weight
    let rawWeight = weightCol >= 0 ? parseFloat(String(r[weightCol]).replace(/[^0-9.]/g, '')) || 0 : 0;
    let rawMetal = materialsCol >= 0 ? String(r[materialsCol] || '') : 'Золото 585';
    
    let baseMaterials: Material[] = [];
    if (materialsCol >= 0 && typeof r[materialsCol] === 'string' && (r[materialsCol].startsWith('[') || r[materialsCol].startsWith('{'))) {
      baseMaterials = safeJsonParse<Material[]>(r[materialsCol], []);
    } else if (rawMetal) {
      baseMaterials = [{
        id: `mat-${i}`,
        name: rawMetal,
        weight: rawWeight || 3.5,
        unit: 'g',
        type: 'metal'
      }];
    }

    // Complexity
    let complexity: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
    if (complexityCol >= 0 && r[complexityCol]) {
      const cStr = String(r[complexityCol]).toUpperCase();
      if (cStr.includes('HIGH') || cStr.includes('ВИСОК')) complexity = 'HIGH';
      else if (cStr.includes('LOW') || cStr.includes('НИЗЬК')) complexity = 'LOW';
      else complexity = 'MEDIUM';
    }

    parsed.push({
      id: String(rawId || `cat-${i}`),
      modelId: String(rawModelId || `MOD-${String(i).padStart(3, '0')}`),
      name: String(rawName || 'Ювелірна модель'),
      complexity,
      baseLaborCost: rawLaborCost,
      baseMaterials,
      description: String(rawDescription || ''),
      photos,
      weight: rawWeight || (baseMaterials[0]?.weight || 0),
      metal: rawMetal || (baseMaterials[0]?.name || 'Золото 585'),
      price: rawLaborCost,
      category: categoryCol >= 0 ? String(r[categoryCol] || '') : undefined,
    });
  }

  return parsed;
}

/**
 * Reads all data directly from the Google Sheet with dynamic sheet detection
 */
export async function readAllFromGoogleSheets(spreadsheetId?: string): Promise<WorkshopData> {
  const targetId = spreadsheetId || getSavedSpreadsheetId();
  if (!targetId) throw new Error('Не вказано ID Google Таблиці');

  // Fetch spreadsheet structure first to get actual sheet titles
  const metaRes = await fetchWithAuth(`https://sheets.googleapis.com/v4/spreadsheets/${targetId}?includeGridData=false`);
  let sheetTitles: string[] = [];
  if (metaRes.ok) {
    const meta = await metaRes.json();
    sheetTitles = (meta.sheets || []).map((s: any) => s.properties?.title || '');
  }

  // Match sheet names
  const customCatalogTab = getSavedCatalogSheetName();
  const catalogSheetTitle = customCatalogTab && sheetTitles.includes(customCatalogTab)
    ? customCatalogTab
    : findSheetTitle(sheetTitles, ['каталог', 'catalog', 'товари', 'моделі', 'вироби', 'прикраси', 'items', 'products', '💎'], '💎 Каталог');

  const ordersSheetTitle = findSheetTitle(sheetTitles, ['замовлення', 'orders', 'order', 'заказы', '📋'], '📋 Замовлення');
  const inventorySheetTitle = findSheetTitle(sheetTitles, ['склад', 'inventory', 'матеріали', 'materials', 'залишки', '📦'], '📦 Склад Матеріалів');

  // Read sheets in batch
  const ranges = [
    encodeURIComponent(`'${ordersSheetTitle}'!A1:P1000`),
    encodeURIComponent(`'${catalogSheetTitle}'!A1:Z1000`),
    encodeURIComponent(`'${inventorySheetTitle}'!A1:J1000`),
  ];

  const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${targetId}/values:batchGet?ranges=${ranges.join('&ranges=')}`;
  const res = await fetchWithAuth(batchUrl);

  let ordersRows: any[][] = [];
  let catalogRows: any[][] = [];
  let inventoryRows: any[][] = [];

  if (res.ok) {
    const batchResponse = await res.json();
    const valueRanges = batchResponse.valueRanges || [];
    ordersRows = valueRanges[0]?.values || [];
    catalogRows = valueRanges[1]?.values || [];
    inventoryRows = valueRanges[2]?.values || [];
  } else {
    // If batch fails due to sheet name mismatch, try reading the first sheet as Catalog
    if (sheetTitles.length > 0) {
      const fallbackRange = encodeURIComponent(`'${sheetTitles[0]}'!A1:Z1000`);
      const fallbackRes = await fetchWithAuth(`https://sheets.googleapis.com/v4/spreadsheets/${targetId}/values/${fallbackRange}`);
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        catalogRows = fallbackData.values || [];
      }
    }
  }

  // Parse Orders
  const parsedOrders: Order[] = [];
  if (ordersRows.length > 1) {
    for (let i = 1; i < ordersRows.length; i++) {
      const r = ordersRows[i];
      if (!r || r.length === 0 || !r[0]) continue;

      const materials: Material[] = safeJsonParse<Material[]>(r[10], []);
      const photos: Photo[] = normalizePhotosArray(r[11]);
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
        totalAmount: Number(String(r[7]).replace(/[^0-9.]/g, '')) || 0,
        advance: Number(String(r[8]).replace(/[^0-9.]/g, '')) || 0,
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

  // Parse Catalog using smart dynamic parser
  const parsedCatalog: CatalogItem[] = parseCatalogRows(catalogRows);

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
 * Reads only the Catalog from a specific Google Sheet tab
 */
export async function readCatalogFromGoogleSheets(spreadsheetId?: string, sheetName?: string): Promise<CatalogItem[]> {
  const targetId = spreadsheetId || getSavedSpreadsheetId();
  if (!targetId) throw new Error('Не вказано ID Google Таблиці');

  let targetSheet = sheetName || getSavedCatalogSheetName();

  if (!targetSheet) {
    const metaRes = await fetchWithAuth(`https://sheets.googleapis.com/v4/spreadsheets/${targetId}?includeGridData=false`);
    if (metaRes.ok) {
      const meta = await metaRes.json();
      const sheetTitles: string[] = (meta.sheets || []).map((s: any) => s.properties?.title || '');
      targetSheet = findSheetTitle(sheetTitles, ['каталог', 'catalog', 'товари', 'моделі', 'вироби', 'прикраси', 'items', 'products', '💎'], sheetTitles[0] || '💎 Каталог');
    }
  }

  const range = encodeURIComponent(`'${targetSheet || '💎 Каталог'}'!A1:Z1000`);
  const res = await fetchWithAuth(`https://sheets.googleapis.com/v4/spreadsheets/${targetId}/values/${range}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Не вдалося завантажити аркуш Каталогу');
  }

  const data = await res.json();
  const rows: any[][] = data.values || [];
  const catalog = parseCatalogRows(rows);

  if (catalog.length > 0) {
    saveLocalData({ catalog });
  }

  return catalog;
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
