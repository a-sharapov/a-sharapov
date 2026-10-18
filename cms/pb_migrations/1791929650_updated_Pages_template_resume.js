/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('Pages');
    collection.fields.getByName('template').values = [
      'card',
      'contacts',
      'article',
      'resume',
    ];
    return app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('Pages');
    collection.fields.getByName('template').values = [
      'card',
      'contacts',
      'article',
    ];
    return app.save(collection);
  }
);
