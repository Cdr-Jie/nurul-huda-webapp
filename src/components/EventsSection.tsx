import React, { useState, useEffect } from 'react';
import EventCard from '../components/EventCard';
import { Link } from 'react-router-dom';

// ─── Type matching the DB schema ──────────────────────────────────────────────

interface Event {
  id: string;
  title: string;
  date: string;        // ISO date string e.g. "2026-05-11"
  description: string;
  organizer: string;
  image_url: string | null;
  surat?: string | null; // Add this with a '?' so it's optional
}

// ─── Helper: format ISO date → "11 Mei 2026" ─────────────────────────────────

const MONTHS_MY: Record<number, string> = {
  1: 'Jan', 2: 'Feb', 3: 'Mac', 4: 'Apr', 5: 'Mei', 6: 'Jun',
  7: 'Jul', 8: 'Ogos', 9: 'Sep', 10: 'Okt', 11: 'Nov', 12: 'Dis',
};

function formatDateMY(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  return `${day} ${MONTHS_MY[month]} ${year}`;
}

// ─── Fallback image if event has no image_url ─────────────────────────────────

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1591088398332-8c716b89973f?w=500&h=300&fit=crop';

// ─── Skeleton card shown while loading ───────────────────────────────────────

const SkeletonCard = () => (
  <div className="animate-pulse flex gap-6 bg-white rounded-xl p-5 mb-4 border border-gray-100">
    <div className="w-32 h-24 bg-gray-200 rounded-lg shrink-0" />
    <div className="flex-1 space-y-3 py-1">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-200 rounded w-1/3" />
      <div className="h-3 bg-gray-200 rounded w-full" />
      <div className="h-3 bg-gray-200 rounded w-5/6" />
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const EventsSection: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
    setLoading(true);
    setError(null);

      try {
        // Fetch from the backend API endpoint
        const apiUrl = import.meta.env.VITE_API_URL || `${window.location.origin}`;
        const response = await fetch(`${apiUrl}/api/events`);
        
        if (!response.ok) {
          setError('Acara sedang dimuat. Sila cuba lagi kemudian.');
          setLoading(false);
          return;
        }

        const data = await response.json();
        setEvents(data ?? []);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Gagal memuatkan acara. Sila cuba lagi.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <section className="py-12 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
          Acara Mendatang
        </h2>

        {/* Loading state */}
        {loading && (
          <div>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-blue-600 underline text-sm"
            >
              Cuba semula
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && events.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-5xl mb-4">📅</p>
            <p className="text-lg font-medium text-gray-500">Tiada acara akan datang buat masa ini.</p>
            <p className="text-sm mt-1">Sila semak semula tidak lama lagi.</p>
          </div>
        )}

        {/* Events list */}
        {!loading && !error && events.length > 0 && (
          <div>
            {events.map((event) => (
              <EventCard
                key={event.id}
                image={event.image_url ?? FALLBACK_IMAGE}
                title={event.title}
                date={formatDateMY(event.date)}
                description={event.description}
                organizer={event.organizer}
              />
            ))}
          </div>
        )}

        {/* CTA */}
        {!loading && (
          <div className="mt-8 text-center">
            <Link to="/events">
              <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Lihat Semua Acara
              </button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default EventsSection;   