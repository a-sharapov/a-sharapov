import { type Object3D, Vector3 } from 'three';

export var MOVERS = {
  'actor-plane': 10,
  'actor-resume': 15,
  'actor-sketchbook': 15,
  'actor-tablet': 14,
  'tool-pen': 7,
  'tool-pencil': 7,
  'tool-stylus': 7,
  card: 5,
  cup: 7,
  penHolder: 5,
} as const;

export type MoverName = keyof typeof MOVERS;

export type Mover = {
  radius: number;
  position: Vector3;
  velocity: Vector3;
  speed: number;
  seen: boolean;
};

export var MOVER_NAMES = Object.keys(MOVERS) as MoverName[];

export var movers = Object.fromEntries(
  MOVER_NAMES.map((name) => [
    name,
    {
      radius: MOVERS[name],
      position: new Vector3(),
      velocity: new Vector3(),
      speed: 0,
      seen: false,
    },
  ])
) as Record<MoverName, Mover>;

var _objects = new Map<MoverName, Object3D>();
var _next = new Vector3();

var _resolve = (root: Object3D, name: MoverName) =>
  _objects.get(name) ??
  ((object) => (object && _objects.set(name, object), object))(
    root.getObjectByName(name)
  );

var _step = (mover: Mover, object: Object3D, delta: number) => (
  object.getWorldPosition(_next),
  mover.seen
    ? mover.velocity
        .subVectors(_next, mover.position)
        .divideScalar(Math.max(delta, 1e-3))
    : mover.velocity.set(0, 0, 0),
  mover.position.copy(_next),
  (mover.speed = mover.velocity.length()),
  (mover.seen = true)
);

export var trackMovers = (root: Object3D, delta: number) =>
  MOVER_NAMES.forEach(
    (name) =>
      void ((object) => object && _step(movers[name], object, delta))(
        _resolve(root, name)
      )
  );

export var resetMovers = () => (
  _objects.clear(),
  MOVER_NAMES.forEach((name) => void (movers[name].seen = false))
);
