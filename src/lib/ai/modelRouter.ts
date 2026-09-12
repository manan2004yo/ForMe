// ============================================================
// FORME — AI Model Router Abstraction
// Implements PRD Section 5: AI Model Architecture
// ============================================================

export type AIProvider = 'openai' | 'gemini' | 'claude' | 'mock'

export interface AIContext {
  profile: any
  metrics: any
  todayFood: any
  todayWorkout: any
}

interface AIResponse {
  message: string
  confidence?: 'high' | 'moderate' | 'low'
  suggestedActions?: { label: string; action: string }[]
}

// ─── Provider Adapters ─────────────────────────────────────────

async function callMockProvider(query: string, context: AIContext): Promise<AIResponse> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500))

  const lowerQuery = query.toLowerCase()

  if (lowerQuery.includes('pizza') || lowerQuery.includes('can i eat')) {
    return {
      message: `You can definitely have pizza! Looking at your day, you have about ${Math.round(context.metrics?.caloricTarget - (context.todayFood?.calories || 0))} calories left. I'd recommend a smaller portion and perhaps a protein-rich side to hit your ${context.metrics?.proteinTarget}g protein goal.`,
      confidence: 'high'
    }
  }

  if (lowerQuery.includes('not losing') || lowerQuery.includes('weight')) {
    return {
      message: `I see your weight has been stable, but if we look at your waist measurements and strength progress, you're actually building muscle while losing fat (body recomposition). Don't change your calories yet!`,
      confidence: 'high'
    }
  }

  if (lowerQuery.includes('workout') || lowerQuery.includes('train')) {
    return {
      message: `Based on your schedule, you have an Upper Body session today. Since you slept poorly yesterday, we can switch it to a shorter 30-minute recovery version if you prefer?`,
      suggestedActions: [{ label: 'Switch to 30 min', action: 'modify_workout' }]
    }
  }

  return {
    message: `I'm FORME's AI Assistant. I can see your daily target is ${context.metrics?.caloricTarget} kcal and you've eaten ${Math.round(context.todayFood?.calories || 0)} kcal so far. How can I help you reach your goals today?`
  }
}

// ─── Router ───────────────────────────────────────────────────

export async function askForme(query: string, context: AIContext, provider: AIProvider = 'mock'): Promise<AIResponse> {
  console.log(`[AI Router] Routing query to ${provider}`)
  
  switch (provider) {
    case 'openai':
      // TODO: Implement OpenAI provider when API key is available
      throw new Error('OpenAI provider not configured')
    case 'gemini':
      // TODO: Implement Gemini provider when API key is available
      throw new Error('Gemini provider not configured')
    case 'claude':
      // TODO: Implement Claude provider when API key is available
      throw new Error('Claude provider not configured')
    case 'mock':
    default:
      return callMockProvider(query, context)
  }
}
