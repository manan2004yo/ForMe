// ============================================================
// FORME - Cinematic 3D Internal Dashboard
// ============================================================

import { useRef, useEffect } from 'react'
import { motion, useScroll, useTransform, useSpring, MotionValue } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

// Import the actual functional dashboards
import { HomeDashboard } from '@/features/home/HomeDashboard'
import { EatDashboard } from '@/features/eat/EatDashboard'
import { PlanDashboard } from '@/features/plan/PlanDashboard'
import { TrainDashboard } from '@/features/train/TrainDashboard'
import { ProgressDashboard } from '@/features/progress/ProgressDashboard'
import { ProfilePage } from '@/features/profile/ProfilePage'

// --- Constants --------------------------------------------------------
const TOTAL_CHAPTERS = 6
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

  const scrollToChapter = (index: number) => {
    const scrollAmount = (index / TOTAL_CHAPTERS) * (document.documentElement.scrollHeight - window.innerHeight)
    window.scrollTo({ top: scrollAmount, behavior: 'smooth' })
  }

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
            <motion.div 
              key={ch} 
              style={{ opacity }} 
              className="text-white text-xs tracking-[0.2em] font-medium font-heading cursor-pointer pointer-events-auto hover:text-accent transition-colors"
              onClick={() => scrollToChapter(i)}
            >
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

