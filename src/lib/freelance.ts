import 'server-only';

import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { onFreelanceCompleted } from '@/lib/events';
import { createNotification } from '@/lib/notify';
import { awardOpportunityScore } from '@/lib/opportunity-score';
import {
  FREELANCE_OPPORTUNITY_SCORE_DELTA,
  FREELANCE_PLATFORM_FEE_RATE,
  inferFreelanceProposalStatus,
  VERIFIED_FREELANCER_MIN_AVG_RATING,
  VERIFIED_FREELANCER_MIN_COMPLETED_ORDERS,
  VERIFIED_FREELANCER_BADGE_SLUG,
  getFreelanceInvoiceNumber,
  getFreelanceWorkspaceHref,
} from '@/lib/freelance-shared';
import { BadgeAward } from '@/models/BadgeAward';
import { FreelanceListing } from '@/models/FreelanceListing';
import { FreelanceOrder } from '@/models/FreelanceOrder';
import { FreelanceReview } from '@/models/FreelanceReview';
import { Payment } from '@/models/Payment';
import { User } from '@/models/User';

export {
  FREELANCE_CATEGORIES,
  FREELANCE_PAYMENT_METHODS,
  FREELANCE_OPPORTUNITY_SCORE_DELTA,
  VERIFIED_FREELANCER_MIN_AVG_RATING,
  VERIFIED_FREELANCER_MIN_COMPLETED_ORDERS,
  VERIFIED_FREELANCER_BADGE_SLUG,
  calculateFreelanceQuote,
  inferFreelanceProposalStatus,
  getFreelanceOrderThreadId,
  calculateFreelancePayout,
  getFreelanceWorkspaceHref,
} from '@/lib/freelance-shared';

export function getObjectIdString(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value instanceof mongoose.Types.ObjectId) return value.toString();
  if (typeof value === 'object' && '_id' in value) {
    return getObjectIdString((value as { _id?: unknown })._id);
  }
  return String(value);
}

