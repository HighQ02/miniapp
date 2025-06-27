import t from '../i18n';

const FAQ = ({ lang }) => {
  return (
    <div style={{textAlign: "center", marginTop: 80, fontSize: 24, minHeight: "100vh"}}>
      {t("comming_soon", lang)}
    </div>
  );
};

export default FAQ;
