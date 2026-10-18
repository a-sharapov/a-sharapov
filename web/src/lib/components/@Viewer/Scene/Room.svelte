<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import type { Snippet } from 'svelte';
  import { Group } from 'three';
  import { type Prop, roomFor } from './staging';
  import { rig } from './state.svelte';

  interface IRoom {
    prop: Prop;
    children: Snippet;
  }

  let { prop, children }: IRoom = $props();

  const group = new Group();

  useTask(`room-${prop}`, () =>
    ((offset) =>
      void (
        (offset[0] !== group.position.x || offset[2] !== group.position.z) &&
        (group.position.set(...offset), (rig.shadowsDirty = true))
      ))(roomFor(prop, rig.actors))
  );
</script>

<T is={group} name="room-{prop}">{@render children()}</T>
