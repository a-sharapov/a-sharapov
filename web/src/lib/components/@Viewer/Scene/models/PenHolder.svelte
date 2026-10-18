<script lang="ts">
  import { T } from '@threlte/core';
  import type { Placement } from '../layout';
  import { geometryOf } from './geometry-jobs';
  import { CERAMIC, useGrain } from './materials.svelte';

  interface IPenHolder {
    placement: Placement;
  }

  let { placement }: IPenHolder = $props();

  const { body, bottom } = geometryOf('penHolder');
  const grain = useGrain(4);
</script>

<T.Group name="penHolder" position={placement.position} rotation.y={placement.yaw}>
  <T.Mesh geometry={body} castShadow receiveShadow>
    <T.MeshPhysicalMaterial {...CERAMIC} bumpMap={grain} />
  </T.Mesh>
  <T.Mesh geometry={bottom} receiveShadow>
    <T.MeshPhysicalMaterial {...CERAMIC} roughness={0.7} />
  </T.Mesh>
</T.Group>
