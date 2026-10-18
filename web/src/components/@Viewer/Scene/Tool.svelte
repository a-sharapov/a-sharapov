<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import type { Snippet } from 'svelte';
  import { Group, Quaternion, Vector3 } from 'three';
  import { rollJitter, TOOL_STEADY, type Tool, type ToolJitter } from './staging';
  import { rig } from './state.svelte';
  import { toolPose, toolProgress } from './tools';

  interface ITool {
    name: Tool;
    children: Snippet;
  }

  let { name, children }: ITool = $props();

  const group = new Group();
  const pose = { position: new Vector3(), quaternion: new Quaternion() };
  let jitter: ToolJitter = TOOL_STEADY;
  let moved = 0;

  useTask(
    `tool-${name}`,
    () =>
      void (((s) => (void (s > 0 && moved === 0 && (jitter = rollJitter(name))), (moved = s)))(
        toolProgress(name, rig.actors)
      ),
      toolPose(name, rig.actors, pose, jitter) &&
        !(group.position.equals(pose.position) && group.quaternion.equals(pose.quaternion)) &&
        (group.position.copy(pose.position),
        group.quaternion.copy(pose.quaternion),
        (rig.shadowsDirty = true)))
  );
</script>

<T is={group} name="tool-{name}">{@render children()}</T>