// --- Component Wrapper for Dashboards ---------------------------------
// This isolates the real dashboards so they look beautiful over the 3D photos
// and can be scrolled internally without conflicting with the main timeline.
function AppPanel({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div 
      className={`relative w-[450px] max-w-[90vw] h-[85vh] bg-bg/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-y-auto pointer-events-auto shadow-2xl custom-scrollbar ${className || ''}`}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div className="absolute inset-0 scale-[0.85] origin-top mx-auto">
        {/* We scale it down slightly so the mobile layout fits nicely in the desktop panel */}
        <div className="w-[117%] h-full origin-top-left overflow-x-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}

// --- Individual Scenes ------------------------------------------------

function SceneHome({ progress }: { progress: MotionValue<number> }) {
  const [start, end] = getRange(0)
  const opacity = useTransform(progress, [0, 0.12, 0.18], [1, 1, 0])
  const panelX = useTransform(progress, [0, end], ['0%', '-50%'])
  const imageZ = useTransform(progress, [0, end], ['0px', '-500px'])
  const images = ['/images/1.jpeg', '/images/2.jpeg', '/images/3.jpeg', '/images/4.jpeg']

  return (
    <motion.div style={{ opacity }} className="absolute inset-0 flex items-center justify-between px-32 transform-style-3d pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,165,0,0.1)_0%,rgba(0,0,0,1)_70%)]" />
      
      <motion.div style={{ x: panelX, translateZ: '50px' }} className="relative z-20 pointer-events-auto mt-10">
        <AppPanel>
          <HomeDashboard />
        </AppPanel>
      </motion.div>

      <motion.div style={{ translateZ: imageZ }} className="relative w-[500px] h-[700px] z-10 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] rounded-sm bg-black pointer-events-none mt-10">
        <ImageSequence progress={progress} start={start} end={end} images={images} />
      </motion.div>
    </motion.div>
  )
}

function SceneEat({ progress }: { progress: MotionValue<number> }) {
  const [start, end] = getRange(1)
  const opacity = useTransform(progress, [start - 0.05, start + 0.02, end - 0.05, end + 0.02], [0, 1, 1, 0])
  const panelX = useTransform(progress, [start, end], ['50%', '-20%'])
  const imageZ = useTransform(progress, [start, start + 0.08, end], ['-800px', '0px', '200px'])
  const images = ['/images/5.jpeg', '/images/6.jpeg', '/images/7.jpeg', '/images/8.jpeg']

  return (
    <motion.div style={{ opacity }} className="absolute inset-0 flex items-center justify-between px-32 transform-style-3d pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,200,100,0.08)_0%,rgba(0,0,0,1)_80%)]" />
      
      <motion.div style={{ translateZ: imageZ }} className="relative w-[500px] h-[500px] z-10 rounded-full overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] bg-black pointer-events-none">
        <ImageSequence progress={progress} start={start} end={end} images={images} />
      </motion.div>

      <motion.div style={{ x: panelX, translateZ: '100px' }} className="relative z-20 pointer-events-auto">
        <AppPanel>
          <EatDashboard />
        </AppPanel>
      </motion.div>
    </motion.div>
  )
}

function ScenePlan({ progress }: { progress: MotionValue<number> }) {
  const [start, end] = getRange(2)
  const opacity = useTransform(progress, [start - 0.05, start + 0.02, end - 0.05, end + 0.02], [0, 1, 1, 0])
  const panelY = useTransform(progress, [start, end], ['-50%', '0%'])
  const imageScale = useTransform(progress, [start, end], [0.8, 1.2])
  const images = ['/images/9.jpeg', '/images/10.jpeg', '/images/11.jpeg', '/images/12.jpeg']

  return (
    <motion.div style={{ opacity }} className="absolute inset-0 flex items-center justify-between px-32 transform-style-3d pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(100,150,255,0.05)_0%,rgba(0,0,0,1)_80%)]" />
      
      <motion.div style={{ y: panelY, translateZ: '0px' }} className="relative z-20 pointer-events-auto">
        <AppPanel>
          <PlanDashboard />
        </AppPanel>
      </motion.div>

      <motion.div style={{ scale: imageScale, translateZ: '150px' }} className="relative w-[700px] h-[500px] z-10 overflow-hidden rounded-xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] bg-black pointer-events-none mt-12">
        <ImageSequence progress={progress} start={start} end={end} images={images} />
      </motion.div>
    </motion.div>
  )
}

function SceneTrain({ progress }: { progress: MotionValue<number> }) {
  const [start, end] = getRange(3)
  const opacity = useTransform(progress, [start - 0.05, start + 0.02, end - 0.05, end + 0.02], [0, 1, 1, 0])
  const panelX = useTransform(progress, [start, end], ['100%', '-50%'])
  const imageZ = useTransform(progress, [start, end], ['300px', '-200px'])
  const images = ['/images/13.jpeg', '/images/14.jpeg', '/images/15.jpeg', '/images/16.jpeg']

  return (
    <motion.div style={{ opacity }} className="absolute inset-0 flex items-center justify-center overflow-hidden transform-style-3d pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(255,50,0,0.1)_0%,rgba(0,0,0,1)_70%)]" />
      
      <motion.div style={{ translateZ: imageZ }} className="absolute w-full h-full z-10 bg-black pointer-events-none">
        <ImageSequence progress={progress} start={start} end={end} images={images} />
      </motion.div>

      <motion.div style={{ x: panelX, translateZ: '50px' }} className="relative z-20 pointer-events-auto ml-auto mr-32">
        <AppPanel>
          <TrainDashboard />
        </AppPanel>
      </motion.div>
    </motion.div>
  )
}

function SceneProgress({ progress }: { progress: MotionValue<number> }) {
  const [start, end] = getRange(4)
  const opacity = useTransform(progress, [start - 0.05, start + 0.02, end - 0.05, end + 0.02], [0, 1, 1, 0])
  const panelZ = useTransform(progress, [start, end], ['-200px', '100px'])
  const images = ['/images/17.jpeg', '/images/18.jpeg', '/images/19.jpeg', '/images/20.jpeg']

  return (
    <motion.div style={{ opacity }} className="absolute inset-0 flex flex-col items-center justify-center p-20 transform-style-3d pointer-events-none">
      <div className="absolute inset-0 bg-black" />
      <motion.div style={{ translateZ: '0px' }} className="absolute inset-0 z-10 opacity-70 bg-black pointer-events-none">
        <ImageSequence progress={progress} start={start} end={end} images={images} />
      </motion.div>
      
      <motion.div style={{ translateZ: panelZ }} className="relative z-20 pointer-events-auto">
        <AppPanel className="w-[600px] max-w-[90vw]">
          <ProgressDashboard />
        </AppPanel>
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
    <motion.div style={{ opacity }} className="absolute inset-0 flex items-center justify-between px-32 transform-style-3d pointer-events-none">
      <div className="absolute inset-0 bg-[#0a0a0a]" />
      <motion.div style={{ y, translateZ: '-100px' }} className="absolute top-0 left-0 w-full h-full z-10 opacity-60 bg-black pointer-events-none">
        <ImageSequence progress={progress} start={start} end={end} images={images} />
      </motion.div>
      
      <motion.div className="relative z-20 pointer-events-auto">
        <AppPanel>
          <ProfilePage />
        </AppPanel>
      </motion.div>
      
      <div className="relative z-20 text-right pointer-events-none">
        <h1 className="text-white font-heading font-bold text-8xl leading-none tracking-tighter mb-4">ME</h1>
        <p className="text-white/70 tracking-widest text-lg font-heading uppercase">The system becomes yours.</p>
      </div>
    </motion.div>
  )
}

// --- Main Page Component ----------------------------------------------

export function CinematicDashboard() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  const { scrollYProgress } = useScroll({ 
    target: containerRef, 
    offset: ['start start', 'end end'] 
  })
  
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.0001 })

  return (
    <div ref={containerRef} className="relative bg-black w-full" style={{ height: SCROLL_HEIGHT }}>
      <div className="sticky top-0 w-full h-screen overflow-hidden perspective-1000 bg-black">
        <FixedNavigation progress={smoothProgress} />

        <SceneHome progress={smoothProgress} />
        <SceneEat progress={smoothProgress} />
        <ScenePlan progress={smoothProgress} />
        <SceneTrain progress={smoothProgress} />
        <SceneProgress progress={smoothProgress} />
        <SceneMe progress={smoothProgress} />
      </div>
    </div>
  )
}