function getDateISOString(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return null;
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getFreelancerReviewAverage(
  review: Partial<{
    professionalismRating: number;
    punctualityRating: number;
    skillPerformanceRating: number;
    workQualityRating: number;
  }>
) {
  return average(
    [
      review.professionalismRating,
      review.punctualityRating,
      review.skillPerformanceRating,
      review.workQualityRating,
    ].filter((value): value is number => typeof value === 'number' && value > 0)
  );
}

function invoiceStatusForOrder(order: Record<string, unknown>) {
  if (order.escrowStatus === 'released') return 'released';
  if (order.escrowStatus === 'refunded') return 'refunded';
  if (order.escrowStatus === 'held') return 'held_in_escrow';
  if (order.status === 'cancelled') return 'cancelled';
  if (
    inferFreelanceProposalStatus({
      proposalStatus: typeof order.proposalStatus === 'string' ? order.proposalStatus : undefined,
      status: typeof order.status === 'string' ? order.status : undefined,
    }) === 'accepted'
  ) {
    return 'awaiting_payment';
  }

  return 'quote_pending';
}

export function buildFreelanceInvoice(
  order: Record<string, unknown>,
  perspective: 'client' | 'freelancer'
) {
  const listing =
    order.listingId && typeof order.listingId === 'object'
      ? (order.listingId as Record<string, unknown>)
      : { _id: order.listingId };
  const client =
    order.clientId && typeof order.clientId === 'object'
      ? (order.clientId as Record<string, unknown>)
      : { _id: order.clientId };
  const freelancer =
    order.freelancerId && typeof order.freelancerId === 'object'
      ? (order.freelancerId as Record<string, unknown>)
      : { _id: order.freelancerId };
  const priceType = typeof order.priceType === 'string' ? order.priceType : 'fixed';
  const rateBDT = Number(order.quotedRateBDT ?? order.agreedPriceBDT ?? 0);
  const hours = priceType === 'hourly' ? Number(order.quotedHours ?? 1) : null;
  const grossAmountBDT = Number(order.agreedPriceBDT ?? 0);
  const platformFeeBDT = Number(order.nexternCutBDT ?? 0);
  const netPayoutBDT = Number(order.freelancerPayoutBDT ?? 0);
  const issuedAt =
    perspective === 'freelancer'
      ? getDateISOString(order.escrowReleasedAt ?? order.completedAt ?? order.createdAt)
      : getDateISOString(order.createdAt);

  return {
    id: `${String(order._id ?? '')}:${perspective}`,
    invoiceNumber: `${getFreelanceInvoiceNumber(String(order._id ?? ''))}${perspective === 'freelancer' ? '-F' : '-C'}`,
    perspective,
    orderId: String(order._id ?? ''),
    status: invoiceStatusForOrder(order),
    listingTitle: String(listing.title ?? 'Freelance service'),
    category: String(listing.category ?? 'other'),
    counterpartyName:
      perspective === 'client'
        ? String(freelancer.name ?? 'Freelancer')
        : String(client.companyName ?? client.name ?? 'Client'),
    counterpartyRole: perspective === 'client' ? 'Freelancer' : 'Client',
    issuedAt,
    dueDate: getDateISOString(order.dueDate),
    deliveredAt: getDateISOString(order.deliveredAt),
    completedAt: getDateISOString(order.completedAt),
    releasedAt: getDateISOString(order.escrowReleasedAt),
    refundedAt: getDateISOString(order.escrowRefundedAt),
    paymentMethod: typeof order.paymentMethod === 'string' ? order.paymentMethod : null,
    priceType,
    rateBDT,
    hours,
    grossAmountBDT,
    platformFeeRate: perspective === 'freelancer' ? FREELANCE_PLATFORM_FEE_RATE : null,
    platformFeeBDT: perspective === 'freelancer' ? platformFeeBDT : null,
    clientTotalBDT: grossAmountBDT,
    freelancerNetBDT: perspective === 'freelancer' ? netPayoutBDT : null,
    escrowStatus: String(order.escrowStatus ?? ''),
    orderStatus: String(order.status ?? ''),
    lineItems:
      priceType === 'hourly'
        ? [
            {
              label: `Hourly service (${hours ?? 1}h × ${rateBDT} BDT)`,
              amountBDT: grossAmountBDT,
            },
          ]
        : [{ label: 'Fixed service package', amountBDT: grossAmountBDT }],
    notes:
      perspective === 'client'
        ? 'Funds are held by Nextern superadmin escrow until you confirm satisfactory delivery.'
        : 'The Nextern 15% platform fee is deducted before net payout is credited to your freelance account balance.',
  };
}

async function recordClientFreelanceSpendIfNeeded(order: {
  _id: mongoose.Types.ObjectId | string;
  clientId: mongoose.Types.ObjectId | string;
  agreedPriceBDT: number;
  clientSpendRecordedAt?: Date | string | null;
}) {
  if (order.clientSpendRecordedAt) return false;

  const marked = await FreelanceOrder.findOneAndUpdate(
    {
      _id: order._id,
      clientSpendRecordedAt: { $exists: false },
    },
    { $set: { clientSpendRecordedAt: new Date() } },
    { new: false }
  )
    .select('_id')
    .lean();

  if (!marked) return false;

  await User.findByIdAndUpdate(order.clientId, {
    $inc: { freelanceTotalSpendingsBDT: Number(order.agreedPriceBDT ?? 0) },
  });

  return true;
}

async function reverseClientFreelanceSpendIfNeeded(order: {
  _id: mongoose.Types.ObjectId | string;
  clientId: mongoose.Types.ObjectId | string;
  agreedPriceBDT: number;
  clientSpendRecordedAt?: Date | string | null;
  clientSpendReversedAt?: Date | string | null;
}) {
  if (!order.clientSpendRecordedAt || order.clientSpendReversedAt) return false;

  const marked = await FreelanceOrder.findOneAndUpdate(
    {
      _id: order._id,
      clientSpendRecordedAt: { $exists: true },
      clientSpendReversedAt: { $exists: false },
    },
    { $set: { clientSpendReversedAt: new Date() } },
    { new: false }
  )
    .select('_id')
    .lean();

  if (!marked) return false;

  await User.findByIdAndUpdate(order.clientId, {
    $inc: { freelanceTotalSpendingsBDT: -Math.max(0, Number(order.agreedPriceBDT ?? 0)) },
  });

  return true;
}

async function recordFreelancerEarningIfNeeded(order: {
  _id: mongoose.Types.ObjectId | string;
  freelancerId: mongoose.Types.ObjectId | string;
  freelancerPayoutBDT: number;
  nexternCutBDT: number;
  freelancerEarningRecordedAt?: Date | string | null;
}) {
  if (order.freelancerEarningRecordedAt) return false;

  const marked = await FreelanceOrder.findOneAndUpdate(
    {
      _id: order._id,
      freelancerEarningRecordedAt: { $exists: false },
    },
    { $set: { freelancerEarningRecordedAt: new Date() } },
    { new: false }
  )
    .select('_id')
    .lean();

  if (!marked) return false;

  await User.findByIdAndUpdate(order.freelancerId, {
    $inc: {
      freelanceAccountBalanceBDT: Number(order.freelancerPayoutBDT ?? 0),
      freelanceTotalEarningsBDT: Number(order.freelancerPayoutBDT ?? 0),
      freelanceTotalPlatformFeesBDT: Number(order.nexternCutBDT ?? 0),
    },
  });

  return true;
}

export async function syncFreelanceListingStats(listingId: string) {
  await connectDB();

  const listingObjectId = new mongoose.Types.ObjectId(listingId);
  const [completedOrders, reviews] = await Promise.all([
    FreelanceOrder.countDocuments({
      listingId: listingObjectId,
      status: 'completed',
      escrowStatus: 'released',
    }),
    FreelanceReview.find({
      listingId: listingObjectId,
      reviewType: 'client_to_student',
      isPublic: true,
      isVerified: true,
    })
      .select('professionalismRating punctualityRating skillPerformanceRating workQualityRating')
      .lean(),
  ]);

  const averageRating = average(reviews.map(getFreelancerReviewAverage).filter(Boolean));

  await FreelanceListing.findByIdAndUpdate(listingId, {
    totalOrdersCompleted: completedOrders,
    averageRating: Number(averageRating.toFixed(2)),
  });

  return {
    totalOrdersCompleted: completedOrders,
    averageRating: Number(averageRating.toFixed(2)),
  };
}

export async function checkVerifiedFreelancerEligibility(studentId: string) {
  await connectDB();

  const studentObjectId = new mongoose.Types.ObjectId(studentId);

  const [completedOrders, reviews] = await Promise.all([
    FreelanceOrder.countDocuments({
      freelancerId: studentObjectId,
      status: 'completed',
      escrowStatus: 'released',
    }),
    FreelanceReview.find({
      freelancerId: studentObjectId,
      reviewType: 'client_to_student',
      isPublic: true,
      isVerified: true,
    })
      .select('professionalismRating punctualityRating skillPerformanceRating workQualityRating')
      .lean(),
  ]);

  const ratingAverage = average(reviews.map(getFreelancerReviewAverage).filter(Boolean));

  return (
    completedOrders >= VERIFIED_FREELANCER_MIN_COMPLETED_ORDERS &&
    reviews.length >= VERIFIED_FREELANCER_MIN_COMPLETED_ORDERS &&
    ratingAverage >= VERIFIED_FREELANCER_MIN_AVG_RATING
  );
}

export async function syncVerifiedFreelancerBadge(studentId: string) {
  await connectDB();

  const [eligible, existingAward] = await Promise.all([
    checkVerifiedFreelancerEligibility(studentId),
    BadgeAward.findOne({ userId: studentId, badgeSlug: VERIFIED_FREELANCER_BADGE_SLUG })
      .select('_id')
      .lean(),
  ]);

  if (eligible && !existingAward) {
    await BadgeAward.create({
      userId: studentId,
      badgeSlug: VERIFIED_FREELANCER_BADGE_SLUG,
      badgeName: 'Verified Freelancer',
      badgeIcon: '💼',
      awardedAt: new Date(),
      evidenceData: { source: 'freelance_marketplace' },
      isDisplayed: true,
    });

    await createNotification({
      userId: studentId,
      type: 'badge_earned',
      title: 'Badge earned: Verified Freelancer',
      body: 'Your freelance delivery record is now verified across the platform.',
      link: '/student/badges',
      meta: {
        badgeSlug: VERIFIED_FREELANCER_BADGE_SLUG,
        badgeName: 'Verified Freelancer',
        badgeIcon: '💼',
      },
    });
  }

  if (!eligible && existingAward) {
    await BadgeAward.deleteOne({ _id: existingAward._id });
  }

  return eligible;
}

export async function addVerifiedPortfolioItemFromOrder(orderId: string) {
  await connectDB();

  const order = await FreelanceOrder.findById(orderId)
    .populate('listingId', 'title category skills')
    .populate('clientId', 'name')
    .lean();

  if (!order) {
    throw new Error('Order not found');
  }

  const listing = order.listingId as
    | {
        title?: string;
        category?: string;
        skills?: string[];
      }
    | undefined;
  const client = order.clientId as { name?: string } | undefined;
  const fileUrls = (order.deliveryFiles ?? [])
    .map((file: { url?: string }) => file.url)
    .filter(Boolean);
  const primaryFileUrl = fileUrls[0];

  if (!primaryFileUrl) {
    return null;
  }

  const ratings = await FreelanceReview.findOne({
    orderId: order._id,
    reviewType: 'client_to_student',
  })
    .select('professionalismRating punctualityRating skillPerformanceRating workQualityRating')
    .lean();

  const portfolioItem = {
    title: listing?.title ?? 'Verified freelance project',
    category: listing?.category ?? 'other',
    fileUrl: primaryFileUrl,
    fileUrls,
    summary: order.deliveryNote ?? order.requirements,
    skills: listing?.skills ?? [],
    clientName: client?.name ?? 'Verified client',
    rating: ratings ? Number(getFreelancerReviewAverage(ratings).toFixed(2)) : undefined,
    freelanceOrderId: order._id,
    completedAt: order.completedAt ?? new Date(),
  };

  await User.findByIdAndUpdate(order.freelancerId, {
    $pull: {
      verifiedPortfolioItems: {
        freelanceOrderId: order._id,
      },
    },
  });

  await User.findByIdAndUpdate(order.freelancerId, {
    $push: {
      verifiedPortfolioItems: {
        $each: [portfolioItem],
        $position: 0,
      },
    },
  });

  return portfolioItem;
}

export async function activateFreelanceEscrowFromPayment(params: {
  orderId: string;
  paymentId: string;
  method: 'bkash' | 'visa' | 'mastercard';
  paymentUpdates?: Record<string, unknown>;
}) {
  await connectDB();

  const [order, payment] = await Promise.all([
    FreelanceOrder.findById(params.orderId).populate('listingId', 'title').lean(),
    Payment.findById(params.paymentId),
  ]);

  if (!order) {
    throw new Error('Order not found');
  }

  if (!payment) {
    throw new Error('Payment not found');
  }

  if (
    payment.type !== 'freelance_escrow' ||
    payment.userId.toString() !== order.clientId.toString() ||
    payment.referenceType !== 'FreelanceOrder' ||
    payment.referenceId?.toString() !== order._id.toString() ||
    payment.amountBDT !== order.agreedPriceBDT ||
    payment.method !== params.method ||
    !['initiated', 'success'].includes(payment.status)
  ) {
    throw new Error('Payment record does not match the freelance order');
  }

  if (order.escrowStatus === 'held' && order.paymentId) {
    await recordClientFreelanceSpendIfNeeded({
      _id: order._id,
      clientId: order.clientId,
      agreedPriceBDT: order.agreedPriceBDT,
      clientSpendRecordedAt: order.clientSpendRecordedAt,
    });

    return order;
  }

  if (
    inferFreelanceProposalStatus({
      proposalStatus: (order as Record<string, unknown>).proposalStatus as string | undefined,
      status: order.status,
    }) !== 'accepted'
  ) {
    throw new Error('Only accepted freelance quotes can move into escrow');
  }

  await Promise.all([
    FreelanceOrder.findByIdAndUpdate(order._id, {
      $set: {
        status: 'in_progress',
        escrowStatus: 'held',
        paymentMethod: params.method,
        paymentId: payment._id,
        ...params.paymentUpdates,
      },
    }),
    Payment.findByIdAndUpdate(payment._id, {
      $set: {
        status: 'success',
        method: params.method,
        referenceId: order._id,
        referenceType: 'FreelanceOrder',
        ...params.paymentUpdates,
      },
    }),
  ]);

  await recordClientFreelanceSpendIfNeeded({
    _id: order._id,
    clientId: order.clientId,
    agreedPriceBDT: order.agreedPriceBDT,
    clientSpendRecordedAt: order.clientSpendRecordedAt,
  });

  const [client, listing] = await Promise.all([
    User.findById(order.clientId).select('name role').lean(),
    order.listingId
      ? FreelanceListing.findById(
          typeof order.listingId === 'object' && '_id' in order.listingId
            ? order.listingId._id
            : order.listingId
        )
          .select('title')
          .lean()
      : null,
  ]);

  const listingTitle =
    listing?.title ??
    (typeof order.listingId === 'object' && 'title' in order.listingId
      ? order.listingId.title
      : 'your service');

  await Promise.all([
    createNotification({
      userId: getObjectIdString(order.freelancerId),
      type: 'freelance_order',
      title: 'New funded freelance order',
      body: `${client?.name ?? 'A client'} funded "${listingTitle}". The payment is now held in nextern escrow and you can start delivery.`,
      link: '/student/freelance',
      meta: { orderId: order._id.toString(), listingTitle, escrowStatus: 'held' },
    }),
    createNotification({
      userId: getObjectIdString(order.clientId),
      type: 'payment_received',
      title: 'Escrow secured',
      body: `Payment for "${listingTitle}" is now held in nextern escrow until you confirm delivery.`,
      link: getFreelanceWorkspaceHref(client?.role),
      meta: { orderId: order._id.toString(), listingTitle, escrowStatus: 'held' },
    }),
  ]);

  return FreelanceOrder.findById(order._id)
    .populate('listingId', 'title category skills')
    .populate('clientId', 'name role image companyName')
    .populate('freelancerId', 'name image university department')
    .lean();
}

export async function completeFreelanceOrder(orderId: string) {
  await connectDB();

  const order = await FreelanceOrder.findById(orderId)
    .populate('listingId', 'title')
    .populate('clientId', 'name')
    .lean();

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.status === 'completed' && order.escrowStatus === 'released') {
    await recordFreelancerEarningIfNeeded({
      _id: order._id,
      freelancerId: order.freelancerId,
      freelancerPayoutBDT: order.freelancerPayoutBDT,
      nexternCutBDT: order.nexternCutBDT,
      freelancerEarningRecordedAt: order.freelancerEarningRecordedAt,
    });
    return order;
  }

  const now = new Date();
  const updatedOrder = await FreelanceOrder.findByIdAndUpdate(
    orderId,
    {
      $set: {
        status: 'completed',
        escrowStatus: 'released',
        clientConfirmedAt: now,
        completedAt: now,
        escrowReleasedAt: now,
      },
    },
    { new: true }
  ).lean();

  await recordFreelancerEarningIfNeeded({
    _id: order._id,
    freelancerId: order.freelancerId,
    freelancerPayoutBDT: order.freelancerPayoutBDT,
    nexternCutBDT: order.nexternCutBDT,
    freelancerEarningRecordedAt: order.freelancerEarningRecordedAt,
  });

  const existingRelease = await Payment.findOne({
    type: 'freelance_release',
    referenceType: 'FreelanceOrder',
    referenceId: order._id,
    userId: order.freelancerId,
  })
    .select('_id')
    .lean();

  if (!existingRelease) {
    await Payment.create({
      userId: order.freelancerId,
      type: 'freelance_release',
      amountBDT: order.freelancerPayoutBDT,
      method: order.paymentMethod ?? 'bkash',
      status: 'success',
      referenceId: order._id,
      referenceType: 'FreelanceOrder',
    });
  }

  if (!order.opportunityScoreAwarded) {
    const listing = order.listingId as { title?: string } | undefined;

    await awardOpportunityScore({
      userId: getObjectIdString(order.freelancerId),
      delta: FREELANCE_OPPORTUNITY_SCORE_DELTA,
      eventType: 'freelance_order_completed',
      reason: `Completed verified freelance order${listing?.title ? `: ${listing.title}` : ''}`,
      meta: {
        orderId: order._id.toString(),
        clientId: getObjectIdString(order.clientId),
      },
    });

    await FreelanceOrder.findByIdAndUpdate(order._id, {
      opportunityScoreAwarded: true,
    });
  }

  await addVerifiedPortfolioItemFromOrder(orderId).catch(console.error);
  await syncFreelanceListingStats(getObjectIdString(order.listingId)).catch(console.error);
  await syncVerifiedFreelancerBadge(getObjectIdString(order.freelancerId)).catch(console.error);
  await onFreelanceCompleted(getObjectIdString(order.freelancerId), orderId).catch(console.error);

  const clientName =
    typeof order.clientId === 'object' && 'name' in order.clientId ? order.clientId.name : 'Client';
  const listingTitle =
    typeof order.listingId === 'object' && 'title' in order.listingId
      ? order.listingId.title
      : 'your project';

  const client = await User.findById(order.clientId).select('role').lean();

  await Promise.all([
    createNotification({
      userId: getObjectIdString(order.freelancerId),
      type: 'payment_received',
      title: 'Escrow released',
      body: `${clientName ?? 'Your client'} approved delivery for "${listingTitle ?? 'your project'}". Your verified work sample has been added to your portfolio.`,
      link: '/student/freelance',
      meta: { orderId, listingTitle, escrowStatus: 'released' },
    }),
    createNotification({
      userId: getObjectIdString(order.clientId),
      type: 'freelance_order',
      title: 'Project completed',
      body: `You approved delivery for "${listingTitle ?? 'your project'}". Leave a verified review to complete the work record.`,
      link: getFreelanceWorkspaceHref(client?.role),
      meta: { orderId, listingTitle, escrowStatus: 'released' },
    }),
  ]);

  return updatedOrder;
}

