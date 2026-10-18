<script lang="ts">
  import { T, useThrelte } from '@threlte/core';
  import { onDestroy } from 'svelte';
  import { type Camera, CircleGeometry, Matrix4 } from 'three';
  import {
    cameraPosition,
    exp,
    Fn,
    float,
    getViewPosition,
    interleavedGradientNoise,
    length,
    log2,
    max,
    min,
    positionWorld,
    pow,
    reflector,
    screenCoordinate,
    screenSize,
    select,
    smoothstep,
    uniform,
    vec2,
    vec4,
  } from 'three/tsl';
  import { MeshBasicNodeMaterial, type Node, type WebGPURenderer } from 'three/webgpu';
  import { FLAT_LAYER } from '../layers';
  import type { MixedMood } from '../mood';
  import { createReflectionMaterials } from '../reflection-materials';
  import { rig } from '../state.svelte';

  interface IReflectiveDesk {
    mood: MixedMood;
    resolution: number;
  }

  let { mood, resolution }: IReflectiveDesk = $props();

  const reflection = reflector({
    resolutionScale: resolution,
    generateMipmaps: true,
    depth: true,
    bounces: false,
  });
  const depth = reflection.getDepthNode();

  const gpu = useThrelte().renderer as unknown as WebGPURenderer;
  const materials = createReflectionMaterials();
  type RenderObject = Parameters<WebGPURenderer['renderObject']>;
  const _renderObject = (...args: RenderObject) =>
    void gpu.renderObject(...(args.with(4, materials.of(args[4])) as RenderObject));
  type Updating = { updateBefore: (frame: never) => unknown };
  ((reflector: Updating) =>
    ((update) =>
      void (reflector.updateBefore = (frame) =>
        rig.still
          ? undefined
          : ((previous) => (
              gpu.setRenderObjectFunction(_renderObject),
              update(frame),
              gpu.setRenderObjectFunction(previous)
            ))(gpu.getRenderObjectFunction())))(reflector.updateBefore.bind(reflector)))(
    (reflection as unknown as { reflector: Updating }).reflector
  );

  const strength = uniform(0.3);
  const falloff = uniform(1.6);
  const far = uniform(0);
  const _RADIUS = 110;

  const _virtual = (camera: Camera) =>
    ((virtual: Camera) => (virtual.layers.disable(FLAT_LAYER), virtual))(
      (
        reflection as unknown as {
          reflector: { getVirtualCamera: (camera: Camera) => Camera };
        }
      ).reflector.getVirtualCamera(camera)
    );
  const projectionInverse = uniform(new Matrix4()).onRenderUpdate(
    ({ camera }) =>
      void (camera && projectionInverse.value.copy(_virtual(camera).projectionMatrix).invert())
  );
  const cameraWorld = uniform(new Matrix4()).onRenderUpdate(
    ({ camera }) => void (camera && cameraWorld.value.copy(_virtual(camera).matrixWorld))
  );

  type V2 = Node<'vec2'>;
  type F = Node<'float'>;

  const heightAt = Fn(({ 0: uv }: [V2]) => {
    const value = depth.sample(uv).x;
    const view = getViewPosition(uv, value, projectionInverse);
    const world = cameraWorld.mul(vec4(view, 1));
    return select(value.greaterThanEqual(0.9999), float(-1), max(world.y, 0));
  });

  const contactOf = (height: F) =>
    select(height.lessThan(0), far, exp(height.negate().div(falloff)));

  const _POISSON: Array<[number, number]> = [
    [-0.326, -0.406],
    [-0.84, -0.074],
    [-0.696, 0.457],
    [-0.203, 0.621],
    [0.962, -0.195],
    [0.473, -0.48],
    [0.519, 0.767],
    [0.185, -0.893],
    [0.507, 0.064],
    [0.896, 0.412],
    [-0.322, -0.933],
    [-0.792, -0.598],
  ];

  const material = new MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
  });
  material.outputNode = Fn(() => {
    const uv = reflection.uvNode as V2;
    const texel = vec2(1).div(screenSize.mul(resolution));
    const center = heightAt(uv);
    const low = [0, 3, 6, 9].reduce(
      (acc, i) =>
        ((h: F) => select(h.lessThan(0), acc, min(acc, h)))(
          heightAt(
            uv.add(
              vec2(..._POISSON[i]!)
                .mul(texel)
                .mul(18)
            )
          )
        ),
      select(center.lessThan(0), float(1e3), center)
    );
    const blur = select(low.greaterThan(999), float(56), min(max(low.mul(16).add(7), 7), 72));
    const lod = log2(max(blur.mul(0.6), 1));
    const spread = vec2(0.5, 1).mul(blur).mul(texel);
    const angle = interleavedGradientNoise(screenCoordinate.xy).mul(Math.PI * 2);
    const turn = (x: number, y: number) =>
      vec2(angle.cos().mul(x).sub(angle.sin().mul(y)), angle.sin().mul(x).add(angle.cos().mul(y)));
    const taps = _POISSON.map(({ 0: x, 1: y }) => uv.add(turn(x, y).mul(spread)));
    const weights = taps.map((tap) => contactOf(heightAt(tap)));
    const centerWeight = contactOf(center);
    const sum = taps.reduce(
      (acc, tap, i) => acc.add(reflection.sample(tap).level(lod).rgb.mul(weights[i]!)),
      reflection.sample(uv).level(lod).rgb.mul(centerWeight)
    );
    const total = weights.reduce((acc, weight) => acc.add(weight), centerWeight);
    const view = cameraPosition.sub(positionWorld).normalize();
    const fresnel = pow(max(view.y.clamp(0, 1).oneMinus(), 1e-4), 5)
      .mul(0.96)
      .add(0.04);
    const fade = smoothstep(_RADIUS * 0.45, _RADIUS, length(positionWorld.xz)).oneMinus();
    const alpha = strength.mul(fresnel.mul(0.5).add(0.25)).mul(fade).mul(total.div(13)).clamp(0, 1);
    return vec4(sum.div(max(total, 1e-4)), alpha);
  })();

  $effect(() => {
    strength.value = mood.reflection;
    falloff.value = mood.reflectionFalloff;
    far.value = mood.reflectionFar;
  });

  const geometry = new CircleGeometry(140, 64);

  onDestroy(() => {
    geometry.dispose();
    material.dispose();
    materials.dispose();
    reflection.dispose();
  });
</script>

<T is={reflection.target} rotation.x={-Math.PI / 2} position.y={0.015} />
<T.Mesh
  name="deskReflection"
  {geometry}
  {material}
  rotation.x={-Math.PI / 2}
  position.y={0.015}
  renderOrder={1}
/>
