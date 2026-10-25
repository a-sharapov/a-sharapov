import { useTask, useThrelte } from '@threlte/core';
import { onMount } from 'svelte';
import {
  type Camera,
  Color,
  LinearSRGBColorSpace,
  MaterialBlending,
  type Matrix4,
  NeutralToneMapping,
  NoToneMapping,
  type PerspectiveCamera,
  Quaternion,
  RedFormat,
  SRGBColorSpace,
  UnsignedByteType,
  Vector2,
  Vector3,
} from 'three';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { denoise } from 'three/addons/tsl/display/DenoiseNode.js';
import { ao } from 'three/addons/tsl/display/GTAONode.js';
import { lut3D } from 'three/addons/tsl/display/Lut3DNode.js';
import TRAANode from 'three/addons/tsl/display/TRAANode.js';
import {
  cameraProjectionMatrix,
  convertToTexture,
  distance,
  float,
  length,
  max,
  mix,
  modelViewMatrix,
  mrt,
  normalView,
  output,
  packNormalToRGB,
  pass,
  positionLocal,
  renderOutput,
  rtt,
  sample,
  screenUV,
  select,
  sign,
  smoothstep,
  sRGBTransferEOTF,
  sRGBTransferOETF,
  sub,
  texture,
  texture3D,
  uniform,
  unpackRGBToNormal,
  vec2,
  vec3,
  vec4,
  velocity,
} from 'three/tsl';
import {
  BlendMode,
  type Node,
  RenderPipeline,
  type TextureNode,
  type WebGPURenderer,
} from 'three/webgpu';
import { FEEDBACK_GAIN, feedback } from './feedback';
import { GLITCH, glitchAt } from './glitch';
import { sharedGobo } from './gobo';
import { CAT_EYE, lensDof } from './lens/dof';
import { grain, tintBloom } from './lens/film';
import { glitchTone, glitchWarp } from './lens/glitch';
import { LUT_SIZE } from './lens/grade';
import { createLut } from './lens/lut';
import { ABERRATION, lensColor, shutterFor } from './lens/motion';
import type { MixedMood } from './mood';
import { movers } from './movers';
import type { Quality } from './quality';
import { type FrameSample, nextDpr, windowFull } from './resolution';
import { rig, viewer } from './state.svelte';
import { createVolumetrics } from './volumetric';

var _DISABLED = new Set(
  import.meta.env.DEV && typeof location !== 'undefined'
    ? (new URLSearchParams(location.search).get('fx') ?? '').split(',')
    : []
);

var _RADIAL = { strength: 0.85, from: 0.16, to: 0.62 };

var _VIGNETTE_OFFSET = 0.28;
var _BOKEH_SCALE = 0.6;

var _REDUCED_MOTION =
  typeof matchMedia !== 'undefined' &&
  matchMedia('(prefers-reduced-motion: reduce)').matches;

var _JITTER = 0.65;

type Jittered = { setViewOffset(width: number, height: number): void };
var _jitterFull = (TRAANode.prototype as unknown as Jittered).setViewOffset;

var _steady = (node: TRAANode) =>
  Object.assign(node, {
    setViewOffset: (width: number, height: number) =>
      ((camera) =>
        void (_jitterFull.call(node, width, height),
        camera.view &&
          ((camera.view.offsetX *= _JITTER),
          (camera.view.offsetY *= _JITTER),
          camera.updateProjectionMatrix())))(node.camera as PerspectiveCamera),
  });

var _AO_FADE = [70, 120] as const;

var _STILL = { position: 0.002, angle: 3.5e-5, frames: 60 };

type Held = { updateBefore: (frame: never) => unknown };

var _hold = <T extends object>(node: T): T =>
  ((update) =>
    Object.assign(node, {
      updateBefore: (frame: never) => (rig.still ? undefined : update(frame)),
    }))((node as unknown as Held).updateBefore.bind(node));

type Velocity = {
  projectionMatrix: Matrix4 | null;
  previousProjectionMatrix: Node<'mat4'>;
  previousCameraViewMatrix: Node<'mat4'>;
  previousModelWorldMatrix: Node<'mat4'>;
};

