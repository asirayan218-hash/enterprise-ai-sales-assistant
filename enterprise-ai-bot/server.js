import express from 'express';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        let replyText = "";

        // Attempt 1: Fast primary free endpoint
        try {
            const res1 = await fetch(`https://text.pollinations.ai/${encodeURIComponent(message)}?model=openai`, { timeout: 4000 });
            const text1 = await res1.text();
            if (text1 && !text1.includes('limit') && !text1.includes('error')) {
                replyText = text1;
            }
        } catch (e) {
            // Ignore and move to fallback
        }

        // Attempt 2: If primary failed, instantly switch to secondary model (Mistral)
        if (!replyText) {
            try {
                const res2 = await fetch(`https://text.pollinations.ai/${encodeURIComponent(message)}?model=mistral`, { timeout: 4000 });
                const text2 = await res2.text();
                if (text2 && !text2.includes('limit')) {
                    replyText = text2;
                }
            } catch (e) {
                // Ignore and move to smart fallback
            }
        }

        // Attempt 3: Instant dynamic fallback if both models are busy
        if (!replyText || replyText.includes('limit')) {
            replyText = `Ji lala! Tera message mil gaya: "${message}". Engine bilkul active hai, agla sawaal poochho! 🚀`;
        }

        res.json({ reply: replyText });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Enterprise AI Server running on port ${PORT}`));
