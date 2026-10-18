<script lang="ts">
  import { useTask, useThrelte } from '@threlte/core';
  import { type Object3D, Vector3 } from 'three';
  import {
    type Contact,
    contact,
    createMotion,
    crossed,
    distanceGain,
    type Motion,
    panOf,
    planeVoice,
    rustleActivity,
  } from '#lib/components/@UX/Sound/cues.ts';
  import sound, { type SoundFrame } from '#lib/components/@UX/Sound/engine.ts';
  import type { Cue } from '#lib/components/@UX/Sound/voices.ts';
  import { planeFold } from '../Scene/flight';
  import { movers } from '../Scene/movers';
  import { carryTravel, SKETCH_TIMELINE, type Tool } from '../Scene/staging';
  import { rig } from '../Scene/state.svelte';
  import { toolProgress } from '../Scene/tools';

  type Carried = 'resume' | 'sketchbook' | 'tablet';

  const _CARRIED: Record<Carried, Record<'lift' | 'land', Cue>> = {
    resume: { lift: 'paperLift', land: 'paperPat' },
    sketchbook: { lift: 'bookLift', land: 'bookPat' },
    tablet: { lift: 'tabletLift', land: 'tabletPat' },
  };

  const _TOOLS: Record<Tool, Cue> = {
    pen: 'penTock',
    pencil: 'pencilTock',
    stylus: 'stylusTock',
  };

  const _CARRIED_NAMES = Object.keys(_CARRIED) as Carried[];
  const _TOOL_NAMES = Object.keys(_TOOLS) as Tool[];

  const _SCREEN_ON = 0.68;
  const _FLIP = { leave: 0.02, turn: 0.35 };
  const _OPEN_RATE = 0.5;
  const _FOLD_RATE = 1.2;
  const _LEAVE_HOLDER = 0.35;
  const _RELAUNCH = 0.8;

  const { scene, camera } = useThrelte();

  const plane = {
    motion: createMotion({ start: 10, stop: 1.5, peak: 15, settle: 0.05 }),
    local: new Vector3(),
    seen: false,
    speed: 0,
    unfold: planeFold.unfold,
    quiet: _RELAUNCH,
  };

  const last = {
    flip: rig.card.flip,
    clicks: rig.lamp.clicks,
    sketchbook: rig.actors.sketchbook,
    tablet: rig.actors.tablet,
    travel: Object.fromEntries(
      _CARRIED_NAMES.map((name) => [name, carryTravel(name, rig.actors[name])])
    ) as Record<Carried, number>,
    tools: Object.fromEntries(
      _TOOL_NAMES.map((name) => [name, toolProgress(name, rig.actors)])
    ) as Record<Tool, number>,
  };

  const frame: SoundFrame = {
    delta: 0,
    whoosh: { gain: 0, frequency: 400, q: 1, flutter: 0, pan: 0 },
    rustle: { activity: 0, pan: 0 },
  };

  const objects = new Map<string, Object3D>();
  const _object = (name: string) =>
    objects.get(name) ??
    ((object) => (object && objects.set(name, object), object))(scene.getObjectByName(name));

  const _ndc = new Vector3();
  const _world = new Vector3();

  const _pan = (position: Vector3) => panOf(_ndc.copy(position).project(camera.current).x);

  const _play = (cue: Cue, position: Vector3, gain = 1) =>
    sound.active &&
    sound.play(cue, {
      pan: _pan(position),
      gain: gain * distanceGain(camera.current.position.distanceTo(position)),
    });

  const _carried = (name: Carried) =>
    ((travel) =>
      ((touch: Contact) => (
        touch && _play(_CARRIED[name][touch.event], movers[`actor-${name}`].position),
        (last.travel[name] = travel)
      ))(contact(last.travel[name], travel)))(carryTravel(name, rig.actors[name]));

  const _toolCue = (name: Tool, touch: NonNullable<Contact>, position: Vector3) =>
    touch.home
      ? _play('clink', position, touch.event === 'land' ? 1 : _LEAVE_HOLDER)
      : touch.event === 'land' && _play(_TOOLS[name], position);

  const _tool = (name: Tool) =>
    ((progress) =>
      ((touch: Contact) => (
        touch && _toolCue(name, touch, movers[`tool-${name}`].position),
        (last.tools[name] = progress)
      ))(contact(last.tools[name], progress)))(toolProgress(name, rig.actors));

  const _plane = (delta: number) =>
    ((object) =>
      void (
        object &&
        ((plane.speed = plane.seen
          ? plane.local.distanceTo(object.position) / Math.max(delta, 1e-3)
          : 0),
        plane.local.copy(object.position),
        (plane.seen = true),
        (plane.quiet += delta),
        ((event: Motion) =>
          void (event === 'start'
            ? (plane.quiet >= _RELAUNCH && _play('planeLaunch', movers['actor-plane'].position),
              (plane.quiet = 0))
            : event === 'stop' && _play('planePat', movers['actor-plane'].position)))(
          plane.motion.step(plane.speed, delta)
        ))
      ))(_object('actor-plane'));

  const _card = () =>
    ((flip, position) => (
      crossed(last.flip, flip, _FLIP.leave) === 1 && _play('slide', position),
      crossed(last.flip, flip, _FLIP.leave) === -1 && _play('tap', position),
      ((turn) => void (turn && _play('flick', position, turn > 0 ? 1 : 0.75)))(
        crossed(last.flip, flip, _FLIP.turn)
      ),
      (last.flip = flip)
    ))(rig.card.flip, movers.card.position);

  const _lamp = () =>
    void (rig.lamp.clicks > last.clicks &&
      ((button) => button && _play('click', button.getWorldPosition(_world)))(
        _object('lampButton')
      ),
    (last.clicks = rig.lamp.clicks));

  const _sketchbook = (delta: number) =>
    ((p, previous, position) =>
      ((strap) => (
        strap > 0 && (_play('strap', position), _play('coverOpen', position)),
        strap < 0 && (_play('coverClose', position), _play('strap', position, 0.7)),
        (last.sketchbook = p),
        p > SKETCH_TIMELINE.open[0] && p < SKETCH_TIMELINE.open[1]
          ? rustleActivity((p - previous) / Math.max(delta, 1e-3), _OPEN_RATE)
          : 0
      ))(crossed(previous, p, SKETCH_TIMELINE.open[0])))(
      rig.actors.sketchbook,
      last.sketchbook,
      movers['actor-sketchbook'].position
    );

  const _tablet = () =>
    void (crossed(last.tablet, rig.actors.tablet, _SCREEN_ON) === 1 &&
      _play('tone', movers['actor-tablet'].position),
    (last.tablet = rig.actors.tablet));

  const _rustle = (delta: number, cover: number) =>
    ((fold) => (
      (plane.unfold = planeFold.unfold),
      fold >= cover
        ? Object.assign(frame.rustle, {
            activity: fold,
            pan: _pan(movers['actor-plane'].position),
          })
        : Object.assign(frame.rustle, {
            activity: cover * 0.4,
            pan: _pan(movers['actor-sketchbook'].position),
          })
    ))(rustleActivity((planeFold.unfold - plane.unfold) / Math.max(delta, 1e-3), _FOLD_RATE));

  useTask(
    'sound-cues',
    (delta) => (
      _CARRIED_NAMES.forEach((name) => void _carried(name)),
      _TOOL_NAMES.forEach((name) => void _tool(name)),
      _plane(delta),
      _card(),
      _lamp(),
      _tablet(),
      _rustle(delta, _sketchbook(delta)),
      sound.active &&
        (Object.assign(frame.whoosh, planeVoice(plane.speed), {
          pan: _pan(movers['actor-plane'].position),
        }),
        (frame.delta = delta),
        sound.frame(frame))
    ),
    { autoInvalidate: false }
  );
</script>
