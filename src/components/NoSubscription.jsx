import t from "../i18n";

const NoSubscription = ({ lang }) => {
  return (
    <div style={{textAlign: "center", marginTop: 80, fontSize: 24}}>
      {t("no_subscription", lang)}
    </div>
  );
}

export default NoSubscription;