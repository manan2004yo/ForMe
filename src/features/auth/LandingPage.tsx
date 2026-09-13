// ============================================================
// FORME - Cinematic 3D Landing Page
// ============================================================

import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform, useSpring, MotionValue } from 'framer-motion'

// --- Constants --------------------------------------------------------
const TOTAL_CHAPTERS = 6
// We make the scroll container very tall so the user has plenty of scroll space
const SCROLL_HEIGHT = '600vh' 

// Helper to calculate start/end of a chapter's active scroll range
const getRange = (index: number) => {
  const step = 1 / TOTAL_CHAPTERS
  const start = index * step
  const end = start + step
  return [start, end]
}

// --- Navigation Overlay -----------------------------------------------
function FixedNavigation({ progress }: { progress: MotionValue<number> }) {
  const chapters = ['01 HOME', '02 EAT', '03 PLAN', '04 TRAIN', '05 PROGRESS', '06 ME']
  
  // Calculate which chapter is active (0 to 5)
  const activeIndex = useTransform(progress, (p) => Math.min(5, Math.floor(p * TOTAL_CHAPTERS)))

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-50 flex flex-col justify-between p-8">
      {/* Top Nav */}
      <header className="flex justify-between items-center w-full mix-blend-difference">
        <div className="font-heading font-bold tracking-widest text-white text-xl">FORME</div>
        <div className="text-white/50 text-sm tracking-widest uppercase">Cinematic Experience</div>
      </header>

      {/* Side Chapter Indicator */}
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

// --- Individual Scenes ------------------------------------------------

function SceneHome({ progress }: { progress: MotionValue<number> }) {
  const [start, end] = getRange(0)
  
  // Timeline: 0 to 0.16
  // Opacity: stays 1 until 0.12, then fades to 0 at 0.18 (overlaps into Eat)
  const opacity = useTransform(progress, [0, 0.12, 0.18], [1, 1, 0])
  
  // Camera push in
  const scale = useTransform(progress, [0, end], [1, 1.1])
  
  // Typography moves horizontally left as we scroll down
  const textX = useTransform(progress, [0, end], ['0%', '-50%'])
  
  // Image rotates and translates deep into Z space
  const imageRotateY = useTransform(progress, [0, end], ['0deg', '15deg'])
  const imageZ = useTransform(progress, [0, end], ['0px', '-500px'])
  const imageX = useTransform(progress, [0, end], ['0%', '20%'])

  return (
    <motion.div style={{ opacity }} className="absolute inset-0 flex items-center justify-center p-20 transform-style-3d">
      {/* Background Lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,165,0,0.1)_0%,rgba(0,0,0,1)_70%)]" />
      
      {/* Layer 4: Typography */}
      <motion.div style={{ x: textX, translateZ: '50px' }} className="absolute left-32 z-20">
        <div className="text-accent text-sm tracking-[0.3em] font-medium mb-4">01 / HOME</div>
        <h1 className="text-white font-heading font-bold text-8xl leading-[0.9] tracking-tighter whitespace-nowrap">
          BUILD THE BODY.<br />
          BUILD THE SYSTEM.
        </h1>
      </motion.div>

      {/* Layer 5: Hero Object */}
      <motion.div 
        style={{ rotateY: imageRotateY, translateZ: imageZ, x: imageX }} 
        className="absolute right-32 w-[500px] h-[700px] z-10"
      >
        <img src="/images/01_home.jpg" alt="Home" className="w-full h-full object-cover rounded-sm shadow-2xl opacity-90 mix-blend-lighten" />
      </motion.div>
    </motion.div>
  )
}

function SceneEat({ progress }: { progress: MotionValue<number> }) {
  const [start, end] = getRange(1)
  
  // Fades in starting at 0.12 (overlapping Home), fades out at 0.35 (overlapping Plan)
  const opacity = useTransform(progress, [start - 0.05, start + 0.02, end - 0.05, end + 0.02], [0, 1, 1, 0])
  
  // Text enters from right
  const textX = useTransform(progress, [start, end], ['50%', '-20%'])
  
  // Image enters from deep Z, comes forward, then rotates
  const imageZ = useTransform(progress, [start, start + 0.08, end], ['-800px', '0px', '200px'])
  const imageRotateX = useTransform(progress, [start + 0.05, end], ['30deg', '0deg'])

  return (
    <motion.div style={{ opacity }} className="absolute inset-0 flex items-center justify-center p-20 transform-style-3d pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,200,100,0.08)_0%,rgba(0,0,0,1)_80%)]" />
      
      <motion.div 
        style={{ translateZ: imageZ, rotateX: imageRotateX }} 
        className="absolute left-32 w-[600px] h-[600px] z-10 rounded-full overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]"
      >
        <img src="/images/02_eat.jpg" alt="Eat" className="w-full h-full object-cover" />
      </motion.div>

      <motion.div style={{ x: textX, translateZ: '100px' }} className="absolute right-32 z-20 text-right">
        <div className="text-accent text-sm tracking-[0.3em] font-medium mb-4">02 / EAT</div>
        <h1 className="text-white font-heading font-bold text-8xl leading-[0.9] tracking-tighter">
          EAT WITH<br />INTENTION.
        </h1>
        <div className="flex gap-8 justify-end mt-12 text-white/60 font-heading text-sm tracking-widest uppercase">
          <span>Protein 180g</span>
          <span>Carbs 220g</span>
          <span>Fats 65g</span>
        </div>
      </motion.div>
    </motion.div>
  )
}

function ScenePlan({ progress }: { progress: MotionValue<number> }) {
  const [start, end] = getRange(2)
  const opacity = useTransform(progress, [start - 0.05, start + 0.02, end - 0.05, end + 0.02], [0, 1, 1, 0])
  
  // Text drops vertically
  const textY = useTransform(progress, [start, end], ['-100%', '50%'])
  
  // Structural grid scaling and rotating
  const scale = useTransform(progress, [start, end], [0.8, 1.2])
  const rotateZ = useTransform(progress, [start, end], ['-5deg', '5deg'])

  return (
    <motion.div style={{ opacity }} className="absolute inset-0 flex items-center justify-center p-20 transform-style-3d pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(100,150,255,0.05)_0%,rgba(0,0,0,1)_80%)]" />
      
      <motion.div style={{ y: textY, translateZ: '0px' }} className="absolute top-12 right-32 z-10 text-right mix-blend-difference">
        <div className="text-accent text-sm tracking-[0.3em] font-medium mb-4">03 / PLAN</div>
        <h1 className="text-white font-heading font-bold text-[8rem] leading-[0.8] tracking-tighter">
          PLAN<br />THE WORK.
        </h1>
      </motion.div>

      <motion.div 
        style={{ scale, rotateZ, translateZ: '150px' }} 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] z-20"
      >
        <img src="/images/03_plan.jpg" alt="Plan" className="w-full h-full object-contain mix-blend-screen opacity-90" />
      </motion.div>
    </motion.div>
  )
}

