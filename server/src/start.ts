import { startServer } from '@opentiny/genui-sdk-server';

startServer({
  port: 3100,
  baseURL: 'https://api.modelarts-maas.com/v1/',
  apiKey: 'your-api-key',
  maxAttempts: 10, // 端口冲突时最大尝试次数
});