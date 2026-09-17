import sys

with open('src/lib/firebase/dataService.ts', 'r') as f:
    content = f.read()

content += '''
// --- Achievements -----------------------------------------------

export async function saveAchievements(uid: string, achievements: any[]): Promise<void> {
  const ref = doc(db, 'users', uid, 'achievements', 'current')
  localStorage.setItem(orme_achievements_, JSON.stringify(achievements))
  if (!navigator.onLine) return
  try {
    await setDoc(ref, { achievements: sanitizeForFirestore(achievements) })
  } catch (error) {
    console.warn('Firestore write error:', error)
  }
}

export async function getAchievements(uid: string): Promise<any[]> {
  try {
    const ref = doc(db, 'users', uid, 'achievements', 'current')
    const snap = await getDoc(ref)
    if (snap.exists()) {
      const data = snap.data().achievements as any[]
      localStorage.setItem(orme_achievements_, JSON.stringify(data))
      return data
    }
    return getLocalAchievements(uid)
  } catch {
    return getLocalAchievements(uid)
  }
}

function getLocalAchievements(uid: string): any[] {
  const raw = localStorage.getItem(orme_achievements_)
  return raw ? JSON.parse(raw) : []
}
'''

with open('src/lib/firebase/dataService.ts', 'w') as f:
    f.write(content)
