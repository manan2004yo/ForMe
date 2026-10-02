// ============================================================
// FORME — Barcode Scanner Overlay
// ============================================================
// Full-screen camera overlay. Same pattern as ActiveWorkoutOverlay.
// BarcodeDetector (native) used where available.
// @zxing/browser is LAZY LOADED as a fallback.
// Camera stream is always stopped on unmount / close.
// ============================================================

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, AlertCircle, Camera, Loader2 } from 'lucide-react'
import type { ScannedProduct, ResolvedScannedProduct } from '@/lib/services/barcodeProductService'
import { resolveBarcodeProduct, libraryProductToResolved } from '@/lib/services/barcodeProductService'
import { getLibraryProduct } from '@/lib/firebase/dataService'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'

interface BarcodeScannerOverlayProps {
  isOpen: boolean
  onClose: () => void
  onProductFound: (product: ResolvedScannedProduct) => void
  /** Called when the user chooses to enter the product by hand. Carries the scanned barcode and any known product name. */
  onSearchManually?: (ctx: { barcode: string; name: string }) => void
}

type ScannerState =
  | 'requesting_permission'
  | 'scanning'
  | 'fetching'
  | 'permission_denied'
  | 'not_supported'
  | 'error'
  | 'not_found'
  | 'missing_nutrition'
  | 'analyzing_image'

