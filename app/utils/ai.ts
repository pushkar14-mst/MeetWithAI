// ai.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Summary } from "~/types/schema";
import { saveSummaryToFirestore, getSummaryForMeeting } from "./api/meetings";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;
if (apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log('✅ Gemini API initialized');
  } catch (err) {
    console.error('❌ Failed to initialize Gemini:', err);
  }
} else {
  console.error('⚠️ Missing VITE_GEMINI_API_KEY');
}

interface TranscriptSegment {
  text: string;
  timestamp: string;
  speaker?: string;
}

export async function generateSummaryWithInsights(
  transcript: TranscriptSegment[],
  meetingId?: string
) {
  if (!genAI) {
    console.error("⚠️ AI features are disabled.");
    return;
  }

  try {
    // Check if we already have a valid summary
    if (meetingId) {
      const existingSummary = await getSummaryForMeeting(meetingId);
      if (existingSummary) {
        console.log("Valid summary already exists, skipping generation");
        return;
      }
    }

    // Only generate if we have transcript content
    if (!transcript.length) {
      console.log("No transcript content available for summary generation");
      return;
    }

    const newSummary = await generateMeetingSummary(transcript);
    const items = await extractActionItems(transcript);
    const meetingInsights = await generateMeetingInsights(transcript);
    console.log("meetingInsights -> ", meetingInsights);
    console.log("items -> ", items);
    console.log("newSummary -> ", newSummary);

    if (meetingId) {
      let summary: Summary = {
        summary: newSummary,
        actionItems: items,
        insights: meetingInsights,
        id: `${meetingId}-${new Date().toISOString()}`,
      };
      console.log("summary -> ", summary);
      await saveSummaryToFirestore(meetingId, summary);
    }
  } catch (error) {
    console.error("Error generating insights:", error);
    throw error;
  }
}

export async function transcribeAudio(audioBase64: string): Promise<string> {
  if (!genAI) throw new Error('AI features are disabled.');

  try {
    console.log(`🎤 Transcribing with model: gemini-1.5-flash`);
    console.log(`📦 Base64 length: ${audioBase64.length}`);

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [
          { text: "You are a speech-to-text transcription service. Transcribe the following audio exactly as spoken. If there is no speech, return nothing. Do not add any commentary or explanations." },
          {
            inlineData: {
              mimeType: "audio/webm;codecs=opus",
              data: audioBase64
            }
          }
        ]
      }]
    });

    const response = await result.response;
    const text = response.text();

    // Clean up the response
    const cleaned = text
      .replace(/^Here's.*?:/i, '')
      .replace(/^The transcription is:/i, '')
      .replace(/^The audio says:/i, '')
      .replace(/^I'm unable to transcribe.*$/i, '') // Remove error messages
      .replace(/^I don't have access.*$/i, '') // Remove access messages
      .replace(/^I need the audio.*$/i, '') // Remove need messages
      .trim();

    // If the cleaned text is empty or contains error messages, return empty string
    if (!cleaned || cleaned.toLowerCase().includes("unable to transcribe")) {
      return "";
    }

    console.log(`✅ Transcription from gemini-1.5-flash:`, cleaned);
    return cleaned;
  } catch (error: any) {
    if (error.message?.includes('400')) {
      throw new Error("Audio too long or in unsupported format.");
    }
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      console.warn(`⚠️ Quota hit, retrying later.`);
      return "";
    }
    console.error(`❌ Unknown error with gemini-1.5-flash:`, error);
    return "";
  }
}

export async function summarizeTranscriptChunk(text: string): Promise<string> {
  if (!genAI) return "AI unavailable.";

  const prompt = `Clean up and summarize this segment of a meeting transcript. \nPreserve natural flow, fix grammar, and remove any disfluencies. Don't fabricate. Just clean and present clearly:\n---\n${text}\n---`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const responseText = (await result.response).text().trim();

    return responseText || "No meaningful content found.";
  } catch (error) {
    console.error("❌ summarizeTranscriptChunk failed:", error);
    return "Failed to clean this segment.";
  }
}
export async function generateMeetingSummary(transcript: TranscriptSegment[]): Promise<string> {
  if (!genAI) return "AI unavailable.";

  const formattedTranscript = transcript.map(seg => seg.text).join('\n');

  const prompt = `
Return ONLY a JSON object in the following format:
{
  "summary": "A detailed bullet-point summary of the meeting (10-12 points)",
  "keyPoints": ["Main discussion topics as phrases"],
  "decisions": ["Any decisions made during the meeting"]
}

The summary must cover all key updates, issues discussed, solutions proposed, deadlines mentioned, and responsibilities assigned.

Do NOT include any explanation before or after the JSON object. Return valid JSON only.

Transcript:
${formattedTranscript}
`.trim();

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.2,
        topP: 0.9,
        topK: 40
      }
    });

    const result = await model.generateContent(prompt);
    const rawText = (await result.response).text();
    console.log("🧾 Raw Gemini Response (Structured):", rawText);

    const cleanedJson = rawText
      .replace(/```json|```/g, '')
      .replace(/^[^{]+/, '')
      .replace(/[^}]+$/, '')
      .trim();

    const parsed = JSON.parse(cleanedJson);

    if (!parsed.summary || typeof parsed.summary !== "string") {
      throw new Error("Missing or invalid summary field.");
    }

    const cleanSummary = parsed.summary
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      .replace(/\r\n|\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return cleanSummary;
  } catch (error) {
    console.warn("❗ Structured summary failed:", error);

    // Fallback summary
    try {
      const fallbackPrompt = `
Provide a detailed bullet-point summary (10-12 points) of the following meeting transcript.
Include key updates, bugs discussed, fixes proposed, deadlines, and decisions. Do not add any explanation.

Transcript:
${formattedTranscript}
`.trim();

      const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const fallbackResult = await fallbackModel.generateContent(fallbackPrompt);
      const fallbackText = (await fallbackResult.response).text().trim();

      console.log("✅ Fallback summary:", fallbackText);

      const finalClean = fallbackText
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/_(.*?)_/g, '$1')
        .replace(/\r\n|\r/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      return finalClean || "Fallback summary generated, but was empty.";
    } catch (fallbackErr) {
      console.error("❌ Fallback summary generation also failed:", fallbackErr);
      return "Failed to generate structured summary.";
    }
  }
}


