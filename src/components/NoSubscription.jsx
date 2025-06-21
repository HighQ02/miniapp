import useTelegramUser from "../hooks/useTelegramUser";
import t from "../i18n";

export default function NoSubscription() {
  const { lang } = useTelegramUser();
  return (
    <div style={{textAlign: "center", marginTop: 80, fontSize: 24}}>
      {t("no_subscription", lang)}
    </div>
  );
}