export function BarcodeScannerOverlay({
  isOpen,
  onClose,
  onProductFound,
  onSearchManually,
}: BarcodeScannerOverlayProps) {
  const videoRef     = useRef<HTMLVideoElement>(null)
  const streamRef    = useRef<MediaStream | null>(null)
  const scanningRef  = useRef(false)
  const animFrameRef = useRef<number | null>(null)

  const [scannerState, setScannerState] = useState<ScannerState>('requesting_permission')
  const [errorDetail, setErrorDetail]   = useState<string>('')
  const [lastBarcode,  setLastBarcode]  = useState<string | null>(null)
  const [notFoundBarcode, setNotFoundBarcode] = useState<string>('')
  const [missingNutritionName, setMissingNutritionName] = useState<string>('')
  const [labelLoading, setLabelLoading] = useState(false)
  const [labelError, setLabelError] = useState<string | null>(null)
  const toast = useToastStore()

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    scanningRef.current = false
  }, [])

  const resizeLabelImage = useCallback((dataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const maxSize = 1600
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(img.width * scale))
        canvas.height = Math.max(1, Math.round(img.height * scale))
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not prepare the label image.'))
          return
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = () => reject(new Error('Could not load the label image.'))
      img.src = dataUrl
    })
  }, [])

  const handleNutritionLabel = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLabelLoading(true)
    setLabelError(null)
    stopCamera()

    try {
      const reader = new FileReader()
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('Could not read the selected photo.'))
        reader.readAsDataURL(file)
      })

      const resized = await resizeLabelImage(dataUrl)

      const response = await fetch('/api/read-nutrition-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: resized }),
      })

      const data = await response.json()

      if (!response.ok || data.status !== 'ok' || !data.per100g) {
        throw new Error("Couldn't read the nutrition label.")
      }

      const p = data.per100g
      const unknownFields: string[] = []

      const safeNumber = (value: unknown, field: string): number => {
        if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
          unknownFields.push(field)
          return 0
        }
        return value
      }

      const calories = safeNumber(p.calories, 'calories')
      const protein = safeNumber(p.protein, 'protein')
      const carbs = safeNumber(p.carbs, 'carbs')
      const fat = safeNumber(p.fat, 'fat')
      const fiber = safeNumber(p.fiber, 'fiber')

      if (p.sugar == null) unknownFields.push('sugar')
      if (p.sodium == null) unknownFields.push('sodium')

      // Label OCR is the highest-trust source. The existing BarcodeResultSheet will
      // open from onProductFound and lets the user verify/edit every available value
      // before logging.
      const product: ResolvedScannedProduct = {
        barcode: lastBarcode ?? '',
        name: missingNutritionName,
        brand: null,
        per100g: {
          calories,
          protein,
          carbs,
          fat,
          fiber,
          ...(p.sugar != null && { sugar: p.sugar }),
          ...(p.sodium != null && { sodium: p.sodium }),
        },
        servingSizeG: typeof data.servingSizeG === 'number' ? data.servingSizeG : null,
        dataSource: 'custom',
        imageUrl: null,
        trust: {
          tier: 'label',
          label: 'Verified from Label',
        },
        unknownFields,
      }

      onProductFound(product)
      onClose()
    } catch {
      setLabelError("Couldn't read the nutrition label. Try a clearer photo of the nutrition facts panel or enter the values manually.")
    } finally {
      setLabelLoading(false)
      e.target.value = ''
    }
  }, [lastBarcode, missingNutritionName, onClose, onProductFound, resizeLabelImage, stopCamera])

  const handleBarcode = useCallback(async (barcode: string) => {
    // Only process if we haven't just scanned this one, AND we are currently in scanning state
    if (barcode === lastBarcode || !scanningRef.current) return

    setLastBarcode(barcode)
    setScannerState('fetching')
    scanningRef.current = false
    stopCamera()

    if (navigator.vibrate) navigator.vibrate(60)

    // Personal library first: the user's own confirmed products win over any external source
    const uid = useAuthStore.getState().user?.uid
    if (uid) {
      const libraryHit = await getLibraryProduct(uid, barcode)
      if (libraryHit) {
        onProductFound(libraryProductToResolved(libraryHit))
        onClose()
        return
      }
    }

    const result = await resolveBarcodeProduct(barcode)

    if (result.status === 'found') {
      onProductFound(result.product)
      onClose()
    } else if (result.status === 'missing_nutrition') {
      setMissingNutritionName(result.name)
      setScannerState('missing_nutrition')
    } else if (result.status === 'not_found') {
      setNotFoundBarcode(barcode)
      setScannerState('not_found')
    } else {
      toast.error(`Scan error: ${result.message}`)
      setLastBarcode(null)
      // Must restart camera fully — stream was destroyed by stopCamera()
      await startCamera()
    }
  }, [lastBarcode, stopCamera, onProductFound, onClose, toast])

  const startNativeScanner = useCallback(async () => {
    // @ts-ignore — BarcodeDetector is not in all TS lib versions
    const detector = new BarcodeDetector({
      formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code'],
    })

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx || !videoRef.current) return

    scanningRef.current = true

    async function tick() {
      if (!scanningRef.current || !videoRef.current) return
      if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        canvas.width  = videoRef.current.videoWidth
        canvas.height = videoRef.current.videoHeight
        ctx!.drawImage(videoRef.current, 0, 0)
        try {
          const barcodes = await detector.detect(canvas)
          if (barcodes.length > 0) {
            await handleBarcode(barcodes[0].rawValue)
            return
          }
        } catch {
          // Individual frame detection failed — continue
        }
      }
      animFrameRef.current = requestAnimationFrame(tick)
    }

    animFrameRef.current = requestAnimationFrame(tick)
  }, [handleBarcode])

  const startZXingScanner = useCallback(async (stream: MediaStream) => {
    const { BrowserMultiFormatReader } = await import('@zxing/browser')
    const reader = new BrowserMultiFormatReader()

    if (!videoRef.current) return
    scanningRef.current = true

    try {
      await reader.decodeFromStream(stream, videoRef.current, (result) => {
        if (result && scanningRef.current) {
          handleBarcode(result.getText())
        }
      })
    } catch {
      setScannerState('error')
    }
  }, [handleBarcode])

  const startCamera = useCallback(async () => {
    setScannerState('requesting_permission')

    try {
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } }
        })
      } catch {
        // Fallback for laptops or strict browsers that reject facingMode requests
        stream = await navigator.mediaDevices.getUserMedia({ video: true })
      }

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play().catch(err => {
          // Play can throw NotAllowedError due to autoplay policies.
          // Do not let this crash the camera setup.
          console.warn('Video play prevented by browser:', err)
        })
      }

      setScannerState('scanning')

      // @ts-ignore
      if (typeof BarcodeDetector !== 'undefined') {
        await startNativeScanner()
      } else {
        await startZXingScanner(stream)
      }
    } catch (err: unknown) {
      const name = err instanceof Error ? (err as DOMException).name : ''
      const msg = err instanceof Error ? err.message : String(err)
      setErrorDetail(`${name}: ${msg}`)
      
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setScannerState('permission_denied')
      } else if (name === 'NotFoundError') {
        setScannerState('not_supported')
      } else {
        setScannerState('error')
      }
    }
  }, [startNativeScanner, startZXingScanner])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    stopCamera()
    setScannerState('analyzing_image')
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser')
      const reader = new BrowserMultiFormatReader()
      const imgURL = URL.createObjectURL(file)
      const img = new Image()
      img.onload = async () => {
        try {
          const result = await reader.decodeFromImageElement(img)
          if (result) {
            scanningRef.current = true
            handleBarcode(result.getText())
          } else {
            setErrorDetail('No barcode found in this image. Try a clearer shot.')
            setScannerState('error')
          }
        } catch {
          setErrorDetail('No barcode found in this image. Try a clearer shot.')
          setScannerState('error')
        } finally {
          URL.revokeObjectURL(imgURL)
        }
      }
      img.onerror = () => {
        setErrorDetail('Failed to load the image.')
        setScannerState('error')
        URL.revokeObjectURL(imgURL)
      }
      img.src = imgURL
    } catch {
      setErrorDetail('Failed to load barcode decoder.')
      setScannerState('error')
    }
  }

  useEffect(() => {
    if (isOpen) {
      setLastBarcode(null)
      setLabelLoading(false)
      setLabelError(null)
      // Use requestAnimationFrame so <video ref={videoRef}> is fully mounted in DOM before accessing srcObject
      const raf = requestAnimationFrame(() => {
        startCamera()
      })
      return () => {
        cancelAnimationFrame(raf)
        stopCamera()
      }
    } else {
      stopCamera()
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => { stopCamera(); onClose() }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 32, stiffness: 280 }}
          className="fixed inset-0 z-[100] bg-black flex flex-col"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-12 pb-4 z-10 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0">
            <div>
              <h1 className="text-lg font-bold text-white">Scan Barcode</h1>
              <p className="text-xs text-white/50 mt-0.5">
                {scannerState === 'scanning'            && 'Point camera at a barcode'}
                {scannerState === 'fetching'            && 'Looking up product...'}
                {scannerState === 'requesting_permission' && 'Requesting camera access...'}
                {scannerState === 'permission_denied'   && 'Camera access denied'}
                {scannerState === 'not_supported'       && 'No camera found'}
                {scannerState === 'error'               && 'Scanner error'}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm text-white transition-all active:scale-95"
            >
              <X size={20} />
            </button>
          </div>

          {/* Camera viewport — full screen */}
          <div className="flex-1 relative overflow-hidden">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />

            {/* Scanning frame overlay */}
            {scannerState === 'scanning' && (
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Dark vignette outside scan zone */}
                <div className="absolute inset-0 bg-black/40" />

                {/* Scan window — clear area */}
                <div className="relative w-72 h-48 z-10">
                  {/* Corner markers */}
                  {[
                    'top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-lg',
                    'top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-lg',
                    'bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-lg',
                    'bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-lg',
                  ].map((cls, i) => (
                    <div
                      key={i}
                      className={`absolute w-7 h-7 border-accent ${cls}`}
                      style={{ borderColor: 'var(--accent, #2DD4BF)' }}
                    />
                  ))}

                  {/* Scanning laser line */}
                  <motion.div
                    animate={{ y: [0, 176, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                    className="absolute left-2 right-2 h-0.5 rounded-full"
                    style={{
                      background: 'var(--accent, #2DD4BF)',
                      boxShadow: '0 0 10px 2px var(--accent, #2DD4BF)',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Photo scan action — packaged-food photo follows the same barcode resolution chain */}
            {scannerState === 'scanning' && (
              <label className="absolute left-1/2 bottom-8 -translate-x-1/2 z-20 min-h-[44px] px-5 py-3 rounded-2xl bg-black/70 border border-white/15 backdrop-blur-md text-white flex items-center justify-center gap-2 font-semibold text-sm cursor-pointer active:scale-[0.98] transition-transform">
                <Camera size={18} />
                <span>Scan a Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            )}

            {/* Fetching state */}
            {scannerState === 'fetching' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  >
                    <Zap size={36} style={{ color: 'var(--accent, #2DD4BF)' }} />
                  </motion.div>
                  <p className="text-white font-semibold text-base">Looking up product...</p>
                  <p className="text-white/40 text-xs">Checking Open Food Facts</p>
                </div>
              </div>
            )}

            {/* Analyzing Image state */}
            {scannerState === 'analyzing_image' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  >
                    <Camera size={36} style={{ color: 'var(--accent, #2DD4BF)' }} />
                  </motion.div>
                  <p className="text-white font-semibold text-base">Scanning Photo...</p>
                  <p className="text-white/40 text-xs">Detecting packaged-food barcode...</p>
                </div>
              </div>
            )}

            {scannerState === 'not_found' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="w-full max-w-sm mx-4 bg-[#111111]/90 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 flex flex-col items-center shadow-2xl">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
                    <AlertCircle size={32} className="text-amber-400" />
                  </div>
                  <h3 className="text-xl text-white font-bold mb-2">Product Not Found</h3>
                  <p className="text-white/50 text-center text-sm mb-6 leading-relaxed">
                    Barcode <span className="text-white/70 font-mono">{notFoundBarcode}</span> is not
                    in our database yet.
                  </p>
                  <div className="w-full space-y-3">
                    <button
                      onClick={() => {
                        setLastBarcode(null)
                        startCamera()
                      }}
                      className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all active:scale-[0.98]"
                    >
                      Scan Different Barcode
                    </button>
                    <button
                      onClick={() => {
                        stopCamera()
                        if (onSearchManually) onSearchManually({ barcode: notFoundBarcode, name: '' })
                        else onClose()
                      }}
                      className="w-full py-3.5 rounded-2xl bg-accent text-black font-semibold transition-all active:scale-[0.98]"
                    >
                      Add Product Manually
                    </button>
                    <button
                      onClick={() => { stopCamera(); onClose() }}
                      className="w-full py-4 text-white/30 hover:text-white text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {scannerState === 'missing_nutrition' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="w-full max-w-sm mx-4 bg-[#111111]/90 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 flex flex-col items-center shadow-2xl">
                  <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
                    <Zap size={32} className="text-blue-400" />
                  </div>
                  <h3 className="text-xl text-white font-bold mb-2">We found {missingNutritionName} but need its nutrition.</h3>
                  <p className="text-white/40 text-center text-sm mb-6 leading-relaxed">
                    Snap the nutrition facts panel on the back of the package and we’ll read the printed values for you to verify.
                  </p>

                  {labelError && (
                    <div className="w-full mb-3 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20">
                      <p className="text-xs text-red-300 text-center leading-relaxed">{labelError}</p>
                    </div>
                  )}

                  <div className="w-full space-y-3">
                    <label className="relative w-full min-h-[48px] py-3.5 rounded-2xl bg-accent text-black font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer overflow-hidden">
                      {labelLoading ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Reading Nutrition Label…
                        </>
                      ) : (
                        <>
                          <Camera size={18} />
                          Snap Nutrition Label
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleNutritionLabel}
                        disabled={labelLoading}
                      />
                    </label>

                    <button
                      onClick={() => {
                        stopCamera()
                        if (onSearchManually) onSearchManually({ barcode: lastBarcode ?? '', name: missingNutritionName })
                        else onClose()
                      }}
                      disabled={labelLoading}
                      className="w-full min-h-[48px] py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      Enter Manually
                    </button>

                    <button
                      onClick={() => {
                        setLabelError(null)
                        setLastBarcode(null)
                        startCamera()
                      }}
                      disabled={labelLoading}
                      className="w-full min-h-[48px] py-3 text-white/40 hover:text-white/70 font-medium transition-all disabled:opacity-40"
                    >
                      Scan Different Product
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Error / denied states */}
            {(scannerState === 'permission_denied' ||
              scannerState === 'not_supported' ||
              scannerState === 'error') && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                {scannerState === 'permission_denied' ? (
                  <div className="w-full max-w-sm mx-4 bg-[#111111]/90 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 flex flex-col items-center shadow-2xl relative overflow-hidden">
                    {/* Subtle top glow */}
                    <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
                    
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                      <Camera size={32} className="text-red-400" />
                    </div>
                    
                    <h3 className="text-xl text-white font-bold mb-2 tracking-tight">Camera Unavailable</h3>
                    <p className="text-white/50 text-center text-sm mb-4 px-2 leading-relaxed">
                      {scannerState === 'permission_denied' 
                        ? 'Camera access was blocked by your browser settings. Please enable camera permission for this site.'
                        : 'We couldn\'t connect to your live camera. You can retry permission, snap a photo, or enter barcode manually.'}
                    </p>
                    {errorDetail && (
                      <p className="text-xs text-red-400/80 bg-red-500/10 px-3 py-1.5 rounded-lg mb-6 text-center font-mono">
                        {errorDetail}
                      </p>
                    )}

                    <div className="w-full space-y-3">
                      {/* Take Photo Button - Premium */}
                      <label className="group relative w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-accent text-white font-semibold cursor-pointer overflow-hidden transition-all active:scale-[0.98]">
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                        <Camera size={18} className="relative z-10" />
                        <span className="relative z-10">Snap Photo Instead</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          capture="environment"
                          className="hidden" 
                          onChange={handleFileUpload} 
                        />
                      </label>

                      {/* Manual Entry */}
                      <div className="relative">
                        <input 
                          id="manual-barcode-input"
                          type="text" 
                          placeholder="Enter barcode manually" 
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-accent/50 focus:bg-white/10 transition-all pr-24"
                        />
                        <button 
                          onClick={() => {
                            const val = (document.getElementById('manual-barcode-input') as HTMLInputElement).value
                            if (val) {
                              scanningRef.current = true;
                              handleBarcode(val);
                            }
                          }}
                          className="absolute right-2 top-2 bottom-2 px-4 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl transition-all"
                        >
                          Search
                        </button>
                      </div>

                      {/* Subtle Close */}
                      <button
                        onClick={() => {
                          stopCamera()
                          onClose()
                        }}
                        className="w-full py-4 text-white/40 hover:text-white text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 px-8 text-center">
                    <AlertCircle size={44} className="text-red-400" />
                    <div>
                      <p className="text-white font-bold text-lg mb-2">
                        {scannerState === 'not_supported'     && 'No Camera Found'}
                        {scannerState === 'error'             && 'Scanner Error'}
                      </p>
                      <p className="text-white/50 text-sm leading-relaxed">
                        {scannerState === 'not_supported' &&
                          'No camera was detected on this device.'}
                        {scannerState === 'error' && errorDetail ? errorDetail : (scannerState === 'error' && 'Something went wrong. Close and try again.')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 text-center bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-xs text-white/30">
              Supports EAN-13, UPC-A, EAN-8 and most packaged food barcodes
            </p>
            <p className="text-[10px] text-white/20 mt-1">
              Photo scans detect the barcode first, then use the same product resolution flow.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
