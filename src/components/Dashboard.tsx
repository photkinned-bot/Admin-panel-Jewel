import React from 'react';
import { 
  TrendingUp, 
  Package, 
  Clock, 
  CheckCircle2, 
  DollarSign, 
  ArrowUpRight,
  FileSpreadsheet,
  Gem,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useWorkshop } from '../context/WorkshopContext';
import { OrderStatus } from '../types';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  subtitle?: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, subtitle, color }) => (
  <div className="luxury-card group bg-white border border-zinc-100 hover:shadow-md transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10`}>
        <Icon size={22} className={color.replace('bg-', 'text-')} />
      </div>
      {subtitle && (
        <span className="text-[11px] font-semibold text-zinc-400 bg-zinc-50 px-2 py-0.5 rounded-full">
          {subtitle}
        </span>
      )}
    </div>
    <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</h3>
    <p className="text-2xl font-bold tracking-tight text-zinc-900">{value}</p>
  </div>
);

export const Dashboard: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const { 
    orders, 
    catalog, 
    inventory, 
    isConnectedToSheets, 
    spreadsheetTitle, 
    spreadsheetUrl, 
    syncToSheets,
    isSyncing 
  } = useWorkshop();

  // Calculations from live state
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const activeOrders = orders.filter(o => o.status !== OrderStatus.COMPLETED);
  const inProgressOrders = orders.filter(o => 
    o.status === OrderStatus.IN_PROGRESS || 
    o.status === OrderStatus.CASTING || 
    o.status === OrderStatus.STONE_SETTING || 
    o.status === OrderStatus.POLISHING
  );
  const completedOrders = orders.filter(o => o.status === OrderStatus.COMPLETED);
  const inventoryValuation = inventory.reduce((sum, i) => sum + ((i.quantity || 0) * (i.price || 0)), 0);

  // Dynamic Chart Data generated from orders or distribution
  const chartData = [
    { name: 'Прийнято', count: orders.filter(o => o.status === OrderStatus.ACCEPTED).length, amount: orders.filter(o => o.status === OrderStatus.ACCEPTED).reduce((s, o) => s + (o.totalAmount || 0), 0) },
    { name: 'В роботі', count: orders.filter(o => o.status === OrderStatus.IN_PROGRESS).length, amount: orders.filter(o => o.status === OrderStatus.IN_PROGRESS).reduce((s, o) => s + (o.totalAmount || 0), 0) },
    { name: 'Литво', count: orders.filter(o => o.status === OrderStatus.CASTING).length, amount: orders.filter(o => o.status === OrderStatus.CASTING).reduce((s, o) => s + (o.totalAmount || 0), 0) },
    { name: 'Закріпка', count: orders.filter(o => o.status === OrderStatus.STONE_SETTING).length, amount: orders.filter(o => o.status === OrderStatus.STONE_SETTING).reduce((s, o) => s + (o.totalAmount || 0), 0) },
    { name: 'Полірування', count: orders.filter(o => o.status === OrderStatus.POLISHING).length, amount: orders.filter(o => o.status === OrderStatus.POLISHING).reduce((s, o) => s + (o.totalAmount || 0), 0) },
    { name: 'Готово', count: completedOrders.length, amount: completedOrders.reduce((s, o) => s + (o.totalAmount || 0), 0) },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="serif text-3xl md:text-4xl font-light mb-1">Огляд ювелірної майстерні</h2>
          <p className="text-zinc-500 text-sm">
            Всі показники синхронізуються в реальному часі з вашою Google Таблицею.
          </p>
        </div>

        {isConnectedToSheets && spreadsheetUrl && (
          <a
            href={spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition-colors w-fit"
          >
            <FileSpreadsheet size={16} className="text-emerald-600" />
            <span>Відкрити «{spreadsheetTitle || 'Базу'}» в Google Sheets</span>
            <ExternalLink size={13} />
          </a>
        )}
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Загальна виручка" 
          value={`₴${Math.round(totalRevenue).toLocaleString('uk-UA')}`}
          icon={DollarSign} 
          subtitle={`${orders.length} замовлень`}
          color="bg-emerald-500"
        />
        <StatCard 
          title="Активні замовлення" 
          value={activeOrders.length} 
          icon={Package} 
          subtitle="В процесі"
          color="bg-blue-500"
        />
        <StatCard 
          title="На виробництві" 
          value={inProgressOrders.length} 
          icon={Clock} 
          subtitle="Литво / Закріпка"
          color="bg-amber-500"
        />
        <StatCard 
          title="Оцінка складу" 
          value={`₴${Math.round(inventoryValuation).toLocaleString('uk-UA')}`} 
          icon={Layers} 
          subtitle={`${inventory.length} позицій`}
          color="bg-purple-500"
        />
      </div>

      {/* Charts & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 luxury-card bg-white border border-zinc-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-lg text-zinc-900">Розподіл суми замовлень за етапами (₴)</h3>
              <p className="text-xs text-zinc-400">Обсяг коштів на кожному технологічному етапі</p>
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 11 }}
                  dy={8}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#a1a1aa', fontSize: 11 }}
                  tickFormatter={(v) => `₴${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: any) => [`₴${Number(value).toLocaleString('uk-UA')}`, 'Сума']}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: '1px solid #e4e4e7', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)' 
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#059669" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorAmount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Orders List Widget */}
        <div className="luxury-card bg-white border border-zinc-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-zinc-900">Останні замовлення</h3>
              <span className="text-xs text-zinc-400 font-bold">{orders.length} всього</span>
            </div>
            
            <div className="space-y-4">
              {orders.slice(0, 4).map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-zinc-900 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-zinc-900 leading-tight">{order.itemName}</p>
                      <p className="text-[11px] text-zinc-400">{order.clientName} • {order.orderNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-zinc-900">₴{(order.totalAmount || 0).toLocaleString('uk-UA')}</p>
                    <span className="text-[10px] text-emerald-600 font-semibold">{order.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {onNavigate && (
            <button 
              onClick={() => onNavigate('orders')}
              className="w-full mt-6 py-2.5 bg-zinc-50 hover:bg-zinc-100 text-xs font-bold text-zinc-700 rounded-xl transition-colors text-center"
            >
              Переглянути всі замовлення →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
