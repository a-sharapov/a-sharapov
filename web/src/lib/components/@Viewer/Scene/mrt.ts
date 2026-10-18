import { mrt, vec4 } from 'three/tsl';
import type { Node, NodeMaterial, WebGPURenderer } from 'three/webgpu';

export var keepSceneNormals = (
  material: NodeMaterial,
  renderer: WebGPURenderer,
  extra: Record<string, Node> = {}
) =>
  ((override) =>
    void Object.defineProperty(material, 'mrtNode', {
      get: () => (renderer.getMRT() ? override : null),
      set: () => {},
      configurable: true,
    }))(mrt({ normal: vec4(0), velocity: vec4(0), ...extra }));
