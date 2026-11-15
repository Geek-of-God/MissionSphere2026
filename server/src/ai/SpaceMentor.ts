import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { CATALOG, TARGET_SCENARIOS } from '../../../shared/constants/catalogData';
import { SpaceMentorRules } from '../../../shared/engine/SpaceMentorRules';
import { MentorMessage, MissionState } from '../../../shared/types/mission.types';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export class SpaceMentor {
  public static evaluateState(state: MissionState): MentorMessage | null {
    return SpaceMentorRules.evaluate(state);
  }

  public static async explainTradeOff(
    state: MissionState,
    customQuestion?: string
  ): Promise<MentorMessage> {
    const t = state.telemetry;
    const d = state.design;
    const scenario = d.target ? TARGET_SCENARIOS[d.target] : null;
    const payloads = d.payloadIds.map((id) => CATALOG[id]?.shortLabel).filter(Boolean).join(', ') || 'Aucun';
    const bus = d.busId ? CATALOG[d.busId]?.shortLabel : 'Non défini';
    const launcher = d.launcherId ? CATALOG[d.launcherId]?.shortLabel : 'Non défini';

    const fallbackResponse: MentorMessage = {
      id: `mentor-explain-${Date.now()}`,
      severity: t.powerBalance < 0 || t.budgetUsed > t.budgetMax ? 'CRITICAL' : 'INFO',
      title: customQuestion ? 'Réponse de Space Mentor' : 'Analyse du Compromis Actuel',
      explanation: `En phase ${state.currentPhase}, votre satellite (${bus}, instruments : ${payloads}) en orbite ${d.orbit.type} (${d.orbit.altitudeKm} km) consomme ${t.powerConsumed}W pour ${t.powerGenerated}W produits et pèse ${t.massTotal} kg.`,
      tradeOffTip:
        t.powerBalance < 40
          ? 'Piste socratique : Quelle ressource sacrifier (puissance solaire ou instrumentation) pour retrouver une marge électrique sûre ?'
          : t.dataGeneratedMbps > t.dataCapacityMbps
          ? 'Piste socratique : Vos capteurs génèrent plus de données que votre antenne n\'en transmet. Bande-X ou Bande-Ka ?'
          : 'Piste socratique : Vérifiez si votre lanceur et votre orbite optimisent la résolution tout en restant sous le budget cible.',
      timestamp: Date.now(),
    };

    const ai = getAiClient();
    if (!ai) {
      return fallbackResponse;
    }

    try {
      const prompt = [
        `Mission: ${scenario?.nameFr ?? 'Non choisie'} (${scenario?.nasaInspiration ?? ''}).`,
        `Phase actuelle: ${state.currentPhase}/15 (CML ${state.cmlLevel}).`,
        `Architecture: Bus=${bus}, Payloads=[${payloads}], Orbite=${d.orbit.type} ${d.orbit.altitudeKm}km, Lanceur=${launcher}.`,
        `Télémétrie: Budget $${t.budgetUsed}M/$${t.budgetMax}M, Masse ${t.massTotal}/${t.massMax || '?'}kg, Puissance ${t.powerBalance}W, Data ${t.dataGeneratedMbps}/${t.dataCapacityMbps}Mbps, Risque ${t.riskPercentage}%, Science ${t.scienceScore}pts.`,
        customQuestion
          ? `Question de l'équipe : "${customQuestion}"`
          : 'Explique le principal compromis d\'ingénierie système actuel de façon socratique.',
      ].join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'Tu es SPACE MENTOR, ingénieur système senior au NASA Mission Design Lab. Réponds en français, de manière concise (maximum 2 phrases d\'explication + 1 question/piste socratique), sans jamais donner une solution toute faite. Utilise le format JSON {"title": "...", "explanation": "...", "tradeOffTip": "..."}.',
          responseMimeType: 'application/json',
        },
      });

      const raw = (response.text ?? '').trim();
      const parsed = JSON.parse(raw);
      return {
        id: `mentor-ai-${Date.now()}`,
        severity: t.powerBalance < 0 || t.budgetUsed > t.budgetMax ? 'WARNING' : 'INFO',
        title: String(parsed.title || 'Analyse Space Mentor'),
        explanation: String(parsed.explanation || fallbackResponse.explanation),
        tradeOffTip: String(parsed.tradeOffTip || fallbackResponse.tradeOffTip),
        timestamp: Date.now(),
      };
    } catch {
      return fallbackResponse;
    }
  }
}
