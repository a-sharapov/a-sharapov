/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const email = $os.getenv('CMS_LOGIN');
    const password = $os.getenv('CMS_PASSWORD');

    const findOrNew = () => {
      try {
        return app.findAuthRecordByEmail('_superusers', email);
      } catch (_) {
        return new Record(app.findCollectionByNameOrId('_superusers'));
      }
    };

    const upsert = (record) => {
      record.set('email', email);
      record.set('password', password);
      return app.save(record);
    };

    return email && password ? upsert(findOrNew()) : null;
  },
  () => null
);
