/// <reference path="../pb_data/types.d.ts" />

cronAdd('inquiries-retention', '17 3 * * *', () => {
  const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .replace('T', ' ');
  $app
    .findRecordsByFilter('Inquiries', 'created < {:cutoff}', '', 0, 0, {
      cutoff,
    })
    .forEach((record) => void $app.delete(record));
});
