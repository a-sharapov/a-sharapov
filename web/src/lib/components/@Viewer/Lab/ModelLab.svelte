<script lang="ts">
  import { Canvas } from '@threlte/core';
  import { NeutralToneMapping, PCFShadowMap } from 'three';
  import { WebGPURenderer } from 'three/webgpu';
  import LabScene from './LabScene.svelte';

  interface IModelLab {
    model: string;
  }

  let { model }: IModelLab = $props();
</script>

<div class="lab">
  <Canvas
    toneMapping={NeutralToneMapping}
    shadows={PCFShadowMap}
    renderMode="always"
    createRenderer={(canvas) => new WebGPURenderer({ canvas, antialias: true })}
  >
    <LabScene {model} />
  </Canvas>
</div>

<style>
  .lab {
    position: fixed;
    inset: 0;
  }
</style>