function SceneTrain({ progress }: { progress: MotionValue<number> }) {
  const [start, end] = getRange(3)
  const opacity = useTransform(progress, [start - 0.05, start + 0.02, end - 0.05, end + 0.02], [0, 1, 1, 0])
  
  // Aggressive parallax
  const textX = useTransform(progress, [start, end], ['100%', '-100%'])
  const imageScale = useTransform(progress, [start, end], [1.5, 1])
  const imageRotateY = useTransform(progress, [start, end], ['20deg', '-10deg'])
  const imageZ = useTransform(progress, [start, end], ['300px', '-200px'])

  return (
    <motion.div style={{ opacity }} className="absolute inset-0 flex items-center justify-center overflow-hidden transform-style-3d pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(255,50,0,0.1)_0%,rgba(0,0,0,1)_70%)]" />
      
      <motion.div style={{ x: textX, translateZ: '50px' }} className="absolute z-20 whitespace-nowrap mix-blend-overlay">
        <h1 className="text-white font-heading font-bold text-[18rem] leading-none tracking-tighter opacity-80">
          DO THE WORK
        </h1>
      </motion.div>

      <motion.div 
        style={{ scale: imageScale, rotateY: imageRotateY, translateZ: imageZ }} 
        className="absolute w-full h-full z-10"
      >
        <img src="/images/04_train.jpg" alt="Train" className="w-full h-full object-cover opacity-90" />
      </motion.div>
    </motion.div>
  )
}

