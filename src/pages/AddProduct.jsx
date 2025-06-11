import React, { useState, useEffect } from 'react';

const AddProduct = () => {
  const [thumbnail, setThumbnail] = useState(null);
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [hasVideo, setHasVideo] = useState(false);
  const [isHot, setIsHot] = useState(false);
  const [error, setError] = useState('');

  // Если пользователь добавил видео — автоматически включаем чекбокс
  useEffect(() => {
    if (videos.length > 0) {
      setHasVideo(true);
    } else {
      setHasVideo(false); // опционально — можно оставить включённым, если надо
    }
  }, [videos]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Проверка на обязательные поля
    if (!thumbnail) {
      return setError('Пожалуйста, добавьте изображение для витрины.');
    }

    if (images.length === 0 && videos.length === 0) {
      return setError('Необходимо добавить хотя бы одно фото или видео.');
    }

    setError(''); // очищаем старую ошибку
    const formData = new FormData();
    formData.append('thumbnail', thumbnail);

    images.forEach(img => formData.append('images', img));
    videos.forEach(vid => formData.append('videos', vid));

    formData.append('has_video', hasVideo);
    formData.append('is_hot', isHot);

    const res = await fetch('https://check-bot.top/api/admin/add-product', {
      method: 'POST',
      body: formData,
    });

    const text = await res.text();
    try {
      const data = JSON.parse(text);
      console.log('✅ Товар успешно добавлен:', data);
    } catch (e) {
      console.error('❌ Ошибка при добавлении:', e);
      console.error('Ответ сервера:', text);
    }
  };

  return (
    <div>
      <h2>Добавить товар</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <label>Изображение на витрину:</label>
        <input
          type="file"
          accept="image/*"
          onChange={e => setThumbnail(e.target.files[0])}
        />

        <label>Фотографии:</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={e => setImages([...e.target.files])}
        />

        <label>Видео:</label>
        <input
          type="file"
          accept="video/*"
          multiple
          onChange={e => setVideos([...e.target.files])}
        />

        <label>
          <input
            type="checkbox"
            checked={hasVideo}
            onChange={e => setHasVideo(e.target.checked)}
            disabled={videos.length > 0} // запрещаем выключать, если видео добавлены
          />
          🎥 Есть видео
        </label>

        <label>
          <input
            type="checkbox"
            checked={isHot}
            onChange={e => setIsHot(e.target.checked)}
          />
          🔥 Горячее предложение
        </label>

        <button type="submit">Добавить товар</button>
      </form>
    </div>
  );
};

export default AddProduct;
