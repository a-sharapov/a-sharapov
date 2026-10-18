/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    app
      .findRecordsByFilter('Pages', "slug = 'portfolio'", '', 0, 0)
      .forEach((record) => void app.delete(record));
    app
      .findAllRecords('i18n')
      .map((record) => ({
        record,
        content: JSON.parse(record.getString('content') || '{}'),
      }))
      .filter(({ content }) => content && 'portfolio' in content)
      .forEach(({ record, content }) => {
        delete content.portfolio;
        record.set('content', content);
        app.save(record);
      });
    const collection = app.findCollectionByNameOrId('Pages');
    collection.fields.getByName('template').values = [
      'card',
      'contacts',
      'article',
      'resume',
      'services',
    ];
    return app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('Pages');
    collection.fields.getByName('template').values = [
      'card',
      'contacts',
      'article',
      'resume',
      'services',
      'portfolio',
    ];
    return app.save(collection);
  }
);
