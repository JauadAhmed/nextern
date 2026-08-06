// src/app/api/payment/bkash/callback/route.ts
// GET /api/payment/bkash/callback
// bKash redirects here after the user completes (or cancels) payment.

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Payment } from '@/models/Payment';
import { executeBkashPayment } from '@/lib/bkash';
import { PLANS } from '@/lib/subscription-plans';
import { activateSubscriptionFromPayment } from '@/lib/subscription-service';

function getPremiumRedirectBase(planId: 'student_premium' | 'employer_premium' | null) {
  return planId === 'employer_premium' ? '/employer/premium' : '/student/premium';
}

function getSubscriptionRedirectBase(planId: 'student_premium' | 'employer_premium') {
  return planId === 'employer_premium' ? '/employer/subscription' : '/student/subscription';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const paymentID = searchParams.get('paymentID');
  const status = searchParams.get('status');
  const paymentDbId = searchParams.get('paymentDbId');
  const userId = searchParams.get('userId');
  const planId = searchParams.get('plan') as 'student_premium' | 'employer_premium' | null;

  const baseUrl = new URL(req.url).origin;
  const premiumBase = getPremiumRedirectBase(planId);

  try {
    await connectDB();

    if (status === 'cancel') {
      if (paymentDbId) {
        await Payment.findByIdAndUpdate(paymentDbId, { status: 'failed' }).catch(() => {});
      }
      return NextResponse.redirect(`${baseUrl}${premiumBase}?payment=cancelled`);
    }

    if (status === 'failure' || !paymentID) {
      if (paymentDbId) {
        await Payment.findByIdAndUpdate(paymentDbId, { status: 'failed' }).catch(() => {});
      }
      return NextResponse.redirect(`${baseUrl}${premiumBase}?payment=failed`);
    }

    const plan = planId ? PLANS[planId] : null;
    if (
      !plan ||
      !userId ||
      !paymentDbId ||
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(paymentDbId)
    ) {
      return NextResponse.redirect(`${baseUrl}${premiumBase}?payment=error`);
    }

    const payment = await Payment.findOne({
      _id: paymentDbId,
      userId,
      type: 'subscription',
      method: 'bkash',
      bkashPaymentId: paymentID,
    }).lean();
    if (!payment) {
      return NextResponse.redirect(`${baseUrl}${premiumBase}?payment=error`);
    }

    const executeResult = await executeBkashPayment(paymentID);
    if (executeResult.transactionStatus !== 'Completed') {
      await Payment.findByIdAndUpdate(paymentDbId, { status: 'failed' });
      return NextResponse.redirect(`${baseUrl}${premiumBase}?payment=failed`);
    }

    await activateSubscriptionFromPayment({
      paymentId: paymentDbId,
      userId,
      planId: plan.id,
      method: 'bkash',
      paymentUpdates: {
        bkashTrxId: executeResult.trxID,
        bkashPaymentId: paymentID,
        status: 'success',
      },
    });

    return NextResponse.redirect(
      `${baseUrl}${getSubscriptionRedirectBase(plan.id)}?payment=success`
    );
  } catch (error) {
    console.error('[BKASH CALLBACK ERROR]', error);
    if (paymentDbId) {
      await Payment.findByIdAndUpdate(paymentDbId, { status: 'failed' }).catch(() => {});
    }
    return NextResponse.redirect(`${baseUrl}${premiumBase}?payment=error`);
  }
}
