import os
import re
import json

def get_file_content(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception:
        return ""

def search_files(directory, pattern):
    import glob
    return glob.glob(os.path.join(directory, pattern), recursive=True)

def find_evidence(files, regex_pattern):
    for filepath in files:
        content = get_file_content(filepath)
        matches = re.finditer(regex_pattern, content, re.MULTILINE)
        for match in matches:
            line_num = content.count('\n', 0, match.start()) + 1
            return f"{filepath}:{line_num} `{match.group(0).strip()}`"
    return None

files = search_files('src', '**/*.tsx') + search_files('src', '**/*.ts') + search_files('functions', '**/*.ts')

# 1. Auth
print("--- 1. Auth ---")
print("login:", find_evidence(files, r'signInWithEmailAndPassword'))
print("google:", find_evidence(files, r'signInWithPopup'))
print("reset:", find_evidence(files, r'sendPasswordResetEmail'))
print("logout:", find_evidence(files, r'signOut\('))

# 2. Onboarding
print("\n--- 2. Onboarding ---")
print("Firebase save:", find_evidence(files, r'updateProfile\('))
print("Onboarding completion save:", find_evidence(files, r'onboardingComplete:\s*true'))

# 3. Home Dashboard
print("\n--- 3. Home Dashboard ---")
print("Macro rings:", find_evidence(files, r'MacroRing'))
print("Hydration:", find_evidence(files, r'waterStreakStore'))

# 4. Food Logging Manual Search
print("\n--- 4. Food Search ---")
print("Search call:", find_evidence(files, r'foodSearchService'))
print("Log food:", find_evidence(files, r'addFoodEntry'))

# 5. Food Barcode
print("\n--- 5. Barcode Scanner ---")
print("ZXing:", find_evidence(files, r'BrowserMultiFormatReader'))
print("API:", find_evidence(files, r'fetchProductByBarcode'))

# 6. Snap AI
print("\n--- 6. Snap AI ---")
print("API endpoint:", find_evidence(files, r'analyze-food-image'))
print("Function:", find_evidence(files, r'generativelanguage\.googleapis\.com'))

# 7. NLP Parser
print("\n--- 7. NLP Parser ---")
print("NLP func:", find_evidence(files, r'parseFoodText'))

# 8. Workout Planning
print("\n--- 8. Workout Planning ---")
print("Save template:", find_evidence(files, r'saveAsTemplate'))

# 9. Active Workout
print("\n--- 9. Active Workout ---")
print("Active Session:", find_evidence(files, r'ActiveWorkoutOverlay'))

# 10. Muscle Recovery Map
print("\n--- 10. Muscle Map ---")
print("Muscle SVG:", find_evidence(files, r'MuscleMapSVG'))

# 11. CNS Daily Check-in
print("\n--- 11. CNS ---")
print("CNS Save:", find_evidence(files, r'saveCheckIn'))

# 12. Progress Tracking
print("\n--- 12. Progress ---")
print("Weight chart:", find_evidence(files, r'MeasurementsChart'))

# 13. Achievements
print("\n--- 13. Achievements ---")
print("Achievement:", find_evidence(files, r'unlockAchievement'))

# 14. Nutrition History
print("\n--- 14. Nutrition History ---")
print("History:", find_evidence(files, r'MacroTrendsChart'))

# 15. AI Coach
print("\n--- 15. AI Coach ---")
print("AI Coach:", find_evidence(files, r'ai-coach'))

# 16. VYBE Voice Assistant
print("\n--- 16. VYBE ---")
print("VYBE:", find_evidence(files, r'vybeStore'))

# 17. Privacy and Data
print("\n--- 17. Privacy ---")
print("Delete account:", find_evidence(files, r'deleteUserAccount'))

# 18. Push Notifications
print("\n--- 18. Push ---")
print("Push:", find_evidence(files, r'Notification\.requestPermission'))

# 19. Demo Mode
print("\n--- 19. Demo Mode ---")
print("Demo:", find_evidence(files, r'isDemoMode'))

# 20. Profile and Settings
print("\n--- 20. Profile ---")
print("Save Profile:", find_evidence(files, r'updateProfile.*db'))

