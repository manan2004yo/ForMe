import { PageTransition } from '@/components/layout/PageTransition'
import { db } from '@/lib/firebase/config'
import { useAuthStore } from '@/store/authStore'
import { doc, setDoc } from 'firebase/firestore'
import { ArrowRight, CheckCircle2, Crown, ShieldCheck, X, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'

// Singleton promise to ensure script is only injected once even in Strict Mode
let razorpayPromise: Promise<boolean> | null = null;

const loadRazorpay = (): Promise<boolean> => {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if ((window as any).Razorpay) return Promise.resolve(true);

  if (!razorpayPromise) {
    razorpayPromise = new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.error('Razorpay script failed to load. Check network tab.');
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }
  
  return razorpayPromise;
}

export function FormeProPaywall({ onClose }: { onClose?: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, isPro } = useAuthStore()

  useEffect(() => {
    loadRazorpay()
  }, [])

  const handleSubscribe = async () => {
    if (!user) {
      setError('You must be logged in to subscribe.')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const isLoaded = await loadRazorpay()
      if (!isLoaded) {
        throw new Error('Razorpay was blocked by your browser. Please disable your Adblocker or Brave Shields and try again.')
      }

      // Call Cloudflare Pages Function
      const createRes = await fetch('/api/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid || (user as any).id })
      })
      
      const data = await createRes.json()
      if (!createRes.ok) throw new Error(data.error || 'Failed to initialize payment')

      const options = {
        key: data.key_id,
        subscription_id: data.subscription_id,
        name: 'FORME PRO',
        description: 'Monthly Premium Subscription',
        image: 'https://your-logo-url.com/logo.png', // Replace with actual logo URL
        handler: async function (response: any) {
          try {
            // 1. Verify Signature on Cloudflare Edge
            const verifyRes = await fetch('/api/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature
              })
            })
            
            const verifyData = await verifyRes.json()
            if (!verifyData.valid) throw new Error('Payment signature verification failed!')

            // 2. Update Firestore Securely
            await setDoc(doc(db, 'users', user.uid || (user as any).id), {
              isPro: true,
              razorpaySubscriptionId: response.razorpay_subscription_id,
              razorpayCustomerId: response.razorpay_customer_id || null,
            }, { merge: true })

            alert(`Payment Successful! Welcome to FORME PRO.`)
            if (onClose) onClose()
            // Force reload to apply pro status everywhere
            window.location.reload()
            
          } catch (err: any) {
            setError(err.message || 'Error saving payment data.')
          }
        },
        prefill: {
          name: typeof user === 'object' && user !== null && 'displayName' in user ? user.displayName : 'User',
          email: typeof user === 'object' && user !== null && 'email' in user ? user.email : '',
        },
        theme: {
          color: '#2DD4BF', // Match our accent color
        },
      }

      const rzp = new (window as any).Razorpay(options)
      
      rzp.on('payment.failed', function (response: any) {
        setError(response.error.description || 'Payment failed')
      })

      rzp.open()
      
    } catch (err: any) {
      setError(err.message || 'An error occurred during checkout.')
    } finally {
      setLoading(false)
    }
  }

  if (isPro) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(45,212,191,0.3)]">
            <Crown className="text-accent w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2">You are PRO</h2>
          <p className="text-white/60 mb-8 max-w-sm">
            Thank you for subscribing. All premium AI features, auto-regulation, and analytics are unlocked.
          </p>
          {onClose && (
            <button 
              onClick={onClose}
              className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
            >
              Back to Dashboard
            </button>
          )}
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="relative pb-32">
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white z-10 bg-black/50 rounded-full backdrop-blur-md">
            <X size={20} />
          </button>
        )}
        
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-b-[3rem] p-8 pt-12 pb-16 relative overflow-hidden border-b border-white/5">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Crown size={200} />
          </div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-semibold text-xs tracking-widest uppercase mb-6">
              <Zap size={14} /> Unlock Intelligence
            </div>
            <h1 className="text-4xl font-black text-white leading-tight mb-4 tracking-tight">
              Train Smarter.<br/>
              Recover Faster.<br/>
              <span className="text-accent">FORME PRO.</span>
            </h1>
            <p className="text-white/60 text-sm max-w-xs leading-relaxed">
              Stop guessing. Let our AI auto-regulate your workouts and deeply analyze your diet.
            </p>
          </div>
        </div>

        <div className="px-5 -mt-8 relative z-20">
          <div className="bg-[#121212] border border-accent/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-[50px] pointer-events-none" />
            
            <div className="flex items-end gap-2 mb-8">
              <span className="text-4xl font-black text-white">₹999</span>
              <span className="text-white/50 font-medium mb-1">/ month</span>
            </div>

            <div className="space-y-4 mb-8">
              <Feature text="Auto-Regulating CNS Engine" />
              <Feature text="Vision AI 'Snap & Log' Food" />
              <Feature text="Advanced Analytics & Charts" />
              <Feature text="Menu Hacker (Zomato Sync)" />
              <Feature text="Priority Cloud Backups" />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-4 flex items-start gap-2">
                <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <button 
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full py-4 rounded-xl bg-accent text-black font-black text-lg tracking-wide flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_0_30px_rgba(45,212,191,0.4)] disabled:opacity-70 disabled:scale-100"
            >
              {loading ? (
                <span className="animate-pulse">Loading Razorpay...</span>
              ) : (
                <>
                  Subscribe with UPI <ArrowRight size={20} />
                </>
              )}
            </button>
            
            <div className="mt-4 flex justify-center items-center gap-2 text-[10px] text-white/40 uppercase tracking-widest font-semibold">
              <ShieldCheck size={12} /> 100% Secure Checkout via Razorpay
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-accent/20 text-accent p-1 rounded-full">
        <CheckCircle2 size={16} />
      </div>
      <span className="text-sm font-medium text-white/90">{text}</span>
    </div>
  )
}
