import { HalfFloatType, type PixelFormat, RedFormat, Vector2 } from 'three';
import { gaussianBlur } from 'three/addons/tsl/display/GaussianBlurNode.js';
import {
  context,
  convertToTexture,
  Fn,
  float,
  Loop,
  max,
  min,
  mix,
  outputStruct,
  property,
  smoothstep,
  sqrt,
  step,
  texture,
  uniform,
  uniformArray,
  uv,
  vec2,
  vec4,
} from 'three/tsl';
import {
  type Node,
  type NodeBuilder,
  type NodeFrame,
  NodeMaterial,
  NodeUpdateType,
  QuadMesh,
  RendererUtils,
  RenderTarget,
  TempNode,
  type TextureNode,
  type WebGPURenderer,
} from 'three/webgpu';

type F = Node<'float'>;
type V2 = Node<'vec2'>;
type V4 = Node<'vec4'>;

export var CAT_EYE = { strength: 0.34, from: 0.38, to: 1 };

var _GOLDEN_ANGLE = 2.39996323;
var _SAMPLES = 80;

export type KernelPoint = [x: number, y: number];

export var bokehKernel = () =>
  Array.from(
    { length: _SAMPLES },
    (_, i): KernelPoint =>
      ((r, theta) => [r * Math.cos(theta), r * Math.sin(theta)])(
        Math.sqrt(i / _SAMPLES),
        i * _GOLDEN_ANGLE
      )
  ).reduce<{ dense: KernelPoint[]; sparse: KernelPoint[] }>(
    (kernel, point, i) => (
      (i % 5 === 0 ? kernel.sparse : kernel.dense).push(point), kernel
    ),
    { dense: [], sparse: [] }
  );

export var chordPoint = ({ 0: x, 1: y }: KernelPoint): KernelPoint => [
  x / Math.sqrt(Math.max(1e-6, 1 - y * y)),
  y,
];

export var catEyePoint = (
  { 0: u, 1: y }: KernelPoint,
  shift: number
): KernelPoint =>
  ((across) => [u * (Math.sqrt(1 - across * across) - shift), across])(
    y * Math.sqrt(1 - shift * shift)
  );

var _vec = ({ 0: x, 1: y }: KernelPoint) => new Vector2(x, y);

var _quad = new QuadMesh(new NodeMaterial());
let _state: RendererUtils.RendererState | undefined;

type Aperture = { shift: F; squeeze: F; radial: V2; tangent: V2 };

var _aperture = (strength: F, invSize: V2): Aperture =>
  ((offset: V2, shift: F) =>
    ((radial: V2) => ({
      shift,
      squeeze: sqrt(shift.mul(shift).oneMinus()).toVar(),
      radial,
      tangent: vec2(radial.y.negate(), radial.x).toVar(),
    }))(offset.div(max(offset.length(), 1e-4)).toVar()))(
    uv().sub(0.5).div(invSize),
    strength
      .mul(
        smoothstep(
          CAT_EYE.from,
          CAT_EYE.to,
          uv().sub(0.5).length().div(vec2(0.5, 0.5).length())
        )
      )
      .toVar()
  );

var _tap = (point: V2, aperture: Aperture): V2 =>
  ((across: F) =>
    aperture.radial
      .mul(point.x.mul(sqrt(across.mul(across).oneMinus()).sub(aperture.shift)))
      .add(aperture.tangent.mul(across)))(point.y.mul(aperture.squeeze));

var _target = (name: string, format?: PixelFormat) =>
  ((target) => ((target.texture.name = name), target))(
    new RenderTarget(1, 1, {
      depthBuffer: false,
      type: HalfFloatType,
      ...(format === undefined ? {} : { format }),
    })
  );

