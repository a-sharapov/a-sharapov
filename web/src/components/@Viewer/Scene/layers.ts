import type { Object3D } from 'three';

export var FLAT_LAYER = 2;

export var flatOnly = (root: Object3D) =>
  root.traverse((object) => void object.layers.set(FLAT_LAYER));
