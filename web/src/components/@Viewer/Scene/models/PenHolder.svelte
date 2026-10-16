<script lang="ts">
  import { T } from '@threlte/core';
  import { ExtrudeGeometry } from 'three';
  import type { Placement } from '../layout';
  import { CERAMIC, useGrain } from './materials.svelte';
  import { MM, parseSvg, shapeWithHoles, smoothNormals } from './svg';
  import penHolder from './svg/pen-holder.svg?raw';

  interface IPenHolder {
    placement: Placement;
  }

  let { placement }: IPenHolder = $props();

  const _HEIGHT = 90;
  const _TWIST = Math.PI / 4;
  const _TAPER = 0.86;
  const _BEVEL = 1.3;

  const section = parseSvg(penHolder);
  const _twist = (geometry: ExtrudeGeometry) => {
    const position = geometry.getAttribute('position');
    Array.from({ length: position.count }).forEach((_, i) => {
      const z = position.getZ(i) + _BEVEL;
      const t = Math.min(1, Math.max(0, z / _HEIGHT));
      const angle = _TWIST * t;
      const scale = _TAPER + (1 - _TAPER) * t;
      const x = position.getX(i) * scale;
      const y = position.getY(i) * scale;
      position.setXYZ(
        i,
        (x * Math.cos(angle) - y * Math.sin(angle)) * MM,
        z * MM,
        -(x * Math.sin(angle) + y * Math.cos(angle)) * MM
      );
    });
    return smoothNormals(geometry);
  };

  const body = _twist(
    new ExtrudeGeometry(shapeWithHoles(section.outer, section.inner), {
      depth: _HEIGHT - _BEVEL * 2,
      steps: 48,
      bevelEnabled: true,
      bevelThickness: _BEVEL,
      bevelSize: _BEVEL * 0.8,
      bevelOffset: -_BEVEL * 0.8,
      bevelSegments: 4,
      curveSegments: 12,
    })
  );
  const bottom = _twist(
    new ExtrudeGeometry(section.inner.toShapes(), {
      depth: 4 - _BEVEL,
      steps: 1,
      bevelEnabled: false,
      curveSegments: 12,
    })
  );

  const grain = useGrain(4);
</script>

<T.Group name="penHolder" position={placement.position} rotation.y={placement.yaw}>
  <T.Mesh geometry={body} castShadow receiveShadow>
    <T.MeshPhysicalMaterial {...CERAMIC} bumpMap={grain} />
  </T.Mesh>
  <T.Mesh geometry={bottom} receiveShadow>
    <T.MeshPhysicalMaterial {...CERAMIC} roughness={0.7} />
  </T.Mesh>
</T.Group>
