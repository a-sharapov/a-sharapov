import { describe, expect, test } from 'bun:test';
import {
  type Device,
  type Graphics,
  graphicsOf,
  weakDevice,
} from '#lib/common/graphics.ts';

const _RENDERERS: Record<Graphics, string[]> = {
  discrete: [
    'ANGLE (AMD, Vulkan 1.4.354 (AMD Radeon RX 9070 XT (RADV GFX1201) (0x00007550)), radv)',
    'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 (0x00002504) Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (NVIDIA Corporation, NVIDIA GeForce GTX 1050 Ti/PCIe/SSE2, OpenGL 4.5.0)',
    'ANGLE (Intel, Intel(R) Arc(TM) A770 Graphics (0x000056A0) Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'Mesa Intel(R) Arc(tm) A750 Graphics (DG2)',
    'ANGLE (AMD, AMD Radeon RX 6500M (0x0000743F) Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (AMD, AMD Radeon Pro 5500M OpenGL Engine, OpenGL 4.1)',
    'AMD Radeon RX 580 Series (radeonsi, polaris10, LLVM 15.0.7, DRM 3.54)',
  ],
  modern: [
    'ANGLE (Apple, ANGLE Metal Renderer: Apple M1, Unspecified Version)',
    'ANGLE (Apple, ANGLE Metal Renderer: Apple M3 Pro, Unspecified Version)',
    'Apple GPU',
    'ANGLE (Intel, Intel(R) Arc(TM) Graphics (0x00007D55) Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (Intel, Intel(R) Arc(TM) 140V GPU (16GB) (0x000064A0) Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (AMD, AMD Radeon(TM) 780M Graphics (0x000015BF) Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'AMD Radeon 680M (radeonsi, rembrandt, LLVM 17.0.6, DRM 3.57)',
    'ANGLE (AMD, AMD Radeon(TM) 8060S Graphics (0x00001586) Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (Qualcomm, Qualcomm(R) Adreno(TM) X1-85 GPU (0x36334330) Direct3D11 vs_5_0 ps_5_0, D3D11)',
  ],
  integrated: [
    'ANGLE (Intel, Intel(R) UHD Graphics 620 (0x00005917) Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (Intel, Intel(R) HD Graphics 400 Direct3D11 vs_5_0 ps_5_0), or similar',
    'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics (0x00009A49) Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (Intel Inc., Intel(R) Iris(TM) Plus Graphics 655, OpenGL 4.1)',
    'Mesa Intel(R) UHD Graphics 620 (KBL GT2)',
    'Mesa Intel(R) Graphics (ADL GT2)',
    'ANGLE (AMD, AMD Radeon(TM) Graphics (0x00001638) Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (AMD, Vulkan 1.3.274 (AMD Radeon Graphics (RADV RENOIR) (0x00001636)), radv)',
    'ANGLE (AMD, AMD Radeon(TM) Vega 8 Graphics (0x000015D8) Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (AMD, AMD Radeon(TM) RX Vega 10 Graphics (0x000015D8) Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (AMD, AMD Radeon R7 Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'AMD Radeon 610M (radeonsi, raphael_mendocino, LLVM 17.0.6, DRM 3.57)',
    'ANGLE (ARM, Mali-G72, OpenGL ES 3.2)',
    'Adreno (TM) 650',
  ],
  software: [
    'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)',
    'llvmpipe (LLVM 17.0.6, 256 bits)',
    'ANGLE (Microsoft, Microsoft Basic Render Driver Direct3D11 vs_5_0 ps_5_0, D3D11)',
  ],
  unknown: ['WebKit WebGL', 'Mozilla'],
};

const _device = (
  renderer: string | null,
  extra: Partial<Device> = {}
): Device => ({
  renderer,
  caveat: false,
  cores: 8,
  memory: 8,
  ...extra,
});

describe('graphicsOf', () => {
  Object.entries(_RENDERERS).forEach(({ 0: kind, 1: renderers }) => {
    renderers.forEach((renderer) => {
      test(`${kind}: ${renderer}`, () =>
        expect(graphicsOf(renderer)).toBe(kind as Graphics));
    });
  });

  test('no WebGL or a performance caveat means software', () => {
    expect(graphicsOf(null)).toBe('software');
    expect(graphicsOf(_RENDERERS.discrete[0]!, true)).toBe('software');
  });
});

describe('weakDevice', () => {
  test('old integrated and software graphics are weak', () => {
    expect(weakDevice(_device(_RENDERERS.integrated[0]!))).toBe(true);
    expect(
      weakDevice(_device(_RENDERERS.software[0]!, { cores: 16, memory: 8 }))
    ).toBe(true);
    expect(weakDevice(_device(null))).toBe(true);
  });

  test('a discrete card is never weak, even on an old processor', () => {
    expect(
      weakDevice(_device(_RENDERERS.discrete[2]!, { cores: 2, memory: 2 }))
    ).toBe(false);
  });

  test('modern and unknown graphics are weak only on a low-end machine', () => {
    expect(weakDevice(_device(_RENDERERS.modern[0]!))).toBe(false);
    expect(weakDevice(_device(_RENDERERS.modern[0]!, { cores: 4 }))).toBe(true);
    expect(weakDevice(_device(_RENDERERS.unknown[0]!, { memory: 4 }))).toBe(
      true
    );
    expect(
      weakDevice(
        _device(_RENDERERS.unknown[0]!, {
          cores: Number.POSITIVE_INFINITY,
          memory: Number.POSITIVE_INFINITY,
        })
      )
    ).toBe(false);
  });
});
