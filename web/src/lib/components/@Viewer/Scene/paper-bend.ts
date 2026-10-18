import { Matrix3, Matrix4, Vector2 } from 'three';
import {
  clamp as clampNode,
  Fn,
  float,
  max,
  normalLocal,
  positionLocal,
  uniform,
  vec3,
  vec4,
} from 'three/tsl';
import type { Node } from 'three/webgpu';

export { sliceGeometry } from './paper-slice';

type F = Node<'float'>;
type V3 = Node<'vec3'>;

export type Spring = { value: number; velocity: number };

export var spring = (): Spring => ({ value: 0, velocity: 0 });

var _SUBSTEP = 1 / 240;

export var stepSpring = (
  state: Spring,
  delta: number,
  target: number,
  frequency: number,
  damping: number
) =>
  ((omega, steps) =>
    Array.from({ length: steps }).forEach(
      () =>
        void ((state.velocity +=
          (omega * omega * (target - state.value) -
            2 * damping * omega * state.velocity) *
          (delta / steps)),
        (state.value += state.velocity * (delta / steps)))
    ))(2 * Math.PI * frequency, Math.max(1, Math.ceil(delta / _SUBSTEP)));

export var bounce = (
  state: Spring,
  low: number,
  high: number,
  restitution: number
) =>
  state.value < low
    ? ((state.value = low),
      (state.velocity = Math.abs(state.velocity) * restitution))
    : state.value > high &&
      ((state.value = high),
      (state.velocity = -Math.abs(state.velocity) * restitution));

export var settle = (state: Spring, target: number, epsilon = 3e-3) =>
  target === 0 &&
  Math.abs(state.value) < epsilon &&
  Math.abs(state.velocity) < epsilon * 10 &&
  ((state.value = 0), (state.velocity = 0), true);

export var smooth = (from: number, to: number, x: number) =>
  ((t) => t * t * (3 - 2 * t))(
    Math.min(1, Math.max(0, (x - from) / (to - from)))
  );

export var SAG = {
  droop: 0.34,
  frequency: 2.6,
  damping: 0.45,
  limit: 1.4,
  gravity: 700,
  lift: [0.04, 0.9] as [number, number],
  curl: 0.14,
  curlSpeed: [8, 50] as [number, number],
  curlFrequency: 1.8,
  curlDamping: 0.6,
  restitution: 0.45,
  accel: 0.06,
  touch: 0.002,
  kick: 3.6,
  memory: 0.25,
};

export type Sag = {
  droop: Spring;
  curl: Spring;
  lead: Vector2;
  height: number;
  pressed: number;
  y: number;
  vy: number;
  ay: number;
  seen: boolean;
  active: boolean;
};

export var createSag = (): Sag => ({
  droop: spring(),
  curl: spring(),
  lead: new Vector2(0, -1),
  height: 0,
  pressed: 0,
  y: 0,
  vy: 0,
  ay: 0,
  seen: false,
  active: false,
});

