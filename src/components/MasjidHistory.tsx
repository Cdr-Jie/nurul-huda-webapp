import React from 'react';

const MasjidHistory: React.FC = () => {
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Sejarah Masjid Nurul Huda</h1>
          <p className="text-xl text-gray-600">Perjalanan kami dalam melayani komunitas Islam</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg p-12 border border-gray-100">
          <div className="space-y-8 text-gray-700 text-lg leading-relaxed">
            <p>
              Masjid Nurul Huda telah menjadi pusat ibadah dan pembelajaran bagi komunitas Muslim di kawasan ini selama bertahun-tahun. Didirikan dengan semangat kuat untuk melayani masyarakat Islam lokal, masjid kami telah berkembang menjadi institusi spiritual yang penting bagi amalan agama dan pengajian Islam di daerah ini.
            </p>

            <p>
              Sejak awal perkembangannya, Masjid Nurul Huda telah berkomitmen untuk menyediakan tempat yang nyaman dan menyambut bagi umat Islam untuk menunaikan ibadah mereka. Dengan fasilitas-fasilitas yang tersedia, kami terus berupaya menciptakan lingkungan yang kondusif untuk aktivitas keagamaan sehari-hari.
            </p>

            <p>
              Sepanjang perjalanannya, masjid kami telah melayani berbagai program keagamaan dan kegiatan pendidikan yang dirancang untuk memberdayakan masyarakat. Kami menyelenggarakan berbagai acara sosial dan inisiatif pembelajaran yang membantu memperkuat ikatan komunitas dan meningkatkan pemahaman agama.
            </p>

            <p>
              Dengan tim pengurusan yang berdedikasi, kami terus berusaha meningkatkan kualitas layanan dan fasilitas masjid. Komitmen kami adalah memberikan pengalaman beribadah terbaik bagi semua jemaah yang berkunjung, tanpa memandang latar belakang mereka.
            </p>

            <p>
              Masjid Nurul Huda bukan hanya sekadar tempat untuk melaksanakan ibadah wajib, tetapi juga menjadi pusat pembelajaran Islam, tempat pertemuan komunitas, dan cerminan dari semangat kebersamaan dalam menjalankan ajaran Islam. Kami terus berkembang dan beradaptasi dengan kebutuhan masyarakat yang terus berubah.
            </p>

            <p>
              Hingga hari ini, Masjid Nurul Huda tetap menjadi landmark spiritual yang penting bagi masyarakat Muslim setempat, terus melayani dengan sepenuh hati dan dedikasi untuk menjaga tradisi ibadah dan pembelajaran Islam yang kuat.
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 mt-12 pt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Visi & Misi Kami</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Visi</h3>
                <p className="text-blue-800">
                  Menjadi pusat ibadah dan pembelajaran Islam yang inklusif, membangun komunitas yang kuat dan bersatu dalam menjalankan ajaran agama.
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                <h3 className="text-lg font-semibold text-green-900 mb-3">Misi</h3>
                <p className="text-green-800">
                  Menyediakan fasilitas ibadah yang berkualitas, menyelenggarakan program pendidikan agama, dan mendorong partisipasi aktif masyarakat dalam kehidupan bermasyarakat.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MasjidHistory;