var _settledVelocity = (node: Velocity) =>
  Object.assign(node, {
    setup: () =>
      ((current: Node<'vec4'>, previous: Node<'vec4'>) =>
        sub(current.xy.div(current.w), previous.xy.div(previous.w)))(
        (node.projectionMatrix === null
          ? cameraProjectionMatrix
          : uniform(node.projectionMatrix)
        )
          .mul(modelViewMatrix)
          .mul(positionLocal) as unknown as Node<'vec4'>,
        node.previousProjectionMatrix
          .mul(node.previousCameraViewMatrix.mul(node.previousModelWorldMatrix))
          .mul(positionLocal) as unknown as Node<'vec4'>
      ),
  });

_settledVelocity(velocity as unknown as Velocity);

var _FLAT = { depthBuffer: false };

var _texture = (node: Node) =>
  ((node as { getTextureNode?: () => TextureNode }).getTextureNode?.() ??
    convertToTexture(node, null, null, _FLAT)) as TextureNode;

var _SHAFTS_PAGE = 0.35;

type Controls = ReturnType<typeof _controls>;

var _controls = () => ({
  focusDistance: uniform(40),
  focusRange: uniform(8),
  bokeh: uniform(2),
  radial: uniform(0),
  focusUv: uniform(vec2(0.5, 0.5)),
  aspect: uniform(1),
  bloom: uniform(0.4),
  vignette: uniform(0.4),
  aoColor: uniform(new Color('#2b1a0c')),
  shutter: uniform(0),
  pixelRatio: uniform(1),
  catEye: uniform(_DISABLED.has('nolens') ? 0 : CAT_EYE.strength),
  aberration: uniform(_DISABLED.has('nolens') ? 0 : ABERRATION.pixels),
  grade: uniform(0),
  gradeAmount: uniform(1),
  glitch: uniform(0),
  pixel: uniform(1),
  seed: uniform(0),
});

