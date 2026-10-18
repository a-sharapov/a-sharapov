import type { Material, MeshStandardMaterial } from 'three';
import { MeshStandardNodeMaterial } from 'three/webgpu';

type Source = MeshStandardMaterial &
  Partial<
    Pick<MeshStandardNodeMaterial, (typeof _NODES)[number] | 'positionNode'>
  >;

var _NODES = [
  'colorNode',
  'emissiveNode',
  'roughnessNode',
  'metalnessNode',
  'opacityNode',
] as const;

var _create = (source: Source) =>
  Object.assign(
    new MeshStandardNodeMaterial({
      name: `${source.name} [ reflection ]`,
      side: source.side,
      transparent: source.transparent,
      alphaTest: source.alphaTest,
      flatShading: source.flatShading,
      vertexColors: source.vertexColors,
    }),
    Object.fromEntries(
      _NODES.filter((key) => source[key]).map((key) => [key, source[key]])
    )
  );

var _sync = (proxy: MeshStandardNodeMaterial, source: Source) => (
  proxy.color.copy(source.color),
  proxy.emissive.copy(source.emissive),
  Object.assign(proxy, {
    roughness: source.roughness,
    metalness: source.metalness,
    envMapIntensity: source.envMapIntensity,
    emissiveIntensity: source.emissiveIntensity,
    opacity: source.opacity,
  }),
  proxy.map !== source.map &&
    ((proxy.needsUpdate = !proxy.map !== !source.map),
    (proxy.map = source.map)),
  proxy
);

export var createReflectionMaterials = () =>
  ((proxies) => ({
    of: (material: Material): Material =>
      (material as Source).isMeshStandardMaterial &&
      !(material as Source).positionNode
        ? _sync(
            proxies.get(material) ??
              ((proxy) => (proxies.set(material, proxy), proxy))(
                _create(material as Source)
              ),
            material as Source
          )
        : material,
    dispose: () => proxies.forEach((proxy) => void proxy.dispose()),
  }))(new Map<Material, MeshStandardNodeMaterial>());
