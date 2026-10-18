import { Color } from 'three';
import {
  bumpMap,
  color,
  cos,
  exp,
  float,
  length,
  max,
  mix,
  mx_fractal_noise_float,
  mx_noise_float,
  mx_worley_noise_float,
  positionLocal,
  sin,
  smoothstep,
  sqrt,
  time,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import { MeshPhysicalNodeMaterial, type Node } from 'three/webgpu';

type F = Node<'float'>;
type V2 = Node<'vec2'>;

var _COLORS = {
  shade: '#aa6a30',
  crema: '#c48c4c',
  light: '#dcb27a',
  rim: '#9d531c',
  thin: '#5e3216',
  tiger: '#7a4419',
  pool: '#110704',
  bubble: '#1c0e07',
  foam: '#ecd9b8',
};

var _POOL = { center: [0.02, -0.14], radius: 0.62 } as const;

var _GROWTH = 2.8;

var _fbm = (p: V2, octaves = 4): F =>
  (mx_fractal_noise_float(p, octaves, 2.03, 0.5) as F).mul(0.5);

var _fall = (lo: number, hi: number, x: F): F =>
  smoothstep(lo, hi, x).oneMinus();

var _bubbles = (p: V2, scale: number, density: F) =>
  ((d: F, mask: F) => ({
    core: _fall(0.72, 0.9, d).mul(mask),
    ring: smoothstep(0.78, 0.95, d)
      .mul(_fall(1, 1.25, d))
      .mul(mask),
  }))(
    (mx_worley_noise_float(p.mul(scale)) as F).div(
      (mx_noise_float(p.mul(scale * 0.9).add(3.3)) as F).mul(0.06).add(0.21)
    ),
    smoothstep(
      density.oneMinus(),
      density.oneMinus().add(0.06),
      (mx_noise_float(p.mul(scale * 0.41)) as F).mul(0.5).add(0.5)
    )
  );

export var createCoffeeMaterial = () => {
  const material = new MeshPhysicalNodeMaterial();
  const disc: V2 = uv().mul(2).sub(1);
  const r: F = length(disc);

  const drift = time.mul(0.012);
  const q: V2 = vec2(
    disc.x.mul(cos(drift)).sub(disc.y.mul(sin(drift))),
    disc.x.mul(sin(drift)).add(disc.y.mul(cos(drift)))
  );
  const w: V2 = q.add(
    vec2(_fbm(q.mul(1.7)), _fbm(q.mul(1.7).add(7.3))).mul(0.4)
  );

  const toPool: V2 = q.sub(vec2(..._POOL.center));
  const poolR = length(toPool.mul(vec2(1, 1.08))).add(
    _fbm(toPool.mul(1.8).add(5.1)).mul(0.08)
  );
  const pool = _fall(_POOL.radius - 0.008, _POOL.radius + 0.008, poolR);
  const open = pool.oneMinus();
  const thin = smoothstep(_POOL.radius, _POOL.radius + 0.015, poolR).mul(
    _fall(_POOL.radius + 0.015, _POOL.radius + 0.08, poolR)
  );
  const wall = smoothstep(0.9, 0.995, r);
  const far = smoothstep(-0.3, 0.45, q.y);

  const mottle = smoothstep(-0.3, 0.45, _fbm(w.mul(3)));
  const tiger = smoothstep(0.5, 0.8, mx_noise_float(w.mul(80)) as F).mul(0.3);

  const band = open.mul(far);
  const large = _bubbles(q, 9, band.mul(0.6));
  const medium = _bubbles(q.add(2.7), 18, band.mul(0.55).add(open.mul(0.04)));
  const small = _bubbles(q.add(6.1), 36, band.mul(0.5).add(open.mul(0.1)));
  const bubble = max(max(large.core, medium.core), small.core.mul(0.85)).mul(
    open
  );
  const ring = max(max(large.ring, medium.ring), small.ring).mul(0.6).mul(open);
  const froth = _bubbles(
    q.add(9.2),
    52,
    open
      .mul(far.oneMinus())
      .mul(smoothstep(0.8, 0.95, r))
      .mul(0.8)
  ).core;

  const tint = (hex: string) => color(new Color(hex));
  const crema = mix(
    mix(tint(_COLORS.shade), tint(_COLORS.crema), mottle),
    tint(_COLORS.light),
    mottle.mul(0.35).mul(far)
  );
  const textured = mix(crema, tint(_COLORS.tiger), tiger);
  const edged = mix(
    mix(textured, tint(_COLORS.rim), wall.mul(0.7)),
    tint(_COLORS.thin),
    thin.mul(0.85)
  );
  const bubbled = mix(
    mix(mix(edged, tint(_COLORS.light), ring), tint(_COLORS.bubble), bubble),
    tint(_COLORS.foam),
    froth
  );
  material.colorNode = mix(bubbled, tint(_COLORS.pool), pool);

  material.roughnessNode = mix(mix(0.45, 0.12, pool), 0.06, bubble);
  material.clearcoatNode = bubble.mul(0.6);
  material.clearcoatRoughnessNode = float(0.05);

  const centre = vec2(..._POOL.center);
  const ray = toPool.div(max(length(toPool), 1e-4));
  const along = centre.dot(ray);
  const toWall = along
    .negate()
    .add(sqrt(max(along.mul(along).sub(centre.dot(centre)).add(1), 0)));
  const s = poolR
    .sub(_POOL.radius)
    .div(max(toWall.sub(_POOL.radius), 0.05))
    .clamp(0, 1);
  const ramp = exp(s.mul(_GROWTH))
    .sub(1)
    .div(Math.exp(_GROWTH) - 1);
  const layer = ramp.mul(mix(0.1, 0.2, far)).add(mottle.mul(0.005).mul(s));
  const detail = ring.mul(0.015).sub(bubble.mul(0.02)).add(froth.mul(0.012));
  material.positionNode = positionLocal.add(vec3(0, layer, 0));
  material.normalNode = bumpMap(layer.add(detail), float(1));
  return material;
};
