import { useTranslation } from "react-i18next";
import { setAppLanguage } from "../../app/i18n";

export function LanguageSwitch() {
  const { i18n, t } = useTranslation();
  const lang = i18n.language === "en" ? "en" : "ru";

  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ color: "#94a3b8", fontSize: 13 }}>{t("common.language")}</span>
      <select
        value={lang}
        onChange={(e) => {
          void setAppLanguage(e.target.value === "en" ? "en" : "ru");
        }}
      >
        <option value="ru">Русский</option>
        <option value="en">English</option>
      </select>
    </label>
  );
}

