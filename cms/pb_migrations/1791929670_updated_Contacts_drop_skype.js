/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    app
      .findRecordsByFilter('Contacts', "kind = 'skype'", '', 0, 0)
      .forEach((record) => void app.delete(record));
    const collection = app.findCollectionByNameOrId('Contacts');
    collection.fields.getByName('kind').values = [
      'phone',
      'telegram',
      'email',
      'linkedin',
      'github',
    ];
    return app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('Contacts');
    collection.fields.getByName('kind').values = [
      'phone',
      'telegram',
      'skype',
      'email',
      'linkedin',
      'github',
    ];
    return app.save(collection);
  }
);
