import LOCALES, { DEFAULT_LOCALE } from "../l18n";
export { AVAILABLE_LOCALES, DEFAULT_LOCALE, default as LOCALES } from "../l18n";

export default LOCALES[DEFAULT_LOCALE as keyof typeof LOCALES];
