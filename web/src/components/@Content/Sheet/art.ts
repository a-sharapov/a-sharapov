var _ART: Record<string, string> = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>('./art/*.svg', {
      query: '?raw',
      import: 'default',
      eager: true,
    })
  ).map(({ 0: file, 1: svg }) => [
    file.slice('./art/'.length, -'.svg'.length),
    svg.trim(),
  ])
);

export var inlineArt = (html: string) =>
  html.replace(
    /<span data-art="([\w-]+)"[^>]*><\/span>/g,
    (tag, name: string) =>
      _ART[name]?.replace(
        '<svg',
        `<svg class="art" data-art="${name}" aria-hidden="true"`
      ) ?? tag
  );
