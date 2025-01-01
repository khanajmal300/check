import { createSafeAIStream } from './utils/streamHandler';

export async function streamWrapper(response: Response): Promise<Response> {
  return createSafeAIStream(response);
}