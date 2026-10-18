import { Color, type Data3DTexture } from 'three';
import {
  abs,
  cameraPosition,
  exp,
  Fn,
  float,
  fract,
  frameId,
  If,
  int,
  interleavedGradientNoise,
  Loop,
  max,
  min,
  mix,
  modelWorldMatrixInverse,
  positionLocal,
  pow,
  screenCoordinate,
  smoothstep,
  sqrt,
  step,
  texture3DLevel,
  time,
  uniform,
  uniformArray,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import {
  FrontSide,
  MeshBasicNodeMaterial,
  type Node,
  type WebGPURenderer,
} from 'three/webgpu';
import { keepSceneNormals } from '../mrt';
import {
  AXIS_LEVELS,
  createAxis,
  STEAM_SPAN,
  STEAM_VOLUME,
  STRANDS,
  updateAxis,
} from './axis';
import { createNoiseTexture, NOISE_PERIOD } from './noise';

type F = Node<'float'>;
type V2 = Node<'vec2'>;
type V3 = Node<'vec3'>;
type V4 = Node<'vec4'>;

var _STEPS = 28;
var _EDGE_ON = 0.3;
var _WARP = 0.63;
var _VEIL = { radius: 2.4, middle: 2.5, density: 0.1 };

var _fbm = (noise: Data3DTexture, p: V3, octaves = 3): F =>
  Array.from({ length: octaves }).reduce<F>(
    (sum, _, octave) =>
      sum.add(
        (
          texture3DLevel(
            noise,
            p.mul(2.03 ** octave / NOISE_PERIOD),
            0
          ) as unknown as V4
        ).r
          .mul(2)
          .sub(1)
          .mul(0.5 ** (octave + 1))
      ),
    float(0)
  );

var _safe = (x: F): F => max(abs(x), 1e-5).mul(step(0, x).mul(2).sub(1));

export var createSteamMaterial = (
  seed: number,
  renderer: WebGPURenderer,
  drift?: Float32Array
) => {
  const opacity = uniform(0.55).setName('steamOpacity');
  const tint = uniform(new Color('#ffffff'));
  const { radius, height } = STEAM_VOLUME;
  const noise = createNoiseTexture();
  const axis = uniformArray(createAxis(), 'vec4').onFrameUpdate(
    ({ time: now }) => void updateAxis(axis.array as never, now, seed, drift)
  );
  const _row = (index: Node<'int'>) => axis.element(index) as unknown as V4;

  const march = Fn(() => {
    const origin = modelWorldMatrixInverse
      .mul(vec4(cameraPosition, 1))
      .xyz.toVar();
    const dir = positionLocal.sub(origin).normalize().toVar();
    const a = max(dir.x.mul(dir.x).add(dir.z.mul(dir.z)), 1e-6);
    const b = origin.x.mul(dir.x).add(origin.z.mul(dir.z));
    const c = origin.x
      .mul(origin.x)
      .add(origin.z.mul(origin.z))
      .sub(radius * radius);
    const root = sqrt(max(b.mul(b).sub(a.mul(c)), 0));
    const dy = _safe(dir.y).toVar();
    const y0 = origin.y.negate().div(dy);
    const y1 = float(height).sub(origin.y).div(dy);
    const near = max(max(b.negate().sub(root).div(a), min(y0, y1)), 0);
    const far = min(b.negate().add(root).div(a), max(y0, y1));
    const stride = max(far.sub(near), 0).div(_STEPS).toVar();
    const t = near
      .add(
        stride.mul(
          fract(
            interleavedGradientNoise(screenCoordinate.xy).add(
              float(frameId).mul(0.618034)
            )
          )
        )
      )
      .toVar();

    const optical = float(0).toVar();
    const shade = float(0).toVar();
    const veil = float(0).toVar();

    Loop(_STEPS, () => {
      const p = origin.add(dir.mul(t)).toVar();
      const h = p.y.div(height).toVar();
      const rise = smoothstep(0.02, 0.2, h)
        .mul(pow(max(smoothstep(0.14, 0.95, h).oneMinus(), 1e-4), 1.4))
        .toVar();
      const radial = p.xz.length().toVar();
      veil.addAssign(
        smoothstep(0.03, 0.12, h)
          .mul(smoothstep(0.1, 0.4, h).oneMinus())
          .mul(exp(radial.mul(radial).div(-_VEIL.radius * _VEIL.radius)))
          .mul(stride)
      );

      If(rise.greaterThan(1e-3), () => {
        const level = h.clamp(0, 1).mul(AXIS_LEVELS - 1);
        const below = level.floor();
        const i0 = int(below).toVar();
        const i1 = int(min(below.add(1), AXIS_LEVELS - 1)).toVar();
        const f = level.sub(below);
        const centers = mix(_row(i0), _row(i1), f).toVar();
        const slopes = mix(
          _row(i0.add(AXIS_LEVELS)),
          _row(i1.add(AXIS_LEVELS)),
          f
        ).toVar();
        const width = mix(float(0.02), float(0.085), smoothstep(0, 0.9, h))
          .mul(STEAM_SPAN)
          .toVar();
        const strands = STRANDS.map(({ weight, thickness }, k) => ({
          weight,
          center: k === 0 ? centers.xy : centers.zw,
          slope: k === 0 ? slopes.xy : slopes.zw,
          width: width.mul(thickness),
        }));
        const across = (
          at: V2,
          { center, slope }: (typeof strands)[number]
        ): F =>
          ((offset: V2) =>
            ((along: F) =>
              offset
                .dot(offset)
                .sub(along.mul(along).div(slope.dot(slope).add(1))))(
              offset.dot(slope)
            ))(at.sub(center));
        const gap = strands.reduce<F>(
          (nearest, strand) =>
            min(
              nearest,
              ((reach: F) => across(p.xz, strand).div(reach.mul(reach)))(
                strand.width.mul(2.5).add(_WARP)
              )
            ),
          float(1e9)
        );

        If(gap.lessThan(1), () => {
          const grain = vec3(
            p.x.mul(2 / STEAM_SPAN),
            h.mul(2.2).sub(time.mul(0.18)),
            p.z.mul(2 / STEAM_SPAN)
          )
            .add(seed)
            .toVar();
          const warp = vec2(
            _fbm(noise, grain.add(vec3(0, time.mul(0.05), 0)), 2),
            _fbm(noise, grain.add(vec3(5.2, time.mul(0.05), 1.3)), 2)
          ).toVar();
          const at = p.xz
            .sub(warp.mul(h.mul(0.05).add(0.02).mul(STEAM_SPAN)))
            .toVar();
          const tube = strands.reduce<F>(
            (sum, strand) =>
              sum.add(
                exp(
                  across(at, strand)
                    .div(strand.width.mul(strand.width))
                    .negate()
                )
                  .mul(strand.weight / Math.sqrt(Math.PI))
                  .div(strand.width)
                  .mul(
                    ((cosine: F) =>
                      sqrt(max(cosine.mul(cosine).oneMinus(), 0)).max(
                        _EDGE_ON
                      ))(
                      dir.dot(
                        vec3(strand.slope.x, 1, strand.slope.y).normalize()
                      )
                    )
                  )
              ),
            float(0)
          );
          const fibers = mix(float(0.7), float(0.35), h).add(
            mix(float(0.3), float(0.65), h).mul(
              smoothstep(-0.4, 0.5, _fbm(noise, grain.mul(2.3).add(3.1)))
            )
          );
          const density = tube
            .mul(fibers)
            .mul(rise)
            .mul(smoothstep(radius - 1.2, radius, radial).oneMinus())
            .mul(stride);
          optical.addAssign(density);
          shade.addAssign(density.mul(warp.x.mul(0.16).add(0.92)));
        });
      });
      t.addAssign(stride);
    });

    const middle = origin.add(
      dir.mul(float(_VEIL.middle).sub(origin.y).div(dy))
    );
    const haze = veil
      .mul(smoothstep(0.35, 0.85, dir.y.negate()))
      .mul(
        smoothstep(
          -0.3,
          0.6,
          _fbm(
            noise,
            vec3(middle.x.mul(0.35), time.mul(-0.3), middle.z.mul(0.35)).add(
              seed + 9.1
            ),
            2
          ).mul(2)
        )
      )
      .mul(_VEIL.density);

    return vec2(
      optical.add(haze),
      shade.add(haze.mul(0.95)).div(max(optical.add(haze), 1e-4))
    );
  });

  const result = march();
  const material = new MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    fog: false,
    side: FrontSide,
  });
  material.colorNode = vec4(
    tint.mul(result.y),
    result.x.clamp(0, 1).mul(opacity)
  );
  keepSceneNormals(material, renderer);
  material.alphaTest = 0.003;

  return { material, noise, opacity, tint };
};
