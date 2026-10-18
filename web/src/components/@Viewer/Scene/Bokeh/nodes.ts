import { Color, type InstancedBufferAttribute, type Vector3 } from 'three';
import {
  abs,
  clamp,
  cos,
  cross,
  exp,
  Fn,
  float,
  If,
  instancedBufferAttribute,
  Loop,
  length,
  max,
  min,
  mix,
  normalize,
  positionGeometry,
  positionView,
  sin,
  smoothstep,
  uniform,
  vec3,
  vec4,
  vertexStage,
} from 'three/tsl';
import {
  AdditiveBlending,
  type Node,
  NormalBlending,
  PointsNodeMaterial,
  type WebGPURenderer,
} from 'three/webgpu';
import { keepSceneNormals } from '../mrt';
import { WAKE, WIND } from '../wind';

export type BokehAttributes = {
  position: InstancedBufferAttribute;
  size: InstancedBufferAttribute;
  seed: InstancedBufferAttribute;
  color: InstancedBufferAttribute;
};

export type BokehSpec = {
  cocScale: number;
  falloff: number;
  drift: number;
  maxSize: number;
  outside: number;
  unlit?: string;
  additive: boolean;
};

type Lamp = { position: Vector3; direction: Vector3; cone: number };

type F = Node<'float'>;
type V3 = Node<'vec3'>;
type V4 = Node<'vec4'>;

type Row = { element: (index: Node<'int'>) => unknown };

export type Gust = {
  head: Row;
  tail: Row;
  wake: Row;
  amount: Node<'float'>;
};

var _UP = vec3(0, 1, 0);

export var DUST = {
  sprite: 3,
  dot: [0.35, 0.95] as [number, number],
  core: 0.9,
  halo: 0.7,
};

var _gust = ({ head, tail, wake, amount }: Gust, at: V3) =>
  Fn(() => {
    const sum = vec3(0).toVar();
    const gather = vec3(0).toVar();
    const gathered = float(0).toVar();
    Loop(WIND.puffs, ({ i }: { i: Node<'int'> }) => {
      const puff = tail.element(i) as V4;
      const pull = wake.element(i) as F;
      If(puff.w.greaterThan(0).or(pull.greaterThan(0)), () => {
        const origin = head.element(i) as V4;
        const offset = at.sub(origin.xyz).toVar();
        const sigma = origin.w;
        const direction = puff.xyz;
        const along = offset.dot(direction);
        const across = offset.sub(direction.mul(along)).toVar();
        const weight = exp(
          offset.dot(offset).div(sigma.mul(sigma).mul(-2))
        ).mul(puff.w);
        const side = ((turn: V3) => turn.div(max(length(turn), 1e-3)))(
          cross(direction, _UP)
        );
        const spin = across
          .dot(side)
          .div(max(length(across), 1e-3))
          .mul(WIND.swirl)
          .div(sigma);
        sum.addAssign(
          direction.add(cross(direction, across).mul(spin)).mul(weight)
        );
        const grip = pull
          .mul(exp(along.mul(along).div(-2 * WAKE.window ** 2)))
          .mul(exp(across.dot(across).div(-2 * WAKE.capture ** 2)))
          .mul(
            smoothstep(
              2 * WAKE.capture,
              3 * WAKE.capture,
              length(across)
            ).oneMinus()
          );
        gather.subAssign(across.mul(grip));
        gathered.addAssign(grip);
      });
    });
    return sum
      .add(gather.mul(float(WAKE.pull).div(gathered.add(WAKE.soft))))
      .mul(amount);
  })();

export var createBokehMaterial = (
  attributes: BokehAttributes,
  spec: BokehSpec,
  lamp: Lamp,
  renderer: WebGPURenderer,
  gust: Gust
) => {
  const controls = {
    time: uniform(0),
    viewport: uniform(800),
    focus: uniform(40),
    aperture: uniform(1),
    intensity: uniform(1),
    lampBoost: uniform(0),
  };
  const center = instancedBufferAttribute(
    attributes.position
  ) as unknown as Node<'vec3'>;
  const pointSize = instancedBufferAttribute(attributes.size) as unknown as F;
  const seed = instancedBufferAttribute(attributes.seed) as unknown as F;
  const tint = instancedBufferAttribute(
    attributes.color
  ) as unknown as Node<'vec3'>;

  const material = new PointsNodeMaterial({
    transparent: true,
    depthWrite: false,
    fog: false,
    sizeAttenuation: false,
    blending: spec.additive ? AdditiveBlending : NormalBlending,
  });

  const t = controls.time.mul(0.12).add(seed.mul(Math.PI * 2));
  const drifted = center.add(
    vec3(
      sin(t.mul(1.3)),
      sin(t.mul(0.7).add(1.7)).mul(0.6),
      cos(t.mul(1.1))
    ).mul(spec.drift)
  );
  const moved = drifted.add(_gust(gust, drifted));
  material.positionNode = moved;

  const depth = positionView.z.negate();
  const coc = abs(depth.sub(controls.focus))
    .div(max(depth, 0.001))
    .mul(controls.aperture);
  const size = min(pointSize.add(coc.mul(spec.cocScale)), spec.maxSize);
  const extent = max(size.mul(controls.viewport).div(depth), 1.5);
  const sprite = max(extent, DUST.sprite);
  material.sizeNode = sprite;

  const inCone = smoothstep(
    lamp.cone - 0.08,
    lamp.cone + 0.05,
    normalize(moved.sub(vec3(lamp.position))).dot(vec3(lamp.direction))
  );
  const blur = vertexStage(clamp(coc.mul(0.5), 0, 1));
  const core = vertexStage(pointSize.div(size));
  const fade = vertexStage(
    float(spec.outside)
      .add(inCone.mul(controls.lampBoost))
      .div(coc.mul(coc).mul(spec.falloff).add(1))
  );

  const p = vertexStage(positionGeometry.xy).mul(2);
  const r = length(p).mul(vertexStage(sprite.div(extent)));
  const pixel = length(p).mul(vertexStage(sprite)).mul(0.5);
  const dot = smoothstep(DUST.dot[0], DUST.dot[1], pixel).oneMinus();
  const lit = vertexStage(
    float(spec.outside).add(inCone.mul(controls.lampBoost))
  );
  const mote = ((radius: F) =>
    exp(r.mul(r).div(radius.mul(radius)).mul(-3))
      .mul(mix(float(1), float(0.35), blur))
      .add(
        exp(r.mul(r).mul(-4.5))
          .mul(smoothstep(0.85, 1, r).oneMinus())
          .mul(0.45)
          .mul(blur)
      ))(max(core, 0.06));

  const shade = spec.unlit
    ? mix(uniform(new Color(spec.unlit)), tint, vertexStage(inCone))
    : tint;
  material.colorNode = shade;
  keepSceneNormals(material, renderer, {
    cores: vec4(
      shade,
      dot.mul(lit).mul(controls.intensity).mul(DUST.core).min(1)
    ),
  });
  material.opacityNode = mote.mul(fade).mul(controls.intensity).mul(DUST.halo);
  material.alphaTest = 0.002;

  return { material, controls };
};
