<script>
  import { T } from '@threlte/core'
  import { useGltf } from '@threlte/extras'
  import { COFFEE, CUP } from './assets'
  import { currentState, INTRO } from './state'
  import Steam from './Steam/Steam.svelte'
</script>

<T.Group position={COFFEE.POSITION.DEFAULT} rotation={COFFEE.ROTATION.DEFAULT} scale={COFFEE.SCALE}>
  {#await useGltf('/models/coffee.glb') then cup}
    {#if $currentState === INTRO}
      <Steam />
    {/if}
    <T
      is={cup.scene}
      position={CUP.POSITION.DEFAULT}
      rotation={CUP.ROTATION.DEFAULT}
      scale={CUP.SCALE}
      castShadow
      receiveShadow
    />
  {/await}
</T.Group>
