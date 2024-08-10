export var MANAGER_TOKENS = import.meta.env.TG_MANAGER_TOKEN?.split(",");

export var INITIAL_SESSION = {
  messages: [],
  isAuth: false,
};

export var LINE_JOINER = "\n\n----\n\n";

export var LIMIT = 10;

export var OK = Symbol.for("OK");
export var ERROR = Symbol.for("ERROR");
