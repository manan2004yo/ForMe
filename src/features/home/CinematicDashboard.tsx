// ============================================================
// FORME - Cinematic 3D Internal Dashboard
// ============================================================

import { useRef, useEffect } from 'react'
import { motion, useScroll, useTransform, useSpring, MotionValue } from 'framer-motion'
import { useUserStore } from '@/store/userStore'
import { useFoodLogStore } from '@/store/foodLogStore'
import { useNavigate } from 'react-router-dom'

// --- Constants --------------------------------------------------------
const TOTAL_CHAPTERS = 6
// Give plenty of scroll room
const SCROLL_HEIGHT = '600vh' 

const getRange = (index: number) => {
  const step = 1 / TOTAL_CHAPTERS
  const start = index * step
  const end = start + step
  return [start, end]
}

// --- Navigation Overlay -----------------------------------------------
function FixedNavigation({ progress }: { progress: MotionValue<number> }) {
  const chapters = ['01 HOME', '02 EAT', '03 PLAN', '04 TRAIN', '05 PROGRESS', '06 ME']
  const activeIndex = useTransform(progress, (p) => Math.min(5, Math.floor(p * TOTAL_CHAPTERS)))

  return (
    <div className="fixed top-0 left-0 w-full h-screen pointer-events-none z-50 flex flex-col justify-between p-8">
      <header className="flex justify-between items-center w-full mix-blend-difference">
        <div className="font-heading font-bold tracking-widest text-white text-xl">FORME</div>
      </header>
      <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col gap-6 mix-blend-difference">
        {chapters.map((ch, i) => {
          const isActive = useTransform(activeIndex, (idx) => idx === i)
          const opacity = useTransform(isActive, (active) => (active ? 1 : 0.3))
          return (
            <motion.div key={ch} style={{ opacity }} className="text-white text-xs tracking-[0.2em] font-medium font-heading">
              {ch}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// --- Image Sequence Helper --------------------------------------------
function ImageSequence({ progress, start, end, images }: { progress: MotionValue<number>, start: number, end: number, images: string[] }) {
  const step = (end - start) / images.length
  return (
    <>
      {images.map((img, i) => {
        const imgStart = start + (i * step)
        const imgEnd = imgStart + step
        
        // This makes the images sequentially fade in and out during the chapter's scroll range
        // Add a slight overlap so they blend together smoothly
        const opacity = useTransform(
          progress, 
          [imgStart - 0.02, imgStart, imgEnd - 0.01, imgEnd + 0.01], 
          [0, 1, 1, 0]
        )
        const scale = useTransform(progress, [imgStart, imgEnd], [1, 1.05])
        
        return (
          <motion.img 
            key={img} 
            src={img} 
            style={{ opacity, scale }} 
            className="absolute inset-0 w-full h-full object-cover" 
          />
        )
      })}
    </>
  )
}

// --- Individual Scenes ------------------------------------------------

function SceneHome({ progress, name }: { progress: MotionValue<number>, name: string }) {
  const [start, end] = getRange(0)
  const opacity = useTransform(progress, [0, 0.12, 0.18], [1, 1, 0])
  const textX = useTransform(progress, [0, end], ['0%', '-50%'])
  const imageZ = useTransform(progress, [0, end], ['0px', '-500px'])
  const images = ['/images/1.jpeg', '/images/2.jpeg', '/images/3.jpeg', '/images/4.jpeg']

  return (
    <motion.div style={{ opacity }} className="absolute inset-0 flex items-center justify-center p-20 transform-style-3d">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,165,0,0.1)_0%,rgba(0,0,0,1)_70%)]" />
      <motion.div style={{ x: textX, translateZ: '50px' }} className="absolute left-32 z-20">
        <div className="text-accent text-sm tracking-[0.3em] font-medium mb-4">01 / HOME</div>
        <h1 className="text-white font-heading font-bold text-7xl leading-[0.9] tracking-tighter whitespace-nowrap">
          WELCOME BACK,<br />
          <span className="text-accent">{name.toUpperCase()}</span>.
        </h1>
      </motion.div>
      <motion.div style={{ translateZ: imageZ }} className="absolute right-32 w-[500px] h-[700px] z-10 overflow-hidden shadow-2xl rounded-sm bg-black">
        <ImageSequence progress={progress} start={start} end={end} images={images} />
      </motion.div>
    </motion.div>
  )
}

function SceneEat({ progress, protein, carbs, fats }: { progress: MotionValue<number>, protein: number, carbs: number, fats: number }) {
  const [start, end] = getRange(1)
  const opacity = useTransform(progress, [start - 0.05, start + 0.02, end - 0.05, end + 0.02], [0, 1, 1, 0])
  const textX = useTransform(progress, [start, end], ['50%', '-20%'])
  const imageZ = useTransform(progress, [start, start + 0.08, end], ['-800px', '0px', '200px'])
  const images = ['/images/5.jpeg', '/images/6.jpeg', '/images/7.jpeg', '/images/8.jpeg']

  return (
    <motion.div style={{ opacity }} className="absolute inset-0 flex items-center justify-center p-20 transform-style-3d pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,200,100,0.08)_0%,rgba(0,0,0,1)_80%)]" />
      <motion.div style={{ translateZ: imageZ }} className="absolute left-32 w-[600px] h-[600px] z-10 rounded-full overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] bg-black">
        <ImageSequence progress={progress} start={start} end={end} images={images} />
      </motion.div>
      <motion.div style={{ x: textX, translateZ: '100px' }} className="absolute right-32 z-20 text-right">
        <div className="text-accent text-sm tracking-[0.3em] font-medium mb-4">02 / EAT</div>
        <h1 className="text-white font-heading font-bold text-8xl leading-[0.9] tracking-tighter">
          EAT WITH<br />INTENTION.
        </h1>
        <div className="flex gap-8 justify-end mt-12 text-white/60 font-heading text-sm tracking-widest uppercase">
          <span>Protein {protein}g</span>
          <span>Carbs {carbs}g</span>
          <span>Fats {fats}g</span>
        </div>
      </motion.div>
    </motion.div>
  )
}

function ScenePlan({ progress }: { progress: MotionValue<number> }) {
  const [start, end] = getRange(2)
  const opacity = useTransform(progress, [start - 0.05, start + 0.02, end - 0.05, end + 0.02], [0, 1, 1, 0])
  const textY = useTransform(progress, [start, end], ['-100%', '50%'])
  const scale = useTransform(progress, [start, end], [0.8, 1.2])
  const images = ['/images/9.jpeg', '/images/10.jpeg', '/images/11.jpeg', '/images/12.jpeg']

  return (
    <motion.div style={{ opacity }} className="absolute inset-0 flex items-center justify-center p-20 transform-style-3d pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(100,150,255,0.05)_0%,rgba(0,0,0,1)_80%)]" />
      <motion.div style={{ y: textY, translateZ: '0px' }} className="absolute top-12 right-32 z-10 text-right mix-blend-difference">
        <div className="text-accent text-sm tracking-[0.3em] font-medium mb-4">03 / PLAN</div>
        <h1 className="text-white font-heading font-bold text-[8rem] leading-[0.8] tracking-tighter">
          PLAN<br />THE WORK.
        </h1>
      </motion.div>
      <motion.div style={{ scale, translateZ: '150px' }} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] z-20 overflow-hidden rounded-xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] bg-black">
        <ImageSequence progress={progress} start={start} end={end} images={images} />
      </motion.div>
    </motion.div>
  )
}

function SceneTrain({ progress }: { progress: MotionValue<number> }) {
  const [start, end] = getRange(3)
  const opacity = useTransform(progress, [start - 0.05, start + 0.02, end - 0.05, end + 0.02], [0, 1, 1, 0])
  const textX = useTransform(progress, [start, end], ['100%', '-100%'])
  const imageZ = useTransform(progress, [start, end], ['300px', '-200px'])
  const images = ['/images/13.jpeg', '/images/14.jpeg', '/images/15.jpeg', '/images/16.jpeg']

  return (
    <motion.div style={{ opacity }} className="absolute inset-0 flex items-center justify-center overflow-hidden transform-style-3d pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(255,50,0,0.1)_0%,rgba(0,0,0,1)_70%)]" />
      <motion.div style={{ x: textX, translateZ: '50px' }} className="absolute z-20 whitespace-nowrap mix-blend-overlay">
        <h1 className="text-white font-heading font-bold text-[18rem] leading-none tracking-tighter opacity-80">
          DO THE WORK
        </h1>
      </motion.div>
      <motion.div style={{ translateZ: imageZ }} className="absolute w-full h-full z-10 bg-black">
        <ImageSequence progress={progress} start={start} end={end} images={images} />
      </motion.div>
    </motion.div>
  )
}

function SceneProgress({ progress }: { progress: MotionValue<number> }) {
  const [start, end] = getRange(4)
  const opacity = useTransform(progress, [start - 0.05, start + 0.02, end - 0.05, end + 0.02], [0, 1, 1, 0])
  const textZ = useTransform(progress, [start, end], ['-200px', '100px'])
  const images = ['/images/17.jpeg', '/images/18.jpeg', '/images/19.jpeg', '/images/20.jpeg']

  return (
    <motion.div style={{ opacity }} className="absolute inset-0 flex flex-col items-center justify-center p-20 transform-style-3d pointer-events-none">
      <div className="absolute inset-0 bg-black" />
      <motion.div style={{ translateZ: '0px' }} className="absolute inset-0 z-10 opacity-70 bg-black">
        <ImageSequence progress={progress} start={start} end={end} images={images} />
      </motion.div>
      <motion.div style={{ translateZ: textZ }} className="relative z-20 text-center mix-blend-difference">
        <div className="text-accent text-sm tracking-[0.3em] font-medium mb-4">05 / PROGRESS</div>
        <h1 className="text-white font-heading font-bold text-[6rem] leading-tight tracking-tighter mb-12">
          PROGRESS IS VISIBLE.
        </h1>
        <div className="flex gap-16 justify-center text-white font-heading">
          <div className="flex flex-col gap-2"><span className="text-sm tracking-widest text-white/50">STRENGTH</span><span className="text-3xl">+34%</span></div>
          <div className="flex flex-col gap-2"><span className="text-sm tracking-widest text-white/50">ENDURANCE</span><span className="text-3xl">+21%</span></div>
          <div className="flex flex-col gap-2"><span className="text-sm tracking-widest text-white/50">CONSISTENCY</span><span className="text-3xl">87 DAYS</span></div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function SceneMe({ progress }: { progress: MotionValue<number> }) {
  const [start, end] = getRange(5)
  const opacity = useTransform(progress, [start - 0.05, start + 0.02], [0, 1])
  const y = useTransform(progress, [start, end], ['20%', '0%'])
  const images = ['/images/21.jpeg', '/images/22.jpeg', '/images/23.jpeg', '/images/24.jpeg']

  return (
    <motion.div style={{ opacity }} className="absolute inset-0 flex flex-col items-center justify-end p-20 transform-style-3d pointer-events-none">
      <div className="absolute inset-0 bg-[#0a0a0a]" />
      <motion.div style={{ y, translateZ: '-100px' }} className="absolute top-0 left-0 w-full h-full z-10 opacity-80 bg-black">
        <ImageSequence progress={progress} start={start} end={end} images={images} />
      </motion.div>
      <motion.div className="relative z-20 text-center mb-12 mix-blend-difference w-full max-w-lg pointer-events-auto">
        <h1 className="text-white font-heading font-bold text-8xl leading-none tracking-tighter mb-4">
          ME
        </h1>
        <p className="text-white/70 tracking-widest text-lg font-heading mb-12 uppercase">
          The system becomes yours.
        </p>
      </motion.div>
    </motion.div>
  )
}

// --- Main Page Component ----------------------------------------------

export function CinematicDashboard() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Notice we track the scroll progress of this huge 600vh container
  const { scrollYProgress } = useScroll({ 
    target: containerRef, 
    offset: ['start start', 'end end'] 
  })
  
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.0001 })

  // Fetch real user data
  const { profile } = useUserStore()
  const { entries } = useFoodLogStore()
  
  const todayStr = new Date().toISOString().split('T')[0]
  const todayEntries = entries.filter(e => e.date === todayStr)
  let protein = 0, carbs = 0, fats = 0
  todayEntries.forEach(entry => {
    entry.foods.forEach(item => {
      protein += item.nutrition.protein
      carbs += item.nutrition.carbs
      fats += item.nutrition.fat
    })
  })

  return (
    <div ref={containerRef} className="relative bg-black w-full" style={{ height: SCROLL_HEIGHT }}>
      {/* 
        This is the sticky cinematic viewport camera.
        It spans the whole screen width and height.
      */}
      <div className="sticky top-0 w-full h-screen overflow-hidden perspective-1000 bg-black">
        
        <FixedNavigation progress={smoothProgress} />

        <SceneHome progress={smoothProgress} name={profile?.name?.split(' ')[0] || 'Athlete'} />
        <SceneEat progress={smoothProgress} protein={Math.round(protein)} carbs={Math.round(carbs)} fats={Math.round(fats)} />
        <ScenePlan progress={smoothProgress} />
        <SceneTrain progress={smoothProgress} />
        <SceneProgress progress={smoothProgress} />
        <SceneMe progress={smoothProgress} />
        
      </div>
    </div>
  )
}