export async function chatWithAI({ transcript, question }: { transcript: TranscriptSegment[], question: string }): Promise<string> {
  if (!genAI) throw new Error('AI service unavailable.');

  const formatted = transcript.map(seg => `[${new Date(seg.timestamp).toLocaleTimeString()}] ${seg.text}`).join('\n');

  const prompt = `You are an AI assistant for a meeting transcript.\n\nTranscript:\n${formatted}\n\nUser Question: ${question}\n\nGive a helpful answer based only on the transcript. If it's not present, say so.`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    return (await result.response).text();
  } catch (error) {
    console.error('❌ chatWithAI failed:', error);
    return "Unable to answer the question.";
  }
}

export async function extractActionItems(transcript: TranscriptSegment[]): Promise<string[]> {
  if (!genAI) return ["AI unavailable."];

  const prompt = `
Extract all action items from this meeting transcript.
Format each action item as a single bullet point like this:
- [Task] by [Due Date]

If no due date is mentioned, skip it.

Respond with plain text — one bullet point per line. Do not include markdown formatting like **bold** or extra explanation.

Transcript:
${transcript.map(t => t.text).join('\n')}
`.trim();

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const rawText = (await result.response).text().trim();

    // Clean output
    const cleanItems = rawText
      .replace(/\*\*(.*?)\*\*/g, '$1') // remove markdown bold
      .replace(/\*(.*?)\*/g, '$1')     // remove markdown italic
      .split('\n')
      .map(line => line.replace(/^[-•]\s*/, '').trim())
      .filter(line => line);

    return cleanItems;
  } catch (error) {
    console.error('❌ Action item extraction failed:', error);
    return ["Failed to extract action items."];
  }
}


export async function generateMeetingInsights(transcript: TranscriptSegment[]): Promise<{
  sentiment: string;
  keyTopics: string[];
  decisions: string[];
}> {
  if (!genAI) {
    return {
      sentiment: "neutral",
      keyTopics: ["AI unavailable"],
      decisions: ["AI unavailable"]
    };
  }

  const prompt = `Analyze this meeting transcript and return a JSON object with the following structure:
{
  "sentiment": "positive|neutral|negative",
  "keyTopics": ["topic1", "topic2", ...],
  "decisions": ["decision1", "decision2", ...]
}

Transcript:
${transcript.map(seg => seg.text).join('\n')}

Return ONLY the JSON object, no other text.`;

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        topK: 40
      }
    });
    const result = await model.generateContent(prompt);
    const rawText = (await result.response).text();

    // Clean the response to ensure it's valid JSON
    const cleanedJson = rawText
      .replace(/```json|```/g, '') // Remove markdown code blocks
      .replace(/^[^{]*/, '') // Remove any text before the first {
      .replace(/[^}]*$/, '') // Remove any text after the last }
      .trim();

    try {
      const insights = JSON.parse(cleanedJson);
      
      // Validate the response structure
      if (!insights.sentiment || !Array.isArray(insights.keyTopics) || !Array.isArray(insights.decisions)) {
        throw new Error('Invalid response structure');
      }

      // Ensure sentiment is one of the allowed values
      if (!['positive', 'neutral', 'negative'].includes(insights.sentiment)) {
        insights.sentiment = 'neutral';
      }

      return insights;
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError);
      console.log('Raw response:', rawText);
      console.log('Cleaned JSON:', cleanedJson);
      throw new Error('Failed to parse AI response');
    }
  } catch (error) {
    console.error('❌ Insight generation failed:', error);
    return {
      sentiment: "neutral",
      keyTopics: ["Could not analyze"],
      decisions: ["Could not analyze"]
    };
  }
}
