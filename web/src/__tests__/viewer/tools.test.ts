import { describe, expect, test } from 'bun:test';
import { Quaternion, Vector3 } from 'three';
import { lampGap } from '$lib/components/@Viewer/Scene/carry';
import {
  CARD,
  CUP,
  INTRO_AZIMUTH,
  PAPER_PLANE,
  PEN_HOLDER,
  PEN_SLOTS,
} from '$lib/components/@Viewer/Scene/layout';
import {
  carryEase,
  FACES,
  ROOM,
  roomFor,
  TABLE_STAGE,
  TOOL_STEADY,
  TOOLS,
  type Tool,
  type ToolJitter,
} from '$lib/components/@Viewer/Scene/staging';
import type { Actor } from '$lib/components/@Viewer/Scene/state.svelte';
import {
  TOOL_OUT_SHARE,
  toolPose,
  toolProgress,
} from '$lib/components/@Viewer/Scene/tools';

const _TOOLS = Object.keys(TOOLS) as Tool[];
const _HOME: Record<Actor, number> = {
  resume: 0,
  sketchbook: 0,
  tablet: 0,
  plane: 0,
};

const _SPREAD = [
  [1, 1, 1],
  [-1, 0, -1],
  [0.35, 0, 1],
  [-0.35, 1, -1],
  [1, 0, -1],
  [-1, 1, 1],
] as const;

const _jitter = (tool: Tool, k: number): ToolJitter =>
  ((jitter, spread) => ({
    turn: spread[0] * jitter.turn,
    depth: jitter.depth[spread[1]],
    roll: spread[2] * jitter.roll,
  }))(TOOLS[tool].jitter, _SPREAD[k]!);

const _segment = (
  tool: Tool,
  actors: Record<Actor, number>,
  jitter: ToolJitter = TOOL_STEADY
) =>
  ((pose) =>
    ((axis) => ({
      from: pose.position.clone(),
      to: pose.position.clone().addScaledVector(axis, TOOLS[tool].length),
      radius: TOOLS[tool].radius,
    }))(new Vector3(0, 1, 0).applyQuaternion(pose.quaternion)))(
    toolPose(
      tool,
      actors,
      {
        position: new Vector3(),
        quaternion: new Quaternion(),
      },
      jitter
    )
  );

const _points = (segment: ReturnType<typeof _segment>, count = 24) =>
  Array.from({ length: count + 1 }, (_, i) =>
    segment.from.clone().lerp(segment.to, i / count)
  );

const _distance = (segment: ReturnType<typeof _segment>, point: Vector3) =>
  ((ab) =>
    segment.from
      .clone()
      .addScaledVector(
        ab,
        Math.min(
          1,
          Math.max(0, point.clone().sub(segment.from).dot(ab) / ab.lengthSq())
        )
      )
      .distanceTo(point))(segment.to.clone().sub(segment.from));

const _toFrame = (point: { x: number; z: number }) => [
  point.x * Math.cos(INTRO_AZIMUTH) - point.z * Math.sin(INTRO_AZIMUTH),
  point.x * Math.sin(INTRO_AZIMUTH) + point.z * Math.cos(INTRO_AZIMUTH),
];

const _PAGES: Array<Actor | 'home'> = [
  'home',
  'resume',
  'sketchbook',
  'tablet',
  'plane',
];
const _TRANSITIONS = _PAGES.flatMap((from) =>
  _PAGES
    .filter(
      (to) =>
        to !== from &&
        _TOOLS.some(
          (tool) => TOOLS[tool].actor === from || TOOLS[tool].actor === to
        )
    )
    .map((to) => [from, to] as const)
);

const _at = (
  from: Actor | 'home',
  to: Actor | 'home',
  u: number
): Record<Actor, number> =>
  ((e) => ({
    ..._HOME,
    ...(from === 'home' ? {} : { [from]: 1 - e }),
    ...(to === 'home' ? {} : { [to]: e }),
  }))(carryEase(u));

