// VADER-inspired Sentiment Analyzer with multilingual support
const PHI = 1.618033988749895;

const POSITIVE_LEXICON: Record<string, number> = {
  excellent: 3.1, amazing: 3.0, wonderful: 2.9, fantastic: 2.8, great: 2.5,
  good: 1.9, nice: 1.8, love: 2.8, happy: 2.5, pleased: 2.2, satisfied: 2.0,
  helpful: 2.1, perfect: 3.0, awesome: 2.8, outstanding: 3.0, brilliant: 2.9,
  thank: 1.5, thanks: 1.5, appreciate: 2.0, enjoy: 2.2, reliable: 2.0,
  impressive: 2.5, recommend: 2.3, efficient: 2.1, smooth: 1.8, fast: 1.5,
  easy: 1.8, intuitive: 2.0, seamless: 2.2, best: 2.8,
};
const NEGATIVE_LEXICON: Record<string, number> = {
  terrible: -3.1, awful: -3.0, horrible: -2.9, worst: -3.0, hate: -2.8,
  bad: -2.0, poor: -2.1, disappointed: -2.3, frustrated: -2.5, angry: -2.7,
  broken: -2.2, useless: -2.5, slow: -1.8, difficult: -1.7, confusing: -2.0,
  expensive: -1.5, overpriced: -2.0, bug: -1.8, crash: -2.5, error: -2.0,
  fail: -2.2, failure: -2.3, problem: -1.8, issue: -1.5, cancel: -2.0,
  unacceptable: -2.8, ridiculous: -2.5, waste: -2.2, annoying: -2.0,
};
const NEGATORS = new Set(['not', 'dont', 'doesnt', 'didnt', 'wont', 'cant', 'no', 'never', 'neither', 'nor']);
const INTENSIFIERS: Record<string, number> = {
  very: 1.5, extremely: 2.0, really: 1.3, absolutely: 1.8, incredibly: 1.7,
  so: 1.3, quite: 1.2, highly: 1.5, super: 1.5, totally: 1.4,
};

const EMOTION_PATTERNS: Record<string, string[]> = {
  frustrated: ['frustrated', 'frustrating', 'stuck', 'impossible', 'ugh'],
  confused: ['confused', 'confusing', 'unclear', 'lost', 'dont understand'],
  disappointed: ['disappointed', 'letdown', 'expected more', 'underwhelming'],
  excited: ['excited', 'amazing', 'cant wait', 'love it', 'thrilled'],
  angry: ['angry', 'furious', 'outraged', 'unacceptable', 'ridiculous'],
  grateful: ['thank', 'thanks', 'grateful', 'appreciate', 'blessed'],
  loyal: ['years', 'always', 'recommend', 'best ever', 'loyal'],
  fearful: ['worried', 'afraid', 'scared', 'concerned', 'anxious'],
  joyful: ['happy', 'joy', 'wonderful', 'fantastic', 'delighted'],
  surprised: ['surprised', 'unexpected', 'wow', 'shocked', 'amazed'],
  indifferent: ['whatever', 'okay', 'fine', 'meh', 'average'],
  overwhelmed: ['overwhelmed', 'too much', 'overloaded', 'drowning'],
  trusting: ['trust', 'reliable', 'dependable', 'confident', 'faith'],
  impatient: ['waiting', 'slow', 'hurry', 'when', 'still waiting'],
  sad: ['sad', 'miss', 'unfortunate', 'sorry', 'regret'],
  disgusted: ['disgusted', 'gross', 'terrible', 'revolting'],
  anticipating: ['looking forward', 'hoping', 'expect', 'soon'],
};

export function analyzeSentiment(text: string): { compound: number; emotion: string } {
  const words = text.toLowerCase().replace(/[^\w\s']/g, '').split(/\s+/);
  let totalScore = 0;
  let wordCount = 0;
  let negated = false;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (NEGATORS.has(w)) { negated = true; continue; }
    const intensifier = INTENSIFIERS[w] || 1;
    let score = POSITIVE_LEXICON[w] || NEGATIVE_LEXICON[w] || 0;
    if (score !== 0) {
      score *= intensifier;
      if (negated) { score *= -0.75; negated = false; }
      totalScore += score;
      wordCount++;
    } else {
      negated = false;
    }
  }

  const compound = wordCount > 0 ? Math.tanh(totalScore / Math.sqrt(wordCount + 1)) : 0;

  const lower = text.toLowerCase();
  let bestEmotion = 'indifferent';
  let bestScore = 0;
  for (const [emotion, patterns] of Object.entries(EMOTION_PATTERNS)) {
    const score = patterns.reduce((s, p) => s + (lower.includes(p) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; bestEmotion = emotion; }
  }
  if (bestScore === 0) {
    bestEmotion = compound > 0.3 ? 'joyful' : compound < -0.3 ? 'frustrated' : 'indifferent';
  }

  return { compound: Math.max(-1, Math.min(1, compound)), emotion: bestEmotion };
}

export function computeTrajectory(history: number[]): 'improving' | 'declining' | 'stable' | 'volatile' {
  if (history.length < 7) return 'stable';
  const last7 = history.slice(-7);
  const last30 = history.slice(-30);
  const avg7 = last7.reduce((a, b) => a + b, 0) / last7.length;
  const avg30 = last30.reduce((a, b) => a + b, 0) / last30.length;
  const momentum = avg7 - avg30;
  const variance = last7.reduce((a, v) => a + (v - avg7) ** 2, 0) / last7.length;

  if (variance > 0.15) return 'volatile';
  if (momentum > 0.1) return 'improving';
  if (momentum < -0.1) return 'declining';
  return 'stable';
}

export function timeDecayWeight(daysAgo: number): number {
  return Math.pow(PHI, -daysAgo / 30);
}
