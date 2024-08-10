import en from "./en";
import ru from "./ru";

var LOCALES = {
  ru,
  en,
};

export var DEFAULT_LOCALE = Object.keys(LOCALES)[0];
export var AVAILABLE_LOCALES = Object.keys(LOCALES);

export default LOCALES;
