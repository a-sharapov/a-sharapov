/// <reference path="../pb_data/types.d.ts" />
migrate((app) =>
  ['Pages', 'i18n'].forEach(
    (collection) =>
      void app
        .findRecordsByFilter(collection, "locale = 'en'", '', 0, 0)
        .forEach((record) => void app.delete(record))
  )
);
