import { useTask, useThrelte } from '@threlte/core';
import type { PerspectiveCamera } from 'three';
import type { Shot } from '$lib/common/types';
import { clamp, lerp } from '$lib/common/utils';
import { movers } from './movers';
import {
  arcRoll,
  bank,
  type Cue,
  easeShot,
  establishingPose,
  INTRO_ORBIT,
  interpolatePose,
  introPose,
  lerp3,
  OPENING,
  openingAt,
  openingPose,
  type Pose,
  posesEqual,
  type Rect,
  type Sheet,
  type Size,
  STILL_CUE,
  SWING,
  sheetPose,
  shortestYaw,
  shotCue,
  transitionDuration,
} from './shots';
import { ACTOR_SECONDS, actorOf, carryEase, stageFit, THROW } from './staging';
import { ACTORS, type Actor, rig, type Stage } from './state.svelte';

type Transition = {
  from: Pose;
  fromMorph: number;
  fromActors: Record<Actor, number>;
  fromSheet: Sheet;
  t: number;
  duration: number;
  swing: number;
  still: boolean;
  opening: boolean;
  rate: number;
  pace: number;
};

type Goal = {
  pose: Pose;
  morph: number;
  actors: Record<Actor, number>;
  sheet: Sheet;
  stage?: { actor: Actor; at: Stage };
};

var _rest = (): Record<Actor, number> => ({
  resume: 0,
  sketchbook: 0,
  tablet: 0,
  plane: 0,
});

export type RigOptions = {
  getShot: () => Shot;
  getEpoch: () => number;
  getReady: () => boolean;
  getHover: () => boolean;
  getLaunched: () => boolean;
  reducedMotion: boolean;
  onLoaded: () => void;
  onMoving: () => void;
  onSettled: () => void;
};

var _REVEAL_AT = 0.82;

var _ACTOR_SWAP = 1.6;

var _actorSeconds = (goal: Record<Actor, number>) =>
  ACTORS.filter((actor) => rig.actors[actor] !== goal[actor]).reduce(
    (seconds, actor) =>
      Math.max(
        seconds,
        ACTOR_SECONDS[actor]?.[goal[actor] > rig.actors[actor] ? 0 : 1] ??
          _ACTOR_SWAP
      ),
    0
  );

var _HOVER_DOLLY = 0.84;

var _SHEET_SELECTOR = 'main .sheet';

var _lookdev = (): Pose | null =>
  ((params) =>
    import.meta.env.DEV && params?.get('cam') && params.get('look')
      ? ((cam, look) => ({
          ...introPose({ width: 16, height: 10 }),
          position: cam as Pose['position'],
          target: look as Pose['target'],
          focus: look as Pose['focus'],
          bokeh: 0.6,
        }))(
          params.get('cam')!.split(',').map(Number),
          params.get('look')!.split(',').map(Number)
        )
      : null)(
    typeof location === 'undefined'
      ? null
      : new URLSearchParams(location.search)
  );

var _WARM = { frames: 3, frame: 0.25, limit: 45 };

var _SKIP_EVENTS = ['pointerdown', 'wheel', 'keydown', 'touchstart'] as const;

var _PACE_LAG = 0.12;

var _smooth = (lo: number, hi: number, x: number) =>
  ((k) => k * k * (3 - 2 * k))(clamp((x - lo) / (hi - lo)));

var _OPENING_HOLD = ((value) =>
  import.meta.env.DEV && value !== null && Number.isFinite(Number(value))
    ? clamp(Number(value))
    : null)(
  typeof location === 'undefined'
    ? null
    : new URLSearchParams(location.search).get('opening')
);

var _REFIT_RATE = 10;

var _lerpRect = (from: Rect, to: Rect, t: number): Rect => ({
  left: lerp(from.left, to.left, t),
  top: lerp(from.top, to.top, t),
  width: lerp(from.width, to.width, t),
  height: lerp(from.height, to.height, t),
});

var _fallbackSheet = (viewport: Size): Rect => ({
  left: viewport.width * 0.1,
  top: viewport.height * 0.12,
  width: viewport.width * 0.8,
  height: viewport.height * 0.76,
});

var _measureSheet = (viewport: Size): Rect =>
  ((element) =>
    element
      ? {
          left: element.offsetLeft,
          top: element.offsetTop,
          width: element.offsetWidth,
          height: element.offsetHeight,
        }
      : _fallbackSheet(viewport))(
    document.querySelector<HTMLElement>(_SHEET_SELECTOR)
  );

