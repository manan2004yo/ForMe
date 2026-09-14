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
  const remainingCals = Math.round(context.metrics?.caloricTarget - (context.todayFood?.calories || 0))
  const remainingProtein = Math.round(context.metrics?.proteinTarget - (context.todayFood?.protein || 0))

  if (lowerQuery.includes('pizza') || lowerQuery.includes('burger') || lowerQuery.includes('cheat') || lowerQuery.includes('dinner')) {
    return {
      message: `You have ${remainingCals} kcal and ${remainingProtein}g protein remaining. Here are your best options:`,
      suggestedActions: [
        { label: 'High Protein Dinner', action: 'Suggest high protein dinner' },
        { label: 'Quick Snack Option', action: 'Suggest a quick snack' }
      ]
    }
  }

  if (lowerQuery.includes('workout') || lowerQuery.includes('train') || lowerQuery.includes('bench') || lowerQuery.includes('sets')) {
    return {
      message: `For your goal of ${context.profile?.goal === 'build_muscle' ? 'hypertrophy' : 'strength'}, here are the recommended set and rep ranges:`,
      suggestedActions: [
        { label: 'Strength: 3-5 sets, 4-6 reps', action: 'Help me plan strength' },
        { label: 'Hypertrophy: 3-4 sets, 8-12 reps', action: 'Help me plan hypertrophy' }
      ]
    }
  }
  
  if (lowerQuery.includes('recover') || lowerQuery.includes('rest')) {
    return {
      message: `Rest days are crucial. What type of recovery are you interested in today?`,
      suggestedActions: [
        { label: 'Active Recovery Routine', action: 'Suggest active recovery' },
        { label: 'Mobility & Stretching', action: 'Suggest mobility work' }
      ]
    }
  }

  return {
    message: `I've analyzed your progress. You have ${remainingCals} kcal left today. What would you like to focus on next?`,
    suggestedActions: [
      { label: 'Review Diet Plan', action: 'Review diet plan' },
      { label: 'Adjust Macros', action: 'Adjust macros' }
    ]
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
