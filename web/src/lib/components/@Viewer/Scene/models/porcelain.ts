import {
  BackSide,
  BoxGeometry,
  Color,
  Mesh,
  MeshBasicMaterial,
  type Object3D,
  PlaneGeometry,
  Scene,
  type Texture,
  Vector3,
} from 'three';
import {
  cameraPosition,
  color,
  dot,
  float,
  length,
  max,
  mix,
  normalize,
  normalWorld,
  pmremTexture,
  positionLocal,
  positionWorld,
  pow,
  reflectVector,
  smoothstep,
  uniform,
  vec2,
} from 'three/tsl';
import {
  MeshPhysicalNodeMaterial,
  type Node,
  PMREMGenerator,
  type WebGPURenderer,
} from 'three/webgpu';
import type { XYZ } from '#lib/common/types.ts';

export var GLAZE = {
  color: '#e7e5e1',
  roughness: 0.42,
  clearcoat: 0.5,
  gloss: 0.07,
  f0: 0.04,
  ior: 1.5,
  specularIntensity: 0.35,
  biscuit: { color: '#ebe6de', roughness: 0.88 },
  translucency: {
    tint: '#ffd8b4',
    distortion: 0.28,
    power: 5,
    scale: 0.025,
  },
};

export var STUDIO = {
  distance: 22,
  room: 60,
  day: {
    walls: 0.8,
    floor: 0.75,
    windows: [
      { size: [8, 11], glow: 16, bars: true },
      { size: [7, 9], glow: 6, bars: false },
      { size: [15, 15], glow: 5, bars: false },
    ],
  },
  night: {
    walls: 0.6,
    floor: 0.45,
    window: { color: '#6f86c4', glow: 2.2 },
    lamp: { color: '#ffbb80', glow: 9, radius: 1.2 },
  },
};

type Zones = {
  foot: Node<'float'>;
  thin: Node<'float'>;
};

type Shared = ReturnType<typeof createPorcelainLight>;

export var createPorcelainLight = () => ({
  lampPosition: uniform(new Vector3()),
  lampDirection: uniform(new Vector3(0, -1, 0)),
  lampCone: uniform(Math.cos(0.9)),
  lampColor: uniform(new Color(0, 0, 0)),
  night: uniform(0),
  glaze: uniform(1),
});

var _translucency = (shared: Shared, thin: Node<'float'>): Node<'vec3'> =>
  ((toLamp) =>
    ((distanceToLamp, fromLamp) =>
      (color(GLAZE.translucency.tint) as unknown as Node<'vec3'>)
        .mul(shared.lampColor as unknown as Node<'vec3'>)
        .mul(
          pow(
            max(
              dot(
                normalize(cameraPosition.sub(positionWorld)),
                normalize(
                  fromLamp.add(normalWorld.mul(GLAZE.translucency.distortion))
                )
              ),
              1e-4
            ),
            GLAZE.translucency.power
          )
        )
        .mul(
          smoothstep(
            shared.lampCone,
            float(1),
            dot(fromLamp, shared.lampDirection)
          )
        )
        .mul(thin)
        .mul(GLAZE.translucency.scale)
        .div(max(distanceToLamp.mul(distanceToLamp), 1)))(
      length(toLamp),
      normalize(toLamp).negate()
    ))(shared.lampPosition.sub(positionWorld));

var _glaze = (
  shared: Shared,
  studios: { day: Texture; night: Texture },
  foot: Node<'float'>
): Node<'vec3'> =>
  mix(
    pmremTexture(studios.day, reflectVector, float(GLAZE.gloss)),
    pmremTexture(studios.night, reflectVector, float(GLAZE.gloss)),
    shared.night
  )
    .mul(
      float(GLAZE.f0).add(
        float(1 - GLAZE.f0).mul(
          pow(
            max(
              dot(normalWorld, normalize(cameraPosition.sub(positionWorld)))
                .oneMinus()
                .clamp(),
              1e-4
            ),
            5
          )
        )
      )
    )
    .mul(shared.glaze)
    .mul(foot.oneMinus());

export var createPorcelain = (
  shared: Shared,
  zones: Zones,
  studios: { day: Texture; night: Texture }
) =>
  Object.assign(
    new MeshPhysicalNodeMaterial({
      name: 'porcelain',
      roughness: GLAZE.roughness,
      clearcoat: GLAZE.clearcoat,
      clearcoatRoughness: GLAZE.gloss,
      ior: GLAZE.ior,
      specularIntensity: GLAZE.specularIntensity,
    }),
    {
      colorNode: mix(
        color(GLAZE.color),
        color(GLAZE.biscuit.color),
        zones.foot
      ),
      roughnessNode: mix(
        float(GLAZE.roughness),
        float(GLAZE.biscuit.roughness),
        zones.foot
      ),
      clearcoatNode: zones.foot.oneMinus().mul(GLAZE.clearcoat),
      emissiveNode: _glaze(shared, studios, zones.foot).add(
        _translucency(shared, zones.thin)
      ),
    }
  );

var _radius = () => length(vec2(positionLocal.x, positionLocal.z));

