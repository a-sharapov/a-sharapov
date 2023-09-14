<script lang="ts">
  import { imageInPreview } from "storage";
  import { inclineTime } from "utils";
  import "./Examples.style.css";
  type Example = {
    mainSrc: string;
    title?: string;
    description?: string;
    logoSrc?: string;
  };

  export let addons: string[] = [];
  export let content: Example[] = [];

  const exampleImages = content.map((example: Example) => example.mainSrc);
  const updateImageInPreview = (example: Example): void => {
    imageInPreview.set({
      src: example.mainSrc,
      title: example.title,
      description: example.description,
      gallery: [...exampleImages, ...addons],
    });
  };
</script>

<aside class="examples-slider">
  {#each content as example}
    <figure
      class="example-composition"
      on:pointerdown={() => {
        updateImageInPreview(example);
      }}
    >
      {#if example.title}
        <figcaption>{example.title}</figcaption>
      {/if}
      <img
        src={example.mainSrc}
        alt={example.title || ""}
        class="example-image"
      />
      {#if example.logoSrc}
        <img
          src={example.logoSrc}
          class="example-logo"
          alt={`Логотип ${example.title}`}
        />
      {/if}
    </figure>
  {/each}
  {#if addons.length > 0}
    <div
      class="more-preview"
      on:pointerdown={() => {
        updateImageInPreview({
          mainSrc: addons[0],
          title: "Другие примеры",
          description: "Другие примеры",
        });
      }}
    >
      <img loading="lazy" src={addons[0]} alt="" class="other-preview-bg" />
      <span>
        И ещё {addons.length}
        {inclineTime(addons.length, ["пример", "примера", "примеров"])}</span
      >
    </div>
  {/if}
</aside>
