import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Pause, Camera, Upload, Loader2, ImagePlus } from 'lucide-react'
import { useUserStore } from '@/store/userStore'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { uploadProgressPhoto } from '@/lib/firebase/storageService'
import { saveUserProfile } from '@/lib/firebase/dataService'

export function CinematicProgressMorph({ onClose }: { onClose: () => void }) {
  const { user } = useAuthStore()
  const { profile, loadProfile } = useUserStore()
  const toast = useToastStore()
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [index, setIndex] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  const photos = profile?.progressPhotos || []
  
  // Need at least 2 photos to morph
  const canMorph = photos.length >= 2
  
  // If we only have 1 photo, show it. If 0, show empty state.
  const displayImage = photos.length > 0 ? photos[index % photos.length] : null

  const togglePlay = () => {
    if (!canMorph) return
    setIsPlaying(!isPlaying)
    if (!isPlaying) {
      setIndex(index === 0 ? photos.length - 1 : 0) // toggle between first and last for drama
    }
  }

  const handleUploadClick = () => {
    if (user?.uid === 'demo') {
      toast.error("Progress photos unavailable in demo mode.")
      return
    }
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user || !profile) return
    
    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast.error("Please select a valid image file.")
      return
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error("Image size must be less than 5MB.")
      return
    }

    try {
      setIsUploading(true)
      const downloadURL = await uploadProgressPhoto(user.uid, file)
      
      const updatedPhotos = [...photos, downloadURL]
      const updatedProfile = { ...profile, progressPhotos: updatedPhotos }
      
      await saveUserProfile(user.uid, updatedProfile)
      await loadProfile(user.uid) // refresh local store
      
      toast.success("Progress photo saved successfully.")
      if (updatedPhotos.length >= 2) {
        setIndex(updatedPhotos.length - 1) // jump to newest
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to upload photo.")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      <div className="absolute top-0 inset-x-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between">
        <button onClick={onClose} className="p-2 text-white/50 hover:text-white transition-colors bg-black/20 rounded-full backdrop-blur-md">
          <X size={24} />
        </button>
        <div className="bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
          <span className="text-white font-semibold text-sm tracking-widest uppercase">
            {photos.length === 0 ? 'No Photos Yet' : (index === 0 ? 'Day 1' : 'Current')}
          </span>
        </div>
        <button 
          onClick={handleUploadClick}
          disabled={isUploading}
          className="p-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors bg-black/20 rounded-full backdrop-blur-md"
        >
          {isUploading ? <Loader2 size={20} className="animate-spin text-accent" /> : <Camera size={20} />}
        </button>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-[#0a0a0a]">
        <AnimatePresence mode="wait">
          {displayImage ? (
            <motion.img
              key={index}
              src={displayImage}
              initial={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-full object-cover max-w-lg absolute inset-0 m-auto"
              alt="Progress Morph"
            />
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center text-center px-6 max-w-sm"
            >
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <ImagePlus size={32} className="text-white/20" />
              </div>
              <h3 className="text-xl font-heading font-bold text-white mb-2">Track Your Transformation</h3>
              <p className="text-white/40 text-sm mb-8 leading-relaxed">
                Add at least two progress photos to unlock the cinematic morph viewer and see your changes over time.
              </p>
              <button 
                onClick={handleUploadClick}
                disabled={isUploading}
                className="btn btn-primary w-full shadow-glow"
              >
                {isUploading ? "Uploading..." : "Add First Photo"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {canMorph && (
        <div className="absolute bottom-10 inset-x-0 z-20 flex flex-col items-center gap-6">
          <div className="flex items-center gap-8">
            <button 
              onClick={() => setIndex(0)}
              className={`text-sm font-bold tracking-widest uppercase transition-colors ${index === 0 ? 'text-white' : 'text-white/30'}`}
            >
              Before
            </button>
            
            <button 
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)] active:scale-95"
            >
              {isPlaying ? <Pause size={24} className="fill-black" /> : <Play size={24} className="fill-black ml-1" />}
            </button>

            <button 
              onClick={() => setIndex(photos.length - 1)}
              className={`text-sm font-bold tracking-widest uppercase transition-colors ${index === photos.length - 1 ? 'text-accent' : 'text-white/30'}`}
            >
              After
            </button>
          </div>
          
          <p className="text-xs text-white/50 tracking-wide font-medium bg-black/40 backdrop-blur-md px-4 py-2 rounded-full">
            Tap Play to view cinematic morph
          </p>
        </div>
      )}
      
      {!canMorph && photos.length === 1 && (
        <div className="absolute bottom-10 inset-x-0 z-20 flex flex-col items-center gap-6">
          <p className="text-sm text-white/70 tracking-wide font-medium bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 text-center">
            Upload 1 more photo to unlock<br/>the morph effect.
          </p>
        </div>
      )}
    </motion.div>
  )
}
