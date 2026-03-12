import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { Anthropic } from '@anthropic-ai/sdk';

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'milka-service-board-api' });
});

app.post('/api/import-wines', upload.single('file'), async (req, res) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'Missing ANTHROPIC_API_KEY in .env' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: req.file.buffer.toString('base64')
              }
            },
            {
              type: 'text',
              text: 'Extract every wine from this wine list as a JSON array. Each item must have: name (string), producer (string, or empty string if unknown), vintage (string year or NV), byGlass (boolean, true if offered by the glass). Return raw JSON only.'
            }
          ]
        }
      ]
    });

    const textBlock = response.content.find(block => block.type === 'text');
    const raw = textBlock?.text?.replace(/```json|```/g, '').trim();

    if (!raw) {
      return res.status(502).json({ error: 'Model returned no parsable text' });
    }

    let wines;
    try {
      wines = JSON.parse(raw);
    } catch {
      return res.status(502).json({ error: 'Model response was not valid JSON', raw });
    }

    return res.json({ wines });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || 'Wine import failed',
    });
  }
});

const port = Number(process.env.PORT || 8787);
app.listen(port, () => {
  console.log(`Milka API listening on http://localhost:${port}`);
});
