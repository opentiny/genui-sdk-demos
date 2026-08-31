// src/materials/materials.ts
import { buildMaterialDefaultValueMap, type IMaterials } from '@opentiny/genui-sdk-core';
import { materialsMeta } from '../meta';
import { components } from './components';

const requiredCompleteFieldSelectors = [];

export { components };

export const materials: IMaterials = {
  components,
  requiredCompleteFieldSelectors,
  defaultPropsMap: buildMaterialDefaultValueMap(materialsMeta),
};
