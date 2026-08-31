import { PatternExtractor } from '@opentiny/genui-sdk-core';

/**
 * 将用户输入与 genPrompt 生成的任务说明（systemPrompt）发送到本地代理服务，
 * 并流式解析其中的 schemaJson 片段。
 */
export async function fetchSchemaStream(
  url: string,
  apiKey: string,
  model: string,
  userInput: string,
  systemPrompt: string,
  onSchemaUpdate: (schemaChunk: string) => void,
): Promise<void> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput },
      ],
      model,
      thinking: {
        type: 'disabled',
      },
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  const patternExtractor = new PatternExtractor({
    onNormalWrite: () => {},
    onHandledWrite: (value) => onSchemaUpdate(value),
  });

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      while (true) {
        const lineEndIndex = buffer.indexOf('\n');
        if (lineEndIndex === -1) break;

        const line = buffer.slice(0, lineEndIndex).trim();
        buffer = buffer.slice(lineEndIndex + 1);

        if (!line.startsWith('data:')) continue;

        const dataStr = line.slice(5).trim();

        if (dataStr === '[DONE]') {
          return;
        }

        try {
          const chunk = JSON.parse(dataStr);
          const content = chunk.choices?.[0]?.delta?.content;

          if (!content) continue;

          patternExtractor.handleContent(content);
        } catch (e) {
          console.error('解析后端数据失败:', e, dataStr);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
