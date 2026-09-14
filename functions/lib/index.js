"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.razorpayWebhook = exports.createRazorpaySubscription = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const crypto_1 = __importDefault(require("crypto"));
// @ts-ignore
const razorpay_1 = __importDefault(require("razorpay"));
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder';
const razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'whsec_placeholder';
const defaultPlanId = process.env.RAZORPAY_PLAN_ID || 'plan_placeholder';
const instance = new razorpay_1.default({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret,
});
exports.createRazorpaySubscription = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
    }
    const uid = context.auth.uid;
    try {
        const subscription = await instance.subscriptions.create({
            plan_id: defaultPlanId,
            total_count: 120, // max billing cycles (10 years if monthly)
            customer_notify: 1,
            notes: {
                firebase_uid: uid,
            },
        });
        return {
            subscription_id: subscription.id,
            key_id: razorpayKeyId
        };
    }
    catch (error) {
        throw new functions.https.HttpsError('internal', error.message || 'Failed to create subscription');
    }
});
exports.razorpayWebhook = functions.https.onRequest(async (req, res) => {
    var _a, _b;
    const signature = req.headers['x-razorpay-signature'];
    if (!signature || typeof signature !== 'string') {
        res.status(400).send('Missing Razorpay signature');
        return;
    }
    // Verify HMAC SHA256 Signature
    const expectedSignature = crypto_1.default
        .createHmac('sha256', razorpayWebhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');
    if (expectedSignature !== signature) {
        functions.logger.error('Invalid Razorpay Signature');
        res.status(400).send('Invalid signature');
        return;
    }
    const event = req.body;
    // Idempotency: Prevent double processing
    const eventId = req.headers['x-razorpay-event-id'] || crypto_1.default.randomUUID();
    const eventRef = db.collection('razorpay_events').doc(eventId);
    const eventDoc = await eventRef.get();
    if (eventDoc.exists) {
        functions.logger.info(`Event ${eventId} already processed.`);
        res.status(200).send('Already processed');
        return;
    }
    await eventRef.set({ processedAt: firestore_1.FieldValue.serverTimestamp(), type: event.event });
    // Handle successful subscription charge
    if (event.event === 'subscription.charged') {
        const payload = event.payload.subscription.entity;
        const uid = (_a = payload.notes) === null || _a === void 0 ? void 0 : _a.firebase_uid;
        if (uid) {
            await db.collection('users').doc(uid).set({
                isPro: true,
                razorpaySubscriptionId: payload.id,
                razorpayCustomerId: payload.customer_id,
            }, { merge: true });
            functions.logger.info(`User ${uid} upgraded to PRO via Razorpay.`);
        }
    }
    // Handle subscription cancellation/halt
    if (event.event === 'subscription.cancelled' || event.event === 'subscription.halted') {
        const payload = event.payload.subscription.entity;
        const uid = (_b = payload.notes) === null || _b === void 0 ? void 0 : _b.firebase_uid;
        if (uid) {
            await db.collection('users').doc(uid).set({
                isPro: false,
            }, { merge: true });
            functions.logger.info(`User ${uid} PRO subscription revoked via Razorpay.`);
        }
    }
    res.status(200).send({ status: 'ok' });
});
//# sourceMappingURL=index.js.map