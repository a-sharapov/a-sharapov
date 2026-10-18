<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core';
  import { interactivity } from '@threlte/extras';
  import { onDestroy, untrack } from 'svelte';
  import { cubicInOut } from 'svelte/easing';
  import { Tween } from 'svelte/motion';
  import type { Light, LightShadow, Object3D } from 'three';
  import { shell } from '#lib/common/shell.svelte.ts';
  import type { Shot } from '#lib/common/types.ts';
  import SoundCues from '../Sound/SoundCues.svelte';
  import Actor from './Actor.svelte';
  import Bokeh from './Bokeh/Bokeh.svelte';
  import { bindCameraRig } from './camera-rig.svelte';
  import { idleWhenSettled } from './idle.svelte';
  import Lights from './Lights.svelte';
  import { FLAT_LAYER } from './layers';
  import { CUP, ORIGIN, PEN_HOLDER } from './layout';
  import BusinessCard from './models/BusinessCard.svelte';
  import Cup from './models/Cup.svelte';
  import Desk from './models/Desk.svelte';
  import { prepareGeometry } from './models/geometry-jobs';
  import Lamp from './models/Lamp.svelte';
  import PaperPlane from './models/PaperPlane.svelte';
  import Pen from './models/Pen.svelte';
  import Pencil from './models/Pencil.svelte';
  import PenHolder from './models/PenHolder.svelte';
  import ReflectiveDesk from './models/ReflectiveDesk.svelte';
  import Resume from './models/Resume.svelte';
  import Sketchbook from './models/Sketchbook.svelte';
  import Stylus from './models/Stylus.svelte';
  import Tablet from './models/Tablet.svelte';
  import { mixLit, THEME_MOOD } from './mood';
  import { resetMovers, trackMovers } from './movers';
  import { bindPostFx } from './postfx.svelte';
  import type { Quality } from './quality';
  import ReadingLight from './ReadingLight.svelte';
  import Room from './Room.svelte';
  import { warmRoomsAside } from './rooms';
  import { SHOT_FOV } from './shots';
  import { ROOM_WARMUP, warmRoom } from './staging';
  import { rig } from './state.svelte';
  import Tool from './Tool.svelte';
  import type { CardBack, CardFace } from './textures';
  import { clickAt, type ThemeState, themeCue } from './theme-cue';

  interface IScene {
    shot: Shot;
    ready: boolean;
    epoch: number;
    face: CardFace;
    back: CardBack;
    quality: Quality;
    reducedMotion: boolean;
    launched: boolean;
    onloaded: () => void;
    onmoving: () => void;
    onsettled: () => void;
  }

  let {
    shot,
    ready,
    epoch,
    face,
    back,
    quality,
    reducedMotion,
    launched,
    onloaded,
    onmoving,
    onsettled,
  }: IScene = $props();

  const geometry = prepareGeometry();
  let modeled = $state(false);
  void geometry.then(() => (modeled = true));

  interactivity();

  const _night = () => THEME_MOOD[shell.theme] === 'evening';
  const theme = $state(((lit) => ({ ambient: lit, power: lit, press: 0 }))(_night() ? 1 : 0));
  let cue: {
    from: ThemeState;
    night: boolean;
    t: number;
    prev: number;
  } | null = null;
  rig.lamp.power = theme.power;
  const intro = new Tween(shot === 'intro' ? 1 : 0, {
    duration: 900,
    easing: cubicInOut,
  });

  $effect(() => {
    const night = _night();
    untrack(
      () =>
        void ((night ? theme.ambient < 1 : theme.ambient > 0) ||
        (night ? theme.power < 1 : theme.power > 0)
          ? (cue = {
              from: { ambient: theme.ambient, power: theme.power },
              night,
              t: 0,
              prev: -1,
            })
          : (cue = null))
    );
  });

  useTask('theme-cue', (delta) =>
    ((current) =>
      void (
        current &&
        ((current.t += delta),
        ((state, click) =>
          void (Object.assign(theme, {
            ambient: state.ambient,
            power: state.power,
            press: state.press,
          }),
          Object.assign(rig.lamp, { power: state.power, press: state.press }),
          click !== null && current.prev < click && current.t >= click && (rig.lamp.clicks += 1),
          (current.prev = current.t),
          (rig.shadowsDirty = true),
          state.done && (cue = null)))(
          themeCue(current.from, current.night, current.t, reducedMotion),
          clickAt(current.from, current.night)
        ))
      ))(cue)
  );

  $effect(() => {
    intro.target = shot === 'intro' ? 1 : 0;
  });

  const mood = $derived(mixLit(theme.ambient, theme.power));

  let hover = $state(false);

  bindCameraRig({
    getShot: () => shot,
    getEpoch: () => epoch,
    getReady: () => ready,
    getHover: () => hover,
    getLaunched: () => launched,
    reducedMotion,
    onLoaded: () => void geometry.then(onloaded),
    onMoving: onmoving,
    onSettled: onsettled,
  });

  bindPostFx(() => mood, quality);

  const { scene } = useThrelte();
  let warmup = 45;
  const stale = new Set<Light>();
  const _redraw = (light: Light, shadow: LightShadow, dirty: boolean) =>
    void (shadow.camera.layers.enable(FLAT_LAYER),
    (shadow.autoUpdate = false),
    light.intensity === 0
      ? dirty && stale.add(light)
      : (dirty || stale.has(light)) &&
        ((shadow.needsUpdate = true), (rig.shadowsRedrawn = true), stale.delete(light)));
  useTask('shadow-freeze', () =>
    ((dirty) =>
      void ((rig.shadowsRedrawn = dirty),
      (dirty || stale.size > 0) &&
        scene.traverse((object) =>
          ((shadow) =>
            void (
              (object as Light).isLight &&
              object.castShadow &&
              shadow &&
              _redraw(object as Light, shadow, dirty)
            ))((object as Object3D & { shadow?: LightShadow }).shadow)
        ),
      (warmup = Math.max(0, warmup - 1)),
      (rig.shadowsDirty = false)))(warmup > 0 || rig.shadowsDirty)
  );

  useTask('movers', (delta) => trackMovers(scene, delta));
  onDestroy(resetMovers);

  warmRoomsAside(ROOM_WARMUP);
  idleWhenSettled(ROOM_WARMUP.map((actor) => () => warmRoom(actor)));
