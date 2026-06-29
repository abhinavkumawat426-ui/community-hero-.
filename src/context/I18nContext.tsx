import React, { createContext, useContext, useState, ReactNode } from "react";

export type Language = "en" | "es" | "tl";

export interface Translations {
  [key: string]: {
    [lang in Language]: string;
  };
}

export const translations: Translations = {
  appName: {
    en: "Citizen Hero Hub",
    es: "Héroe Ciudadano",
    tl: "Bayanihang Hub",
  },
  appSub: {
    en: "Oakridge Local Coordination & Telemetry",
    es: "Coordinación Local y Telemetría de Oakridge",
    tl: "Lokal na Koordinasyon at Telemetry ng Oakridge",
  },
  activeLogs: {
    en: "Citizen Logs Live",
    es: "Registros en Vivo",
    tl: "Mga Live na Ulat",
  },
  mapView: {
    en: "Map View",
    es: "Vista de Mapa",
    tl: "Tingnan sa Mapa",
  },
  verifyQueue: {
    en: "Verify Queue",
    es: "Cola de Verificación",
    tl: "Pila ng Pagpapatunay",
  },
  insightsAnalytics: {
    en: "Insights & Analytics",
    es: "Análisis e Informes",
    tl: "Mga Insight at Analytics",
  },
  leaderboard: {
    en: "Leaderboard",
    es: "Tabla de Clasificación",
    tl: "Leaderboard ng Bayani",
  },
  prioritizeTab: {
    en: "AI Issue Prioritizer",
    es: "Priorizador de IA",
    tl: "Prioritizer ng AI",
  },
  reportIssue: {
    en: "Report Issue",
    es: "Reportar Problema",
    tl: "Mag-ulat ng Problema",
  },
  cancel: {
    en: "Cancel",
    es: "Cancelar",
    tl: "Kanselahin",
  },
  headline: {
    en: "Problem Headline",
    es: "Título del Problema",
    tl: "Pamagat ng Problema",
  },
  category: {
    en: "Category",
    es: "Categoría",
    tl: "Kategorya",
  },
  urgency: {
    en: "Urgency",
    es: "Urgencia",
    tl: "Urgensya",
  },
  description: {
    en: "Description",
    es: "Descripción",
    tl: "Paglalarawan",
  },
  address: {
    en: "Location Address",
    es: "Dirección de Ubicación",
    tl: "Address ng Lokasyon",
  },
  images: {
    en: "Attach Images",
    es: "Adjuntar Imágenes",
    tl: "Mag-attach ng Larawan",
  },
  voiceMemo: {
    en: "Voice Memo",
    es: "Nota de Voz",
    tl: "Voice Memo",
  },
  submitReport: {
    en: "Submit Citizen Report",
    es: "Enviar Reporte de Ciudadano",
    tl: "Isumite ang Ulat",
  },
  verifyButton: {
    en: "Upvote & Verify",
    es: "Votar y Verificar",
    tl: "I-verify at I-upvote",
  },
  officialAction: {
    en: "Official Response",
    es: "Respuesta Oficial",
    tl: "Opisyal na Tugon",
  },
  resolved: {
    en: "Resolved",
    es: "Resuelto",
    tl: "Nalutas Na",
  },
  reported: {
    en: "Reported",
    es: "Reportado",
    tl: "Inulat Na",
  },
  verified: {
    en: "Verified",
    es: "Verificado",
    tl: "Na-verify Na",
  },
  assigned: {
    en: "Assigned",
    es: "Asignado",
    tl: "Itinalaga Na",
  },
  in_progress: {
    en: "In Progress",
    es: "En Progreso",
    tl: "Kasalukuyang Ginagawa",
  },
  exportCsv: {
    en: "Export CSV",
    es: "Exportar CSV",
    tl: "I-export ang CSV",
  },
  toggleHeatmap: {
    en: "🔥 Heatmap Layer",
    es: "🔥 Capa de Calor",
    tl: "🔥 Mapa ng Densidad",
  },
  points: {
    en: "XP Points",
    es: "Puntos XP",
    tl: "Mga Puntos na XP",
  },
  registeredAs: {
    en: "Registered as",
    es: "Registrado como",
    tl: "Nakarehistro bilang",
  },
  logout: {
    en: "Logout / Switch ID",
    es: "Cerrar Sesión",
    tl: "Mag-logout",
  }
};

interface I18nContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  const t = (key: string): string => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
