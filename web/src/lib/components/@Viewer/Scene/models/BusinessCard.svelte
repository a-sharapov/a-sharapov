<script lang="ts">
  import { T, useTask } from '@threlte/core';
  import type { IntersectionEvent } from '@threlte/extras';
  import { onDestroy } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import { Spring, Tween } from 'svelte/motion';
  import {
    Euler,
    type Group,
    Matrix4,
    type Mesh,
    MeshStandardMaterial,
    Quaternion,
    type Texture,
    Vector3,
  } from 'three';
  import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
  import {
    bumpMap,
    float,
    luminance,
    mix,
    smoothstep,
    texture as textureNode,
    uniform,
    uv,
    vec2,
    vec4,
  } from 'three/tsl';
  import { MeshStandardNodeMaterial } from 'three/webgpu';
  import Logo from '#lib/logo.svg?raw';
  import { tapCard } from '../glitch';
  import { CARD, PAPER } from '../layout';
  import { rig } from '../state.svelte';
  import {
    type CardBack,
    type CardFace,
    type CardIcons,
    type CardLink,
    createCardBackTexture,
    createCardTexture,
    createPaperRelief,
    drawCardBack,
    linkAt,
    loadCardIcons,
    loadCardLogo,
    PAPER_RELIEF_REPEAT,
    updateCardTexture,
  } from '../textures';
  import { PLATINUM } from './materials.svelte';
  import { anchor, extrudeFrom, MM, normalizeUv, parseSvg, sweepFrom } from './svg';
  import source from './svg/desk.svg?raw';

  interface IBusinessCard {
    face: CardFace;
    back: CardBack;
    interactive: boolean;
    onhover: (hovered: boolean) => void;
  }

  let { face, back, interactive, onhover }: IBusinessCard = $props();

  const paths = parseSvg(source);
  const _WIDTH = 9;
  const _HEIGHT = 5;
  const _DEPTH = 0.45;
  const _LEAN = -Math.atan(0.392);
  const _SLOT = new Vector3(0, 0.11, 0.72);
  const _BAR: [number, number] = [0.5, 0.7];
  const _WIRE_HALF = 2.6;

  const _side = (x: number) =>
    sweepFrom(paths.wire!, {
      radius: _BAR,
      squareness: 8,
      radial: 20,
      segments: 80,
    })
      .translate(0, 3.99, 0)
      .rotateY(Math.PI / 2)
      .translate(x, 0, 1);
  const _bar = (height: number, depth: number) =>
    new RoundedBoxGeometry(
      _WIRE_HALF * 2 + _BAR[1] * 2 * MM,
      _BAR[0] * 2 * MM,
      _BAR[1] * 2 * MM,
      2,
      0.02
    ).translate(0, height, depth);
  const holder = [
    _side(-_WIRE_HALF),
    _side(_WIRE_HALF),
    _bar((40 - 33) * MM, 1 - 1 * MM),
    _bar((40 - 5.8) * MM, 1 - 16.9 * MM),
  ];
  const card = normalizeUv(
    anchor(extrudeFrom(paths.card, { depth: _DEPTH, bevel: 0.12 }), 'center', 'center', 'center')
  );

  ((lids, sides) => {
    const half = lids.count / 2;
    const position = card.getAttribute('position');
    const {
      0: a,
      1: b,
      2: c,
    } = [0, 1, 2].map((k) => new Vector3().fromBufferAttribute(position, lids.start + k));
    const backFirst = new Vector3().crossVectors(b!.sub(a!), c!.sub(a!)).z < 0;
    card.clearGroups();
    card.addGroup(lids.start, half, backFirst ? 2 : 0);
    card.addGroup(lids.start + half, half, backFirst ? 0 : 2);
    card.addGroup(sides.start, sides.count, 1);
  })(card.groups[0]!, card.groups[1]!);

  let logo = $state.raw<HTMLImageElement | null>(null);

  $effect(() => {
    let alive = true;
    const _handle = (image: HTMLImageElement) => void (alive && (logo = image));
    const _catch = (error: unknown) =>
      void console.error('BusinessCard: логотип не загрузился', error);
    loadCardLogo(Logo).then(_handle, _catch);
    return () => void (alive = false);
  });

  let hovered = $state(false);
  const hover = new Spring(0, { stiffness: 0.07, damping: 0.38 });
  const press = new Spring(0, { stiffness: 0.32, damping: 0.62 });

  const texture = createCardTexture(face);
  const backTexture = createCardBackTexture();

  const blank = uniform(0);
  const relief = createPaperRelief();
  const _tooth = textureNode(relief, uv().mul(vec2(...PAPER_RELIEF_REPEAT))).r.mul(0.6);
  const _printed = (map: Texture, emboss: number, sharpen: number, tone = 1, paper = 0.85) =>
    ((material, sample) => {
      const ink = smoothstep(0.25, 0.7, luminance(sample.rgb).oneMinus()).mul(blank.oneMinus());
      material.colorNode = mix(
        vec4(sample.rgb.mul(tone), sample.a),
        vec4(0.985, 0.98, 0.968, 1),
        blank
      );
      material.roughnessNode = mix(float(paper), float(0.5), ink);
      material.normalNode = bumpMap(
        emboss > 0 ? textureNode(map).r.mul(emboss).add(_tooth) : _tooth,
        blank.oneMinus()
      );
      return material;
    })(new MeshStandardNodeMaterial(), textureNode(map).bias(float(-sharpen)));
  const _BACK_TONE = 0.86;
  const faceMaterial = _printed(texture, 0.6, 0, 1, 0.72);
  const backMaterial = _printed(backTexture, 0, 0.7, _BACK_TONE, 0.9);
  const edgeMaterial = new MeshStandardMaterial({
    color: '#f1f1f0',
    roughness: 0.9,
  });

  $effect(() => {
    const current = { ...face, logo };
    void document.fonts.ready.then(() => updateCardTexture(texture, current));
  });

  let icons = $state.raw<CardIcons>({});
  let row = $state(-1);
  let links: CardLink[] = [];

  $effect(() => {
    let alive = true;
    const _handle = (loaded: CardIcons) => void (alive && (icons = loaded));
    const _catch = (error: unknown) =>
      void console.error('BusinessCard: иконки контактов не загрузились', error);
    loadCardIcons().then(_handle, _catch);
    return () => void (alive = false);
  });

  $effect(() => {
    const current = { back, icons, row };
    void document.fonts.ready.then(
      () =>
        void ((links = drawCardBack(
          backTexture.image as HTMLCanvasElement,
          current.back,
          current.icons,
          current.row
        )),
        (backTexture.needsUpdate = true))
    );
  });

  let flipped = $state(false);
  let wasFlipped = false;
  $effect(
    () =>
      void (
        flipped !== wasFlipped &&
        ((wasFlipped = flipped),
        ((now) => tapCard(now, rig.glitch < 0) && (rig.glitch = now))(performance.now()))
      )
  );
  const flip = new Tween(0, { duration: 950, easing: cubicOut });

  $effect(() => {
    flip.target = flipped ? 1 : 0;
  });

  $effect(() => {
    hover.target = hovered ? 1 : 0;
  });

  $effect(() => {
    void (!interactive && ((flipped = false), hovered && setHover(false)));
  });

  $effect(() => {
    const _key = (event: KeyboardEvent) => void (event.key === 'Escape' && flipped && close());
    window.addEventListener('keydown', _key);
    return () => window.removeEventListener('keydown', _key);
  });

  const _cursor = (pointer: boolean) =>
    void (document.body.style.cursor = pointer ? 'pointer' : '');

  const setHover = (value: boolean) => {
    hovered = value;
    _cursor(value);
    onhover(value);
  };

  const _linkOf = (event: IntersectionEvent<MouseEvent>) =>
    flipped && flip.current > 0.9 && event.face?.materialIndex === 2 && event.uv
      ? linkAt(links, event.uv)
      : undefined;
  const _open = (href: string) =>
    void (/^https?:/.test(href)
      ? window.open(href, '_blank', 'noopener,noreferrer')
      : (location.href = href));

  const over = { card: false, spot: false };
  let handled: Event | undefined;

  const _hoverIn = () => void (interactive && !flipped && !hovered && setHover(true));
  const enter = (part: keyof typeof over) => () => void ((over[part] = true), _hoverIn());
  const leave = (part: keyof typeof over) => () =>
    void ((over[part] = false),
    over.card || over.spot || ((press.target = 0), !flipped && hovered && setHover(false)),
    part === 'card' && ((row = -1), flipped && _cursor(false)));
  const close = () => void ((flipped = false), (row = -1), setHover(false));
  const down = () => void (interactive && !flipped && (press.target = 1));
  const up = () => void (press.target = 0);
  const move = (event: IntersectionEvent<PointerEvent>) =>
    void (flipped
      ? ((link) => ((row = link?.index ?? -1), _cursor(Boolean(link))))(_linkOf(event))
      : _hoverIn());
  const select = (event: IntersectionEvent<MouseEvent>) =>
    void (
      event.nativeEvent !== handled &&
      ((handled = event.nativeEvent),
      interactive &&
        (flipped
          ? ((link) => (link ? _open(link.href) : close()))(_linkOf(event))
          : ((press.target = 0), (flipped = true))))
    );
  const missed = (event: MouseEvent) => void (flipped && ((handled = event), close()));

  let group = $state.raw<Group>();
  let sheet = $state.raw<Mesh>();

  const _Y = new Vector3(0, 1, 0);
  const _yaw = (angle: number, target = new Quaternion()) => target.setFromAxisAngle(_Y, angle);
  const _flat = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2);
  const _cardYaw = _yaw(CARD.yaw);
  const _slot = _SLOT
    .clone()
    .applyQuaternion(_cardYaw)
    .add(new Vector3(...CARD.position));
  const _paper = new Vector3(PAPER.position[0], PAPER.position[1] + PAPER.lift, PAPER.position[2]);
  const _stand = new Quaternion();
  const _lying = new Quaternion();
  const _tilt = new Quaternion();
  const _euler = new Euler();
  const _standAt = new Vector3();
  const _out = new Vector3();
  const _above = new Vector3();
  const _toward = new Vector3();
  const _hold = new Quaternion();
  const _holdAt = new Vector3();
  const _face = new Quaternion();
  const _spin = new Quaternion();
  const _look = new Matrix4();
  const _eye = new Vector3();
  const _rise = new Vector3();
  const _approach = new Vector3();

  const _TOWARD = 0.42;
  const _RISE = 3.5;
  const _APPROACH = 1.5;
  const _SPIN: [number, number] = [0.38, 0.92];
  const _AIRBORNE = 0.2;
  const _rest = _cardYaw.clone().multiply(new Quaternion().setFromEuler(new Euler(_LEAN, 0, 0)));
  const _home = new Vector3(0, _HEIGHT / 2, 0).applyQuaternion(_rest).add(_slot);
  const _front = _home.clone();

  $effect(() => {
    void (flipped && rig.pose && _front.copy(_home).lerp(_eye.set(...rig.pose.position), _TOWARD));
  });

  const _LIFT = 6;
  const _DROP = 6;
  const _TURN: [number, number] = [0.1, 0.9];
  const _SWING: [number, number] = [0.35, 1];

  const _cubic = (
    out: Vector3 | undefined,
    t: number,
    p0: Vector3,
    p1: Vector3,
    p2: Vector3,
    p3: Vector3
  ) =>
    ((u) =>
      out
        ?.copy(p0)
        .multiplyScalar(u * u * u)
        .addScaledVector(p1, 3 * u * u * t)
        .addScaledVector(p2, 3 * u * t * t)
        .addScaledVector(p3, t * t * t))(1 - t);

  const _window = (t: number, { 0: from, 1: to }: [number, number]) =>
    ((x) => x * x * (3 - 2 * x))(Math.min(1, Math.max(0, (t - from) / (to - from))));

  const _turn = (m: number) => _window(m, _TURN);

  let _last = { m: -1, h: -1, p: -1, f: -1 };

  useTask('business-card', () => {
    const m = rig.morph;
    const f = flip.current;
    const h = Math.max(0, hover.current) * (1 - m);
    const swing = _window(h, _SWING);
    const p = press.current * (1 - m) * (1 - f);
    void (
      (Math.abs(m - _last.m) > 1e-5 ||
        Math.abs(h - _last.h) > 1e-5 ||
        Math.abs(p - _last.p) > 1e-5 ||
        Math.abs(f - _last.f) > 1e-5) &&
      ((rig.shadowsDirty = true), (_last = { m, h, p, f }))
    );
    const { 0: width, 1: height } = rig.sheet.size;

    _stand
      .copy(_yaw(CARD.yaw - swing * 0.12, _stand))
      .multiply(_tilt.setFromEuler(_euler.set(_LEAN + swing * 0.3, 0, swing * -0.3)));
    _lying.copy(_yaw(rig.sheet.yaw, _lying)).multiply(_flat);

    _toward.set(0, h * 1.6, swing * 0.8).applyQuaternion(_cardYaw);
    _standAt
      .set(0, _HEIGHT / 2, 0)
      .applyQuaternion(_stand)
      .add(_slot)
      .add(_toward);
    _eye.set(...(rig.pose?.position ?? [0, 30, 60]));
    _face.setFromRotationMatrix(_look.lookAt(_eye, _front, _Y));
    _hold
      .copy(_stand)
      .slerp(_face, f)
      .multiply(_spin.setFromAxisAngle(_Y, Math.PI * _window(f, _SPIN)));
    _rise.copy(_standAt).add(_toward.set(0, _RISE, 0));
    _approach.copy(_front).add(_toward.set(0, _APPROACH, 0));
    _cubic(_holdAt, f, _standAt, _rise, _approach, _front);
    rig.card.flip = f;
    rig.card.focus = _front.toArray();
    void (sheet && (sheet.castShadow = f < _AIRBORNE));

    _out.set(0, _LIFT, 0).applyQuaternion(_hold).add(_holdAt);
    _above.copy(_paper).add(_toward.set(0, _DROP, 0));
    _cubic(group?.position, m, _holdAt, _out, _above, _paper);

    const turn = _turn(m);
    group?.quaternion.copy(_hold).slerp(_lying, turn);
    group?.scale.set(
      1 + (width / _WIDTH - 1) * turn - h * 0.08 * (1 - f) - p * 0.03,
      1 + (height / _HEIGHT - 1) * turn - h * 0.08 * (1 - f) - p * 0.03,
      1
    );
    blank.value = Math.min(1, Math.max(0, (m - 0.15) / 0.5));
  });

  onDestroy(() => {
    document.body.style.cursor = '';
    [texture, backTexture, relief, faceMaterial, backMaterial, edgeMaterial].forEach(
      (_) => void _.dispose()
    );
  });
</script>

<T.Group name="cardHolder" position={CARD.position} rotation.y={CARD.yaw}>
  {#each holder as part, i (i)}
    <T.Mesh geometry={part} castShadow receiveShadow>
      <T.MeshPhysicalMaterial {...PLATINUM} />
    </T.Mesh>
  {/each}
</T.Group>

<T.Mesh
  name="cardSpot"
  geometry={card}
  visible={false}
  position={_home.toArray()}
  quaternion={_rest.toArray()}
  onpointerenter={enter('spot')}
  onpointerleave={leave('spot')}
  onpointermove={_hoverIn}
  onpointerdown={down}
  onpointerup={up}
  onclick={select}
/>

<T.Group name="card" bind:ref={group}>
  <T.Mesh
    bind:ref={sheet}
    geometry={card}
    material={[faceMaterial, edgeMaterial, backMaterial]}
    castShadow
    receiveShadow
    onpointerenter={enter('card')}
    onpointerleave={leave('card')}
    onpointerdown={down}
    onpointerup={up}
    onpointermove={move}
    onclick={select}
    onpointermissed={missed}
  />
</T.Group>