export async function refundFreelanceOrder(orderId: string) {
  await connectDB();

  const order = await FreelanceOrder.findByIdAndUpdate(
    orderId,
    {
      $set: {
        status: 'cancelled',
        escrowStatus: 'refunded',
        escrowRefundedAt: new Date(),
      },
    },
    { new: true }
  ).lean();

  if (!order) {
    throw new Error('Order not found');
  }

  await reverseClientFreelanceSpendIfNeeded({
    _id: order._id,
    clientId: order.clientId,
    agreedPriceBDT: order.agreedPriceBDT,
    clientSpendRecordedAt: order.clientSpendRecordedAt,
    clientSpendReversedAt: order.clientSpendReversedAt,
  });

  await Payment.updateMany(
    {
      referenceType: 'FreelanceOrder',
      referenceId: order._id,
      type: 'freelance_escrow',
    },
    { $set: { status: 'refunded' } }
  );

  const client = await User.findById(order.clientId).select('role').lean();

  await Promise.all([
    createNotification({
      userId: getObjectIdString(order.clientId),
      type: 'payment_received',
      title: 'Escrow refunded',
      body: 'Your freelance escrow payment has been refunded by nextern resolution.',
      link: getFreelanceWorkspaceHref(client?.role),
      meta: { orderId, escrowStatus: 'refunded' },
    }),
    createNotification({
      userId: getObjectIdString(order.freelancerId),
      type: 'freelance_order',
      title: 'Order closed',
      body: 'This freelance order was closed with a refund. Review the admin note in your order timeline.',
      link: '/student/freelance',
      meta: { orderId, escrowStatus: 'refunded' },
    }),
  ]);

  return order;
}
