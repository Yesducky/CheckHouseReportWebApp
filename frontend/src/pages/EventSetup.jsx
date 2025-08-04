import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { eventAPI } from '../utils/api';

export default function EventSetup() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    house_id: '',
    old_house_id: '',
    flat: '',
    customer_name: '',
  });
  const [houses, setHouses] = useState([]);
  const [filteredHouses, setFilteredHouses] = useState([]);
  const [houseInputError, setHouseInputError] = useState('');
  const inputRef = useRef(null);
  const [inputWidth, setInputWidth] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await eventAPI.getEvent(eventId);
        if (response.data.success) {
          const event = response.data.event;
          setFormData({
            house_id: event.house_id || '',
            old_house_id: event.old_house_id || '',
            flat: event.flat || '',
            customer_name: event.customer_name || '',
          });
          // Redirect if required fields are filled
          if (
            event.house_id && event.house_id.trim() !== '' &&
            event.flat && event.flat.trim() !== '' &&
            event.customer_name && event.customer_name.trim() !== ''
          ) {
            navigate(`/dashboard/${eventId}`);
          }
        }
      } catch (err) {
        console.error('Failed to fetch event:', err);
      }
    };

    // Fetch all houses
    const fetchHouses = async () => {
      try {
        const res = await eventAPI.getHouses();
        if (res.data.success) {
          setHouses(res.data.houses);
          console.log('Houses fetched:', res.data.houses);
        }
      } catch (err) {
        console.error('Failed to fetch houses:', err);
      }
    };

    fetchEvent();
    fetchHouses();
  }, [eventId, navigate]);

  useEffect(() => {
    // Set input width after houses loaded
    if (inputRef.current) {
      setInputWidth(inputRef.current.offsetWidth);
    }
  }, [houses]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setHouseInputError('');
    // Check if house_id is a valid id from houses
    const found = houses.find(h => h.id === formData.house_id);
    if (!found) {
      setHouseInputError('請選擇正確的屋苑');
      setLoading(false);
      return;
    }
    try {
      await eventAPI.updateEvent(eventId, formData);
      navigate(`/dashboard/${eventId}`);
    } catch (err) {
      console.error('Failed to update event:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleHouseInput = (e) => {
    const value = e.target.value;
    setFormData({
      ...formData,
      house_id: value,
    });
    if (value.trim() === '') {
      setFilteredHouses([]);
    } else {
      setFilteredHouses(
        houses.filter(house => house.name.includes(value))
      );
    }
  };

  const handleSelectHouse = (house) => {
    setFormData({
      ...formData,
      house_id: house.id,
    });
    setFilteredHouses([]);
  };

  return (
    <div className="w-full p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-lg rounded-lg px-12 py-8 w-full"
      >
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          設定
        </h1>
        <p className="text-gray-600 mb-6">
          請填寫以下驗樓項目詳細資訊
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="house_id" className="block text-sm font-medium text-gray-700 mb-2">
              屋苑
            </label>
            <input
              type="text"
              id="house_id"
              name="house_id"
              ref={inputRef}
              value={(() => {
                // Show house name if house_id is an id
                const found = houses.find(h => h.id === formData.house_id);
                return found ? found.name : formData.house_id;
              })()}
              onChange={handleHouseInput}
              required
              className={`w-full px-3 py-2 border ${houseInputError ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-darkred focus:border-transparent`}
              autoComplete="off"
            />
            {houseInputError && (
              <div className="text-red-500 text-sm mt-1">{houseInputError}</div>
            )}
            {filteredHouses.length > 0 && (
              <ul
                className="border border-gray-300 rounded-md mt-1 bg-white max-h-40 overflow-y-auto z-10 absolute"
                style={inputWidth ? { width: inputWidth } : {}}
              >
                {filteredHouses.map(house => (
                  <li
                    key={house.id}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSelectHouse(house)}
                  >
                    {house.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label htmlFor="flat" className="block text-sm font-medium text-gray-700 mb-2">
              單位
            </label>
            <input
                type="text"
                id="flat"
                name="flat"
                value={formData.flat}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-darkred focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="old_house_id" className="block text-sm font-medium text-gray-700 mb-2">
              現住屋苑
            </label>
            <input
              type="text"
              id="old_house_id"
              name="old_house_id"
              value={formData.old_house_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-darkred focus:border-transparent"
            />
          </div>



          <div>
            <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 mb-2">
              客戶姓名
            </label>
            <input
              type="text"
              id="customer_name"
              name="customer_name"
              value={formData.customer_name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-darkred focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-darkred text-white px-6 py-2 rounded-md hover:bg-red transition-colors duration-200 disabled:bg-gray active:scale-95"
            >
              {loading ? '儲存中...' : '儲存並繼續'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}