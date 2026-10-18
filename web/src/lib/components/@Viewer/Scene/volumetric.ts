import {
  type Camera,
  Color,
  DepthTexture,
  type DirectionalLight,
  NearestFilter,
  type Object3D,
  type SpotLight,
  Vector3,
} from 'three';
import {
  dot,
  exp,
  Fn,
  float,
  frameId,
  getViewPosition,
  interleavedGradientNoise,
  Loop,
  length,
  lightShadowMatrix,
  max,
  normalize,
  pow,
  screenCoordinate,
  screenUV,
  select,
  smoothstep,
  step,
  texture,
  uniform,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import type { Node } from 'three/webgpu';
import { onFrame } from './layout';

export var VOLUME = {
  steps: 20,
  far: 170,
  height: 12,
  near: [20, 45] as [number, number],
  center: onFrame(0, 4),
  radius: [110, 220] as [number, number],
  panes: Array.from({ length: 7 }, (_, i): [number, number] => [
    0.3 + i * 0.066,
    0.3 + i * 0.066 + 0.034,
  ]),
  paneSoft: 0.008,
  paneWidth: [0.2, 0.8] as [number, number],
  bias: 0.002,
  sunPhase: 0.2,
  lampPhase: 0.55,
  cone: [0.62, 0.42] as [number, number],
};

export var WINDOW_LIGHT = 'keyWindow';

export var LAMP_LIGHT = 'lampSpot';

var _placeholder = () =>
  Object.assign(new DepthTexture(1, 1), {
    compareFunction: null,
    minFilter: NearestFilter,
    magFilter: NearestFilter,
  });

var _band = (from: number, to: number, x: Node<'float'>): Node<'float'> =>
  smoothstep(from - VOLUME.paneSoft, from + VOLUME.paneSoft, x).mul(
    smoothstep(to + VOLUME.paneSoft, to - VOLUME.paneSoft, x)
  );

var _panes = (uv: Node<'vec2'>): Node<'float'> =>
  VOLUME.panes
    .reduce<Node<'float'>>(
      (sum, { 0: from, 1: to }) => sum.add(_band(from, to, uv.y)),
      float(0)
    )
    .mul(_band(VOLUME.paneWidth[0], VOLUME.paneWidth[1], uv.x));

var _henyeyGreenstein = (cosine: Node<'float'>, g: number): Node<'float'> =>
  float((1 - g * g) / (4 * Math.PI)).div(
    pow(max(float(1 + g * g).sub(cosine.mul(2 * g)), 1e-4), 1.5)
  );

type Lights = { window?: DirectionalLight; lamp?: SpotLight };

export var createVolumetrics = (
  root: Object3D,
  gobo: (uv: Node<'vec2'>) => Node<'float'>
) => {
  const lights: Lights = {};
  const windowDepth = texture(_placeholder());
  const lampDepth = texture(_placeholder());
  const u = {
    sun: uniform(new Color(0, 0, 0)),
    lamp: uniform(new Color(0, 0, 0)),
    toSun: uniform(new Vector3(0, 1, 0)),
    lampPosition: uniform(new Vector3()),
    lampDirection: uniform(new Vector3(0, -1, 0)),
    camera: uniform(new Vector3()),
    shafts: uniform(0),
    beam: uniform(0),
  };
  const _target = new Vector3();
  const _position = new Vector3();

  const _resolve = () =>
    void ((lights.window ??= root.getObjectByName(WINDOW_LIGHT) as
      | DirectionalLight
      | undefined),
    (lights.lamp ??= root.getObjectByName(LAMP_LIGHT) as
      | SpotLight
      | undefined));

  const _depth = (light: Object3D | undefined) =>
    (light as DirectionalLight | undefined)?.shadow?.map?.depthTexture ?? null;

  const update = (camera: Camera, shafts: number, beam: number) => (
    _resolve(),
    camera.getWorldPosition(u.camera.value),
    (u.shafts.value = shafts),
    (u.beam.value = beam),
    ((window) =>
      void (
        window &&
        (u.sun.value.copy(window.color).multiplyScalar(window.intensity),
        u.toSun.value
          .copy(window.getWorldPosition(_position))
          .sub(window.target.getWorldPosition(_target))
          .normalize(),
        _depth(window) &&
          windowDepth.value !== _depth(window) &&
          (windowDepth.value = _depth(window)!))
      ))(lights.window),
    ((lamp) =>
      void (
        lamp &&
        (u.lamp.value.copy(lamp.color).multiplyScalar(lamp.intensity),
        u.lampPosition.value.copy(lamp.getWorldPosition(_position)),
        u.lampDirection.value
          .copy(lamp.target.getWorldPosition(_target))
          .sub(_position)
          .normalize(),
        _depth(lamp) &&
          lampDepth.value !== _depth(lamp) &&
          (lampDepth.value = _depth(lamp)!))
      ))(lights.lamp)
  );

  const _shadowUv = (light: Object3D, point: Node<'vec3'>) =>
    ((projected) =>
      vec3(
        projected.x.div(projected.w),
        projected.y.div(projected.w).oneMinus(),
        projected.z.div(projected.w)
      ))(lightShadowMatrix(light as never).mul(vec4(point, 1)));

  const _visible = (
    depth: ReturnType<typeof texture>,
    coord: Node<'vec3'>
  ): Node<'float'> =>
    select(
      coord.x
        .greaterThan(0)
        .and(coord.x.lessThan(1))
        .and(coord.y.greaterThan(0))
        .and(coord.y.lessThan(1))
        .and(coord.z.lessThan(1)),
      step(
        coord.z.sub(VOLUME.bias),
        (depth.sample(coord.xy) as unknown as Node<'vec4'>).x
      ),
      float(1)
    );

  const _haze = (point: Node<'vec3'>, along: Node<'float'>): Node<'float'> =>
    exp(max(point.y, 0).div(-VOLUME.height))
      .mul(
        smoothstep(
          VOLUME.radius[1],
          VOLUME.radius[0],
          length(point.xz.sub(vec2(VOLUME.center[0], VOLUME.center[2])))
        )
      )
      .mul(smoothstep(VOLUME.near[0], VOLUME.near[1], along));

  const node = (
    sceneDepth: ReturnType<typeof texture>,
    camera: Camera
  ): Node<'vec3'> =>
    Fn(() => {
      const projectionInverse = uniform(camera.projectionMatrixInverse);
      const world = uniform(camera.matrixWorld);
      const raw = (sceneDepth.sample(screenUV) as unknown as Node<'vec4'>).x;
      const view = getViewPosition(screenUV, raw, projectionInverse);
      const surface = world.mul(vec4(view, 1)).xyz;
      const toSurface = surface.sub(u.camera);
      const direction = normalize(toSurface);
      const span = select(
        raw.greaterThanEqual(0.9999),
        float(VOLUME.far),
        length(toSurface).min(VOLUME.far)
      );
      const jitter = interleavedGradientNoise(
        screenCoordinate.xy.add(vec2(float(frameId).mul(5.588), 0))
      );
      const sunPhase = _henyeyGreenstein(
        dot(u.toSun, direction),
        VOLUME.sunPhase
      );
      const sun = float(0).toVar();
      const lamp = vec3(0).toVar();
      Loop(VOLUME.steps, ({ i }) => {
        const along = span.mul(float(i).add(jitter).div(VOLUME.steps));
        const point = u.camera.add(direction.mul(along));
        const haze = _haze(point, along);
        void (
          lights.window &&
          ((coord) =>
            sun.addAssign(
              _visible(windowDepth, coord)
                .mul(gobo(coord.xy))
                .mul(_panes(coord.xy))
                .mul(haze)
            ))(_shadowUv(lights.window, point))
        );
        void (
          lights.lamp &&
          ((toLamp) =>
            ((distanceToLamp, from) =>
              lamp.addAssign(
                vec3(
                  _visible(lampDepth, _shadowUv(lights.lamp!, point))
                    .mul(
                      smoothstep(
                        Math.cos(VOLUME.cone[0]),
                        Math.cos(VOLUME.cone[1]),
                        dot(from, u.lampDirection)
                      )
                    )
                    .mul(
                      _henyeyGreenstein(
                        dot(from, direction.negate()),
                        VOLUME.lampPhase
                      )
                    )
                    .div(max(distanceToLamp.mul(distanceToLamp), 4))
                    .mul(haze)
                )
              ))(length(toLamp), normalize(toLamp).negate()))(
            u.lampPosition.sub(point)
          )
        );
      });
      const stride = span.div(VOLUME.steps);
      return u.sun
        .mul(sun.mul(sunPhase).mul(stride).mul(u.shafts))
        .add(lamp.mul(stride).mul(u.beam).mul(u.lamp));
    })();

  return {
    node,
    update,
    resolve: _resolve,
    lights,
    depths: { window: windowDepth, lamp: lampDepth },
  };
};
