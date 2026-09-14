import * as functions from 'firebase-functions';
export declare const createRazorpaySubscription: functions.https.CallableFunction<any, Promise<{
    subscription_id: string;
    key_id: string;
}>, unknown>;
export declare const razorpayWebhook: functions.https.HttpsFunction;
//# sourceMappingURL=index.d.ts.map