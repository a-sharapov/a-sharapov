<script lang="ts">
  import CoffeeCup from "components/CoffeeCup/CoffeeCup.svelte";
  import Lamp from "components/Lamp/Lamp.svelte";
  import Paperplane from "components/Paperplane/Paperplane.svelte";
  import Pencils from "components/Pencils/Pencils.svelte";
  import { loading } from "storage";
  import { writable } from "svelte/store";

  loading.set(false);

  let moves = writable<number>(0);
  const ratio: number = 0.01;

  if (typeof window !== "undefined") {
    document.addEventListener("pointermove", (e: PointerEvent): void => {
      moves.set((e.pageX - window.innerWidth / 2) * ratio);
    });
  }

  import "./Backstage.style.css";
</script>

<div id="backstage">
  <CoffeeCup left={$moves} />
  <Pencils left={-$moves * 0.5} />
  <Paperplane left={$moves * 0.3} />
  <Lamp left={-$moves * 0.01} />
</div>
