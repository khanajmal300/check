export function createSafeAIStream(response: Response): Response {
  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader();
      if (!reader) {
        controller.close();
        return;
      }

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Parse the chunks and handle DeepSeek format
          const text = new TextDecoder().decode(value);
          const lines = text.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              if (line.startsWith('data: ')) {
                const data = JSON.parse(line.slice(6));
                if (data.choices?.[0]?.delta?.content) {
                  controller.enqueue(new TextEncoder().encode(data.choices[0].delta.content));
                }
              }
            } catch (e) {
              console.warn('Error parsing stream chunk:', e);
            }
          }
        }
      } catch (error) {
        console.error('Stream reading error:', error);
      } finally {
        reader.releaseLock();
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
