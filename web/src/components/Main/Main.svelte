<script>
  import store from '@lib/shared/store'
  import './Main.scss'
</script>

<main>
  {#if !$store.sceneIsReady || !$store.sceneIs3D}
    <section class="contentBox">
      <slot />
    </section>
  {/if}
</main>
