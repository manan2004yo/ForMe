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
import { X, Zap, AlertCircle, Camera } from 'lucide-react'
import type { ScannedProduct } from '@/lib/services/barcodeProductService'
import { fetchProductByBarcode } from '@/lib/services/barcodeProductService'
import { useToastStore } from '@/store/toastStore'

interface BarcodeScannerOverlayProps {
  isOpen: boolean
  onClose: () => void
  onProductFound: (product: ScannedProduct) => void
}

type ScannerState =
  | 'requesting_permission'
  | 'scanning'
  | 'fetching'
  | 'permission_denied'
  | 'not_supported'
  | 'error'

export function BarcodeScannerOverlay({
  isOpen,
  onClose,
  onProductFound,
}: BarcodeScannerOverlayProps) {
  const videoRef     = useRef<HTMLVideoElement>(null)
  const streamRef    = useRef<MediaStream | null>(null)
  const scanningRef  = useRef(false)
  const animFrameRef = useRef<number | null>(null)

  const [scannerState, setScannerState] = useState<ScannerState>('requesting_permission')
  const [errorDetail, setErrorDetail]   = useState<string>('')
  const [lastBarcode,  setLastBarcode]  = useState<string | null>(null)
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

  const handleBarcode = useCallback(async (barcode: string) => {
    if (barcode === lastBarcode || !scanningRef.current) return

    setLastBarcode(barcode)
    setScannerState('fetching')
    stopCamera()

    if (navigator.vibrate) navigator.vibrate(60)

    const result = await fetchProductByBarcode(barcode)

    if (result.status === 'found') {
      onProductFound(result.product)
      onClose()
    } else if (result.status === 'not_found') {
      toast.warning('Product not found. You can enter nutrition manually.')
      onClose()
    } else {
      toast.error(`Scan error: ${result.message}`)
      setLastBarcode(null)
      setScannerState('scanning')
      scanningRef.current = true
    }
  }, [lastBarcode, stopCamera, onProductFound, onClose, toast])

  const startNativeScanner = useCallback(async (stream: MediaStream) => {
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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }
        },
      })

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
        await startNativeScanner(stream)
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

    setScannerState('scanning')
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser')
      const reader = new BrowserMultiFormatReader()
      const imgURL = URL.createObjectURL(file)
      
      try {
        const result = await reader.decodeFromImageUrl(imgURL)
        if (result) {
          handleBarcode(result.getText())
        }
      } catch (err) {
        console.error(err)
        setErrorDetail('Could not find a clear barcode in that photo. Please try a closer/clearer shot.')
        setScannerState('error')
      } finally {
        URL.revokeObjectURL(imgURL)
      }
    } catch (err) {
      console.error(err)
      setErrorDetail('Failed to load barcode decoder.')
      setScannerState('error')
    }
  }

  useEffect(() => {
    if (isOpen) {
      setLastBarcode(null)
      startCamera()
    }
    return () => { stopCamera() }
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

            {/* Error / denied states */}
            {(scannerState === 'permission_denied' ||
              scannerState === 'not_supported' ||
              scannerState === 'error') && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                {scannerState === 'permission_denied' ? (
                  <div className="flex flex-col items-center gap-4 px-8 text-center">
                    <AlertCircle size={40} className="text-red-400" />
                    <div>
                      <p className="text-white font-semibold mb-2">Camera Access Required</p>
                      <p className="text-white/50 text-sm leading-relaxed mb-6">
                        Camera permission was denied. To enable it:
                      </p>
                      <div className="bg-white/5 p-4 rounded-xl text-left text-xs text-white/70 space-y-2 mb-6 w-full max-w-xs break-words">
                        <p className="text-red-400 font-mono mb-2">Browser Error:<br/>{errorDetail}</p>
                        <p><strong>Chrome Android:</strong> Tap the lock icon in the address bar → Permissions → Camera → Allow</p>
                        <p><strong>Safari iOS:</strong> Settings → Safari → Camera → Allow</p>
                      </div>
                      
                      <button 
                        onClick={startCamera} 
                        className="btn bg-white hover:bg-gray-200 text-black w-full max-w-xs mb-4 font-bold"
                      >
                        Retry Camera Access
                      </button>

                      <div className="w-full max-w-xs mb-4">
                        <p className="text-xs text-white/50 mb-2">Or take a photo natively (bypasses browser block):</p>
                        <label className="btn bg-accent hover:bg-accent/80 text-white w-full cursor-pointer flex items-center justify-center gap-2 py-3 rounded-xl">
                          <Camera size={18} />
                          Take Photo of Barcode
                          <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment"
                            className="hidden" 
                            onChange={handleFileUpload} 
                          />
                        </label>
                      </div>

                      <div className="w-full max-w-xs mb-6 text-left">
                        <p className="text-xs text-white/50 mb-2">Or enter barcode manually (fallback):</p>
                        <div className="flex gap-2">
                          <input 
                            id="manual-barcode-input"
                            type="text" 
                            placeholder="e.g. 8901058863610" 
                            className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent"
                          />
                          <button 
                            onClick={() => {
                              const val = (document.getElementById('manual-barcode-input') as HTMLInputElement).value
                              if (val) handleBarcode(val)
                            }}
                            className="btn btn-accent px-4 py-2"
                          >
                            Search
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          stopCamera()
                          onClose()
                        }}
                        className="w-full py-3 rounded-2xl bg-white/10 text-white font-semibold text-sm active:scale-95 transition-all"
                      >
                        Close and Fix in Settings
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
                        {scannerState === 'error' &&
                          'Something went wrong. Close and try again.'}
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
