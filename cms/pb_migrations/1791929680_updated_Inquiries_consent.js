/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('Inquiries');
    collection.fields.add(new BoolField({ name: 'consent', required: true }));
    return app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('Inquiries');
    collection.fields.removeByName('consent');
    return app.save(collection);
  }
);
