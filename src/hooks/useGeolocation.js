import { useState } from 'react';

export function useGeolocation() {
  const [coordinates, setCoordinates] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const requestLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const msg = "Geolokasi tidak didukung oleh browser Anda.";
        setError(msg);
        reject(msg);
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setCoordinates(coords);
          setLoading(false);
          resolve(coords);
        },
        (error) => {
          let msg = "Terjadi kesalahan saat mengambil lokasi.";
          switch(error.code) {
            case error.PERMISSION_DENIED:
              msg = "Akses lokasi ditolak. Izinkan browser untuk mengakses lokasi Anda.";
              break;
            case error.POSITION_UNAVAILABLE:
              msg = "Informasi lokasi tidak tersedia.";
              break;
            case error.TIMEOUT:
              msg = "Permintaan lokasi terlalu lama (timeout).";
              break;
          }
          setError(msg);
          setLoading(false);
          reject(msg);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  return { coordinates, error, loading, requestLocation };
}
