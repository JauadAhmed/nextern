import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { activateFreelanceEscrowFromPayment, getFreelanceWorkspaceHref } from '@/lib/freelance';
import { executeBkashPayment } from '@/lib/bkash';
import { Payment } from '@/models/Payment';
import { User } from '@/models/User';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const paymentID = searchParams.get('paymentID');
  const status = searchParams.get('status');
  const paymentDbId = searchParams.get('paymentDbId');
  const orderId = searchParams.get('orderId');
  const userId = searchParams.get('userId');

  const baseUrl = new URL(req.url).origin;

  try {
    await connectDB();

    const user =
      userId && mongoose.Types.ObjectId.isValid(userId)
        ? await User.findById(userId).select('role').lean()
        : null;
    const workspaceHref = getFreelanceWorkspaceHref(user?.role);

    if (status === 'cancel') {
      if (paymentDbId) {
        await Payment.findByIdAndUpdate(paymentDbId, { status: 'failed' }).catch(() => {});
      }
      return NextResponse.redirect(`${baseUrl}${workspaceHref}?payment=cancelled`);
    }

    if (status === 'failure' || !paymentID || !paymentDbId || !orderId) {
      if (paymentDbId) {
        await Payment.findByIdAndUpdate(paymentDbId, { status: 'failed' }).catch(() => {});
      }
      return NextResponse.redirect(`${baseUrl}${workspaceHref}?payment=failed`);
    }

    if (
      !mongoose.Types.ObjectId.isValid(paymentDbId) ||
      !mongoose.Types.ObjectId.isValid(orderId)
    ) {
      return NextResponse.redirect(`${baseUrl}${workspaceHref}?payment=error`);
    }

    const payment = await Payment.findOne({
      _id: paymentDbId,
      type: 'freelance_escrow',
      method: 'bkash',
      referenceId: orderId,
      bkashPaymentId: paymentID,
    }).lean();
    if (!payment) {
      return NextResponse.redirect(`${baseUrl}${workspaceHref}?payment=error`);
    }

    const executeResult = await executeBkashPayment(paymentID);
    if (executeResult.transactionStatus !== 'Completed') {
      await Payment.findByIdAndUpdate(paymentDbId, { status: 'failed' }).catch(() => {});
      return NextResponse.redirect(`${baseUrl}${workspaceHref}?payment=failed`);
    }

    await activateFreelanceEscrowFromPayment({
      orderId,
      paymentId: paymentDbId,
      method: 'bkash',
      paymentUpdates: {
        bkashPaymentId: paymentID,
        bkashTrxId: executeResult.trxID,
      },
    });

    return NextResponse.redirect(`${baseUrl}${workspaceHref}?payment=success&order=${orderId}`);
  } catch (error) {
    console.error('[FREELANCE BKASH CALLBACK ERROR]', error);
    if (paymentDbId) {
      await Payment.findByIdAndUpdate(paymentDbId, { status: 'failed' }).catch(() => {});
    }
    return NextResponse.redirect(`${baseUrl}/student/freelance?payment=error`);
  }
}
