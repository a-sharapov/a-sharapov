<script lang="ts">
  import { DICTIONARY } from "constants/dictionary";
  import { writable } from "svelte/store";

  let active = writable<boolean>(false);
  let content = writable<string>(DICTIONARY.slogan);

  const handleOnMouseEnter = (): void => {
    active.set(true);
    content.set(DICTIONARY.altSlogan);
  };

  const handleOnMouseLeave = (): void => {
    active.set(false);
    content.set(DICTIONARY.slogan);
  };

  import "./Vcard.style.css";
</script>

<a
  id="vcard"
  data-active={$active}
  href="cv"
  on:pointerenter={handleOnMouseEnter}
  on:pointerleave={handleOnMouseLeave}
>
  <span class="content">
    <img
      src="/i/logo.svg"
      class="vcard-logo"
      width="250px"
      alt={DICTIONARY.name}
    /><br />
    <span class="vcard-slogan narrow" data-active={$active}>{$content}</span>
  </span>
</a>
