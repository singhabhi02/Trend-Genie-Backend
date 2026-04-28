const express = require("express");
const OpenAI = require("openai");
const router = express.Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are Trend Genie, an AI assistant for movie and fashion recommendations.
Return ONLY valid JSON with this exact shape:
{
  "type": "conversational" | "movie" | "fashion",
  "message": "string (required for conversational, optional otherwise)",
  "recommendations": object | array | null
}

Rules:
- If the user asks for a specific movie recommendation, return:
  type = "movie"
  recommendations = {
    "title": string,
    "year": string,
    "rating": string,
    "genre": string,
    "director": string,
    "plot": string,
    "similar": string[]
  }
- If the user asks for fashion recommendations, return:
  type = "fashion"
  recommendations = [
    {
      "productDisplayName": string,
      "masterCategory": string,
      "subCategory": string,
      "baseColour": string,
      "season": string,
      "usage": string,
      "gender": string
    }
  ]
- For greetings/general talk/non-specific queries, return:
  type = "conversational"
  message = helpful natural response
- Do not include markdown or extra text; output raw JSON only.`;

// Universal Recommendation Route (OpenAI powered)
router.get("/", async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: "Query is required" });

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ message: "OPENAI_API_KEY is not configured on the server." });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: String(query) },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || "{}";
    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {
        type: "conversational",
        message: "I can help with movie and fashion recommendations. Please try asking in a bit more detail.",
        recommendations: null,
      };
    }

    const safeType = ["conversational", "movie", "fashion"].includes(parsed.type)
      ? parsed.type
      : "conversational";

    if (safeType === "conversational") {
      return res.json({
        type: "conversational",
        message:
          parsed.message ||
          "I can help with movie and fashion recommendations. Tell me what you're looking for.",
      });
    }

    return res.json({
      type: safeType,
      recommendations: parsed.recommendations || (safeType === "fashion" ? [] : null),
      message: parsed.message || "",
    });
  } catch (error) {
    console.error("OpenAI recommendation error:", error);
    return res.status(500).json({
      type: "conversational",
      message:
        "I'm having trouble generating recommendations right now. Please try again in a moment.",
    });
  }
});

module.exports = router;
