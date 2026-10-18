<script lang="ts">
  import { T, useThrelte } from '@threlte/core';
  import { onDestroy } from 'svelte';
  import { type Color, RingGeometry, Vector3 } from 'three';
  import type { MeshPhysicalNodeMaterial, WebGPURenderer } from 'three/webgpu';
  import type { XYZ } from '$lib/common/types';
  import { createCoffeeMaterial } from '../Coffee/nodes';
  import { computeLampRig } from '../lamp-rig';
  import { LAMP, type Placement, WINDOWS } from '../layout';
  import type { MixedMood } from '../mood';
  import Steam from '../Steam/Steam.svelte';
  import {
    bakeStudios,
    CUP_ZONES,
    createPorcelain,
    createPorcelainLight,
    glazeLevel,
    HANDLE_ZONES,
    SAUCER_ZONES,
    type Studios,
  } from './porcelain';
  import { latheFrom, MM, parseSvg, sweepFrom } from './svg';
  import source from './svg/cup.svg?raw';

  interface ICup {
    placement: Placement;
    steamOpacity: number;
    steamColor: Color;
    mood: MixedMood;
  }

  let { placement, steamOpacity, steamColor, mood }: ICup = $props();

  const _DESK = 80;
  const _COFFEE_TOP = 59.15 * MM;
  const _COFFEE_RADIUS = 33.9 * MM;
  const _SCALE = 0.9;
  const _FOOT = (_DESK - 76.8) * MM;
  const _LIFT = _FOOT * (1 - _SCALE);

  const paths = parseSvg(source);
  const _lathe = (id: string) =>
    latheFrom(paths[id]!, { baseline: _DESK, segments: 96, divisions: 3 });
  const cup = _lathe('cup');
  const saucer = _lathe('saucer');
  const coffee = new RingGeometry(0.0005, _COFFEE_RADIUS, 192, 72).rotateX(-Math.PI / 2);
  const coffeeMaterial = createCoffeeMaterial();

  onDestroy(() => {
    coffee.dispose();
    coffeeMaterial.dispose();
  });

  const _series = (name: string) =>
    ((paths.handle!.userData?.node as Element | undefined)?.getAttribute(name) ?? '')
      .split(' ')
      .map(Number)
      .filter(Number.isFinite);
  const _thickness = _series('data-thickness');
  const _width = _series('data-width');
  const _at = (series: number[], t: number) =>
    ((i, k) => series[k]! + (series[k + 1]! - series[k]!) * (i - k))(
      t * (series.length - 1),
      Math.min(series.length - 2, Math.floor(t * (series.length - 1)))
    );
  const handle = sweepFrom(paths.handle!, {
    radius: [0.5, 0.5],
    profile: (t) => [_at(_thickness, t), _at(_width, t)],
    segments: 160,
    radial: 28,
  });

  const { renderer } = useThrelte();
  const _BULB = computeLampRig().bulb;
  const light = createPorcelainLight();
  light.lampPosition.value.copy(_BULB);
  light.lampDirection.value
    .set(...LAMP.target)
    .sub(_BULB)
    .normalize();
  let studios: Studios | null = null;
  let porcelain = $state<Record<'saucer' | 'cup' | 'handle', MeshPhysicalNodeMaterial> | null>(
    null
  );
  void (renderer as unknown as WebGPURenderer).init().then(
    () =>
      void ((studios = bakeStudios(
        renderer as unknown as WebGPURenderer,
        WINDOWS,
        _BULB
          .clone()
          .sub(new Vector3(...placement.position))
          .toArray() as XYZ
      )),
      (porcelain = {
        saucer: createPorcelain(light, SAUCER_ZONES(), studios),
        cup: createPorcelain(light, CUP_ZONES(), studios),
        handle: createPorcelain(light, HANDLE_ZONES(), studios),
      })),
    (error: unknown) => void console.error('Cup: окружение не запеклось', error)
  );

  $effect(() => {
    light.lampColor.value.copy(mood.colors.lamp).multiplyScalar(540 * mood.lamp);
    light.night.value = mood.night;
    light.glaze.value = glazeLevel(mood.night);
  });

  onDestroy(() => {
    void (porcelain && Object.values(porcelain).forEach((material) => void material.dispose()));
    studios?.dispose();
  });
</script>

<T.Group name="cup" position={placement.position} rotation.y={placement.yaw}>
  {#if porcelain}
    <T.Mesh geometry={saucer} material={porcelain.saucer} castShadow receiveShadow />
  {/if}
  <T.Group position.y={_LIFT} scale={_SCALE}>
    {#if porcelain}
      <T.Mesh geometry={cup} material={porcelain.cup} castShadow receiveShadow />
      <T.Mesh
        geometry={handle}
        material={porcelain.handle}
        position.y={_DESK * MM}
        castShadow
        receiveShadow
      />
    {/if}
    <T.Mesh geometry={coffee} material={coffeeMaterial} position.y={_COFFEE_TOP} />
  </T.Group>
  <T.Group visible={steamOpacity > 0.01}>
    <Steam
      position={[0, _LIFT + _COFFEE_TOP * _SCALE + 0.1, 0]}
      opacity={steamOpacity}
      color={steamColor}
    />
  </T.Group>
</T.Group>