export var lensDof = (
  input: Node,
  viewZ: Node,
  focusDistance: Node,
  focusRange: Node,
  bokehScale: Node,
  catEye: Node
) => {
  const source = convertToTexture(input) as TextureNode;
  const invSize = uniform(new Vector2());
  const coc = new RenderTarget(1, 1, {
    depthBuffer: false,
    type: HalfFloatType,
    format: RedFormat,
    count: 2,
  });
  coc.textures[0]!.name = 'DepthOfField.NearField';
  coc.textures[1]!.name = 'DepthOfField.FarField';
  const cocBlurred = _target('DepthOfField.NearFieldBlurred', RedFormat);
  const blur64 = _target('DepthOfField.Blur64');
  const nearBlur = _target('DepthOfField.Blur16Near');
  const farBlur = _target('DepthOfField.Blur16Far');
  const composite = _target('DepthOfField.Composite');
  const materials = {
    coc: new NodeMaterial(),
    cocBlur: new NodeMaterial(),
    blur64: new NodeMaterial(),
    blur16: new NodeMaterial(),
    composite: new NodeMaterial(),
  };
  const output = texture(composite.texture);
  const cocTexture = texture(coc.texture);
  const cocBlur = ((blur) => (
    [blur._horizontalRT, blur._verticalRT].forEach(
      (target) => void (target.texture.format = RedFormat)
    ),
    blur
  ))(
    gaussianBlur(cocTexture, 1, 2) as unknown as ReturnType<
      typeof gaussianBlur
    > & {
      _horizontalRT: RenderTarget;
      _verticalRT: RenderTarget;
    }
  );
  const blur64Texture = texture(blur64.texture);
  const nearTexture = texture(nearBlur.texture);
  const farTexture = texture(farBlur.texture);

  const _size = (width: number, height: number) =>
    ((halfX, halfY) =>
      void (invSize.value.set(1 / width, 1 / height),
      coc.setSize(width, height),
      composite.setSize(width, height),
      [cocBlurred, blur64, nearBlur, farBlur].forEach(
        (target) => void target.setSize(halfX, halfY)
      )))(Math.round(width / 2), Math.round(height / 2));

  const _draw = (
    renderer: WebGPURenderer,
    material: NodeMaterial,
    target: RenderTarget,
    name: string
  ) =>
    void ((_quad.material = material),
    renderer.setRenderTarget(target),
    (_quad.name = name),
    _quad.render(renderer));

  const base = new TempNode('vec4');
  const release = base.dispose.bind(base);
  const node = Object.assign(base, {
    updateBeforeType: NodeUpdateType.FRAME,
    getTextureNode: () => output,
    updateBefore: (frame: NodeFrame) =>
      ((renderer) =>
        void (((image) => _size(image.width, image.height))(
          source.value.image as { width: number; height: number }
        ),
        (_state = RendererUtils.resetRendererState(
          renderer,
          _state as RendererUtils.RendererState
        )),
        renderer.setClearColor(0x000000, 0),
        _draw(renderer, materials.coc, coc, 'DoF [ CoC ]'),
        (cocTexture.value = coc.textures[0]!),
        _draw(renderer, materials.cocBlur, cocBlurred, 'DoF [ CoC Blur ]'),
        (cocTexture.value = cocBlurred.texture),
        _draw(renderer, materials.blur64, blur64, 'DoF [ Blur64 Near ]'),
        _draw(renderer, materials.blur16, nearBlur, 'DoF [ Blur16 Near ]'),
        (cocTexture.value = coc.textures[1]!),
        _draw(renderer, materials.blur64, blur64, 'DoF [ Blur64 Far ]'),
        _draw(renderer, materials.blur16, farBlur, 'DoF [ Blur16 Far ]'),
        _draw(renderer, materials.composite, composite, 'DoF [ Composite ]'),
        RendererUtils.restoreRendererState(
          renderer,
          _state as RendererUtils.RendererState
        )))(frame.renderer as unknown as WebGPURenderer),
    setup: (builder: NodeBuilder) => {
      const shared = context(
        (
          builder as unknown as { getSharedContext: () => object }
        ).getSharedContext()
      );
      const kernel = bokehKernel();
      const near = property('float');
      const far = property('float');

      materials.coc.contextNode = shared;
      materials.coc.colorNode = Fn(() => {
        const signed = (viewZ as F).negate().sub(focusDistance as F);
        const amount = smoothstep(0, focusRange as F, signed.abs());
        near.assign(step(signed, 0).mul(amount));
        far.assign(step(0, signed).mul(amount));
        return float(0);
      })();
      materials.coc.outputNode = outputStruct(near, far);
      materials.coc.needsUpdate = true;

      materials.cocBlur.colorNode = cocBlur;
      materials.cocBlur.needsUpdate = true;

      const dense = uniformArray(
        kernel.dense.map(chordPoint).map(_vec),
        'vec2'
      );
      materials.blur64.contextNode = shared;
      materials.blur64.fragmentNode = Fn(() => {
        const at = uv();
        const amount = cocTexture.sample(at).r;
        const stride = (invSize as unknown as V2)
          .mul(bokehScale as F)
          .mul(amount);
        const sum = vec4(0).toVar();
        const aperture = _aperture(catEye as F, invSize as unknown as V2);
        Loop(kernel.dense.length, ({ i }) => {
          sum.addAssign(
            source.sample(
              at.add(
                stride.mul(_tap(dense.element(i) as unknown as V2, aperture))
              )
            )
          );
        });
        return vec4(sum.rgb.div(kernel.dense.length), amount);
      })();
      materials.blur64.needsUpdate = true;

      const sparse = uniformArray(
        kernel.sparse.map(chordPoint).map(_vec),
        'vec2'
      );
      materials.blur16.contextNode = shared;
      materials.blur16.fragmentNode = Fn(() => {
        const at = uv();
        const color = blur64Texture.sample(at).toVar();
        const peak = color.rgb.toVar();
        const stride = (invSize as unknown as V2)
          .mul(bokehScale as F)
          .mul(color.a);
        const aperture = _aperture(catEye as F, invSize as unknown as V2);
        Loop(kernel.sparse.length, ({ i }) => {
          peak.assign(
            max(
              blur64Texture.sample(
                at.add(
                  stride.mul(_tap(sparse.element(i) as unknown as V2, aperture))
                )
              ).rgb,
              peak
            )
          );
        });
        return vec4(peak, color.a);
      })();
      materials.blur16.needsUpdate = true;

      materials.composite.contextNode = shared;
      materials.composite.fragmentNode = Fn(() => {
        const at = uv();
        const nearColor = nearTexture.sample(at);
        const farColor = farTexture.sample(at);
        const beauty = source.sample(at);
        return vec4(
          mix(
            mix(beauty.rgb, farColor.rgb, min(farColor.a, 0.5).mul(2)),
            nearColor.rgb,
            min(nearColor.a, 0.5).mul(2)
          ),
          1
        );
      })();
      materials.composite.needsUpdate = true;

      return output;
    },
    dispose: () =>
      void ([coc, cocBlurred, blur64, nearBlur, farBlur, composite].forEach(
        (target) => void target.dispose()
      ),
      Object.values(materials).forEach((material) => void material.dispose()),
      cocBlur.dispose(),
      release()),
  });
  return node as typeof node & V4;
};