</script>

<T.PerspectiveCamera
  makeDefault
  fov={SHOT_FOV}
  near={1}
  far={1600}
  oncreate={(camera) => void camera.layers.enable(FLAT_LAYER)}
/>

<Lights {mood} shadows intro={intro.current} />
<ReadingLight {mood} />

<Desk {mood} />
<ReflectiveDesk {mood} resolution={quality.reflection} />
<Room prop="card">
  <BusinessCard {face} {back} interactive={shot === 'intro'} onhover={(value) => (hover = value)} />
</Room>
<Room prop="cup">
  <Cup placement={CUP} steamOpacity={mood.steam} steamColor={mood.colors.steam} {mood} />
</Room>
<Room prop="penHolder">
  {#if modeled}
    <PenHolder placement={PEN_HOLDER} />
  {/if}
</Room>
<Tool name="pen"><Pen /></Tool>
<Tool name="pencil"><Pencil /></Tool>
<Tool name="stylus"><Stylus /></Tool>
<Room prop="plane">
  <Actor name="plane"><PaperPlane placement={ORIGIN} /></Actor>
</Room>
<Actor name="tablet"><Tablet placement={ORIGIN} screenColor={mood.colors.screen} /></Actor>
<Actor name="resume"><Resume placement={ORIGIN} /></Actor>
<Actor name="sketchbook">
  {#if modeled}
    <Sketchbook placement={ORIGIN} />
  {/if}
</Actor>
<Lamp {mood} shadows />
<Bokeh {mood} motion={reducedMotion ? 0 : 1} intro={intro.current} />
<SoundCues />
