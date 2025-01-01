export const AIStream = (
  response: Response,
  options?: {
    onResponse?: (response: Response) => void;
    onFinish?: () => void;
    experimental_onToolCall?: undefined;
  }
): ReadableStream => {
  // Basic implementation
  options?.onResponse?.(response);
  return response.body || new ReadableStream();
};

export class StreamingTextResponse extends Response {
  constructor(body: ReadableStream) {
    super(body, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }
}