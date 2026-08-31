// src/materials/components/components.ts
import type { Component } from 'vue';
import { NButton, NCard, NForm, NFormItem, NIcon, NInput, NSelect } from 'naive-ui';
import NIconSvg from './NIconSvg.vue';

export interface IComponents {
  [key: string]: Component;
}

export const components: IComponents = {
  NIcon,
  NForm,
  NFormItem,
  NButton,
  NInput,
  NSelect,
  NCard,
  NIconSvg,
};
