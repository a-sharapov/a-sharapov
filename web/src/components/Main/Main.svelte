<script>
  import store from '@lib/shared/store'
  import './Main.scss'
</script>

<main>
  {#if !$store.sceneReady}
    <section class="contentBox">
      <slot />
    </section>
  {/if}
</main>
