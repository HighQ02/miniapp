import { useEffect, useState } from 'react';

const useTelegramUser = () => {
  const [user, setUser] = useState(null);
  const [lang, setLang] = useState(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tg = window.Telegram?.WebApp?.initDataUnsafe?.user;

    if (!tg) {
      setLoading(false);
      return;
    }

    const id = tg.id;
    const language = tg.language_code;
    setLang(language);
    setUser({ id });

    // 1. Проверка подписки
    const checkSubscription = fetch(`https://check-bot.top/check?user_id=${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.hasSubscription) {
          setHasSubscription(true);
        } else {
          setHasSubscription(false);
        }
      });

    // 2. Проверка админа
    const checkAdmin = fetch(`https://check-bot.top/check-admin?user_id=${id}`)
      .then(res => res.json())
      .then(data => {
        setIsAdmin(data.isAdmin || false);
      });

    // Ждем оба запроса
    Promise.all([checkSubscription, checkAdmin]).finally(() => {
      setLoading(false);
    });
  }, []);

  return { user, lang, hasSubscription, isAdmin, loading };
};

export default useTelegramUser;
