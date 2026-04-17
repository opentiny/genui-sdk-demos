import express from 'express';
import { equipChatCompletions } from '@opentiny/genui-sdk-server';
import cors from 'cors';

const app = express();
app.use(cors());

equipChatCompletions(app, {
  route: '/chat/completions',
  apiKey: 'your-api-key',
  baseURL: 'https://api.openai.com/v1',
});

app.listen(3000);