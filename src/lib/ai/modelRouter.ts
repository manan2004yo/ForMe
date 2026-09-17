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

  // Parse natural language food logging
  if (lowerQuery.includes('ate') || lowerQuery.includes('had') || lowerQuery.includes('eat')) {
    // Basic mock parser
    if (lowerQuery.includes('roti')) {
      return {
        message: `I can log that for you! 2 rotis are approximately 240 kcal and 6g of protein.`,
        suggestedActions: [
          { label: 'Log 2 Rotis to Lunch', action: 'ACTION:LOG_FOOD:roti' }
        ]
      }
    }
    if (lowerQuery.includes('egg') || lowerQuery.includes('eggs')) {
      return {
        message: `Got it. 3 whole eggs are roughly 230 kcal and 18g of protein.`,
        suggestedActions: [
          { label: 'Log 3 Eggs to Breakfast', action: 'ACTION:LOG_FOOD:eggs' }
        ]
      }
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

export async function askForme(query: string, context: AIContext, provider: AIProvider = 'openai'): Promise<AIResponse> {
  console.log(`[AI Router] Routing query to ${provider}`)
  
  switch (provider) {
    case 'openai':
      try {
        const res = await fetch('/api/ai-coach', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: query }]
          })
        })

        if (!res.ok) {
          let errText = 'API failed'
          try {
            const errData = await res.json()
            errText = errData.error || errText
          } catch {
            errText = await res.text()
          }
          throw new Error(errText)
        }
        
        const data = await res.json()
        const message = data.choices[0].message.content

        return {
          message,
          confidence: 'high'
        }
      } catch (err: any) {
        console.error('AI Error:', err)
        throw new Error(err.message || 'Failed to connect to AI Coach backend.')
      }
    case 'gemini':
      throw new Error('Gemini provider not configured')
    case 'claude':
      throw new Error('Claude provider not configured')
    case 'mock':
    default:
      return callMockProvider(query, context)
  }
}
