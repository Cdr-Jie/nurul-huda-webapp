import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { authClient } from '../lib/auth-client';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
  organizer: string;
  image_url: string | null;
  host_letter_url: string | null;
  is_active: boolean;
  created_at: string;
  biro_id: string | null;
}

interface CalendarDay {
  date: number | null;
  isCurrentMonth: boolean;
  fullDate: string;
  events: Event[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS: Record<number, string> = {
  1: 'Jan',
  2: 'Feb',
  3: 'Mac',
  4: 'Apr',
  5: 'Mei',
  6: 'Jun',
  7: 'Jul',
  8: 'Ogos',
  9: 'Sep',
  10: 'Okt',
  11: 'Nov',
  12: 'Dis',
};

const MONTH_NAMES: Record<number, string> = {
  1: 'Januari',
  2: 'Februari',
  3: 'Mac',
  4: 'April',
  5: 'Mei',
  6: 'Jun',
  7: 'Julai',
  8: 'Ogos',
  9: 'September',
  10: 'Oktober',
  11: 'November',
  12: 'Disember',
};

const WEEKDAYS = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m]} ${y}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

// ─── Main Component ───────────────────────────────────────────────────────────

const EventCalendar = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // ─── Session ────────────────────────────────────────────────────────────────────
  const { data: session } = authClient.useSession();
  const userBiroId = session?.user?.biro_id ?? null;
  const userRole = session?.user?.role ?? 'user';
  const isSuperAdmin = userRole === 'superadmin';

  // ── Fetch ───────────────────────────────────────────────────────────────────

  const fetchEvents = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .order('date', { ascending: true });

    if (error) console.error('Error fetching events:', error);
    else setEvents(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // ── Calendar generation ────────────────────────────────────────────────────

  const generateCalendarDays = (): CalendarDay[] => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const daysInPrevMonth = getDaysInMonth(currentYear, currentMonth - 1);
    const days: CalendarDay[] = [];

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const date = daysInPrevMonth - i;
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const fullDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
      days.push({
        date,
        isCurrentMonth: false,
        fullDate,
        events: events.filter(e => e.date === fullDate),
      });
    }

    // Current month days
    for (let date = 1; date <= daysInMonth; date++) {
      const fullDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
      days.push({
        date,
        isCurrentMonth: true,
        fullDate,
        events: events.filter(e => e.date === fullDate),
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let date = 1; date <= remainingDays; date++) {
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
      const fullDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
      days.push({
        date,
        isCurrentMonth: false,
        fullDate,
        events: events.filter(e => e.date === fullDate),
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  // ── Navigation ────────────────────────────────────────────────────────────

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const isEventForUserBiro = (event: Event): boolean => {
    if (isSuperAdmin) return false;
    if (!userBiroId) return event.biro_id === null;
    return event.biro_id === userBiroId;
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 max-w-6xl mx-auto pb-20 text-left">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-left">
          <h1 className="text-2xl font-bold text-gray-900">Kalendar Acara</h1>
          <p className="text-gray-500 text-sm">Lihat semua acara dalam format kalendar</p>
        </div>
        <a
          href="/admin/events"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm"
        >
          Kembali ke Pengurusan Acara
        </a>
      </div>

      {/* Calendar Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Memuatkan...</div>
        ) : (
          <>
            {/* Month Navigation */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-gray-200 rounded-lg transition"
                title="Bulan sebelumnya"
              >
                <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
              </button>

              <h2 className="text-lg font-bold text-gray-800 min-w-[200px] text-center">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h2>

              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-200 rounded-lg transition"
                title="Bulan seterusnya"
              >
                <ChevronRightIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-0 border-b border-gray-200 bg-gray-50">
              {WEEKDAYS.map(day => (
                <div
                  key={day}
                  className="p-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-0 bg-white">
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  className={`min-h-[120px] border border-gray-100 p-2 ${!day.isCurrentMonth ? 'bg-gray-50' : ''}`}
                >
                  {/* Date */}
                  <div
                    className={`text-sm font-semibold mb-1 ${
                      day.isCurrentMonth ? 'text-gray-800' : 'text-gray-400'
                    }`}
                  >
                    {day.date}
                  </div>

                  {/* Events */}
                  <div className="space-y-1">
                    {day.events.slice(0, 2).map(event => {
                      const isUserBiro = isEventForUserBiro(event);
                      return (
                        <button
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          className={`w-full text-left text-xs px-1.5 py-1 rounded truncate font-medium transition hover:opacity-90 cursor-pointer ${
                            isUserBiro
                              ? 'bg-blue-200 text-blue-800 border border-blue-300'
                              : 'bg-gray-200 text-gray-700 border border-gray-300'
                          }`}
                          title={event.title}
                        >
                          {event.title}
                        </button>
                      );
                    })}
                    {day.events.length > 2 && (
                      <div className="text-xs text-gray-500 px-1.5 py-0.5">
                        +{day.events.length - 2} lagi
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-200 border border-blue-300 rounded"></div>
                <span className="text-gray-700">Acara untuk divisi anda</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 border border-gray-300 rounded"></div>
                <span className="text-gray-700">Acara lain</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{selectedEvent.title}</h2>
                <p className="text-sm text-gray-500 mt-1">{formatDate(selectedEvent.date)}</p>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition shrink-0"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Event Image */}
            {selectedEvent.image_url && (
              <img
                src={selectedEvent.image_url}
                alt={selectedEvent.title}
                className="w-full h-40 object-cover rounded-lg mb-4"
              />
            )}

            {/* Details */}
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Penganjur
                </p>
                <p className="text-sm text-gray-700">{selectedEvent.organizer}</p>
              </div>

              {selectedEvent.description && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Penerangan
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Status
                </p>
                <span
                  className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                    selectedEvent.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {selectedEvent.is_active ? 'Aktif' : 'Tidak Aktif'}
                </span>
              </div>

              {selectedEvent.host_letter_url && (
                <div>
                  <a
                    href={selectedEvent.host_letter_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-600 hover:underline font-semibold"
                  >
                    Lihat Surat Kebenaran
                  </a>
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => setSelectedEvent(null)}
              className="w-full mt-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition text-sm"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventCalendar;