export var stepSag = (
  sag: Sag,
  delta: number,
  y: number,
  height: number,
  lead: Vector2,
  speed: number
) =>
  ((dt) =>
    ((vy) =>
      ((airborne) => (
        (sag.ay = sag.seen
          ? sag.ay + ((vy - sag.vy) / dt - sag.ay) * Math.min(1, dt / SAG.accel)
          : 0),
        (sag.vy = vy),
        (sag.y = y),
        (sag.seen = true),
        stepSpring(
          sag.droop,
          dt,
          SAG.droop *
            airborne *
            Math.min(2, Math.max(0, 1 + sag.ay / SAG.gravity)),
          SAG.frequency,
          SAG.damping
        ),
        ((ceiling) =>
          (sag.pressed = Math.max(
            sag.pressed * Math.exp(-dt / SAG.memory),
            sag.droop.value > ceiling ? sag.droop.value : 0
          )))(Math.min(Math.max(0, height), SAG.droop * SAG.limit)),
        sag.height > SAG.touch &&
          height <= SAG.touch &&
          ((sag.droop.value = Math.min(sag.droop.value, 0)),
          (sag.droop.velocity =
            -SAG.kick * Math.min(1, sag.pressed / SAG.droop)),
          (sag.pressed = 0)),
        (sag.height = height),
        bounce(
          sag.droop,
          -SAG.droop,
          Math.min(Math.max(0, height), SAG.droop * SAG.limit),
          SAG.restitution
        ),
        stepSpring(
          sag.curl,
          dt,
          SAG.curl *
            airborne *
            smooth(SAG.curlSpeed[0], SAG.curlSpeed[1], speed),
          SAG.curlFrequency,
          SAG.curlDamping
        ),
        speed > SAG.curlSpeed[0] &&
          sag.lead.lerp(lead, Math.min(1, dt * 6)).normalize(),
        (sag.active = !(
          airborne === 0 &&
          settle(sag.droop, 0) &&
          settle(sag.curl, 0)
        ))
      ))(smooth(SAG.lift[0], SAG.lift[1], height)))(
      sag.seen ? (y - sag.y) / dt : 0
    ))(Math.min(Math.max(delta, 1e-4), 0.05));

export var FLEX = {
  reach: 15,
  frequency: 3.4,
  damping: 0.3,
  inertia: 0.0032,
  drag: 0.0022,
  restitution: 0.4,
  fanFrequency: 2.2,
  fanDamping: 0.28,
  fanInertia: 0.0045,
  fanDrag: 0.0055,
  fan: 0.32,
  accel: 0.05,
};

export type Flex = {
  bend: Spring;
  fan: Spring;
  angle: number;
  omega: number;
  alpha: number;
  seen: boolean;
  active: boolean;
};

export var createFlex = (): Flex => ({
  bend: spring(),
  fan: spring(),
  angle: 0,
  omega: 0,
  alpha: 0,
  seen: false,
  active: false,
});

export var stepFlex = (flex: Flex, delta: number, angle: number) =>
  ((dt) =>
    ((omega) => (
      (flex.alpha = flex.seen
        ? flex.alpha +
          ((omega - flex.omega) / dt - flex.alpha) *
            Math.min(1, dt / FLEX.accel)
        : 0),
      (flex.omega = omega),
      (flex.angle = angle),
      (flex.seen = true),
      ((low, high) => (
        stepSpring(
          flex.bend,
          dt,
          Math.min(
            high,
            Math.max(
              low,
              -FLEX.inertia * flex.alpha - FLEX.drag * omega * Math.abs(omega)
            )
          ),
          FLEX.frequency,
          FLEX.damping
        ),
        bounce(flex.bend, low, high, FLEX.restitution),
        stepSpring(
          flex.fan,
          dt,
          Math.min(
            FLEX.fan,
            Math.max(
              0,
              -FLEX.fanInertia * flex.alpha -
                FLEX.fanDrag * omega * Math.abs(omega)
            )
          ),
          FLEX.fanFrequency,
          FLEX.fanDamping
        ),
        bounce(
          flex.fan,
          0,
          Math.min(FLEX.fan, Math.max(0, high - flex.bend.value)),
          0.3
        )
      ))(-angle * FLEX.reach, (Math.PI - angle) * FLEX.reach),
      (flex.active = !(
        omega === 0 &&
        settle(flex.bend, 0) &&
        settle(flex.fan, 0)
      ))
    ))(flex.seen ? (angle - flex.angle) / dt : 0))(
    Math.min(Math.max(delta, 1e-4), 0.05)
  );

export var createSagUniforms = () => ({
  droop: uniform(0),
  curl: uniform(0),
  lead: uniform(new Vector2(0, -1)),
  reach: uniform(1),
});

export type SagUniforms = ReturnType<typeof createSagUniforms>;

var _bent = (position: V3, normal: V3, lift: F, gradient: V3) => (
  normalLocal.assign(
    vec3(
      normal.x.sub(gradient.x.mul(normal.y)),
      normal.y,
      normal.z.sub(gradient.z.mul(normal.y))
    ).normalize()
  ),
  vec3(position.x, position.y.add(lift), position.z)
);

