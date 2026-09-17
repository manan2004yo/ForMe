import sys

with open('src/features/train/TrainDashboard.tsx', 'r') as f:
    content = f.read()

# Add imports
content = content.replace(
    "import { useToastStore } from '@/store/toastStore'",
    "import { useToastStore } from '@/store/toastStore'\nimport { ConfirmModal } from '@/components/ui/ConfirmModal'\nimport { PromptModal } from '@/components/ui/PromptModal'"
)

# Add DaySection state
content = content.replace(
    "  const [expanded, setExpanded] = useState(true)\n  const { toggleRestDay, removeExerciseFromDay, saveAsTemplate } = useTrainStore()",
    "  const [expanded, setExpanded] = useState(true)\n  const [showSavePrompt, setShowSavePrompt] = useState(false)\n  const { toggleRestDay, removeExerciseFromDay, saveAsTemplate } = useTrainStore()"
)

# Replace DaySection prompt
content = content.replace(
    '''              <button \n                onClick={() => {\n                  const name = prompt("Enter a name for this workout template (e.g., Push Day):")\n                  if (name) saveAsTemplate(name, dayIndex)\n                }}\n                className="px-3 py-1.5 text-xs font-semibold text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all flex items-center gap-1.5 active:scale-95"\n              >''',
    '''              <button \n                onClick={() => setShowSavePrompt(true)}\n                className="px-3 py-1.5 text-xs font-semibold text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all flex items-center gap-1.5 active:scale-95"\n              >'''
)

# Add DaySection modal
content = content.replace(
    '''        <div className="border-t border-white/5 bg-blue-500/5 p-6 flex flex-col items-center justify-center text-center">\n          <Coffee size={24} className="text-blue-400 mb-2" />\n          <p className="text-sm font-medium text-blue-200">Rest & Recovery</p>\n          <p className="text-xs text-blue-400/70 mt-1 max-w-[200px]">Focus on hydration, mobility, and high protein intake today.</p>\n        </div>\n      )}\n    </div>\n  )\n}''',
    '''        <div className="border-t border-white/5 bg-blue-500/5 p-6 flex flex-col items-center justify-center text-center">\n          <Coffee size={24} className="text-blue-400 mb-2" />\n          <p className="text-sm font-medium text-blue-200">Rest & Recovery</p>\n          <p className="text-xs text-blue-400/70 mt-1 max-w-[200px]">Focus on hydration, mobility, and high protein intake today.</p>\n        </div>\n      )}\n\n      <PromptModal\n        isOpen={showSavePrompt}\n        title="Save as Template"\n        message="Enter a name for this workout template (e.g., Push Day):"\n        placeholder="Template Name"\n        confirmText="Save Template"\n        onCancel={() => setShowSavePrompt(false)}\n        onSubmit={(name) => {\n          saveAsTemplate(name, dayIndex)\n          setShowSavePrompt(false)\n        }}\n      />\n    </div>\n  )\n}'''
)

# Add TrainDashboard state
content = content.replace(
    "  const [browsingDay, setBrowsingDay] = useState<number | null>(null)\n  const [activeWorkoutDay, setActiveWorkoutDay] = useState<WorkoutDay | null>(null)\n  const cnsStatus = getCurrentStatus()",
    "  const [browsingDay, setBrowsingDay] = useState<number | null>(null)\n  const [activeWorkoutDay, setActiveWorkoutDay] = useState<WorkoutDay | null>(null)\n  const [showClearConfirm, setShowClearConfirm] = useState(false)\n  const [loadTemplateId, setLoadTemplateId] = useState<string | null>(null)\n  const cnsStatus = getCurrentStatus()"
)

# Replace TrainDashboard clearPlan confirm
content = content.replace(
    '''              <button \n                onClick={() => {\n                  if(confirm("Are you sure you want to clear your entire weekly plan? This will remove all planned exercises.")) {\n                    clearPlan()\n                  }\n                }}\n                className="px-4 py-2 border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 active:scale-95"\n              >''',
    '''              <button \n                onClick={() => setShowClearConfirm(true)}\n                className="px-4 py-2 border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 active:scale-95"\n              >'''
)

# Replace TrainDashboard loadTemplate prompt
content = content.replace(
    '''                <button\n                  key={t.id}\n                  onClick={() => {\n                    const day = prompt("Which day to load this into? (0=Sun, 1=Mon... 6=Sat)")\n                    if (day && parseInt(day) >= 0 && parseInt(day) <= 6) {\n                      loadTemplate(t.id, parseInt(day))\n                    }\n                  }}\n                  className="px-4 py-2 bg-white/5 text-white border border-white/10 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap"\n                >''',
    '''                <button\n                  key={t.id}\n                  onClick={() => setLoadTemplateId(t.id)}\n                  className="px-4 py-2 bg-white/5 text-white border border-white/10 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap"\n                >'''
)

# Add TrainDashboard modals
content = content.replace(
    '''        {browsingDay !== null && (\n          <TrainExerciseSearch\n            onClose={() => setBrowsingDay(null)}\n            dayIndex={browsingDay}\n          />\n        )}\n      </div>\n    </PageTransition>\n  )\n}''',
    '''        {browsingDay !== null && (\n          <TrainExerciseSearch\n            onClose={() => setBrowsingDay(null)}\n            dayIndex={browsingDay}\n          />\n        )}\n\n        <ConfirmModal\n          isOpen={showClearConfirm}\n          title="Clear Plan"\n          message="Are you sure you want to clear your entire weekly plan? This will remove all planned exercises."\n          confirmText="Clear Plan"\n          isDestructive={true}\n          onCancel={() => setShowClearConfirm(false)}\n          onConfirm={() => {\n            clearPlan()\n            setShowClearConfirm(false)\n          }}\n        />\n\n        <PromptModal\n          isOpen={loadTemplateId !== null}\n          title="Load Template"\n          message="Which day to load this into? (0=Sun, 1=Mon... 6=Sat)"\n          placeholder="0-6"\n          confirmText="Load"\n          onCancel={() => setLoadTemplateId(null)}\n          onSubmit={(day) => {\n            const parsed = parseInt(day)\n            if (!isNaN(parsed) && parsed >= 0 && parsed <= 6 && loadTemplateId) {\n              loadTemplate(loadTemplateId, parsed)\n            }\n            setLoadTemplateId(null)\n          }}\n        />\n      </div>\n    </PageTransition>\n  )\n}'''
)

with open('src/features/train/TrainDashboard.tsx', 'w') as f:
    f.write(content)