function SceneProgress({ progress }: { progress: MotionValue<number> }) {
  const [start, end] = getRange(4)
  const opacity = useTransform(progress, [start - 0.05, start + 0.02, end - 0.05, end + 0.02], [0, 1, 1, 0])
  
  const scale = useTransform(progress, [start, end], [0.8, 1.1])
  const blur = useTransform(progress, [start, start + 0.05], ['20px', '0px'])
  const textZ = useTransform(progress, [start, end], ['-200px', '100px'])

  return (
    <motion.div style={{ opacity }} className="absolute inset-0 flex flex-col items-center justify-center p-20 transform-style-3d pointer-events-none">
      <div className="absolute inset-0 bg-black" />
      
      <motion.div 
        style={{ scale, filter: blur, translateZ: '0px' }} 
        className="absolute inset-0 z-10 opacity-70"
      >
        <img src="/images/05_progress.jpg" alt="Progress" className="w-full h-full object-cover mix-blend-lighten" />
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
  // Final scene stays visible until the very end
  const opacity = useTransform(progress, [start - 0.05, start + 0.02], [0, 1])
  
  const imageScale = useTransform(progress, [start, end], [1.2, 1])
  const y = useTransform(progress, [start, end], ['20%', '0%'])

  const navigate = useNavigate()

  return (
    <motion.div style={{ opacity }} className="absolute inset-0 flex flex-col items-center justify-end p-20 transform-style-3d pointer-events-none">
      <div className="absolute inset-0 bg-[#0a0a0a]" />
      
      <motion.div 
        style={{ scale: imageScale, y, translateZ: '-100px' }} 
        className="absolute top-0 left-0 w-full h-full z-10 opacity-80"
      >
        <img src="/images/06_me.jpg" alt="Me" className="w-full h-full object-cover" />
      </motion.div>

      <motion.div className="relative z-20 text-center mb-12 mix-blend-difference w-full max-w-lg pointer-events-auto">
        <h1 className="text-white font-heading font-bold text-8xl leading-none tracking-tighter mb-4">
          ME
        </h1>
        <p className="text-white/70 tracking-widest text-lg font-heading mb-12 uppercase">
          The system becomes yours.
        </p>
        
        <div className="flex flex-col gap-4">
          <button onClick={() => navigate('/signup')} className="w-full py-4 bg-white text-black font-heading font-bold tracking-widest uppercase hover:bg-white/90 transition-colors pointer-events-auto cursor-pointer">
            Start for Free
          </button>
          <button onClick={() => navigate('/login')} className="w-full py-4 bg-transparent border border-white/20 text-white font-heading font-bold tracking-widest uppercase hover:bg-white/10 transition-colors pointer-events-auto cursor-pointer">
            Sign In
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// --- Main Page Component ----------------------------------------------

export function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  })

  // Apply spring physics to the scroll progress so it feels buttery smooth and cinematic
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.0001
  })

  return (
    <div ref={containerRef} className="relative bg-black" style={{ height: SCROLL_HEIGHT }}>
      {/* Sticky Cinematic Viewport */}
      <div className="sticky top-0 w-full h-screen overflow-hidden perspective-1000 bg-black">
        
        <FixedNavigation progress={smoothProgress} />

        {/* 
          All 6 scenes are mounted simultaneously and stacked absolutely.
          Their internal opacity and transform logic tied to scrollProgress determines their visibility.
        */}
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
