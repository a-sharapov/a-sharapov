var _PUBLIC_FOLDERS = ['i', 'css', 'js', 'images', '_app', '.well-known'];

var _isApi = (path: string): boolean => path.startsWith('/api/');

var _likeAFile = (path: string): boolean => /\.[^./\\]+$/.test(path);

var _likePublicFolder = (path: string): boolean =>
  _PUBLIC_FOLDERS.some(($) => path.startsWith(`/${$}/`));

export var isPage = (path: string): boolean =>
  !_isApi(path) && !_likeAFile(path) && !_likePublicFolder(path);
