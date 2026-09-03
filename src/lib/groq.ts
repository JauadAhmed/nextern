import Groq from 'groq-sdk';
import {
  buildAIFallbackMeta,
  buildAIProviderMeta,
  sanitizeAIProviderError,
  type AIResult,
} from '@/lib/ai-meta';

const GROQ_MODEL = 'openai/gpt-oss-20b';
const LOCAL_INTERVIEW_MODEL = 'local-interview-mode';
const LOCAL_FEEDBACK_MODEL = 'local-interview-feedback';

export type GroqMessage = { role: 'user' | 'assistant' | 'system'; content: string };

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured.');
  }

  return new Groq({ apiKey });
}

async function askGroq(messages: GroqMessage[]): Promise<string> {
  const response = await getGroqClient().chat.completions.create({
    model: GROQ_MODEL,
    messages,
    temperature: 0.7,
    max_completion_tokens: 1024,
  });

  const content = response.choices[0].message.content?.trim() ?? '';
  if (!content) {
    throw new Error('Groq returned an empty response.');
  }

  return content;
}

function extractPreparedQuestions(systemPrompt: string): string[] {
  return systemPrompt
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^\d+\.\s+/.test(line))
    .map((line) => line.replace(/^\d+\.\s+/, '').trim())
    .filter(Boolean);
}

function fallbackQuestionList(): string[] {
  return [
    'Tell me about yourself and why this role interests you.',
    'Which of your current skills best match this opportunity?',
    'Describe a project where you solved a difficult problem.',
    'How do you usually learn a new tool or technology quickly?',
    'Why should we choose you for this internship?',
  ];
}

function buildFallbackInterviewReply(history: GroqMessage[]): string {
  const systemPrompt = history.find((message) => message.role === 'system')?.content ?? '';
  const questions = extractPreparedQuestions(systemPrompt);
  const preparedQuestions = questions.length > 0 ? questions : fallbackQuestionList();
  const userAnswers = history.filter((message) => message.role === 'user');
  const answerCount = userAnswers.length;

  if (answerCount >= preparedQuestions.length) {
    return "Thank you, that concludes our interview. I'll now prepare your feedback.";
  }

  const nextQuestion = preparedQuestions[answerCount];
  const acknowledgements = [
    'Thanks, that was a clear answer.',
    'Good, I can see your thinking there.',
    'That gives useful context.',
    'Nice, let us build on that.',
  ];
  const acknowledgement =
    acknowledgements[(answerCount - 1 + acknowledgements.length) % acknowledgements.length];

  return `${acknowledgement} ${nextQuestion}`;
}

function extractJsonPayload(raw: string): string {
  const clean = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();
  if (!clean) {
    throw new Error('Groq returned an empty response.');
  }

  try {
    JSON.parse(clean);
    return clean;
  } catch {
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start >= 0 && end > start) {
      const candidate = clean.slice(start, end + 1).replace(/,\s*([}\]])/g, '$1');
      JSON.parse(candidate);
      return candidate;
    }
  }

  throw new Error('Groq returned invalid JSON.');
}

export function buildInterviewSystemPrompt(params: {
  jobTitle: string;
  industry: string;
  studentName: string;
  preparedQuestions: string[];
}): string {
  return `You are a professional interviewer at a top ${params.industry} company in Bangladesh,
interviewing ${params.studentName} for a "${params.jobTitle}" internship position.

Your prepared questions (ask them one at a time, in order):
${params.preparedQuestions.map((question, index) => `${index + 1}. ${question}`).join('\n')}

Rules:
- Ask ONLY ONE question per message.
- After each answer, give a brief (1 sentence) encouraging acknowledgment, then ask the next question.
- If an answer is incomplete or unclear, ask ONE follow-up before moving on.
- After all questions are asked, say EXACTLY: "Thank you, that concludes our interview. I'll now prepare your feedback."
- Stay in character as a professional interviewer at all times.
- Be encouraging but realistic. This is a formative practice session.
- Do not add [END] or any special markers.`;
}

export async function startMockInterview(systemPrompt: string): Promise<AIResult<string>> {
  const messages: GroqMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: "Hello, I'm ready for the interview." },
  ];

  try {
    return {
      data: await askGroq(messages),
      meta: buildAIProviderMeta('groq', GROQ_MODEL),
    };
  } catch (error) {
    console.warn('[GROQ START FALLBACK]', error);
    const firstQuestion = extractPreparedQuestions(systemPrompt)[0];
    return {
      data: firstQuestion || fallbackQuestionList()[0],
      meta: buildAIFallbackMeta(
        'groq',
        sanitizeAIProviderError('groq', error),
        LOCAL_INTERVIEW_MODEL
      ),
    };
  }
}

export async function continueInterview(history: GroqMessage[]): Promise<AIResult<string>> {
  try {
    return {
      data: await askGroq(history),
      meta: buildAIProviderMeta('groq', GROQ_MODEL),
    };
  } catch (error) {
    console.warn('[GROQ CONTINUE FALLBACK]', error);
    return {
      data: buildFallbackInterviewReply(history),
      meta: buildAIFallbackMeta(
        'groq',
        sanitizeAIProviderError('groq', error),
        LOCAL_INTERVIEW_MODEL
      ),
    };
  }
}