export var sagNode = (uniforms: SagUniforms, half: number) =>
  Fn(() => {
    const position = positionLocal.toVar();
    const normal = normalLocal.toVar();
    const along = position.z.div(half);
    const lead = max(
      position.x
        .mul(uniforms.lead.x)
        .add(position.z.mul(uniforms.lead.y))
        .div(uniforms.reach),
      0
    );
    const slope = uniforms.curl.mul(lead.mul(2)).div(uniforms.reach);
    return _bent(
      position,
      normal,
      uniforms.droop
        .negate()
        .mul(along.mul(along))
        .add(uniforms.curl.mul(lead.mul(lead))),
      vec3(
        slope.mul(uniforms.lead.x),
        0,
        uniforms.droop
          .negate()
          .mul(along.mul(2))
          .div(half)
          .add(slope.mul(uniforms.lead.y))
      )
    );
  })();

export var createFlexUniforms = () => ({
  bend: uniform(0),
  fan: uniform(0),
});

export type FlexUniforms = ReturnType<typeof createFlexUniforms>;

export type FlexPart =
  | { kind: 'rigid' }
  | { kind: 'fan'; base: number; top: number }
  | { kind: 'page' };

var _flexed = (
  uniforms: FlexUniforms,
  part: FlexPart,
  position: V3,
  normal: V3
) =>
  ((x: F, weight: F) =>
    ((amount: F) =>
      ((gradient: V3) => [
        vec3(position.x, position.y.add(amount.mul(x.mul(x))), position.z),
        ((g: V3) =>
          vec3(
            normal.x.sub(g.x.mul(normal.y).div(g.y.add(1))),
            normal.y.div(g.y.add(1)),
            normal.z
          ).normalize())(gradient),
      ])(
        vec3(
          amount.mul(x.mul(2)).div(FLEX.reach),
          part.kind === 'fan'
            ? uniforms.fan.mul(x.mul(x)).div(part.top - part.base)
            : 0,
          0
        )
      ))(uniforms.bend.add(uniforms.fan.mul(weight))))(
    max(position.x, 0).div(FLEX.reach),
    part.kind === 'page'
      ? float(1)
      : part.kind === 'fan'
        ? clampNode(position.y.sub(part.base).div(part.top - part.base), 0, 1)
        : float(0)
  );

export var flexNode = (uniforms: FlexUniforms, part: FlexPart) =>
  Fn(() =>
    ((position: V3, normal: V3) =>
      (({ 0: bent, 1: turned }) => (normalLocal.assign(turned), bent))(
        _flexed(uniforms, part, position, normal)
      ))(positionLocal.toVar(), normalLocal.toVar())
  )();

export var createFrameUniforms = () => ({
  toFrame: uniform(new Matrix4()),
  fromFrame: uniform(new Matrix4()),
  normalTo: uniform(new Matrix3()),
  normalFrom: uniform(new Matrix3()),
});

export type FrameUniforms = ReturnType<typeof createFrameUniforms>;

export var flexInFrameNode = (uniforms: FlexUniforms, frame: FrameUniforms) =>
  Fn(() =>
    ((position: V3, normal: V3) =>
      (({ 0: bent, 1: turned }) => (
        normalLocal.assign(frame.normalFrom.mul(turned).normalize()),
        frame.fromFrame.mul(vec4(bent, 1)).xyz
      ))(_flexed(uniforms, { kind: 'rigid' }, position, normal)))(
      frame.toFrame.mul(vec4(positionLocal, 1)).xyz.toVar(),
      frame.normalTo.mul(normalLocal).normalize().toVar()
    )
  )();

export var setFrame = (frame: FrameUniforms, matrix: Matrix4) => (
  frame.toFrame.value.copy(matrix),
  frame.fromFrame.value.copy(matrix).invert(),
  frame.normalTo.value.getNormalMatrix(matrix),
  frame.normalFrom.value.setFromMatrix4(matrix).transpose()
);
