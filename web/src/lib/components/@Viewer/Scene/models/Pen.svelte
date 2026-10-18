<script lang="ts">
  import { T } from '@threlte/core';
  import { BufferGeometry, Float32BufferAttribute } from 'three';
  import { PLATINUM, useGrain } from './materials.svelte';
  import { anchor, extrudeFrom, latheFrom, parseSvg, smoothNormals } from './svg';
  import source from './svg/pen.svg?raw';

  const paths = parseSvg(source);
  const _lathe = (id: string) =>
    latheFrom(paths[id]!, { baseline: 140, segments: 48, divisions: 6 });
  const satin = ['barrel', 'crown'].map(_lathe);
  const polished = ['tip', 'nose', 'cap'].map(_lathe);

  const _CLIP_TAPER = { from: 13.5, to: 9.4, scale: 0.84 };
  const _taper = (geometry: BufferGeometry) =>
    ((position) => (
      Array.from({ length: position.count }).forEach(
        (_, i) =>
          void position.setZ(
            i,
            position.getZ(i) *
              (1 -
                (1 - _CLIP_TAPER.scale) *
                  Math.min(
                    1,
                    Math.max(
                      0,
                      (_CLIP_TAPER.from - position.getY(i)) / (_CLIP_TAPER.from - _CLIP_TAPER.to)
                    )
                  ))
          )
      ),
      geometry
    ))(geometry.getAttribute('position'));
  const _group = (geometry: BufferGeometry, group: number) =>
    ((range, part) => (
      part.setAttribute(
        'position',
        new Float32BufferAttribute(
          geometry
            .getAttribute('position')
            .array.slice(range.start * 3, (range.start + range.count) * 3),
          3
        )
      ),
      part.computeVertexNormals(),
      part
    ))(geometry.groups[group]!, new BufferGeometry());
  const clip = ((shape) => [_group(shape, 0), smoothNormals(_group(shape, 1))])(
    _taper(
      anchor(
        extrudeFrom(paths.clip!, { depth: 3.2, bevel: 0.4, bevelSegments: 4 }),
        'none',
        'none',
        'center'
      ).translate(0, 14, 0)
    )
  );
  const grain = useGrain(1);
  grain.repeat.set(6, 0.2);
</script>

{#each satin as part, i (i)}
  <T.Mesh geometry={part} castShadow>
    <T.MeshPhysicalMaterial {...PLATINUM} roughness={0.4} bumpMap={grain} />
  </T.Mesh>
{/each}
{#each polished as part, i (i)}
  <T.Mesh geometry={part} castShadow>
    <T.MeshPhysicalMaterial {...PLATINUM} roughness={0.2} />
  </T.Mesh>
{/each}
{#each clip as part, i (i)}
  <T.Mesh geometry={part} castShadow>
    <T.MeshPhysicalMaterial {...PLATINUM} roughness={0.24} />
  </T.Mesh>
{/each}
