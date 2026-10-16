<script lang="ts">
  import { T } from '@threlte/core';
  import { PLATINUM, useGrain } from './materials.svelte';
  import { latheFrom, parseSvg } from './svg';
  import source from './svg/stylus.svg?raw';

  const paths = parseSvg(source);
  const parts = Object.fromEntries(
    ['body', 'ring', 'tip'].map((id) => [
      id,
      latheFrom(paths[id]!, { baseline: 166, segments: 32 }),
    ])
  );
  const grain = useGrain(4);
</script>

<T.Mesh geometry={parts.body} castShadow>
  <T.MeshPhysicalMaterial {...PLATINUM} roughness={0.4} bumpMap={grain} />
</T.Mesh>
<T.Mesh geometry={parts.ring} castShadow>
  <T.MeshPhysicalMaterial {...PLATINUM} roughness={0.2} />
</T.Mesh>
<T.Mesh geometry={parts.tip} castShadow>
  <T.MeshPhysicalMaterial color="#f2f1ee" roughness={0.45} />
</T.Mesh>
