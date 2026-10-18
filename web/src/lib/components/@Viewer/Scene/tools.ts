import { Matrix4, Quaternion, Vector3 } from 'three';
import { clamp } from '#lib/common/utils.ts';
import { smooth } from './carry';
import { onFrame, PEN_HOLDER, PEN_SLOTS } from './layout';
import {
  carryTime,
  roomFor,
  TOOL_STEADY,
  TOOLS,
  type Tool,
  type ToolJitter,
  toolLaid,
} from './staging';
import type { Actor } from './state.svelte';

var _OUT = { share: 0.25, length: 9.8 };

export var TOOL_PATHS: Record<
  Tool,
  {
    lead: number;
    lift: number;
    aside: [right: number, depth: number];
    drop: number;
    turn: [from: number, to: number];
  }
> = {
  pen: { lead: 5.7, lift: 0.2, aside: [9, -4.1], drop: 5.2, turn: [0.4, 0.93] },
  pencil: {
    lead: 2.4,
    lift: -6.7,
    aside: [8.3, 8.9],
    drop: 2,
    turn: [0.23, 0.77],
  },
  stylus: {
    lead: 2.1,
    lift: 0.5,
    aside: [0.1, 4.5],
    drop: 12.8,
    turn: [0.18, 0.95],
  },
};

export var TOOL_OUT_SHARE = _OUT.share;

export var toolProgress = (tool: Tool, actors: Record<Actor, number>) =>
  ((x) => x * x * (3 - 2 * x))(
    clamp(
      (carryTime(actors[TOOLS[tool].actor]) - TOOLS[tool].window[0]) /
        (TOOLS[tool].window[1] - TOOLS[tool].window[0])
    )
  );

export type ToolPose = { position: Vector3; quaternion: Quaternion };

var _UP = new Vector3(0, 1, 0);
var _Z = new Vector3(0, 0, 1);
var _yaw = new Quaternion();
var _turn = new Quaternion();
var _shift = new Vector3();
var _slot = {
  origin: new Vector3(),
  quaternion: new Quaternion(),
  axis: new Vector3(),
};
var _laid = {
  center: new Vector3(),
  quaternion: new Quaternion(),
  axis: new Vector3(),
  side: new Vector3(),
};
var _basis = new Matrix4();
var _bezier = {
  from: new Vector3(),
  lead: new Vector3(),
  drop: new Vector3(),
  to: new Vector3(),
};

var _slotAt = (tool: Tool, actors: Record<Actor, number>) =>
  ((slot) => (
    _yaw.setFromAxisAngle(_UP, PEN_HOLDER.yaw),
    _slot.origin
      .set(...slot.base)
      .applyQuaternion(_yaw)
      .add(_shift.set(...PEN_HOLDER.position))
      .add(_shift.set(...roomFor('penHolder', actors))),
    _slot.quaternion
      .copy(_yaw)
      .multiply(_turn.setFromAxisAngle(_UP, slot.direction))
      .multiply(_turn.setFromAxisAngle(_Z, -slot.tilt)),
    _slot.axis.copy(_UP).applyQuaternion(_slot.quaternion),
    _slot
  ))(PEN_SLOTS[tool]);

var _laidAt = (tool: Tool, jitter: ToolJitter) =>
  ((laid) => (
    _laid.center.set(...laid.center),
    _laid.axis.set(...laid.axis),
    _laid.side.crossVectors(_UP, _laid.axis),
    _laid.quaternion
      .setFromRotationMatrix(_basis.makeBasis(_UP, _laid.axis, _laid.side))
      .multiply(_turn.setFromAxisAngle(_UP, laid.roll)),
    _laid
  ))(toolLaid(tool, jitter));

export var toolPose = (
  tool: Tool,
  actors: Record<Actor, number>,
  out: ToolPose,
  jitter: ToolJitter = TOOL_STEADY
): ToolPose =>
  ((s, slot, length, path) =>
    s <= _OUT.share
      ? (out.position
          .copy(slot.origin)
          .addScaledVector(slot.axis, (_OUT.length * s) / _OUT.share),
        out.quaternion.copy(slot.quaternion),
        out)
      : ((f, laid) => (
          _bezier.from
            .copy(slot.origin)
            .addScaledVector(slot.axis, _OUT.length + length / 2),
          _bezier.lead
            .copy(_bezier.from)
            .addScaledVector(slot.axis, path.lead)
            .add(
              _shift.set(...onFrame(path.aside[0], path.aside[1], path.lift))
            ),
          _bezier.drop.copy(laid.center).addScaledVector(_UP, path.drop),
          _bezier.to.copy(laid.center),
          out.quaternion
            .copy(slot.quaternion)
            .slerp(laid.quaternion, smooth(path.turn[0], path.turn[1], f)),
          out.position
            .copy(_bezier.from)
            .multiplyScalar((1 - f) ** 3)
            .addScaledVector(_bezier.lead, 3 * (1 - f) ** 2 * f)
            .addScaledVector(_bezier.drop, 3 * (1 - f) * f * f)
            .addScaledVector(_bezier.to, f ** 3)
            .addScaledVector(
              _shift.copy(_UP).applyQuaternion(out.quaternion),
              -length / 2
            ),
          out
        ))((s - _OUT.share) / (1 - _OUT.share), _laidAt(tool, jitter)))(
    toolProgress(tool, actors),
    _slotAt(tool, actors),
    TOOLS[tool].length,
    TOOL_PATHS[tool]
  );
