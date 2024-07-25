export var LOCALES = {
  ru: {
    BASE_TITLE: '',
    BASE_DESCRIPTION: '',
    SHORT_ADDRESS: '',
    CITY: '',
    COUNTRY: '',
    COPYLEFT: 'Александр Шарапов &ndash; веб-разработчик полного цикла',
    FOOTER_CONTENT:
      'Любой распространитель информации, размещенной на данном ресурсе, как с изменениями, так и без них, не вправе ограничивать свободу её дальнейшего распространения либо модификации.',
    SOURCE_LINK_TITLE: 'Код проекта на GitHub',
    SOURCE_LINK_TEXT: 'a-sharapov.com',
    INDEX: 'Главная',
    CONTACTS: 'Контакты',
    CV: 'CV',
    FOLIO: 'Работы'
  }
}

export var AVAILABLE_LOCALES = Object.keys(LOCALES)

export var DEFAULT_LOCALE = AVAILABLE_LOCALES[0]
