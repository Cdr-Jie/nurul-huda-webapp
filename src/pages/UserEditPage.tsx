import { useNavigate } from 'react-router-dom';
import UserEdit from '../components/UserEdit';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

const UserEditPage = () => {
  const navigate = useNavigate();

  return (
    <div className="p-4 max-w-3xl mx-auto pb-20 text-left">
      
      {/* Navigation Layer - Selaras dengan corak kemasukan EventsManager */}
      <div className="w-full flex justify-start mb-2">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors group"
        >
          <ChevronLeftIcon className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Pengurusan Pengguna
        </button>
      </div>
      
      {/* Header Content Layer */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="text-left">
          <h1 className="text-2xl font-bold text-gray-900">Sunting Pengguna</h1>
          <p className="text-gray-500 text-sm">
            Ubah suai maklumat akaun, peranan sistem, dan jawatan AJK ahli
          </p>
        </div>
      </div>

      {/* Form Component View */}
      <UserEdit />

    </div>
  );
};

export default UserEditPage;