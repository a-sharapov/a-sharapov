import { ExtrudeGeometry } from 'three';
import { MM, type SvgPaths, shapeWithHoles, smoothNormals } from './svg';

var _HEIGHT = 90;
var _TWIST = Math.PI / 4;
var _TAPER = 0.86;
var _BEVEL = 1.3;

var _twist = (geometry: ExtrudeGeometry) => {
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

export var buildPenHolderGeometry = (section: SvgPaths) => ({
  body: _twist(
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
  ),
  bottom: _twist(
    new ExtrudeGeometry(section.inner.toShapes(), {
      depth: 4 - _BEVEL,
      steps: 1,
      bevelEnabled: false,
      curveSegments: 12,
    })
  ),
});
