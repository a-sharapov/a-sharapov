const _PUBLIC_FOLDERS = ['i', 'css', 'js', 'images', '_astro', '.well-known'];

export var isApi = (path: string): boolean => path.startsWith('/api/');

export var likeAFile = (path: string): boolean => /\.[^./\\]+$/.test(path);

export var likePublicFolder = (path: string): boolean =>
  _PUBLIC_FOLDERS.some(($) => path.startsWith(`/${$}/`));

export var isPage = (path: string): boolean =>
  !isApi(path) && !likeAFile(path) && !likePublicFolder(path);
