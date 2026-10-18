<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { onDestroy } from 'svelte';
  import { Color, CylinderGeometry, type Mesh, Quaternion, Vector3 } from 'three';
  import type { WebGPURenderer } from 'three/webgpu';
  import type { XYZ } from '$lib/common/types';
  import { FLAT_LAYER } from '../layers';
  import { movers } from '../movers';
  import { wind } from '../wind';
  import { STEAM_VOLUME } from './axis';
  import { clearDrift, createSteamDrift, driftResting, settleDrift, stepDrift } from './drift';
  import { createSteamMaterial } from './nodes';

  interface ISteam {
    position: XYZ;
    opacity?: number;
    color?: Color;
  }

  let { position, opacity = 0.55, color = new Color('#ffffff') }: ISteam = $props();

  const geometry = new CylinderGeometry(
    STEAM_VOLUME.radius,
    STEAM_VOLUME.radius,
    STEAM_VOLUME.height,
    32
  ).translate(0, STEAM_VOLUME.height / 2, 0);
  const { renderer } = useThrelte();
  const drift = createSteamDrift();
  const steam = createSteamMaterial(0, renderer as unknown as WebGPURenderer, drift.local);

  let mesh = $state.raw<Mesh>();
  const base = new Vector3();
  const at = new Vector3();
  const air = new Vector3();
  const turn = new Quaternion();

  const _SAMPLES = 9;
  const samples = new Float32Array(_SAMPLES * 2);
  const flow: [number, number] = [0, 0];

  const _sampleAir = () =>
    Array.from({ length: _SAMPLES }).forEach(
      (_, i) =>
        void (at.set(base.x, base.y + (i / (_SAMPLES - 1)) * STEAM_VOLUME.height, base.z),
        wind.airAt(at, air, 'cup'),
        (samples[i * 2] = air.x - movers.cup.velocity.x),
        (samples[i * 2 + 1] = air.z - movers.cup.velocity.z))
    );

  const _relative = (h: number): [number, number] =>
    ((level, below) =>
      ((f, above) => (
        (flow[0] = samples[below * 2]! + (samples[above * 2]! - samples[below * 2]!) * f),
        (flow[1] =
          samples[below * 2 + 1]! + (samples[above * 2 + 1]! - samples[below * 2 + 1]!) * f),
        flow
      ))(level - below, Math.min(below + 1, _SAMPLES - 1)))(
      h * (_SAMPLES - 1),
      Math.floor(h * (_SAMPLES - 1))
    );

  const _calm = () => wind.state.active === 0 && movers.cup.speed < 1e-3 && driftResting(drift);

  useTask('steam-drift', (delta) => {
    wind.step(delta, (renderer as unknown as WebGPURenderer).info.frame);
    void (
      mesh &&
      (_calm()
        ? clearDrift(drift)
        : (mesh.getWorldPosition(base),
          mesh.getWorldQuaternion(turn),
          _sampleAir(),
          stepDrift(drift, Math.min(delta, 0.05), _relative),
          ((yaw) => settleDrift(drift, Math.cos(yaw), Math.sin(yaw)))(
            2 * Math.atan2(turn.y, turn.w)
          )))
    );
  });

  $effect(() => {
    steam.opacity.value = opacity;
    steam.tint.value.copy(color);
  });

  onDestroy(() => {
    geometry.dispose();
    steam.material.dispose();
    steam.noise.dispose();
  });
</script>

<T.Mesh
  name="steam"
  bind:ref={mesh}
  {position}
  {geometry}
  material={steam.material}
  renderOrder={2}
  oncreate={(created) => void created.layers.set(FLAT_LAYER)}
/>
