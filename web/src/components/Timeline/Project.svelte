<script>
  import { LOCALES } from '@lib/l18n'
  import store from '@lib/shared/store'
  import { slide } from 'svelte/transition'

  export let name
  export let stack

  let isActive = false
  const toggleActive = () => (isActive = !isActive)
</script>

<article class="project" class:active={isActive}>
  <h5 on:pointerdown={toggleActive}>{name}</h5>
  {#if isActive}
    <div transition:slide class="description">
      <slot />
      <ul class="stack">
        <li>{LOCALES[$store.locale].STACK}:</li>
        {#each stack.split(',') as item}
          <li>{item}</li>
        {/each}
      </ul>
    </div>
  {/if}
</article>
