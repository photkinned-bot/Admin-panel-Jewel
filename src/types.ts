export enum OrderStatus {
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  CASTING = 'CASTING',
  STONE_SETTING = 'STONE_SETTING',
  POLISHING = 'POLISHING',
  COMPLETED = 'COMPLETED'
}

export interface Material {
  id: string;
  name: string;
  weight: number;
  unit: 'g' | 'ct' | 'pcs';
  type: 'metal' | 'stone' | 'other';
}

export interface Photo {
  url: string;
  caption?: string;
}

export interface Payment {
  id: string;
  amount: number;
  date: string;
  method: 'cash' | 'card' | 'transfer';
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  itemName: string;
  clientName: string;
  clientPhone: string;
  status: OrderStatus;
  deadline: string;
  totalAmount: number;
  advance: number;
  materials: Material[];
  photos: Photo[];
  payments: Payment[];
  expenses: Expense[];
  description: string;
  notes: string;
  createdAt: string;
  catalogItemId?: string;
  colorTag?: string;
}

export interface CatalogItem {
  id: string;
  modelId: string;
  name: string;
  description: string;
  baseMaterials: Material[];
  photos: Photo[];
  baseLaborCost: number;
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  weight?: number;
  metal?: string;
  price?: number;
  category?: string;
}

export interface OrderFromCatalogOptions {
  clientName: string;
  clientPhone: string;
  deadline?: string;
  totalAmount?: number;
  advance?: number;
  notes?: string;
  description?: string;
  size?: string;
  metal?: string;
  weight?: number;
}

