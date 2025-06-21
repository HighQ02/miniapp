import { useEffect, useState, useRef } from 'react';

const useTelegramUser = () => {
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState("ru"); // По умолчанию русский
  const [hasSubscription, setHasSubscription] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [freeUntil, setFreeUntil] = useState(null);

  const timerRef = useRef();
  const intervalRef = useRef();

  // Получение статуса пользователя
  useEffect(() => {
    const tg = window.Telegram?.WebApp?.initDataUnsafe?.user;

    if (!tg) {
      setLoading(false);
      return;
    }

    const id = tg.id;
    const language = tg.language_code;
    setUser({ id });

    // Получаем статус подписки и free_until
    const checkSubscription = fetch(`https://check-bot.top/api/check?user_id=${id}`)
      .then(res => res.json())
      .then(data => {
        setHasSubscription(!!data.hasSubscription);
        setFreeUntil(data.free_until ? new Date(data.free_until) : null);
        setLang(language);
      });

    // Проверка админа
    const checkAdmin = fetch(`https://check-bot.top/api/check-admin?user_id=${id}`)
      .then(res => res.json())
      .then(data => {
        setIsAdmin(data.isAdmin || false);
      });

    Promise.all([checkSubscription, checkAdmin]).finally(() => {
      setLoading(false);
    });
  }, []);

  // Таймеры для проверки подписки
  useEffect(() => {
    if (loading || !user) return;

    const checkSub = async () => {
      const res = await fetch(`https://check-bot.top/api/check?user_id=${user.id}`);
      const data = await res.json();
      setHasSubscription(!!data.hasSubscription);
      setFreeUntil(data.free_until ? new Date(data.free_until) : null);
    };

    // Очистка предыдущих таймеров
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (freeUntil && freeUntil > new Date()) {
      // free-режим: первая проверка через (freeUntil - now + 10 сек)
      const ms = freeUntil - new Date() + 10000;
      timerRef.current = setTimeout(() => {
        checkSub();
        intervalRef.current = setInterval(checkSub, 60 * 60 * 1000); // далее каждый час
      }, ms);
    } else {
      // Обычный режим: проверка каждый час
      intervalRef.current = setInterval(checkSub, 60 * 60 * 1000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [freeUntil, loading, user]);

  return { user, lang, hasSubscription, isAdmin, loading };
};

export default useTelegramUser;