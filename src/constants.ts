import { OrderStatus, Order, CatalogItem } from './types';

export const MOCK_ORDERS: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-2024-001',
    itemName: 'Обручка з діамантом',
    clientName: 'Олександр Коваль',
    clientPhone: '+380 67 123 45 67',
    status: OrderStatus.IN_PROGRESS,
    deadline: '2024-04-15',
    totalAmount: 45000,
    advance: 15000,
    materials: [
      { id: 'm1', name: 'Золото 585', weight: 4.5, unit: 'g', type: 'metal' },
      { id: 'm2', name: 'Діамант 0.5ct', weight: 1, unit: 'pcs', type: 'stone' }
    ],
    photos: [{ url: 'https://picsum.photos/seed/ring1/800/600' }],
    payments: [],
    expenses: [],
    description: 'Класична обручка з білого золота з центральним каменем.',
    notes: 'Клієнт хоче гравіювання всередині.',
    createdAt: '2024-03-01T10:00:00Z'
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-002',
    itemName: 'Кольє "Зоряне сяйво"',
    clientName: 'Марія Іванова',
    clientPhone: '+380 50 987 65 43',
    status: OrderStatus.ACCEPTED,
    deadline: '2024-05-20',
    totalAmount: 120000,
    advance: 40000,
    materials: [
      { id: 'm3', name: 'Золото 750', weight: 12.2, unit: 'g', type: 'metal' },
      { id: 'm4', name: 'Сапфір', weight: 3, unit: 'pcs', type: 'stone' }
    ],
    photos: [{ url: 'https://picsum.photos/seed/necklace/800/600' }],
    payments: [],
    expenses: [],
    description: 'Вишукане кольє з сапфірами та дрібними діамантами.',
    notes: 'Терміново до ювілею.',
    createdAt: '2024-03-05T14:30:00Z'
  }
];

export const MOCK_CATALOG: CatalogItem[] = [
  {
    id: 'c1',
    modelId: 'MOD-001',
    name: 'Перстень "Аврора"',
    description: 'Сучасний дизайн з асиметричним кріпленням каменя.',
    baseMaterials: [{ id: 'm1', name: 'Золото 585', weight: 3.8, unit: 'g', type: 'metal' }],
    photos: [{ url: 'https://picsum.photos/seed/aurora/800/600' }],
    baseLaborCost: 8000,
    complexity: 'MEDIUM'
  },
  {
    id: 'c2',
    modelId: 'MOD-002',
    name: 'Сережки "Крапля"',
    description: 'Елегантні сережки з перлами.',
    baseMaterials: [{ id: 'm5', name: 'Срібло 925', weight: 5.5, unit: 'g', type: 'metal' }],
    photos: [{ url: 'https://picsum.photos/seed/earrings/800/600' }],
    baseLaborCost: 4500,
    complexity: 'LOW'
  }
];

export const MOCK_INVENTORY = [
  { id: 'i1', name: 'Золото 585', category: 'Метали', quantity: 145.5, unit: 'г', status: 'OK' as const, price: 2100, updatedAt: '2024-03-01' },
  { id: 'i2', name: 'Золото 750', category: 'Метали', quantity: 42.0, unit: 'г', status: 'OK' as const, price: 2700, updatedAt: '2024-03-01' },
  { id: 'i3', name: 'Срібло 925', category: 'Метали', quantity: 850.0, unit: 'г', status: 'OK' as const, price: 45, updatedAt: '2024-03-01' },
  { id: 'i4', name: 'Діаманти 0.01-0.03ct', category: 'Каміння', quantity: 120, unit: 'шт', status: 'OK' as const, price: 350, updatedAt: '2024-03-01' },
  { id: 'i5', name: 'Сапфіри овал 4x3', category: 'Каміння', quantity: 8, unit: 'шт', status: 'LOW' as const, price: 1200, updatedAt: '2024-03-01' },
  { id: 'i6', name: 'Родій рідкий', category: 'Хімія', quantity: 0.5, unit: 'л', status: 'CRITICAL' as const, price: 15000, updatedAt: '2024-03-01' },
];


