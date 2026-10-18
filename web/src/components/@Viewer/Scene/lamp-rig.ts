import { Quaternion, Vector3 } from 'three';
import { LAMP } from './layout';

var _MM = 0.1;
var _Y = new Vector3(0, 1, 0);

export var LAMP_DIMENSIONS = {
  baseHeight: 12 * _MM,
  stemTop: (12 + 90) * _MM,
  armAngle: (18 * Math.PI) / 180,
  armBack: 9.5,
  armFront: 17.5,
  bulbDepth: 3,
};

export var computeLampRig = () => {
  const base = new Vector3(...LAMP.base);
  const toward = new Vector3(...LAMP.target).sub(base).setY(0).normalize();
  const yaw = new Quaternion().setFromAxisAngle(
    _Y,
    Math.atan2(-toward.z, toward.x)
  );
  const world = (local: Vector3) =>
    local.clone().applyQuaternion(yaw).add(base);

  const joint = new Vector3(0, LAMP_DIMENSIONS.stemTop + 0.6, 0);
  const armDirection = new Vector3(
    Math.cos(LAMP_DIMENSIONS.armAngle),
    Math.sin(LAMP_DIMENSIONS.armAngle),
    0
  );
  const armStart = joint
    .clone()
    .addScaledVector(armDirection, -LAMP_DIMENSIONS.armBack);
  const armEnd = joint
    .clone()
    .addScaledVector(armDirection, LAMP_DIMENSIONS.armFront);
  const shade = world(armEnd);
  const aim = new Vector3(...LAMP.target).sub(shade).normalize();

  return {
    base,
    yaw,
    world,
    joint,
    armDirection,
    armStart,
    shade,
    aim,
    bulb: shade.clone().addScaledVector(aim, LAMP_DIMENSIONS.bulbDepth),
  };
};
