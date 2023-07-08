<script lang="ts">
  import { imageInPreview } from "storage";
  import { delay } from "utils";
  import "./PreviewGallery.style.css";

  const closePreview = async (): Promise<void> => {
    const dialog = document.querySelector(".preview-box") as HTMLDialogElement;

    if (dialog) {
      await onClosed();
      dialog.close?.();
    }
  };

  const keyListener = (event: KeyboardEvent) => {
    event.stopPropagation();
    event.preventDefault();

    switch (event.key) {
      case "Escape":
        closePreview();
        break;
      case "ArrowLeft":
        setPreviousImage();
        break;
      case "ArrowRight":
        setNextImage();
        break;
    }
  };

  const onClosed = async (): Promise<void> => {
    const dialog = document.querySelector(".preview-box") as HTMLDialogElement;

    dialog.classList.add("closed");
    await delay(500);
    imageInPreview.set(null);
    dialog.removeAttribute("tabindex");
    document.removeEventListener("keydown", keyListener, false);
  };

  const getNewtIndex = (next: number): number => {
    if (!$imageInPreview) return 0;

    const currentIndex = $imageInPreview.gallery.indexOf($imageInPreview.src);
    const nextIndex =
      currentIndex + next >= $imageInPreview.gallery.length ||
      currentIndex + next < 0
        ? currentIndex
        : currentIndex + next;

    return nextIndex;
  };

  const setNextImage = () => {
    const newIndex = getNewtIndex(1);
    $imageInPreview &&
      ($imageInPreview.src = $imageInPreview.gallery[newIndex]);
  };

  const setPreviousImage = () => {
    const newIndex = getNewtIndex(-1);
    $imageInPreview &&
      ($imageInPreview.src = $imageInPreview.gallery[newIndex]);
  };

  const setActiveImage = (event: Event) =>
    $imageInPreview &&
    ($imageInPreview.src = new URL(
      (event.target as HTMLImageElement).src
    ).pathname);

  $: {
    let dialog = document.querySelector(".preview-box") as HTMLDialogElement;

    if ($imageInPreview?.src && dialog && !dialog.hasAttribute("open")) {
      dialog.classList.remove("closed");
      dialog.showModal?.();
      dialog.setAttribute("tabindex", "0");
      document.addEventListener("keydown", keyListener, false);
    }
  }
</script>

<dialog class="preview-box closed">
  {#if $imageInPreview?.src}
    <span class="close-handle" on:pointerdown={closePreview}>&times;</span>
    <img
      src={$imageInPreview?.src}
      alt={$imageInPreview?.title}
      id="image-preview"
    />
    <span class="previous-handle" on:pointerdown={setPreviousImage}>&lt;</span>
    <span class="next-handle" on:pointerdown={setNextImage}>&gt;</span>
    <span class="preview-gallery">
      {#each $imageInPreview.gallery as galleryImage}
        <img
          src={galleryImage}
          alt="Миниатюра"
          height="80px"
          on:pointerdown={setActiveImage}
          data-acitve={$imageInPreview.src === galleryImage}
          class="preview-gallery-image"
        />
      {/each}
    </span>
  {/if}
</dialog>