export var CUP_ZONES = (): Zones => ({
  foot: smoothstep(0.34, 0.42, positionLocal.y).oneMinus(),
  thin: smoothstep(0.9, 2.4, positionLocal.y)
    .mul(0.55)
    .add(smoothstep(5.3, 6.3, positionLocal.y).mul(0.45)),
});

export var SAUCER_ZONES = (): Zones => ({
  foot: smoothstep(0.02, 0.08, positionLocal.y)
    .oneMinus()
    .mul(smoothstep(2.4, 2.7, _radius()))
    .mul(smoothstep(3.0, 3.2, _radius()).oneMinus()),
  thin: smoothstep(4.3, 5.4, _radius()).mul(0.8).add(0.15),
});

export var HANDLE_ZONES = (): Zones => ({ foot: float(0), thin: float(0.7) });

var _placed = (mesh: Mesh, at: Vector3) => (mesh.position.copy(at), mesh);

var _emitter = (
  geometry: PlaneGeometry,
  glow: number,
  tint: Color,
  at: Vector3
) =>
  ((mesh) => (mesh.lookAt(0, 0, 0), mesh))(
    _placed(
      new Mesh(
        geometry,
        new MeshBasicMaterial({ color: tint.clone().multiplyScalar(glow) })
      ),
      at
    )
  );

var _bars = (window: Mesh, size: [number, number]) =>
  [
    [size[0] * 0.04, size[1], 0, 0],
    [size[0], size[1] * 0.035, 0, size[1] * 0.12],
  ].forEach(
    ({ 0: width, 1: height, 2: x, 3: y }) =>
      void window.add(
        _placed(
          new Mesh(
            new PlaneGeometry(width!, height!),
            new MeshBasicMaterial({ color: '#2a2a2a' })
          ),
          new Vector3(x, y, 0.05)
        )
      )
  );

var _room = (walls: number, floor: number, tint: Color) =>
  ((scene) => (
    scene.add(
      new Mesh(
        new BoxGeometry(STUDIO.room, STUDIO.room, STUDIO.room),
        new MeshBasicMaterial({
          color: tint.clone().multiplyScalar(walls),
          side: BackSide,
        })
      ),
      _placed(
        new Mesh(
          new PlaneGeometry(STUDIO.room, STUDIO.room),
          new MeshBasicMaterial({
            color: tint.clone().multiplyScalar(floor),
          })
        ),
        new Vector3(0, -0.05, 0)
      ).rotateX(-Math.PI / 2)
    ),
    scene
  ))(new Scene());

var _toward = (position: XYZ) =>
  new Vector3(...position).normalize().multiplyScalar(STUDIO.distance);

var _dispose = (root: Object3D) =>
  root.traverse(
    (object) =>
      void (
        (object as Mesh).isMesh &&
        ((object as Mesh).geometry.dispose(),
        ((object as Mesh).material as MeshBasicMaterial).dispose())
      )
  );

export var bakeStudios = (
  renderer: WebGPURenderer,
  windows: XYZ[],
  lamp: XYZ
): { day: Texture; night: Texture; dispose: () => void } =>
  ((pmrem, white) =>
    ((day, night) =>
      ((dayTarget, nightTarget) => (
        _dispose(day),
        _dispose(night),
        pmrem.dispose(),
        {
          day: dayTarget.texture,
          night: nightTarget.texture,
          dispose: () => void (dayTarget.dispose(), nightTarget.dispose()),
        }
      ))(pmrem.fromScene(day, 0.015), pmrem.fromScene(night, 0.015)))(
      ((scene) => (
        STUDIO.day.windows.forEach(
          (window, i) =>
            void ((mesh) => (
              window.bars && _bars(mesh, window.size as [number, number]),
              scene.add(mesh)
            ))(
              _emitter(
                new PlaneGeometry(window.size[0], window.size[1]),
                window.glow,
                white,
                _toward(windows[i]!)
              )
            )
        ),
        scene
      ))(_room(STUDIO.day.walls, STUDIO.day.floor, white)),
      ((scene) => (
        windows.forEach(
          (position, i) =>
            void scene.add(
              _emitter(
                new PlaneGeometry(
                  STUDIO.day.windows[i]!.size[0],
                  STUDIO.day.windows[i]!.size[1]
                ),
                STUDIO.night.window.glow,
                new Color(STUDIO.night.window.color),
                _toward(position)
              )
            )
        ),
        scene.add(
          _emitter(
            new PlaneGeometry(
              STUDIO.night.lamp.radius,
              STUDIO.night.lamp.radius
            ),
            STUDIO.night.lamp.glow,
            new Color(STUDIO.night.lamp.color),
            _toward(lamp)
          )
        ),
        scene
      ))(_room(STUDIO.night.walls, STUDIO.night.floor, new Color('#d2d5dc')))
    ))(new PMREMGenerator(renderer), new Color(1, 1, 1));

export type Studios = ReturnType<typeof bakeStudios>;

export var GLAZE_LEVEL = { day: 0.08, night: 0.2 };

export var glazeLevel = (night: number) =>
  GLAZE_LEVEL.day + (GLAZE_LEVEL.night - GLAZE_LEVEL.day) * night;
