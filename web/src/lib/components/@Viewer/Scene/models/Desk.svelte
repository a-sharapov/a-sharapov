<script lang="ts">
  import { T } from '@threlte/core';
  import type { MixedMood } from '../mood';

  interface IDesk {
    mood: MixedMood;
  }

  let { mood }: IDesk = $props();
</script>

<T.Mesh rotation.x={-Math.PI / 2} receiveShadow>
  <T.CircleGeometry args={[900, 64]} />
  <T.MeshStandardMaterial color={mood.colors.desk} roughness={1} envMapIntensity={0.6} />
</T.Mesh>