describe('инструменты из стакана', () => {
  test('в общем плане стоят в своих гнёздах', () =>
    _TOOLS.forEach(
      (tool) =>
        void ((segment, base) => {
          expect(toolProgress(tool, _HOME)).toBe(0);
          expect(segment.from.distanceTo(base)).toBeLessThan(1e-6);
        })(
          _segment(tool, _HOME),
          new Vector3(...PEN_SLOTS[tool].base)
            .applyAxisAngle(new Vector3(0, 1, 0), PEN_HOLDER.yaw)
            .add(new Vector3(...PEN_HOLDER.position))
        )
    ));

  test.each(
    _TOOLS
  )('%s у подачи лежит на столе рядом с предметом, не на нём — при любой укладке', (tool) =>
    _SPREAD.forEach(
      (_, k) =>
        void ((segment, actor) => {
          expect(Math.abs(segment.from.y - TOOLS[tool].radius)).toBeLessThan(
            1e-6
          );
          expect(Math.abs(segment.to.y - TOOLS[tool].radius)).toBeLessThan(
            1e-6
          );
          expect(_toFrame(segment.to)[1]!).toBeLessThan(
            _toFrame(segment.from)[1]!
          );
          _points(segment).forEach(
            (point) =>
              void expect(
                Math.abs(
                  _toFrame(point)[0]! -
                    _toFrame({ x: TABLE_STAGE[0], z: TABLE_STAGE[2] })[0]!
                )
              ).toBeGreaterThan(FACES[actor].size![0] / 2 + segment.radius)
          );
        })(
          _segment(
            tool,
            { ..._HOME, [TOOLS[tool].actor]: 1 },
            _jitter(tool, k)
          ),
          TOOLS[tool].actor
        )
    ));

  test.each(
    _TOOLS
  )('%s: соседи в раскладке подачи его не задевают — при любой укладке', (tool) =>
    _SPREAD.forEach(
      (_, k) =>
        void ((actor, segment) =>
          Object.entries(ROOM[actor]).forEach(
            ({ 0: prop, 1: shift }) =>
              void (
                prop !== 'pile' &&
                ((center) =>
                  expect(
                    Math.min(
                      ..._points(segment).map((point) =>
                        point.distanceTo(center)
                      )
                    )
                  ).toBeGreaterThan(
                    (
                      {
                        cup: 6.6,
                        penHolder: 4.6,
                        card: 4.8,
                        plane: 4,
                      } as Record<string, number>
                    )[prop]! + segment.radius
                  ))(
                  new Vector3(
                    ...(
                      {
                        cup: CUP.position,
                        penHolder: PEN_HOLDER.position,
                        card: CARD.position,
                        plane: PAPER_PLANE.position,
                      } as Record<string, [number, number, number]>
                    )[prop]!
                  )
                    .add(new Vector3(...shift!))
                    .setY(segment.from.y)
                )
              )
          ))(
          TOOLS[tool].actor,
          _segment(tool, { ..._HOME, [TOOLS[tool].actor]: 1 }, _jitter(tool, k))
        )
    ));

  test.each(
    _TRANSITIONS
  )('%s → %s: пути не проходят сквозь стол, стакан, лампу и друг друга', (from, to) =>
    _SPREAD.forEach(
      (_, k) =>
        void Array.from({ length: 121 }, (_, i) => i / 120).forEach(
          (u) =>
            void ((actors, holder) =>
              _TOOLS.forEach(
                (tool) =>
                  void ((s, segment) =>
                    void (
                      s > 0 &&
                      (_points(segment).forEach((point) => {
                        void (
                          s > TOOL_OUT_SHARE &&
                          (expect(point.y - segment.radius).toBeGreaterThan(
                            -0.01
                          ),
                          expect(
                            point.y > 9.2
                              ? Math.hypot(
                                  Math.max(
                                    0,
                                    Math.hypot(
                                      point.x - holder.x,
                                      point.z - holder.z
                                    ) - 3.75
                                  ),
                                  point.y - 9.2
                                )
                              : Math.hypot(
                                  point.x - holder.x,
                                  point.z - holder.z
                                ) - 3.75
                          ).toBeGreaterThan(segment.radius))
                        );
                        expect(lampGap(point)).toBeGreaterThan(segment.radius);
                      }),
                      _TOOLS
                        .filter(
                          (other) =>
                            other !== tool &&
                            !(s < 0.05 && toolProgress(other, actors) < 0.05)
                        )
                        .forEach(
                          (other) =>
                            void ((otherSegment) =>
                              expect(
                                Math.min(
                                  ..._points(segment).map((point) =>
                                    _distance(otherSegment, point)
                                  )
                                )
                              ).toBeGreaterThan(
                                segment.radius + otherSegment.radius
                              ))(_segment(other, actors, _jitter(other, k)))
                        ))
                    ))(
                    toolProgress(tool, actors),
                    _segment(tool, actors, _jitter(tool, k))
                  )
              ))(
              _at(from, to, u),
              new Vector3(...PEN_HOLDER.position).add(
                new Vector3(...roomFor('penHolder', _at(from, to, u)))
              )
            )
        )
    ));

  test.each(
    _TRANSITIONS.filter(
      ({ 0: from, 1: to }) =>
        _TOOLS.some((tool) => TOOLS[tool].actor === from) &&
        _TOOLS.some((tool) => TOOLS[tool].actor === to)
    )
  )('%s → %s: возвращающийся и выходящий не переносятся одновременно', (from, to) =>
    Array.from({ length: 201 }, (_, i) => i / 200).forEach(
      (u) =>
        void ((actors) =>
          expect(
            _TOOLS.filter((tool) => toolProgress(tool, actors) > TOOL_OUT_SHARE)
              .length
          ).toBeLessThanOrEqual(1))(_at(from, to, u))
    ));
});
