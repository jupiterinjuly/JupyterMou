// Server-only, deliberately small OpenAI-compatible adapter. No browser keys.
export function getChatModel() {
  const provider = process.env.ARTICLE_CHAT_PROVIDER || 'deepseek'
  if (!['deepseek', 'qwen'].includes(provider)) return null
  const qwen = provider === 'qwen'
  const key = qwen
    ? process.env.DASHSCOPE_API_KEY
    : process.env.DEEPSEEK_API_KEY
  if (!key?.trim()) return null
  return {
    provider,
    key: key.trim(),
    model:
      process.env.ARTICLE_CHAT_MODEL ||
      (qwen ? 'qwen3.8-flash' : 'deepseek-flash'),
    url: qwen
      ? 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
      : 'https://api.deepseek.com/chat/completions'
  }
}

export async function modelJSON(
  model,
  messages,
  { maxTokens, signal, timeout = 25000 }
) {
  const response = await fetch(model.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${model.key}`,
      'Content-Type': 'application/json'
    },
    signal: AbortSignal.any([signal, AbortSignal.timeout(timeout)]),
    body: JSON.stringify({
      model: model.model,
      messages,
      stream: false,
      max_tokens: maxTokens,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      ...(model.provider === 'deepseek'
        ? { thinking: { type: 'disabled' } }
        : { enable_thinking: false })
    })
  })
  // Never log upstream bodies: they can contain prompts and provider details.
  if (!response.ok) {
    const error = new Error('MODEL_UNAVAILABLE')
    error.code = response.status === 402 ? 'MODEL_BALANCE' : 'MODEL_UNAVAILABLE'
    throw error
  }
  const body = await response.json()
  console.info('[article-chat] model usage', {
    provider: model.provider,
    model: model.model,
    inputTokens: Number(body.usage?.prompt_tokens) || 0,
    outputTokens: Number(body.usage?.completion_tokens) || 0
  })
  const choice = body.choices?.[0]
  if (choice?.finish_reason !== 'stop') throw new Error('MODEL_INCOMPLETE')
  const content = choice.message?.content
  if (typeof content !== 'string' || content.length > 12000)
    throw new Error('MODEL_INVALID')
  return { value: JSON.parse(content), usage: body.usage }
}
