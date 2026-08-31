<template>
  <GenuiConfigProvider :materials="materials">
    <div class="demo-container">
      <div class="input-group">
        <input
          v-model="inputText"
          placeholder="请输入问题，例如：帮我生成一个登录表单"
          @keyup.enter="handleSend"
        />
        <button :disabled="generating" @click="handleSend">{{ generating ? '生成中...' : '发送' }}</button>
      </div>
      <GenuiRenderer :content="schema" :key="rendererKey" />
    </div>
  </GenuiConfigProvider>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { GenuiRenderer, GenuiConfigProvider } from '@opentiny/genui-sdk-vue';
import { genPrompt } from '@opentiny/genui-sdk-core';
import { components } from '../src/materials';
import { materialsMeta } from '../src/meta';
import { fetchSchemaStream } from './fetch-schema-stream';

// naive-ui 物料注册表：组件映射（渲染器通过它解析 componentName -> 组件）
const materials = { components };

const inputText = ref('');
const schema = ref<any>({ componentName: 'Page', children: [] });
const rendererKey = ref(0);
const generating = ref(false);

// 通过 core 包生成任务说明（system prompt），注入物料协议与白名单规则
const systemPrompt = genPrompt('Vue', materialsMeta);

console.log('genPrompt 生成结果（前 200 字符）:', systemPrompt.slice(0, 200));

const handleSend = async () => {
  if (!inputText.value.trim() || generating.value) return;

  generating.value = true;
  schema.value = '';
  rendererKey.value++;
  const userInput = inputText.value;
  inputText.value = '';

  try {
    await fetchSchemaStream(
      import.meta.env.VITE_DEEPSEEK_API_URL,
      import.meta.env.VITE_DEEPSEEK_API_KEY,
      import.meta.env.VITE_DEEPSEEK_MODEL,
      userInput,
      systemPrompt,
      (schemaChunk) => {
        schema.value += schemaChunk;
      },
    );
  } catch (error) {
    console.error('请求失败:', error);
  } finally {
    generating.value = false;
  }
};
</script>

<style scoped>
.demo-container {
  padding: 16px;
  box-sizing: border-box;
}

.input-group {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  padding: 8px 16px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
