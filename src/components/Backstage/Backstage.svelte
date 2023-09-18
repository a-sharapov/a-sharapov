<script lang="ts">
  import Ashes from "components/Ashes/Ashes.svelte";
  import CoffeeCup from "components/CoffeeCup/CoffeeCup.svelte";
  import Lamp from "components/Lamp/Lamp.svelte";
  import Paperplane from "components/Paperplane/Paperplane.svelte";
  import Pencils from "components/Pencils/Pencils.svelte";
  import { loading } from "storage";

  loading.set(false);

  const ratio: number = 0.01;
  const calcOffset = (initial: number): string =>
    Number((initial - window.innerWidth / 2) * ratio).toFixed(2);

  if (typeof window !== "undefined") {
    document.addEventListener("pointermove", (e: PointerEvent): void => {
      const body = document.querySelector("body");
      if (body) {
        body.style.setProperty("--moveX", calcOffset(e.pageX));
        body.style.setProperty("--moveY", calcOffset(e.pageY));
      }
    });
  }

  import "./Backstage.style.css";
</script>

<Ashes />
<CoffeeCup />
<Pencils />
<Paperplane />
<Lamp />
