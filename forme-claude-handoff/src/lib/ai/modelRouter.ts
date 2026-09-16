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
  await new Promise(resolve => setTimeout(resolve, 800))

  const lowerQuery = query.toLowerCase()

  if (lowerQuery.includes('pizza') || lowerQuery.includes('burger') || lowerQuery.includes('cheat')) {
    return {
      message: `You can fit it in! You have ${Math.round(context.metrics?.caloricTarget - (context.todayFood?.calories || 0))} calories left. Just be mindful of your protein target (${context.metrics?.proteinTarget}g).`,
      confidence: 'high'
    }
  }

  if (lowerQuery.includes('workout') || lowerQuery.includes('train')) {
    return {
      message: `I recommend focusing on progressive overload. If you're feeling tired, it's okay to drop the volume a bit. Need to adjust your split?`,
      suggestedActions: [{ label: 'View Training Plan', action: 'go_train' }]
    }
  }

  if (lowerQuery.includes('diet') || lowerQuery.includes('eat') || lowerQuery.includes('food')) {
    return {
      message: `Currently, you've hit ${Math.round(context.todayFood?.protein || 0)}g out of ${context.metrics?.proteinTarget}g of protein today. Try to include a lean protein source in your next meal!`,
      suggestedActions: [{ label: 'Log Food', action: 'log_food' }]
    }
  }

  // Generic fallback that actually echoes a bit of context so it doesn't look completely dumb
  const responses = [
    "That's a great question. Consistency is key!",
    "I'm here to help you stay on track.",
    "Make sure you're staying hydrated today!",
    "Listen to your body, recovery is just as important as the workout."
  ]
  const randomResponse = responses[Math.floor(Math.random() * responses.length)]

  return {
    message: `${randomResponse} By the way, you have ${Math.round(context.metrics?.caloricTarget - (context.todayFood?.calories || 0))} calories remaining today.`
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
