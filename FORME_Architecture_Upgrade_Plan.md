# FORME: Core Architecture & UX Upgrade Plan

This document outlines a massive, 10-phase architectural and UX upgrade for the FORME fitness application. The goal is to transform the app into a premium, minimalist, and intelligent fitness system (Eat + Train + Recover) without rewriting the entire existing React/Zustand/Firebase codebase.

---

## The Core Philosophy
1. **Extreme Simplicity:** Complex data (volume calculations, CNS mapping, macro math) must happen invisibly in the background. The user simply taps "Log", "Train", or "Check in."
2. **Minimalist Aesthetic:** No highly-detailed 3D anatomy or cluttered bodybuilding dashboards. We rely heavily on sleek glassmorphism, micro-animations (Framer Motion), and minimal color palettes.
3. **Focused Gym Mode:** When a user is in the gym, the app enters a locked-in "Active Workout" state. Irrelevant features (like food logging) are pushed aside.

---

## Phase 1: The Exercise Data Foundation
*Before building the UI, we must build the brain of the training system.*
1. **The Comprehensive Database:** Create a hardcoded database (`exerciseDatabase.ts`) containing 150+ canonical exercises categorized by primary muscle, secondary muscles, equipment, and movement type.
2. **Aliases & Smart Search:** Build an intelligent search engine that supports aliases (e.g., searching "cable pushdown" finds "Tricep Pushdown" or "hack" finds "Hack Squat").
3. **Custom Exercises:** Build the UI/State allowing users to create personal exercises that inject seamlessly into their local library to prevent the database from being a limitation.

## Phase 2: The Core Workout Logger
*Stripping out unnecessary complexity (like RIR) and building a lightning-fast data entry system.*
1. **Remove RIR (Reps In Reserve):** Eradicate RIR from all state types and UI components to simplify logging.
2. **Set/Weight/Reps Table:** Build a clean, auto-numbering table layout for set entry.
3. **KG/LB Global Toggle:** Implement a global state for weight preference and ensure decimal inputs (e.g., 22.5) work flawlessly without corrupting historical data.
4. **Previous Performance UI:** Display the historical sets visually above today's input fields.
5. **"Copy Previous" Action:** A single tap that copies the last workout's set/weight/reps into the active fields to radically speed up logging.

## Phase 3: The Active Gym Mode & Analytics
*Building the focused "Active Workout" state and crunching the numbers.*
1. **Active Workout State:** Lock the app into "Gym Mode." Maintain an explicit active state in Zustand. Ensure this state persists even if the app closes or the phone locks (no reliance on a final "Save" button to prevent data loss).
2. **Gym-Optimized Input:** Ensure inputs open the native numeric keyboard instantly. Build a subtle, non-blocking Rest Timer.
3. **Volume Calculation:** Auto-calculate total volume (Sets × Weight × Reps) in the background.
4. **Progressive Overload Feedback:** Add subtle visual cues (e.g., `↑ +2.5 kg` or `↑ +2 reps`) when the user beats their previous numbers.
5. **Workout History Log:** Build a timeline view showing all past sessions for a specific canonical exercise (merging history for aliases).

## Phase 4: The Recovery Engine (The Muscle Maps)
*Connecting the workout data to the visual recovery system.*
1. **Exercise → Muscle Mapping:** Hook the Phase 1 database to the `cnsStore`. When a set is logged, record the exact timestamp against the mapped Primary and Secondary muscles.
2. **Recovery Calculation:** Build the logic mapping hours-since-trained to states: `<24h (RED = Fatigued)`, `24h-48h (ORANGE = Recovering)`, `>48h (GREEN = Fresh)`.
3. **The Silhouette UI:** Implement a dark-mode minimalist SVG human map. Layer individual glowing SVG patches for each muscle group.
4. **The Muscle Timeline:** Build a list-view underneath the map with horizontal progress bars.
5. **Actionable Recommendations:** When clicking a muscle, show a modal with exact data (Last Trained, Intensity) and dynamically recommend exercises to "Avoid" or "OK" based on fatigue.

## Phase 5: Advanced Nutrition Input
*Making food logging insanely fast and culturally adapted.*
1. **Smart Portions (Indian Food Focus):** Expand the unit types to include specific household measurements (Katori, glass, piece). 
2. **Smart Portion Memory:** Build a memory system that defaults to the user's preferred unit for a specific food if logged repeatedly (e.g., remembering they use "Katori" for Dal instead of grams).
3. **The Barcode Scanner:** Integrate a web-native barcode scanner. Connect to a database to fetch brand, serving size, and macros. Provide options for "Entire package", "Half", or "Custom grams".
4. **Data Quality Layer:** Ensure manufacturer barcode data overrides any estimations and provide a manual fallback for missing products.

## Phase 6: Snap Food AI Refinement
*Enhancing the camera feature without making false promises.*
1. **AI Confirmation Flow:** The AI estimates the meal, but strictly presents it as an *estimate* (do not create false precision).
2. **Correction UI:** Provide a "Does this look right?" confirmation screen where the user can tweak the AI's guesses (Food, Quantity, Serving size) before committing it to the log.

## Phase 7: Deep Nutrition Analytics
*Tracking the long-term diet trends.*
1. **Daily Macro Tracking:** Polish the 4-ring dashboard (Calories, Protein, Carbs, Fat) on the home screen. Display current intake vs. dynamic targets.
2. **Macro History:** Build 7-day, 30-day, and 90-day trend charts for calorie and macro consistency.
3. **Micronutrient Tracking:** Add a secondary "Detailed View" to track specific vitamins and minerals where reliable data is available, keeping it off the main dashboard.

## Phase 8: Ecosystem Cross-Linking
*Making Eat, Train, and Recover talk to each other as one unified system.*
1. **The 10-Second Daily Check-In:** Implement a rapid-fire contextual input for Sleep, Fatigue, and Soreness. Do not make medical diagnoses; use it strictly for contextual recovery scoring.
2. **Contextual Progress Dashboard:** Connect the dots. Show how poor sleep correlates to lower workout volumes, or how high protein relates to better recovery on the timeline.
3. **Goal-Based Targets:** Allow users to swap primary goals ("Build Muscle", "Lose Fat") and have the entire app's nutrition and progress targets dynamically shift.

## Phase 9: Intelligent Personalization & Final Polish
*The final layer of magic and speed.*
1. **Smart Shortcuts:** Surface buttons like "Log 2 Rotis" or "Log 3 Sets Bench Press" automatically based on background habit tracking.
2. **Mobile-First UX Pass:** Ensure every touch target is massive, scrolling is minimal, and micro-animations (Framer Motion) are flawless on all mounting components.
3. **Haptic Feedback & Audio Cues:** Implement the browser Vibration API to trigger subtle physical device vibrations when logging a set or completing a meal, making the app feel extremely tactile.
4. **The Final Test:** A complete end-to-end UX audit to ensure the app still feels like a minimalist, premium companion, not a spreadsheet.

## Phase 10: External Integrations & AI Magic
*Bringing back the smart assistants and syncing with external devices.*
1. **The Context-Aware AI Action Agent:** Reintroduce the "Ask FORME" chatbot. Give it the ability to read the user's daily context (calories remaining, sleep score) and perform actions (e.g., automatically logging food when the user types a sentence).
2. **True Health Integrations (Google Fit / Apple Health):** Replace the mocked health screens with real API connections to pull active calories burned and step counts. Ensure this dynamically updates the user's daily caloric targets.
