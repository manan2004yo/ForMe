import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import crypto from 'crypto'
// @ts-ignore
import Razorpay from 'razorpay'

admin.initializeApp()

const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder'
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder'
const razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'whsec_placeholder'
const defaultPlanId = process.env.RAZORPAY_PLAN_ID || 'plan_placeholder'

const instance = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
})

export const createRazorpaySubscription = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in')
  }

  const uid = context.auth.uid

  try {
    const subscription = await instance.subscriptions.create({
      plan_id: defaultPlanId,
      total_count: 120, // max billing cycles (10 years if monthly)
      customer_notify: 1,
      notes: {
        firebase_uid: uid,
      },
    })

    return { 
      subscription_id: subscription.id,
      key_id: razorpayKeyId
    }
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message || 'Failed to create subscription')
  }
})

export const razorpayWebhook = functions.https.onRequest(async (req, res) => {
  const signature = req.headers['x-razorpay-signature']

  if (!signature || typeof signature !== 'string') {
    res.status(400).send('Missing Razorpay signature')
    return
  }

  // Verify HMAC SHA256 Signature
  const expectedSignature = crypto
    .createHmac('sha256', razorpayWebhookSecret)
    .update(JSON.stringify(req.body))
    .digest('hex')

  if (expectedSignature !== signature) {
    functions.logger.error('Invalid Razorpay Signature')
    res.status(400).send('Invalid signature')
    return
  }

  const event = req.body

  // Idempotency: Prevent double processing
  // Razorpay headers usually contain `x-razorpay-event-id`
  const eventId = req.headers['x-razorpay-event-id'] as string || crypto.randomUUID()
  const eventRef = admin.firestore().collection('razorpay_events').doc(eventId)
  const eventDoc = await eventRef.get()

  if (eventDoc.exists) {
    functions.logger.info(`Event ${eventId} already processed.`)
    res.status(200).send('Already processed')
    return
  }

  await eventRef.set({ processedAt: admin.firestore.FieldValue.serverTimestamp(), type: event.event })

  // Handle successful subscription charge
  if (event.event === 'subscription.charged') {
    const payload = event.payload.subscription.entity
    const uid = payload.notes?.firebase_uid

    if (uid) {
      await admin.firestore().collection('users').doc(uid).set({
        isPro: true,
        razorpaySubscriptionId: payload.id,
        razorpayCustomerId: payload.customer_id,
      }, { merge: true })
      
      functions.logger.info(`User ${uid} upgraded to PRO via Razorpay.`)
    }
  }

  // Handle subscription cancellation/halt
  if (event.event === 'subscription.cancelled' || event.event === 'subscription.halted') {
    const payload = event.payload.subscription.entity
    const uid = payload.notes?.firebase_uid

    if (uid) {
      await admin.firestore().collection('users').doc(uid).set({
        isPro: false,
      }, { merge: true })
      
      functions.logger.info(`User ${uid} PRO subscription revoked via Razorpay.`)
    }
  }

  res.status(200).send({ status: 'ok' })
})
