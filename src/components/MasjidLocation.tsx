import React, { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OperatingHour {
  day: string;
  hours: string;
}

interface LocationConfig {
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  // Paste your Google Maps embed URL here.
  // To get it: Google Maps → search your masjid → Share → Embed a map → copy the src URL
  mapEmbedUrl: string;
  // For the "Get Directions" button — Google Maps link to your location
  directionsUrl: string;
  operatingHours: OperatingHour[];
}

// ─── Config — update these values ─────────────────────────────────────────────

const locationConfig: LocationConfig = {
  name: 'Masjid Nurul Huda',
  address: 'Jalan Teluk Sepanggar, 88846',
  city: 'Kota Kinabalu, Sabah',
  phone: '+60 11-3713 8143 (Mohd Nurhelmie Talawi)',
  email: 'mohdnurhelmie.talawi@gmail.com',
  // Replace with your actual Google Maps embed URL
  mapEmbedUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d253906.64680140646!2d115.84327697753909!3d6.0913976976421935!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x323b149c5f972e19%3A0x61a4e8cfd58f23e6!2sMasjid%20Nurul%20Huda%20Kg.%20Gentisan!5e0!3m2!1sen!2smy!4v1778478519129!5m2!1sen!2smy",
  // Replace with your actual Google Maps directions URL
  directionsUrl: 'https://maps.app.goo.gl/SYi1NHE2FZGGNnQ28',
  operatingHours: [
    { day: 'Isnin – Jumaat', hours: '5:00 pagi – 10:00 malam' },
    { day: 'Sabtu', hours: '5:00 pagi – 10:00 malam' },
    { day: 'Ahad', hours: '5:00 pagi – 10:00 malam' },
    { day: 'Hari Kelepasan', hours: 'Seperti biasa' },
  ],
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const IconPin = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    <circle cx="12" cy="9" r="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconPhone = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" />
  </svg>
);

const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const IconClock = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.8}>
    <circle cx="12" cy="12" r="9" strokeLinecap="round" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
  </svg>
);

const IconDirections = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const MasjidLocation: React.FC = () => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const cfg = locationConfig;

  // Determine if today (Monday) is within operating hours to show open/closed badge
  // In a real app you'd compute this from actual current time vs prayer/operating schedule
  const isOpen = true;

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">

        {/* Section heading */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-3">Lokasi Kami</h2>
          <p className="text-gray-500 text-lg">Singgahlah — kami sentiasa mengalu-alukan kedatangan anda.</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100">
          <div className="grid lg:grid-cols-5">

            {/* ── Map (3 cols) ── */}
            <div className="lg:col-span-3 relative min-h-[320px] lg:min-h-[480px] bg-gray-100">
              {/* Loading skeleton */}
              {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse z-10">
                  <div className="text-center text-gray-400">
                    <div className="text-4xl mb-2">🗺️</div>
                    <p className="text-sm">Memuatkan peta…</p>
                  </div>
                </div>
              )}
              <iframe
                title="Lokasi Masjid Nurul Huda"
                src={cfg.mapEmbedUrl}
                className="w-full h-full absolute inset-0"
                style={{ border: 0, minHeight: '320px' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                onLoad={() => setMapLoaded(true)}
              />
            </div>

            {/* ── Info panel (2 cols) ── */}
            <div className="lg:col-span-2 flex flex-col justify-center items-center p-8 gap-8 text-center">

              {/* Name + status */}
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-2xl font-bold text-gray-900">{cfg.name}</h3>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}>
                    {isOpen ? 'Buka' : 'Tutup'}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">Pusat Ibadah & Pembelajaran Islam</p>
              </div>

              {/* Details */}
              <div className="space-y-5 w-full">
                <div className="flex flex-col items-center gap-1 text-gray-700">
                  <span className="text-blue-600"><IconPin /></span>
                  <p className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Alamat</p>
                  <p className="text-gray-800">{cfg.address}</p>
                  <p className="text-gray-800">{cfg.city}</p>
                </div>

                <div className="flex flex-col items-center gap-1 text-gray-700">
                  <span className="text-blue-600"><IconPhone /></span>
                  <p className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Telefon</p>
                  <a 
                    href={`tel:${cfg.phone.split('(')[0].replace(/\s/g, '')}`} 
                    className="text-gray-800 hover:text-blue-600 transition-colors block"
                  >
                    {/* The Phone Number */}
                    <span className="block font-medium">
                      {cfg.phone.split(' (')[0]}
                    </span>
                    
                    {/* The Name (Only renders if a name exists in the brackets) */}
                    {cfg.phone.includes('(') && (
                      <span className="block text-xs text-gray-500 font-normal mt-0.5">
                        ({cfg.phone.split(' (')[1]}
                      </span>
                    )}
                  </a>                
                </div>

                <div className="flex flex-col items-center gap-1 text-gray-700">
                  <span className="text-blue-600"><IconMail /></span>
                  <p className="font-semibold text-sm text-gray-500 uppercase tracking-wide">E-mel</p>
                  <a href={`mailto:${cfg.email}`} className="text-gray-800 hover:text-blue-600 transition-colors break-all">
                    {cfg.email}
                  </a>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <span className="text-blue-600"><IconClock /></span>
                  <p className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-1">Waktu Operasi</p>
                  <div className="space-y-1.5 w-full">
                    {cfg.operatingHours.map((row, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-600">{row.day}</span>
                        <span className="text-gray-800 font-medium">{row.hours}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CTA */}
              <a href={cfg.directionsUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-colors w-full">
                <IconDirections />
                Dapatkan Arah Tuju
              </a>
            </div>

          </div>
        </div>

        {/* Small disclaimer */}
        <p className="text-center text-gray-400 text-xs mt-4">
          Peta disediakan oleh Google Maps. Waktu operasi mungkin berbeza semasa cuti umum.
        </p>
      </div>
    </section>
  );
};

export default MasjidLocation;