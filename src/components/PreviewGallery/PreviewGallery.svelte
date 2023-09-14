<script lang="ts">
  import { imageInPreview } from "storage";
  import { delay } from "utils";
  import "./PreviewGallery.style.css";

  const definedWindow = typeof window !== "undefined";

  const closePreview = async (): Promise<void> => {
    const dialog = definedWindow
      ? (document.querySelector(".preview-box") as HTMLDialogElement)
      : null;

    if (dialog) {
      await onClosed();
      dialog.close?.();
    }
  };

  const keyListener = (event: KeyboardEvent) => {
    event.stopPropagation();

    switch (event.key) {
      case "Escape":
        event.preventDefault();
        closePreview();
        break;
      case "ArrowLeft":
        setPreviousImage();
        break;
      case "ArrowRight":
        setNextImage();
        break;
      case "ArrowUp":
        zoomImageIn();
        break;
      case "ArrowDown":
        zoomImageOut();
        break;
    }
  };

  const mouseListener = (event: WheelEvent) => {
    event.stopPropagation();

    if (event.deltaY > 0) {
      zoomImageOut();
    } else {
      zoomImageIn();
    }
  };

  const onClosed = async (): Promise<void> => {
    const dialog = definedWindow
      ? (document.querySelector(".preview-box") as HTMLDialogElement)
      : null;

    if (dialog) {
      dialog.classList.add("closed");
      await delay(500);
      imageInPreview.set(null);
      dialog.removeAttribute("tabindex");
      document.removeEventListener("keydown", keyListener, false);
      document.removeEventListener("wheel", mouseListener, false);
    }
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

  const getCurrentZoom = (image: HTMLImageElement): number =>
    Number(image.style.transform.match(/\d+/g)?.join(".")) || 1;

  const zoomImageIn = () => {
    const image = definedWindow
      ? (document.querySelector("#image-preview") as HTMLImageElement)
      : null;

    if (image) {
      image.style.transform = `scale(${
        getCurrentZoom(image) > 3
          ? getCurrentZoom(image)
          : getCurrentZoom(image) + 0.1
      })`;
    }
  };

  const zoomImageOut = () => {
    const image = definedWindow
      ? (document.querySelector("#image-preview") as HTMLImageElement)
      : null;

    if (image) {
      image.style.transform = `scale(${
        getCurrentZoom(image) > 0.5
          ? getCurrentZoom(image) - 0.1
          : getCurrentZoom(image)
      })`;
    }
  };

  const setActiveImage = (event: Event) =>
    $imageInPreview &&
    ($imageInPreview.src = new URL(
      (event.target as HTMLImageElement).src
    ).pathname);

  $: {
    let dialog = definedWindow
      ? (document.querySelector(".preview-box") as HTMLDialogElement)
      : null;
    let image = definedWindow
      ? (document.querySelector("#image-preview") as HTMLImageElement)
      : null;

    if ($imageInPreview?.src && dialog && !dialog.hasAttribute("open")) {
      dialog.classList.remove("closed");
      dialog.showModal?.();
      dialog.setAttribute("tabindex", "0");
      document.addEventListener("keydown", keyListener, false);
      document.addEventListener("wheel", mouseListener, false);
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
