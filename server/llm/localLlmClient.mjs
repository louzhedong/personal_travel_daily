function createTimeoutSignal(timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeoutId),
  };
}

async function postJson(url, payload, timeoutMs) {
  const timeout = createTimeoutSignal(timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: timeout.signal,
    });

    if (!response.ok) {
      throw new Error(`local llm request failed (${response.status})`);
    }

    return await response.json();
  } finally {
    timeout.clear();
  }
}

async function postJsonWithFallback(requests, timeoutMs) {
  let lastError = null;

  for (const request of requests) {
    try {
      return await postJson(request.url, request.payload, timeoutMs);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('local llm request failed');
}

function extractJsonObject(text) {
  const trimmed = `${text ?? ''}`.trim();
  if (!trimmed) {
    throw new Error('local llm returned empty content');
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const matched = trimmed.match(/\{[\s\S]*\}/);
    if (!matched) {
      throw new Error('local llm did not return JSON');
    }
    return JSON.parse(matched[0]);
  }
}

export function createLocalLlmClient(config) {
  return {
    async chatJson(messages) {
      const payload = await postJson(
        `${config.baseUrl}/api/chat`,
        {
          model: config.chatModel,
          messages,
          stream: false,
          format: 'json',
          options: {
            temperature: 0.1,
          },
        },
        config.timeoutMs,
      );

      return extractJsonObject(payload?.message?.content);
    },

    async embed(text) {
      const payload = await postJsonWithFallback(
        [
          {
            url: `${config.baseUrl}/api/embed`,
            payload: {
              model: config.embedModel,
              input: text,
            },
          },
          {
            url: `${config.baseUrl}/api/embeddings`,
            payload: {
              model: config.embedModel,
              prompt: text,
            },
          },
        ],
        config.timeoutMs,
      );

      const vector = Array.isArray(payload?.embedding)
        ? payload.embedding
        : Array.isArray(payload?.embeddings?.[0])
          ? payload.embeddings[0]
          : null;

      if (!Array.isArray(vector)) {
        throw new Error('local llm did not return an embedding');
      }

      return vector.map((value) => Number(value));
    },
  };
}
