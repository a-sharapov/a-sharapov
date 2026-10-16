<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { onDestroy } from 'svelte';
  import { Color, InstancedBufferAttribute, type PerspectiveCamera, Vector3 } from 'three';
  import { uniform, uniformArray } from 'three/tsl';
  import { Sprite, type WebGPURenderer } from 'three/webgpu';
  import type { XYZ } from '$lib/common/types';
  import { computeLampRig } from '../lamp-rig';
  import type { MixedMood } from '../mood';
  import { distance } from '../shots';
  import { rig } from '../state.svelte';
  import { wind } from '../wind';
  import { type BokehAttributes, type BokehSpec, createBokehMaterial, type Gust } from './nodes';

  interface IBokeh {
    mood: MixedMood;
    motion: number;
    intro: number;
  }

  let { mood, motion, intro }: IBokeh = $props();

  const { camera, size, renderer } = useThrelte();

  const _random = (seed: number) =>
    ((value) => value - Math.floor(value))(Math.sin(seed * 91.17) * 47453.31);

  type Spec = {
    count: number;
    at: (i: number) => XYZ;
    size: (i: number) => number;
    color: (i: number) => Color;
  };

  const _attributes = ({ count, at, size: sizeOf, color }: Spec): BokehAttributes =>
    Array.from({ length: count }).reduce<BokehAttributes>(
      (attributes, _, i) => {
        attributes.position.setXYZ(i, ...at(i));
        attributes.size.setX(i, sizeOf(i));
        attributes.seed.setX(i, _random(i + 0.5));
        attributes.color.setXYZ(i, ...(color(i).toArray() as XYZ));
        return attributes;
      },
      {
        position: new InstancedBufferAttribute(new Float32Array(count * 3), 3),
        size: new InstancedBufferAttribute(new Float32Array(count), 1),
        seed: new InstancedBufferAttribute(new Float32Array(count), 1),
        color: new InstancedBufferAttribute(new Float32Array(count * 3), 3),
      }
    );

  const _lamp = computeLampRig();
  const _lampAxis = _lamp.aim.clone().multiplyScalar(26);
  const _lampSide = new Vector3().crossVectors(_lampAxis, new Vector3(0, 1, 0)).normalize();
  const _lampUp = new Vector3().crossVectors(_lampSide, _lampAxis).normalize();
  const dust = _attributes({
    count: 115,
    at: (i) => {
      const along = 0.15 + _random(i * 1.3) * 0.8;
      const radius = Math.sqrt(_random(i * 4.1)) * along * 36;
      const angle = _random(i * 6.7) * Math.PI * 2;
      return _lamp.bulb
        .clone()
        .addScaledVector(_lampAxis, along)
        .addScaledVector(_lampSide, Math.cos(angle) * radius)
        .addScaledVector(_lampUp, Math.sin(angle) * radius)
        .toArray() as XYZ;
    },
    size: (i) => 0.03 + _random(i * 8.3) ** 3 * 0.05,
    color: () => new Color('#ffffff'),
  });

  const specks = _attributes({
    count: 340,
    at: (i) => [
      (_random(i * 2.9) - 0.5) * 70,
      0.5 + _random(i * 3.7) * 28,
      (_random(i * 5.9) - 0.5) * 60,
    ],
    size: (i) => 0.06 + _random(i * 7.1) * 0.07,
    color: () => new Color('#7a6a58'),
  });

  const _LAMP = {
    position: _lamp.bulb.clone(),
    direction: _lamp.aim.clone(),
    cone: Math.cos(0.72),
  };

  const gust = {
    head: uniformArray(wind.head, 'vec4'),
    tail: uniformArray(wind.tail, 'vec4'),
    wake: uniformArray(wind.wake, 'float'),
    amount: uniform(1),
  } as unknown as Gust & { amount: { value: number } };

  const _layer = (attributes: BokehAttributes, spec: BokehSpec) =>
    ((created) =>
      Object.assign(created, {
        sprite: Object.assign(new Sprite(created.material), {
          count: attributes.position.count,
          frustumCulled: false,
          renderOrder: 3,
        }),
      }))(
      createBokehMaterial(attributes, spec, _LAMP, renderer as unknown as WebGPURenderer, gust)
    );

  const layers = {
    dust: _layer(dust, {
      cocScale: 0.6,
      falloff: 1.6,
      drift: 0.7,
      maxSize: 0.9,
      outside: 0.16,
      unlit: '#7d8aa0',
      additive: true,
    }),
    specks: _layer(specks, {
      cocScale: 0.4,
      falloff: 1.2,
      drift: 1.2,
      maxSize: 0.7,
      outside: 1,
      additive: false,
    }),
  };

  useTask('bokeh', (delta) => {
    wind.step(delta, (renderer as unknown as WebGPURenderer).info.frame);
    gust.amount.value = motion;
    const perspective = camera.current as PerspectiveCamera;
    const focus = rig.pose ? distance(perspective.position.toArray() as XYZ, rig.pose.focus) : 40;
    const viewport =
      size.current.height / (2 * Math.tan(((perspective.fov ?? 32) * Math.PI) / 360));
    Object.values(layers).forEach(({ controls }) => {
      controls.time.value += delta * motion;
      controls.viewport.value = viewport;
      controls.focus.value = focus;
      controls.aperture.value = (rig.pose?.bokeh ?? 2) * 0.6;
    });
  });

  $effect(() => {
    layers.dust.controls.intensity.value = mood.dust * (0.1 + 0.32 * intro);
    layers.dust.controls.lampBoost.value = 0.3 + mood.lamp * 1.6;
    layers.specks.controls.intensity.value = mood.specks * (0.45 + 0.5 * intro);
    const tint = mood.colors.dust;
    Array.from({ length: dust.color.count }).forEach(
      (_, i) => void dust.color.setXYZ(i, tint.r, tint.g, tint.b)
    );
    dust.color.needsUpdate = true;
  });

  onDestroy(() => {
    Object.values(layers).forEach(({ material }) => void material.dispose());
  });
</script>

<T is={layers.dust.sprite} />
<T is={layers.specks.sprite} />