export interface InterviewFeedback {
  overallScore: number;
  overallFeedback: string;
  strengths: string[];
  areasToImprove: string[];
  communicationScore: number;
  technicalScore: number;
  confidenceScore: number;
  nextSteps: string[];
}

function buildFallbackInterviewFeedback(params: {
  jobTitle: string;
  industry: string;
  conversationHistory: GroqMessage[];
}): InterviewFeedback {
  const userAnswers = params.conversationHistory.filter((message) => message.role === 'user');
  const totalWords = userAnswers.reduce(
    (sum, message) => sum + message.content.split(/\s+/).filter(Boolean).length,
    0
  );
  const averageWords = userAnswers.length > 0 ? totalWords / userAnswers.length : 0;
  const baseScore = Math.min(
    85,
    55 + userAnswers.length * 5 + Math.round(Math.min(averageWords, 30) / 3)
  );

  return {
    overallScore: baseScore,
    overallFeedback: `You completed a full mock interview for ${params.jobTitle} in the ${params.industry} context. Your answers showed useful potential, and the next improvement comes from making each answer more specific with clearer examples and outcomes.`,
    strengths: [
      'Stayed engaged throughout the interview.',
      'Answered with enough structure to keep the discussion moving.',
      'Showed clear motivation for the role.',
    ],
    areasToImprove: [
      'Add more real examples from projects, coursework, or teamwork.',
      'Keep answers tighter and more outcome-focused.',
      'Prepare stronger role-specific technical talking points.',
    ],
    communicationScore: Math.min(90, baseScore + 2),
    technicalScore: Math.max(50, baseScore - 5),
    confidenceScore: Math.min(90, baseScore + 1),
    nextSteps: [
      'Practice two more role-specific interview answers using the STAR format.',
      'Prepare one technical example and one teamwork example before the next session.',
      'Repeat this mock interview after improving the top weak areas.',
    ],
  };
}

export async function generateInterviewFeedback(params: {
  jobTitle: string;
  industry: string;
  conversationHistory: GroqMessage[];
}): Promise<AIResult<InterviewFeedback>> {
  const feedbackPrompt: GroqMessage = {
    role: 'user',
    content: `The mock interview for "${params.jobTitle}" at a ${params.industry} company in Bangladesh is now complete.

Based on the entire conversation above, provide structured feedback.
Return ONLY valid JSON, no markdown fences:
{
  "overallScore": <0-100>,
  "overallFeedback": "<2-3 sentence overall assessment>",
  "strengths": ["<specific strength 1>", "<strength 2>", "<strength 3>"],
  "areasToImprove": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "communicationScore": <0-100>,
  "technicalScore": <0-100>,
  "confidenceScore": <0-100>,
  "nextSteps": ["<action 1>", "<action 2>", "<action 3>"]
}`,
  };

  try {
    const raw = await askGroq([...params.conversationHistory, feedbackPrompt]);
    const parsed = JSON.parse(extractJsonPayload(raw)) as InterviewFeedback;

    return {
      data: {
        overallScore: Math.max(0, Math.min(100, Number(parsed.overallScore ?? 70))),
        overallFeedback:
          parsed.overallFeedback?.trim() ||
          'Good effort. Keep practicing with more specific examples.',
        strengths:
          Array.isArray(parsed.strengths) && parsed.strengths.length > 0
            ? parsed.strengths.slice(0, 3)
            : ['Good communication', 'Showed enthusiasm', 'Answered questions clearly'],
        areasToImprove:
          Array.isArray(parsed.areasToImprove) && parsed.areasToImprove.length > 0
            ? parsed.areasToImprove.slice(0, 3)
            : [
                'Practice more technical scenarios',
                'Prepare specific examples',
                'Work on conciseness',
              ],
        communicationScore: Math.max(0, Math.min(100, Number(parsed.communicationScore ?? 70))),
        technicalScore: Math.max(0, Math.min(100, Number(parsed.technicalScore ?? 65))),
        confidenceScore: Math.max(0, Math.min(100, Number(parsed.confidenceScore ?? 70))),
        nextSteps:
          Array.isArray(parsed.nextSteps) && parsed.nextSteps.length > 0
            ? parsed.nextSteps.slice(0, 3)
            : [
                'Practice 2 more mock interviews',
                'Review technical concepts',
                'Prepare STAR-format answers',
              ],
      },
      meta: buildAIProviderMeta('groq', GROQ_MODEL),
    };
  } catch (error) {
    console.warn('[GROQ FEEDBACK FALLBACK]', error);
    return {
      data: buildFallbackInterviewFeedback(params),
      meta: buildAIFallbackMeta(
        'groq',
        sanitizeAIProviderError('groq', error),
        LOCAL_FEEDBACK_MODEL
      ),
    };
  }
}

export function isInterviewComplete(lastAssistantMessage: string): boolean {
  const normalized = lastAssistantMessage.toLowerCase();
  return (
    normalized.includes('concludes our interview') ||
    normalized.includes('prepare your feedback') ||
    normalized.includes('that concludes our interview')
  );
}
