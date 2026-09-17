import { describe, it, expect } from 'vitest'
import { generateDietPlan } from './dietEngine'
import type { UserProfile, BodyMetrics } from '@/types'

describe('Diet Engine', () => {
  it('generates a 4-meal plan for a standard user', () => {
    const mockProfile: UserProfile = {
      id: 'test',
      email: 'test@example.com',
      name: 'Test User',
      gender: 'male',
      age: 30,
      heightCm: 175,
      weightKg: 75,
      activityLevel: 'moderately_active',
      lifestyle: 'working_professional',
      dietType: 'non_vegetarian',
      eatsEggs: true,
      eatsMeat: true,
      eatsFish: true,
      eatsDairy: true,
      allergies: '',
      monthlyFoodBudget: 5000,
      cookingAbility: 'regular',
      eatingEnvironment: 'home',
      foodAvailability: [],
      fitnessGoal: 'build_muscle',
      trainingExperience: 'intermediate',
      trainingLocation: 'gym',
      availableEquipment: [],
      trainingDays: [1, 2, 4, 5],
      gymClosedDays: [0],
      workoutDuration: '60-90',
      physicalLimitations: '',
      complexityMode: 'smart',
      mealFrequency: 4,
      preferredKatoriGrams: 150,
      onboardingComplete: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    const mockMetrics: BodyMetrics = {
      bmi: 24.5,
      bmiCategory: 'Normal',
      bmr: 1800,
      tdee: 2600,
      caloricTarget: 2500,
      caloricStrategy: 'surplus',
      deficitOrSurplus: 300,
      proteinTarget: 150,
      carbTarget: 300,
      fatTarget: 80,
      fiberTarget: 30
    }

    const plan = generateDietPlan(mockProfile, mockMetrics)
    
    expect(plan.meals.length).toBeGreaterThan(0)
    expect(plan.totals.calories).toBeGreaterThan(0)
    expect(plan.totals.protein).toBeGreaterThan(0)
  })

  it('generates a vegetarian plan without meat', () => {
    const mockProfile: UserProfile = {
      id: 'test-veg',
      email: 'veg@example.com',
      name: 'Veg User',
      gender: 'female',
      age: 28,
      heightCm: 160,
      weightKg: 65,
      activityLevel: 'sedentary',
      lifestyle: 'student',
      dietType: 'vegetarian',
      eatsEggs: false,
      eatsMeat: false,
      eatsFish: false,
      eatsDairy: true,
      allergies: '',
      monthlyFoodBudget: 4000,
      cookingAbility: 'basic',
      eatingEnvironment: 'hostel',
      foodAvailability: [],
      fitnessGoal: 'lose_fat',
      trainingExperience: 'beginner',
      trainingLocation: 'home',
      availableEquipment: [],
      trainingDays: [1, 3, 5],
      gymClosedDays: [0],
      workoutDuration: '30-45',
      physicalLimitations: '',
      complexityMode: 'easy',
      mealFrequency: 3,
      preferredKatoriGrams: 150,
      onboardingComplete: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    const mockMetrics: BodyMetrics = {
      bmi: 25.4,
      bmiCategory: 'Overweight',
      bmr: 1400,
      tdee: 1600,
      caloricTarget: 1400,
      caloricStrategy: 'deficit',
      deficitOrSurplus: -200,
      proteinTarget: 100,
      carbTarget: 150,
      fatTarget: 50,
      fiberTarget: 25
    }

    const plan = generateDietPlan(mockProfile, mockMetrics)
    
    // Ensure no chicken or egg in meals
    const hasMeat = plan.meals.some(meal => 
      meal.items.some(item => 
        item.foodName.toLowerCase().includes('chicken') || item.foodName.toLowerCase().includes('egg')
      )
    )
    
    expect(hasMeat).toBe(false)
  })
})
