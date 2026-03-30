/**
 * aiAssistant.js — OpenAI streaming chat for BuildMetrics AI Assistant
 * IIFE module: window.AiAssistant
 * Model: gpt-4o | Direct browser → OpenAI API with user's own key
 */

const AiAssistant = (() => {
    const API_URL = 'https://api.openai.com/v1/chat/completions';
    const MODEL = 'gpt-4o';

    const SYSTEM_PROMPT = `You are BuildMetrics AI, an expert structural engineer with deep knowledge of:
- Eurocode 0 (EN 1990) — Basis of structural design
- Eurocode 1 (EN 1991) — Actions on structures
- Eurocode 2 (EN 1992) — Design of concrete structures
- Eurocode 3 (EN 1993) — Design of steel structures
- Eurocode 7 (EN 1997) — Geotechnical design
- ACI 318 (US concrete) and AISC 360 (US steel)
- IS 456 (Indian concrete) and IS 800 (Indian steel)
- British Standards (BS 5950, BS 8110)

You provide precise, code-compliant structural engineering advice. When performing calculations:
1. State the relevant code clause
2. Show the formula clearly
3. Substitute values step by step
4. State the result with units
5. State PASS or FAIL with the utilisation ratio

For section properties, use standard notation: A (area), I (second moment), Z (elastic modulus), S (plastic modulus), r (radius of gyration).

Always recommend professional review for safety-critical applications.
Format responses using markdown: use **bold** for results, \`code\` for formulas, and numbered lists for step-by-step workings.`;

    /**
     * sendMessage — stream a chat completion from OpenAI.
     * @param {string} apiKey
     * @param {Array<{role: string, content: string}>} messages - full history (no system msg)
     * @param {function(string): void} onChunk - called for each streamed token
     * @param {function(): void} onDone - called when stream complete
     * @param {function(Error): void} onError - called on error
     */
    async function sendMessage(apiKey, messages, onChunk, onDone, onError) {
        if (!apiKey) {
            onError(new Error('No API key provided. Please add your OpenAI API key in the settings panel.'));
            return;
        }

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: MODEL,
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        ...messages,
                    ],
                    stream: true,
                    max_tokens: 2000,
                    temperature: 0.3,
                }),
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
                throw new Error(err.error?.message || `API error ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();
                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    const data = line.slice(6).trim();
                    if (data === '[DONE]') { onDone(); return; }
                    try {
                        const parsed = JSON.parse(data);
                        const delta = parsed.choices?.[0]?.delta?.content;
                        if (delta) onChunk(delta);
                    } catch { /* ignore malformed chunks */ }
                }
            }
            onDone();
        } catch (err) {
            onError(err);
        }
    }

    return { sendMessage, SYSTEM_PROMPT };
})();

window.AiAssistant = AiAssistant;
