<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import { onDestroy } from 'svelte';
  import { planeFold } from '../flight';
  import type { Placement } from '../layout';
  import { rig } from '../state.svelte';
  import { PAPER, useGrain } from './materials.svelte';
  import { createPaperGeometry, createPlaneFold } from './plane-fold';
  import source from './svg/paper-plane.svg?raw';

  interface IPaperPlane {
    placement: Placement;
  }

  let { placement }: IPaperPlane = $props();

  const paper = createPaperGeometry(
    createPlaneFold(source),
    planeFold.unfold,
    rig.stages.plane.face
  );
  const grain = useGrain(3);

  let last = { unfold: -1, width: 0, height: 0 };
  useTask(
    'paper-plane',
    () => {
      const unfold = planeFold.unfold;
      const { 0: width, 1: height } = rig.stages.plane.face;
      void (
        (unfold !== last.unfold || width !== last.width || height !== last.height) &&
        (paper.update(unfold, [width, height]),
        (rig.shadowsDirty = true),
        (last = { unfold, width, height }))
      );
    },
    { after: 'actor-plane' }
  );

  onDestroy(() => paper.geometry.dispose());
</script>

<T.Group name="paperPlane" position={placement.position} rotation.y={placement.yaw}>
  <T.Mesh geometry={paper.geometry} castShadow receiveShadow>
    <T.MeshStandardMaterial {...PAPER} bumpMap={grain} />
  </T.Mesh>
</T.Group>
