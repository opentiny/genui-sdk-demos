// src/meta/meta.ts
import type { IMaterialsMeta, IMaterialsProtocol } from '@opentiny/genui-sdk-core';
import bundleJson from './bundle.json' with { type: 'json' };
import { whiteList } from './white-list';

export const materialsMeta: IMaterialsMeta = {
  materials: [bundleJson] as unknown as IMaterialsProtocol[],
  wrapperComponent: 'NCard',
  whiteList,
  examples: [],
  rules: [],
};