export var bindPostFx = (getMood: () => MixedMood, quality: Quality) => {
  const { renderer, scene, camera, size, dpr, autoRender, renderStage } =
    useThrelte();
  const gpu = renderer as unknown as WebGPURenderer;
  const pipeline = new RenderPipeline(gpu);
  const controls = _controls();
  const gobo = sharedGobo();
  const volumetrics = createVolumetrics(scene, gobo.node);
  const focus = new Vector3();
  const _focusUv = new Vector3();
  let ready = false;
  let prime: (() => void) | null = null;
  const luts = { day: createLut('day'), night: createLut('night') };
  let bloomTints: Vector3[] = [];

  const _aoScale = (ratio: number) =>
    quality.aoHalfResolution
      ? 0.5
      : _DISABLED.has('aofull')
        ? 1
        : Math.min(1, 1 / ratio);
  let aoRatio = 0;
  let rescaleAo: (ratio: number) => void = () => {};

  const blit = new RenderPipeline(gpu, texture(feedback.target.texture));
  blit.outputColorTransform = false;
  const _buffer = new Vector2();
  const _capture = () =>
    ((buffer) =>
      void ((buffer.x !== feedback.target.width ||
        buffer.y !== feedback.target.height) &&
        feedback.target.setSize(buffer.x, buffer.y),
      gpu.setRenderTarget(feedback.target),
      pipeline.render(),
      gpu.setRenderTarget(null),
      blit.render()))(gpu.getDrawingBufferSize(_buffer));

  const _build = (current: Camera) => {
    const scenePass = pass(scene, current);
    scenePass.setMRT(
      mrt({
        output,
        normal: packNormalToRGB(normalView),
        velocity,
        cores: vec4(0),
      })
        .setBlendMode('normal', new BlendMode(MaterialBlending))
        .setBlendMode('velocity', new BlendMode(MaterialBlending))
        .setBlendMode('cores', new BlendMode(MaterialBlending))
    );
    scenePass.getTexture('normal').type = UnsignedByteType;
    scenePass.getTexture('cores').type = UnsignedByteType;
    const cores = scenePass.getTextureNode('cores');
    void (
      import.meta.env.DEV &&
      Object.assign(
        (window as unknown as { __asDebug?: object }).__asDebug ?? {},
        { scenePass }
      )
    );
    const color = scenePass.getTextureNode('output');
    const depth = scenePass.getTextureNode('depth');
    const motion = scenePass.getTextureNode('velocity');
    const viewZ = scenePass.getViewZNode();
    const normalTexture = scenePass.getTextureNode('normal');
    const normal = sample((uv: Node<'vec2'>) =>
      unpackRGBToNormal(normalTexture.sample(uv))
    );

    aoRatio = gpu.getPixelRatio();
    const aoScale = _aoScale(aoRatio);
    const occlusion = ao(depth, normal, current);
    occlusion.resolutionScale = aoScale;
    occlusion.radius.value = 1.4;
    occlusion.scale.value = 1.25;
    occlusion.thickness.value = 2;
    occlusion.samples.value = 24;
    _hold(occlusion);
    const _denoise = (input: Node, radius: number, index: number) =>
      ((pass) => (
        (pass.radius.value = radius), (pass.index.value = index), pass
      ))(denoise(input, depth, normal, current));
    const _atAoScale = (node: Node) =>
      _hold(
        rtt(node, null, null, {
          ..._FLAT,
          format: RedFormat,
          resolutionScale: aoScale,
        })
      );
    const aoFirst = _atAoScale(
      _denoise(occlusion.getTextureNode(), 12, 0) as unknown as Node
    );
    const aoClean = _atAoScale(_denoise(aoFirst, 6, 1) as unknown as Node);
    rescaleAo = (ratio) =>
      ((scale) =>
        void ((occlusion.resolutionScale = scale),
        aoFirst.setResolutionScale(scale),
        aoClean.setResolutionScale(scale)))(_aoScale(ratio));
    const lit: Node<'vec4'> = _DISABLED.has('noao')
      ? color
      : vec4(
          color.rgb.mul(
            mix(
              controls.aoColor,
              vec3(1),
              max(
                (aoClean as unknown as Node<'vec4'>).r,
                smoothstep(_AO_FADE[0], _AO_FADE[1], viewZ.negate())
              )
            )
          ),
          color.a
        );

    void volumetrics.resolve();
    const beams = (
      rtt(volumetrics.node(depth, current), null, null, {
        ..._FLAT,
        resolutionScale: 0.5,
      }) as unknown as Node<'vec4'>
    ).rgb;
    const aired: Node<'vec4'> = _DISABLED.has('nobeams')
      ? lit
      : _DISABLED.has('beamsonly')
        ? vec4(beams.mul(6), 1)
        : vec4(lit.rgb.add(beams), lit.a);

    const jittered = _DISABLED.has('notraa')
      ? null
      : _steady(
          new TRAANode(
            convertToTexture(aired, null, null, _FLAT) as never,
            depth,
            motion,
            current
          )
        );
    prime =
      jittered &&
      (() =>
        ((visible) =>
          void ((scene.visible = false),
          pipeline.render(),
          (scene.visible = visible)))(scene.visible));
    const smooth: Node<'vec4'> = jittered
      ? (_texture(jittered as unknown as Node) as unknown as Node<'vec4'>)
      : aired;

    const signed = viewZ.negate().sub(controls.focusDistance);
    const away = select(signed.greaterThanEqual(0), float(1), sign(signed));
    const fromFocus = length(
      screenUV.sub(controls.focusUv).mul(vec2(controls.aspect, 1))
    );
    const radialViewZ = viewZ.sub(
      away
        .mul(controls.radial)
        .mul(controls.focusRange)
        .mul(smoothstep(_RADIAL.from, _RADIAL.to, fromFocus))
    );
    const focused: Node<'vec4'> = _DISABLED.has('nodof')
      ? smooth
      : (lensDof(
          smooth,
          radialViewZ,
          controls.focusDistance,
          controls.focusRange,
          controls.bokeh,
          controls.catEye
        ) as unknown as Node<'vec4'>);
    const sharp: Node<'vec4'> = _DISABLED.has('nocores')
      ? focused
      : vec4(focused.rgb.mul(cores.a.oneMinus()).add(cores.rgb), focused.a);
    const source = _texture(sharp);
    const warp = glitchWarp(controls.glitch, controls.pixel, controls.seed);
    const lensed = lensColor({
      center: select(
        controls.glitch.add(controls.pixel).greaterThan(1.001),
        source.sample(warp.at) as unknown as Node<'vec4'>,
        sharp
      ),
      source,
      at: warp.at,
      split: warp.split,
      velocity: motion as unknown as TextureNode,
      shutter: controls.shutter,
      pixelRatio: controls.pixelRatio,
      aberration: controls.aberration,
    });

    const glowPass = _DISABLED.has('nobloom')
      ? null
      : ((node) => (
          (node.smoothWidth.value = 0.25), node.setResolutionScale(0.33), node
        ))(bloom(sharp, controls.bloom, 0.72, 0.82));
    bloomTints = glowPass?.bloomTintColors ?? [];
    const glow: Node<'vec4'> = glowPass
      ? lensed.add(glowPass as unknown as Node<'vec4'>)
      : lensed;
    const display = renderOutput(
      glow,
      NeutralToneMapping,
      LinearSRGBColorSpace
    ) as unknown as Node<'vec4'>;
    const graded: Node<'vec3'> = _DISABLED.has('nograde')
      ? display.rgb
      : ((encoded: Node<'vec4'>) =>
          mix(
            display.rgb,
            sRGBTransferEOTF(
              mix(
                (
                  lut3D(
                    encoded,
                    texture3D(luts.day),
                    LUT_SIZE,
                    float(1)
                  ) as unknown as Node<'vec4'>
                ).rgb,
                (
                  lut3D(
                    encoded,
                    texture3D(luts.night),
                    LUT_SIZE,
                    float(1)
                  ) as unknown as Node<'vec4'>
                ).rgb,
                controls.grade
              )
            ) as Node<'vec3'>,
            controls.gradeAmount
          ))(vec4(sRGBTransferOETF(display.rgb) as Node<'vec3'>, 1));

    const vignetted = _DISABLED.has('novignette')
      ? graded
      : graded.mul(
          smoothstep(
            0.8,
            _VIGNETTE_OFFSET * 0.799,
            distance(screenUV, vec2(0.5)).mul(
              controls.vignette.add(_VIGNETTE_OFFSET)
            )
          )
        );
    const grained = glitchTone(
      _DISABLED.has('nonoise') ? vignetted : grain(vignetted),
      controls.glitch
    );

    pipeline.outputColorTransform = false;
    pipeline.outputNode = renderOutput(
      vec4(grained, 1),
      NoToneMapping,
      SRGBColorSpace
    );
    pipeline.needsUpdate = true;
  };

  const _glitch = (now: number) =>
    ((active: boolean) =>
      ((state) =>
        void ((controls.glitch.value = state.glitch),
        (controls.pixel.value = state.pixel * gpu.getPixelRatio()),
        (controls.seed.value = _REDUCED_MOTION
          ? 0
          : Math.floor(now / (GLITCH.step * 1000))),
        viewer.glitch !== active && (viewer.glitch = active),
        active || (rig.glitch = -1)))(
        active
          ? glitchAt((now - rig.glitch) / 1000, _REDUCED_MOTION)
          : { glitch: 0, pixel: 1 }
      ))(rig.glitch >= 0 && now - rig.glitch < GLITCH.seconds * 1000);

  const _tune = (mood: MixedMood, delta: number) => {
    ((ratio) =>
      void (ratio !== aoRatio && ((aoRatio = ratio), rescaleAo(ratio))))(
      gpu.getPixelRatio()
    );
    const pose = rig.pose;
    const perspective = camera.current;
    void (pose && focus.set(...pose.focus));
    controls.focusDistance.value = perspective.position.distanceTo(focus);
    controls.focusRange.value = pose?.focusRange ?? 8;
    controls.bokeh.value = (pose?.bokeh ?? 2) * _BOKEH_SCALE;
    ((uv) => controls.focusUv.value.set((uv.x + 1) / 2, (uv.y + 1) / 2))(
      _focusUv.copy(focus).project(perspective)
    );
    controls.aspect.value = size.current.width / size.current.height;
    feedback.aspect.value = controls.aspect.value;
    feedback.gain.value = FEEDBACK_GAIN / mood.exposure;
    controls.radial.value = _RADIAL.strength * (1 - rig.morph);
    controls.bloom.value = mood.bloom * 0.2;
    controls.vignette.value = mood.vignette;
    controls.shutter.value =
      _REDUCED_MOTION || _DISABLED.has('nomotion') ? 0 : shutterFor(delta);
    controls.pixelRatio.value = gpu.getPixelRatio();
    controls.grade.value = mood.grade;
    controls.gradeAmount.value =
      1 - (feedback.recursive ? rig.actors.tablet : 0);
    _glitch(performance.now());
    tintBloom(bloomTints, _DISABLED.has('nohalation') ? 0 : mood.halation);
    gpu.toneMappingExposure = mood.exposure;
    volumetrics.update(
      perspective,
      mood.shafts * (_SHAFTS_PAGE + (1 - _SHAFTS_PAGE) * gobo.strength.value),
      mood.beam
    );
  };

  const reference = {
    position: new Vector3(),
    quaternion: new Quaternion(),
    fov: 0,
    mood: null as MixedMood | null,
    size: new Vector2(),
    frames: 0,
  };
  const _size = new Vector2();
  const _still = (mood: MixedMood, perspective: PerspectiveCamera) =>
    !_DISABLED.has('nofreeze') &&
    reference.frames >= _STILL.frames &&
    !rig.shadowsDirty &&
    !rig.shadowsRedrawn &&
    mood === reference.mood &&
    perspective.fov === reference.fov &&
    gpu.getDrawingBufferSize(_size).equals(reference.size) &&
    perspective.position.distanceTo(reference.position) < _STILL.position &&
    perspective.quaternion.angleTo(reference.quaternion) < _STILL.angle;
  const _settle = (mood: MixedMood) =>
    ((perspective) =>
      void ((rig.still = _still(mood, perspective)),
      rig.still ||
        (reference.position.copy(perspective.position),
        reference.quaternion.copy(perspective.quaternion),
        (reference.fov = perspective.fov),
        (reference.mood = mood),
        gpu.getDrawingBufferSize(reference.size)),
      (reference.frames += 1)))(camera.current as PerspectiveCamera);

  void (
    import.meta.env.DEV &&
    Object.assign(window, {
      __asDebug: {
        renderer,
        scene,
        pipeline,
        camera,
        rig,
        movers,
        volumetrics,
      },
    })
  );

  onMount(() => {
    const before = autoRender.current;
    autoRender.set(false);
    const unsubscribe = camera.subscribe(
      (current) => void (_build(current), (ready = true))
    );
    return () => {
      unsubscribe();
      autoRender.set(before);
      pipeline.dispose();
      blit.dispose();
      luts.day.dispose();
      luts.night.dispose();
    };
  });

  const samples: FrameSample[] = [];
  const _adapt = (interval: number, cpu: number) =>
    void (['moving', 'settled'].includes(viewer.phase) &&
      !rig.still &&
      interval < 0.25 &&
      document.visibilityState === 'visible' &&
      samples.push({ interval, cpu }),
    windowFull(samples) &&
      ((next) =>
        void (next !== dpr.current && dpr.set(next), (samples.length = 0)))(
        nextDpr(dpr.current, samples, quality.dpr[0])
      ));

  useTask(
    'postfx',
    (delta) =>
      ((start) =>
        void (
          ready &&
          (_tune(getMood(), delta),
          _settle(getMood()),
          prime?.(),
          (prime = null),
          feedback.live && rig.actors.tablet > 0
            ? _capture()
            : pipeline.render(),
          _adapt(delta, (performance.now() - start) / 1000))
        ))(performance.now()),
    { stage: renderStage, autoInvalidate: false }
  );

  return { pipeline, controls: controls as Controls };
};
