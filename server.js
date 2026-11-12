import express from 'express';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const SYSTEM_PROMPT = {
    role: "system",
    content: "You are an elite, professional Enterprise AI Sales Assistant. Maintain a sharp, polished, business-oriented tone, handle objections like a pro, and focus entirely on closing deals."
};

// Global conversation history initialized with the elite system prompt
let conversationHistory = [SYSTEM_PROMPT];

// A-to-Z Fast & Free Models Priority List (openrouter/free placed first)
const freeModels = [
    "openrouter/free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "google/gemini-2.0-flash-exp:free",
    "qwen/qwen-2.5-7b-instruct:free",
    "microsoft/phi-3-mini-128k-instruct:free",
    "huggingfaceh4/zephyr-7b-beta:free",
    "openchat/openchat-7b:free",
    "gryphe/mythomax-l2-13b:free",
    "undi95/toppy-m-7b:free"
];

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        // Push user message to history
        conversationHistory.push({ role: "user", content: message });

        let replyText = "";
        let workingModel = "";

        for (const model of freeModels) {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "Enterprise AI"
                },
                body: JSON.stringify({
                    model: model,
                    messages: conversationHistory,
                    temperature: 0.7
                })
            });

            const data = await response.json();
            if (data.choices && data.choices[0]?.message?.content) {
                replyText = data.choices[0].message.content;
                workingModel = model;
                // Push assistant reply to history so context is maintained correctly
                conversationHistory.push({ role: "assistant", content: replyText });
                break;
            }
        }

        if (!replyText) {
            replyText = "All models are currently busy. Please try again shortly.";
            // Pop the last user message if all models failed so history stays clean
            conversationHistory.pop();
        }

        res.json({ reply: replyText, model: workingModel });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Fast Enterprise Server running on port ${PORT}`));
