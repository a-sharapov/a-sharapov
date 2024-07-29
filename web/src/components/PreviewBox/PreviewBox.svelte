<script>
  import store from '@lib/shared/store'
  import { delay } from '@lib/shared/utils'
  import { onMount } from 'svelte'
  import { pinch } from 'svelte-gestures'
  import './PreviewBox.scss'

  let dialog = null
  let imagePreview = null
  export let eventName = 'triggerGalleryPreview'

  const closePreview = async () => {
    if (dialog) {
      await onClosed()
      void dialog.close?.()
    }
  }

  const mouseListener = (event) => (event.deltaY > 0 ? void zoomImageOut() : void zoomImageIn())

  const onClosed = async () => {
    document.querySelector('html')?.classList.remove('no-scroll')
    dialog?.classList.add('closed')
    await delay(500)
    store.update((store) => ({
      ...store,
      activeImage: null
    }))
    dialog?.removeAttribute('tabindex')
    document.removeEventListener('keydown', keyListener, false)
    document.removeEventListener('wheel', mouseListener, false)
  }

  const getNewtIndex = (next) => {
    const currentIndex = $store.gallery.indexOf($store.activeImage)
    const nextIndex =
      currentIndex + next >= $store.gallery.length || currentIndex + next < 0
        ? currentIndex
        : currentIndex + next

    return !$store.activeImage ? 0 : nextIndex
  }

  const setNextImage = () => {
    const newIndex = getNewtIndex(1)
    $store && ($store.activeImage = $store.gallery[newIndex])
  }

  const setPreviousImage = () => {
    const newIndex = getNewtIndex(-1)
    $store && ($store.activeImage = $store.gallery[newIndex])
  }

  const getCurrentZoom = (image) => Number(image.style.transform.match(/\d+/g)?.join('.')) || 1

  const zoomImageIn = () => {
    if (imagePreview) {
      imagePreview.style.transform = `scale(${
        getCurrentZoom(imagePreview) > 3
          ? getCurrentZoom(imagePreview)
          : getCurrentZoom(imagePreview) + 0.1
      })`
    }
  }

  const zoomImageOut = () => {
    if (imagePreview) {
      imagePreview.style.transform = `scale(${
        getCurrentZoom(imagePreview) > 0.5
          ? getCurrentZoom(imagePreview) - 0.1
          : getCurrentZoom(imagePreview)
      })`
    }
  }

  const pinchListener = ({ detail }) => {
    const { scale } = detail

    if (scale > 1) {
      void zoomImageIn()
    } else {
      void zoomImageOut()
    }
  }

  const setActiveImage = (src) => $store && ($store.activeImage = src)

  const BINDINGS = {
    Escape: closePreview,
    ArrowLeft: setPreviousImage,
    ArrowRight: setNextImage,
    ArrowUp: zoomImageIn,
    ArrowDown: zoomImageOut
  }

  const keyListener = (event) => void BINDINGS[event.key]?.()

  onMount(() => {
    store.subscribe((store) => {
      if (store.activeImage && dialog && !dialog.hasAttribute('open')) {
        document.querySelector('html')?.classList.add('no-scroll')
        dialog.classList.remove('closed')
        dialog.showModal?.()
        dialog.setAttribute('tabindex', '0')

        document.addEventListener('keydown', keyListener, false)
        document.addEventListener('wheel', mouseListener, false)
      }
    })

    const productGalleryPreviewListener = ({ detail }) =>
      store.update((store) => ({
        ...store,
        activeImage: image,
        gallery: gallery || []
      }))

    document.addEventListener(eventName, productGalleryPreviewListener)

    return () => {
      document.removeEventListener('keydown', keyListener, false)
      document.removeEventListener('wheel', mouseListener, false)
      document.removeEventListener(eventName, productGalleryPreviewListener, false)
    }
  })
</script>

<dialog class="wrapper previewBox closed" bind:this={dialog} use:pinch on:pinch={pinchListener}>
  {#if $store?.activeImage}
    <button class="action" tabindex="0" aria-label="Close" on:click={closePreview}>
      <img src="/i/close.svg" alt="" />
    </button>
    <img src={$store?.activeImage} alt="" id="imagePreview" bind:this={imagePreview} />
    <span class="action" data-direction="prev" on:pointerdown={setPreviousImage} />
    <span class="action" data-direction="next" on:pointerdown={setNextImage} />
    <span class="previewGallery">
      {#each $store.gallery as galleryImage}
        <img
          src={galleryImage}
          alt=""
          height="80px"
          on:pointerdown={() => void setActiveImage(galleryImage)}
          data-acitve={$store.activeImage === galleryImage}
          class="previewGalleryImage"
          loading="lazy"
        />
      {/each}
    </span>
  {/if}
</dialog>
