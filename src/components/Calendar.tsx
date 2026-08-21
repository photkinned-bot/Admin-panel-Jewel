import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  Package, 
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { clsx } from 'clsx';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, eachDayOfInterval, parseISO } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useWorkshop } from '../context/WorkshopContext';

export const Calendar: React.FC = () => {
  const { orders } = useWorkshop();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  // Map orders to events by deadline
  const events = orders
    .filter(order => order.deadline)
    .map(order => {
      let d: Date;
      try {
        d = typeof order.deadline === 'string' ? parseISO(order.deadline) : new Date(order.deadline);
      } catch {
        d = new Date();
      }
      return {
        id: order.id,
        date: d,
        title: `Дедлайн: ${order.itemName} (${order.clientName})`,
        status: order.status,
        orderNumber: order.orderNumber,
        amount: order.totalAmount,
        type: 'deadline',
        color: order.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-rose-500'
      };
    });

  const selectedDayEvents = events.filter(e => isSameDay(e.date, selectedDate));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="serif text-3xl font-light">Виробничий календар</h2>
          <p className="text-zinc-500 text-sm">Графік виконання замовлень та дедлайнів з Google Таблиці.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 luxury-card p-0 overflow-hidden bg-white">
          <div className="p-6 md:p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
            <h3 className="text-xl font-bold capitalize text-zinc-900">
              {format(currentMonth, 'LLLL yyyy', { locale: uk })}
            </h3>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 hover:bg-white rounded-xl border border-zinc-200 transition-all text-zinc-600">
                <ChevronLeft size={20} />
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-white rounded-xl border border-zinc-200 transition-all text-zinc-600">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-zinc-100 bg-zinc-50/30">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map((day) => (
              <div key={day} className="py-3 text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              const dayEvents = events.filter(e => isSameDay(e.date, day));
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isToday = isSameDay(day, new Date());

              return (
                <div 
                  key={i} 
                  onClick={() => setSelectedDate(day)}
                  className={clsx(
                    "min-h-[100px] md:min-h-[120px] p-2 border-r border-b border-zinc-100 transition-all cursor-pointer hover:bg-zinc-50/70",
                    !isCurrentMonth && "bg-zinc-50/40 opacity-40",
                    isSelected && "bg-zinc-900/5 ring-1 ring-inset ring-zinc-900/15"
                  )}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={clsx(
                      "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full",
                      isToday && "bg-black text-white shadow-sm",
                      isSelected && !isToday && "bg-zinc-200 text-zinc-900"
                    )}>
                      {format(day, 'd')}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-bold text-zinc-400">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map(event => (
                      <div 
                        key={event.id}
                        className={clsx(
                          "px-1.5 py-0.5 rounded text-[9px] font-bold text-white truncate",
                          event.color
                        )}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] font-bold text-zinc-400 block pl-1">
                        +{dayEvents.length - 2} ще
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar for Selected Date */}
        <div className="space-y-6">
          <div className="luxury-card bg-white">
            <h3 className="font-bold text-base mb-4 flex items-center gap-2 text-zinc-900">
              <Clock size={18} className="text-zinc-500" />
              <span>{format(selectedDate, 'd MMMM yyyy', { locale: uk })}</span>
            </h3>
            <div className="space-y-3">
              {selectedDayEvents.length > 0 ? (
                selectedDayEvents.map(event => (
                  <div key={event.id} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">{event.orderNumber}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">Дедлайн</span>
                    </div>
                    <p className="text-sm font-bold text-zinc-900">{event.title}</p>
                    {event.amount && (
                      <p className="text-xs text-emerald-700 font-semibold">₴{event.amount.toLocaleString('uk-UA')}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-400 text-center py-8 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                  На цю дату дедлайнів немає
                </p>
              )}
            </div>
          </div>

          <div className="luxury-card bg-white">
            <h3 className="font-bold text-base mb-4 text-zinc-900">Підсумок дедлайнів</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Всього із дедлайном:</span>
                <span className="font-bold text-zinc-900">{events.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">Завершених:</span>
                <span className="font-bold text-emerald-600">{events.filter(e => e.status === 'COMPLETED').length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500">В процесі:</span>
                <span className="font-bold text-amber-600">{events.filter(e => e.status !== 'COMPLETED').length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
