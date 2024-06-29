import { init } from "main";
import { DICTIONARY } from "./dictionary";
import {
  _clear,
  _dockerComposeDown,
  _dockerComposeUp,
  _dockerRebuild,
  _getLastUpdates,
  _initialize,
  _reloadProxy,
  pipe,
} from "./utils";

const execute = (...fns) => void pipe(_clear, ...fns, init)();

export var CURRENT_OPS = {
  1: [DICTIONARY.UPDATE_PROJECT, () => execute(_getLastUpdates)],
  2: [DICTIONARY.INITIALIZE_CERTBOT, () => execute(_initialize)],
  3: [DICTIONARY.RELOAD_PROXY, () => execute(_reloadProxy)],
  4: [DICTIONARY.RUN_PROJECT, () => execute(_dockerComposeUp)],
  5: [DICTIONARY.STOP_PROJECT, () => execute(_dockerComposeDown)],
  6: [DICTIONARY.REBUILD_APP, () => execute(_dockerRebuild)],
  X: [DICTIONARY.EXIT, () => process.exit()],
};
