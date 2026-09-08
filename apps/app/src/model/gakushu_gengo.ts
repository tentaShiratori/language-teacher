export type GakushuGengo = "en" | "zh_hans" | "ko" | "de";

export const GAKUSHU_GENGO_ICHIRAN = [
  "en",
  "zh_hans",
  "ko",
  "de",
] as const satisfies readonly GakushuGengo[];

export const GAKUSHU_GENGO_HYOJI: Record<GakushuGengo, string> = {
  en: "英語",
  zh_hans: "中国語（簡体）",
  ko: "韓国語",
  de: "ドイツ語",
};