export var bindCameraRig = (options: RigOptions) => {
  const { camera, size, invalidate } = useThrelte();

  let shot: Shot | null = null;
  let transition: Transition | null = null;
  let sheet: Rect | null = null;
  let fit: Rect | null = null;
  const cache: Partial<Record<Shot, Rect>> = {};
  let reveal = false;
  const pointer = { x: 0, y: 0 };
  const parallax = { x: 0, y: 0, dolly: 1 };
  const warm = { streak: 0, frames: 0, done: false };

  const _viewport = (): Size => ({
    width: size.current.width,
    height: size.current.height,
  });

  const _fixed = _lookdev();

  const _measure = (current: Shot): Rect =>
    options.getReady()
      ? (cache[current] = _measureSheet(_viewport()))
      : (cache[current] ?? _fallbackSheet(_viewport()));

  const _goal = (current: Shot): Goal =>
    ((goal) => (_fixed ? { ...goal, pose: _fixed } : goal))(_plan(current));

  const _plan = (current: Shot): Goal =>
    current === 'intro'
      ? {
          pose: introPose(_viewport(), {
            azimuth: INTRO_ORBIT.azimuth + parallax.x * 0.12,
            elevation: INTRO_ORBIT.elevation + parallax.y * 0.04,
          }),
          morph: 0,
          actors: _rest(),
          sheet: rig.sheet,
        }
      : ((actor, rect) =>
          actor
            ? ((fitted) => ({
                pose: fitted.pose,
                morph: 0,
                actors: { ..._rest(), [actor]: 1 },
                sheet: rig.sheet,
                stage: { actor, at: fitted.stage },
              }))(stageFit(actor, _viewport(), rect))
            : {
                ...sheetPose(current, _viewport(), rect),
                morph: 1,
                actors: _rest(),
              })(actorOf(current), (fit ??= sheet ??= _measure(current)));

  const _dolly = (pose: Pose): Pose =>
    parallax.dolly === 1
      ? pose
      : {
          ...pose,
          position: pose.position.map(
            (value, i) =>
              pose.target[i]! + (value - pose.target[i]!) * parallax.dolly
          ) as Pose['position'],
        };

  const _waiting = (pose: Pose): Pose =>
    options.getShot() === 'intro' && !options.reducedMotion && !_fixed
      ? openingPose(pose)
      : establishingPose(pose);

  const _cardFocus = (pose: Pose): Pose =>
    rig.card.flip > 0
      ? {
          ...pose,
          focus: pose.focus.map((value, i) =>
            lerp(value, rig.card.focus[i]!, rig.card.flip)
          ) as Pose['focus'],
        }
      : pose;

  const _swing = (previous: Shot | null, next: Shot) =>
    next === 'intro'
      ? -SWING
      : previous === null || previous === 'intro'
        ? SWING
        : SWING / 2;

  const _start = (next: Shot) => {
    fit = null;
    const goal = _goal(next);
    const opening =
      shot === null && next === 'intro' && !options.reducedMotion && !_fixed;
    const from =
      rig.pose ??
      (opening ? openingPose(goal.pose) : establishingPose(goal.pose));
    const swing = _swing(shot, next);
    shot = next;
    transition = {
      from,
      fromMorph: rig.morph,
      fromActors: { ...rig.actors },
      fromSheet: { size: [...rig.sheet.size], yaw: rig.sheet.yaw },
      t: 0,
      duration: options.reducedMotion
        ? 0
        : opening
          ? OPENING.seconds
          : Math.max(
              transitionDuration(from, goal.pose),
              _actorSeconds(goal.actors)
            ),
      swing,
      still: false,
      opening,
      rate: 1,
      pace: 1,
    };
    reveal = true;
    void (
      posesEqual(from, goal.pose) &&
      ((transition.still = true),
      transition.duration < _ACTOR_SWAP && (transition.duration = 0.35))
    );
    options.onMoving();
  };

  const _skip = () =>
    void (
      transition?.opening &&
      transition.t < 1 &&
      (transition.pace = Math.max(
        transition.pace,
        ((1 - transition.t) * transition.duration) / OPENING.skip
      ))
    );

  const _cue = (from: Transition, progress: number, eased: number): Cue =>
    from.still ? STILL_CUE(eased) : shotCue(progress, from.swing);

  const _at = (from: Transition, goal: Pose, progress: number): Pose =>
    from.opening
      ? openingAt(from.from, goal, progress)
      : ((eased) =>
          interpolatePose(from.from, goal, eased, _cue(from, progress, eased)))(
          easeShot(progress)
        );

  const _banked = (
    from: Transition,
    goal: Pose,
    pose: Pose,
    progress: number
  ) =>
    from.still || from.opening || from.swing === 0
      ? pose
      : ((eased) =>
          bank(
            pose,
            arcRoll(from.from, goal, eased, _cue(from, progress, eased))
          ))(easeShot(progress));

  const _follow = (
    from: Transition,
    goal: Goal,
    pose: Pose,
    progress: number
  ) =>
    ((actor) =>
      actor &&
      !from.opening &&
      from.fromActors[actor] < goal.actors[actor] &&
      movers[`actor-${actor}`].seen
        ? {
            ...pose,
            focus: lerp3(
              lerp3(
                from.from.focus,
                movers[`actor-${actor}`].position.toArray(),
                _smooth(0.05, 0.4, progress)
              ),
              goal.pose.focus,
              _smooth(0.78, 1, progress)
            ),
          }
        : pose)(goal.stage?.actor);

  const _apply = (pose: Pose) => {
    const perspective = camera.current as PerspectiveCamera;
    perspective.position.set(...pose.position);
    perspective.up.set(...pose.up);
    perspective.lookAt(...pose.target);
    void (
      perspective.fov !== pose.fov &&
      ((perspective.fov = pose.fov), perspective.updateProjectionMatrix())
    );
  };

  const _onPointer = (event: PointerEvent) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
  };

  const _onResize = () => {
    sheet = null;
    invalidate();
  };

  $effect(() => {
    void options.getEpoch();
    const next = options.getShot();
    sheet = null;
    void (
      shot !== null &&
      (next === shot && transition
        ? (reveal = true)
        : requestAnimationFrame(() => _start(next)))
    );
  });

  $effect(() => {
    window.addEventListener('pointermove', _onPointer, { passive: true });
    window.addEventListener('resize', _onResize);
    _SKIP_EVENTS.forEach(
      (type) => void window.addEventListener(type, _skip, { passive: true })
    );
    return () => {
      window.removeEventListener('pointermove', _onPointer);
      window.removeEventListener('resize', _onResize);
      _SKIP_EVENTS.forEach(
        (type) => void window.removeEventListener(type, _skip)
      );
    };
  });

  useTask('camera-rig', (frame) => {
    const delta = Math.min(frame, 1 / 30);
    warm.streak = frame < _WARM.frame ? warm.streak + 1 : 0;
    warm.frames += 1;
    void (
      !warm.done &&
      (warm.streak >= _WARM.frames || warm.frames >= _WARM.limit) &&
      ((warm.done = true), options.onLoaded())
    );
    void (
      shot === null &&
      warm.done &&
      options.getLaunched() &&
      _start(options.getShot())
    );
    const active = shot ?? options.getShot();
    const damping = 1 - Math.exp(-delta * 3.2);
    const follow = active === 'intro' && !options.reducedMotion;
    parallax.x = lerp(parallax.x, follow ? pointer.x : 0, damping);
    parallax.y = lerp(parallax.y, follow ? -pointer.y : 0, damping);
    parallax.dolly = lerp(
      parallax.dolly,
      follow && options.getHover() ? _HOVER_DOLLY : 1,
      damping
    );

    fit = ((measured) =>
      fit
        ? _lerpRect(fit, measured, 1 - Math.exp(-delta * _REFIT_RATE))
        : measured)((sheet ??= _measure(active)));
    const goal = _goal(active);
    void (
      transition &&
      (transition.rate = lerp(
        transition.rate,
        transition.pace,
        1 - Math.exp(-delta / _PACE_LAG)
      ))
    );
    const progress = transition
      ? _OPENING_HOLD !== null && transition.opening
        ? _OPENING_HOLD
        : clamp(
            transition.t +
              (transition.duration > 0
                ? (delta * transition.rate) / transition.duration
                : 1)
          )
      : 1;
    const eased = easeShot(progress);
    const from = transition;
    const target = _dolly(goal.pose);

    rig.pose = _cardFocus(
      shot === null
        ? _waiting(goal.pose)
        : from
          ? _follow(
              from,
              goal,
              _banked(from, target, _at(from, target, progress), progress),
              progress
            )
          : target
    );
    void (
      goal.stage && Object.assign(rig.stages[goal.stage.actor], goal.stage.at)
    );
    void (
      rig.thrown >= 0 &&
      ((rig.thrown = Math.min(1, rig.thrown + delta / THROW.seconds)),
      rig.thrown >= 1 && !from && (rig.thrown = -1))
    );
    void (
      shot !== null &&
      ACTORS.forEach(
        (actor) =>
          void (rig.actors[actor] = from
            ? lerp(
                from.fromActors[actor],
                goal.actors[actor],
                carryEase(progress)
              )
            : goal.actors[actor])
      )
    );
    void (
      shot !== null &&
      Object.assign(rig, {
        morph: from ? lerp(from.fromMorph, goal.morph, eased) : goal.morph,
        sheet: from
          ? {
              size: [
                lerp(from.fromSheet.size[0], goal.sheet.size[0], eased),
                lerp(from.fromSheet.size[1], goal.sheet.size[1], eased),
              ],
              yaw: lerp(
                from.fromSheet.yaw,
                shortestYaw(from.fromSheet.yaw, goal.sheet.yaw),
                eased
              ),
            }
          : goal.sheet,
      })
    );

    void (
      reveal &&
      progress >= (from?.opening ? OPENING.reveal : _REVEAL_AT) &&
      options.getReady() &&
      ((reveal = false), options.onSettled())
    );
    void (
      from &&
      ((from.t = progress),
      progress >= 1 && _OPENING_HOLD === null && (transition = null))
    );

    _apply(rig.pose);
  });
};
