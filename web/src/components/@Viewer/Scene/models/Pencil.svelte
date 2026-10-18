<script lang="ts">
  import { T } from '@threlte/core';
  import { CERAMIC, OAK, useWood } from './materials.svelte';
  import { latheFrom, parseSvg } from './svg';
  import source from './svg/pencil.svg?raw';

  const paths = parseSvg(source);
  const parts = Object.fromEntries(
    ['body', 'wood', 'lead'].map((id) => [
      id,
      latheFrom(paths[id]!, { baseline: 175, segments: 28 }),
    ])
  );
  const wood = useWood(parts.wood!);
</script>

<T.Mesh geometry={parts.body} castShadow>
  <T.MeshPhysicalMaterial {...CERAMIC} color="#f4f3ef" roughness={0.5} />
</T.Mesh>
<T.Mesh geometry={parts.wood} castShadow>
  <T.MeshStandardMaterial {...OAK} color="#ecd2a8" map={wood} bumpMap={wood} />
</T.Mesh>
<T.Mesh geometry={parts.lead}>
  <T.MeshStandardMaterial color="#2b2b2e" roughness={0.5} metalness={0.3} />
</T.Mesh>
