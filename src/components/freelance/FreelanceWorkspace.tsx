'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { CSSProperties, Dispatch, ReactNode, SetStateAction } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  BadgeDollarSign,
  BanknoteArrowUp,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  FileUp,
  Filter,
  FolderOpen,
  LoaderCircle,
  PencilLine,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Upload,
  Wallet,
  ReceiptText,
  X,
} from 'lucide-react';
import { useUploadThing } from '@/lib/uploadthing';
import {
  calculateFreelanceQuote,
  FREELANCE_CATEGORIES,
  FREELANCE_PLATFORM_FEE_RATE,
  FREELANCE_PAYMENT_METHODS,
  FREELANCE_OPPORTUNITY_SCORE_DELTA,
} from '@/lib/freelance-shared';
import { PaymentMethodLogo } from '@/components/payments/PaymentMethodLogo';
import PaginationControls from '@/components/ui/PaginationControls';
import FreelanceStripeCheckoutModal from './FreelanceStripeCheckoutModal';

type WorkspaceRole = 'student' | 'employer';
type WorkspaceTab = 'board' | 'services' | 'clientOrders' | 'freelancerOrders' | 'finance';

type FreelanceAsset = {
  url: string;
  name: string;
  type: string;
};

type Listing = {
  _id: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  priceType: 'fixed' | 'hourly';
  priceBDT: number;
  deliveryDays: number;
  sampleFiles: FreelanceAsset[];
  averageRating: number;
  totalOrdersCompleted: number;
  isActive: boolean;
  createdAt: string | null;
  canEdit: boolean;
  canOrder: boolean;
  freelancer: {
    _id: string;
    name: string;
    image: string | null;
    university: string | null;
    department: string | null;
    skills: string[];
    opportunityScore: number;
    hasVerifiedFreelancerBadge: boolean;
  };
};

type OrderSummary = {
  _id: string;
  status: string;
  escrowStatus: string;
  priceType: 'fixed' | 'hourly';
  listedPriceBDT: number;
  quotedRateBDT: number;
  quotedHours: number | null;
  proposalStatus: 'requested' | 'countered' | 'accepted' | 'rejected';
  latestOfferBy: 'client' | 'freelancer';
  proposalNote: string;
  messageThreadId: string;
  agreedPriceBDT: number;
  nexternCutBDT: number;
  freelancerPayoutBDT: number;
  paymentMethod: 'bkash' | 'visa' | 'mastercard' | null;
  requirements: string;
  requirementsFiles: FreelanceAsset[];
  adminNote: string;
  deliveryFiles: FreelanceAsset[];
  deliveryNote: string;
  clientNote: string;
  revisionCount: number;
  dueDate: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  clientConfirmedAt: string | null;
  disputedAt?: string | null;
  createdAt: string | null;
  clientReviewSubmitted: boolean;
  freelancerReviewSubmitted: boolean;
  negotiationHistory: {
    by: 'client' | 'freelancer';
    action: 'request' | 'counter' | 'accept' | 'reject';
    rateBDT: number;
    hours: number | null;
    totalBDT: number;
    note: string;
    createdAt: string | null;
  }[];
  listing: {
    _id: string;
    title: string;
    category: string;
    skills: string[];
    deliveryDays: number | null;
    priceType: 'fixed' | 'hourly' | null;
    priceBDT: number;
  };
  client: {
    _id: string;
    name: string;
    role: string | null;
    image: string | null;
    companyName: string | null;
  };
  freelancer: {
    _id: string;
    name: string;
    image: string | null;
    university: string | null;
    department: string | null;
  };
};

type Review = {
  _id: string;
  reviewType: 'client_to_student' | 'student_to_client';
  overallRating: number | null;
  communicationRating: number | null;
  requirementsClarityRating: number | null;
  paymentPromptnessRating: number | null;
  professionalismRating: number | null;
  punctualityRating: number | null;
  skillPerformanceRating: number | null;
  workQualityRating: number | null;
  isRecommended: boolean;
  recommendationText: string;
  comment: string;
  createdAt: string | null;
  reviewer: {
    _id: string;
    name: string;
    image: string | null;
    role: string | null;
    companyName: string | null;
  } | null;
};

type FreelanceInvoice = {
  id: string;
  invoiceNumber: string;
  perspective: 'client' | 'freelancer';
  orderId: string;
  status: string;
  listingTitle: string;
  category: string;
  counterpartyName: string;
  counterpartyRole: string;
  issuedAt: string | null;
  dueDate: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  releasedAt: string | null;
  refundedAt: string | null;
  paymentMethod: 'bkash' | 'visa' | 'mastercard' | null;
  priceType: 'fixed' | 'hourly';
  rateBDT: number;
  hours: number | null;
  grossAmountBDT: number;
  platformFeeRate: number | null;
  platformFeeBDT: number | null;
  clientTotalBDT: number;
  freelancerNetBDT: number | null;
  escrowStatus: string;
  orderStatus: string;
  lineItems: { label: string; amountBDT: number }[];
  notes: string;
};

type FreelanceWithdrawal = {
  _id: string;
  amountBDT: number;
  status: 'requested' | 'processed' | 'rejected';
  note: string;
  adminNote: string;
  accountBalanceBeforeBDT: number;
  accountBalanceAfterBDT: number;
  createdAt: string | null;
  processedAt: string | null;
  rejectedAt: string | null;
};

type FreelanceFinanceSummary = {
  accountBalanceBDT: number;
  totalEarningsBDT: number;
  totalSpendingsBDT: number;
  totalWithdrawnBDT: number;
  totalPlatformFeesBDT: number;
  pendingWithdrawalsBDT: number;
  clientInvoiceCount: number;
  freelancerInvoiceCount: number;
};

type FreelanceFinancePayload = {
  summary: FreelanceFinanceSummary;
  clientInvoices: FreelanceInvoice[];
  freelancerInvoices: FreelanceInvoice[];
  withdrawals: FreelanceWithdrawal[];
};

type ListingFormState = {
  title: string;
  description: string;
  category: string;
  skillsText: string;
  priceType: 'fixed' | 'hourly';
  priceBDT: string;
  deliveryDays: string;
  sampleFiles: FreelanceAsset[];
  isActive: boolean;
};

type ReviewDraftState = {
  overallRating: number;
  communicationRating: number;
  requirementsClarityRating: number;
  paymentPromptnessRating: number;
  professionalismRating: number;
  punctualityRating: number;
  skillPerformanceRating: number;
  workQualityRating: number;
  isRecommended: boolean;
  recommendationText: string;
  comment: string;
};

const C = {
  blue: '#2563EB',
  blueLight: '#EFF6FF',
  blueBorder: '#BFDBFE',
  teal: '#0D9488',
  tealBg: '#F0FDFA',
  tealBorder: '#99F6E4',
  amberBg: '#FFFBEB',
  amberBorder: '#FDE68A',
  green: '#10B981',
  greenBg: '#ECFDF5',
  greenBorder: '#A7F3D0',
  bg: '#F1F5F9',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textMuted: '#64748B',
  textLight: '#94A3B8',
  danger: '#E11D48',
  dangerBg: '#FFF1F2',
  dangerBorder: '#FECDD3',
};

const EMPTY_LISTING_FORM: ListingFormState = {
  title: '',
  description: '',
  category: FREELANCE_CATEGORIES[0].id,
  skillsText: '',
  priceType: 'fixed',
  priceBDT: '',
  deliveryDays: '7',
  sampleFiles: [],
  isActive: true,
};

const EMPTY_CLIENT_REVIEW: ReviewDraftState = {
  overallRating: 0,
  communicationRating: 0,
  requirementsClarityRating: 0,
  paymentPromptnessRating: 0,
  professionalismRating: 5,
  punctualityRating: 5,
  skillPerformanceRating: 5,
  workQualityRating: 5,
  isRecommended: true,
  recommendationText: '',
  comment: '',
};

const EMPTY_FREELANCER_REVIEW: ReviewDraftState = {
  overallRating: 5,
  communicationRating: 5,
  requirementsClarityRating: 5,
  paymentPromptnessRating: 5,
  professionalismRating: 0,
  punctualityRating: 0,
  skillPerformanceRating: 0,
  workQualityRating: 0,
  isRecommended: true,
  recommendationText: '',
  comment: '',
};

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDate(value?: string | null, withTime = false) {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleString('en-BD', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

function formatStatus(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function quoteLabel(
  order: Pick<OrderSummary, 'priceType' | 'quotedRateBDT' | 'quotedHours' | 'agreedPriceBDT'>
) {
  if (order.priceType === 'hourly') {
    return `${formatMoney(order.quotedRateBDT)}/hr x ${order.quotedHours ?? 1}h`;
  }

  return formatMoney(order.agreedPriceBDT);
}

function proposalWaitingFor(
  order: Pick<OrderSummary, 'proposalStatus' | 'latestOfferBy'>,
  perspective: 'client' | 'freelancer' | null
) {
  if (!perspective || !['requested', 'countered'].includes(order.proposalStatus)) {
    return false;
  }

  return (
    (order.latestOfferBy === 'client' && perspective === 'freelancer') ||
    (order.latestOfferBy === 'freelancer' && perspective === 'client')
  );
}

function assetLabel(asset: FreelanceAsset) {
  if (asset.name) return asset.name;
  try {
    const url = new URL(asset.url);
    return url.pathname.split('/').pop() || 'File';
  } catch {
    return 'File';
  }
}

function toSkillList(value: string) {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function getReviewAverage(review: Review) {
  if (review.reviewType === 'client_to_student') {
    const values = [
      review.professionalismRating,
      review.punctualityRating,
      review.skillPerformanceRating,
      review.workQualityRating,
    ].filter((value): value is number => typeof value === 'number' && value > 0);
    if (!values.length) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  const values = [
    review.overallRating,
    review.communicationRating,
    review.requirementsClarityRating,
    review.paymentPromptnessRating,
  ].filter((value): value is number => typeof value === 'number' && value > 0);
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function toneForStatus(status: string) {
  if (['completed', 'released', 'active', 'success', 'accepted'].includes(status)) {
    return { bg: C.greenBg, border: C.greenBorder, color: '#047857' };
  }
  if (
    [
      'pending',
      'pending_payment',
      'delivered',
      'initiated',
      'paused',
      'requested',
      'countered',
      'held_in_escrow',
      'awaiting_payment',
      'quote_pending',
      'processed',
    ].includes(status)
  ) {
    return { bg: C.amberBg, border: C.amberBorder, color: '#B45309' };
  }
  if (['disputed', 'cancelled', 'refunded', 'failed', 'inactive', 'rejected'].includes(status)) {
    return { bg: C.dangerBg, border: C.dangerBorder, color: C.danger };
  }
  return { bg: '#F8FAFC', border: C.border, color: C.textMuted };
}

function getDefaultTab(): WorkspaceTab {
  return 'board';
}

function isWorkspaceTab(role: WorkspaceRole, value: string | null): value is WorkspaceTab {
  if (!value) return false;
  if (value === 'board' || value === 'clientOrders' || value === 'finance') return true;
  if (role === 'student' && (value === 'services' || value === 'freelancerOrders')) return true;
  return false;
}

function getWorkspaceHref(role: WorkspaceRole, view: WorkspaceTab) {
  return `/${role}/freelance?view=${view}`;
}

function withViewLabel(view: WorkspaceTab) {
  switch (view) {
    case 'board':
      return 'Marketplace';
    case 'services':
      return 'My Services';
    case 'clientOrders':
      return 'Client Orders';
    case 'freelancerOrders':
      return 'Freelancer Orders';
    case 'finance':
      return 'Earnings & Invoices';
    default:
      return 'Workspace';
  }
}

function shortenText(value: string, maxLength = 180) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trimEnd()}...`;
}

function StatusPill({ value }: { value: string }) {
  const tone = toneForStatus(value);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 10px',
        borderRadius: 999,
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        color: tone.color,
        fontSize: 11,
        fontWeight: 800,
      }}
    >
      {formatStatus(value)}
    </span>
  );
}

function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 24,
        padding: 22,
        boxShadow: '0 16px 34px rgba(15,23,42,0.06)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 18,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 21,
              fontWeight: 800,
              color: C.text,
              fontFamily: 'var(--font-display)',
            }}
          >
            {title}
          </h2>
          {description ? (
            <p style={{ margin: '8px 0 0', color: C.textMuted, fontSize: 13, lineHeight: 1.65 }}>
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div
      style={{
        border: `1px dashed ${C.border}`,
        borderRadius: 20,
        background: '#F8FAFC',
        padding: '34px 24px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{title}</div>
      <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.7, marginTop: 8 }}>
        {description}
      </div>
      {action ? <div style={{ marginTop: 16 }}>{action}</div> : null}
    </div>
  );
}

function AssetList({
  assets,
  tone = 'neutral',
  removable = false,
  onRemove,
}: {
  assets: FreelanceAsset[];
  tone?: 'neutral' | 'teal' | 'blue';
  removable?: boolean;
  onRemove?: (index: number) => void;
}) {
  const palette =
    tone === 'teal'
      ? { bg: C.tealBg, border: C.tealBorder, color: C.teal }
      : tone === 'blue'
        ? { bg: C.blueLight, border: C.blueBorder, color: C.blue }
        : { bg: '#F8FAFC', border: C.border, color: C.textMuted };

  if (!assets.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {assets.map((asset, index) => (
        <div
          key={`${asset.url}:${index}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '10px 12px',
            borderRadius: 12,
            background: palette.bg,
            border: `1px solid ${palette.border}`,
          }}
        >
          <a
            href={asset.url}
            target="_blank"
            rel="noreferrer"
            style={{
              color: palette.color,
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
              lineHeight: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              minWidth: 0,
            }}
          >
            <FolderOpen size={14} />
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {assetLabel(asset)}
            </span>
          </a>
          {removable ? (
            <button
              type="button"
              onClick={() => onRemove?.(index)}
              style={{
                border: 'none',
                background: 'transparent',
                color: C.danger,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={15} />
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

type ApiFieldErrors = Record<string, string[] | undefined>;

function formatValidationFieldLabel(field: string) {
  const normalized = field
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim();

  if (!normalized) return 'Field';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatApiErrorMessage(error?: string, details?: ApiFieldErrors) {
  const fieldMessages = Object.entries(details ?? {})
    .flatMap(([field, messages]) =>
      (messages ?? []).map((message) => `${formatValidationFieldLabel(field)}: ${message}`)
    )
    .filter(Boolean);

  if (fieldMessages.length > 0) {
    return error && error !== 'Validation failed'
      ? `${error}: ${fieldMessages.join('; ')}`
      : fieldMessages.join('; ');
  }

  return error ?? 'Request failed';
}

export default function FreelanceWorkspace({ role }: { role: WorkspaceRole }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedView = searchParams.get('view');
  const defaultTab = getDefaultTab();
  const currentView = isWorkspaceTab(role, requestedView) ? requestedView : defaultTab;

  const { startUpload: uploadSamples, isUploading: sampleUploading } =
    useUploadThing('freelanceSampleUploader');
  const { startUpload: uploadRequirements, isUploading: requirementUploading } = useUploadThing(
    'freelanceRequirementUploader'
  );
  const { startUpload: uploadDeliveries, isUploading: deliveryUploading } = useUploadThing(
    'freelanceDeliveryUploader'
  );

  const [activeTab, setActiveTab] = useState<WorkspaceTab>(currentView);
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingPage, setListingPage] = useState(1);
  const [listingPageSize, setListingPageSize] = useState(24);
  const [listingTotal, setListingTotal] = useState(0);
  const [serviceListings, setServiceListings] = useState<Listing[]>([]);
  const [clientOrders, setClientOrders] = useState<OrderSummary[]>([]);
  const [freelancerOrders, setFreelancerOrders] = useState<OrderSummary[]>([]);
  const [financeData, setFinanceData] = useState<FreelanceFinancePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [boardLoading, setBoardLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [financeSubmitting, setFinanceSubmitting] = useState(false);
  const [flash, setFlash] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const [filters, setFilters] = useState({
    search: '',
    category: '',
    skill: '',
    minBudget: '',
    maxBudget: '',
  });

  const [listingEditorOpen, setListingEditorOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [listingForm, setListingForm] = useState<ListingFormState>(EMPTY_LISTING_FORM);

  const [orderComposerListing, setOrderComposerListing] = useState<Listing | null>(null);
  const [requirementsText, setRequirementsText] = useState('');
  const [requirementFiles, setRequirementFiles] = useState<FreelanceAsset[]>([]);
  const [orderQuotedRate, setOrderQuotedRate] = useState('');
  const [orderQuotedHours, setOrderQuotedHours] = useState('1');
  const [orderProposalNote, setOrderProposalNote] = useState('');
  const [orderPaymentMethod, setOrderPaymentMethod] = useState<'bkash' | 'visa' | 'mastercard'>(
    'bkash'
  );

  const [pendingCardCheckout, setPendingCardCheckout] = useState<{
    orderId: string;
    title: string;
    amount: number;
    method: 'visa' | 'mastercard';
  } | null>(null);

  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderSummary | null>(null);
  const [selectedOrderPerspective, setSelectedOrderPerspective] = useState<
    'client' | 'freelancer' | null
  >(null);
  const [selectedOrderReviews, setSelectedOrderReviews] = useState<Review[]>([]);
  const [deliveryNote, setDeliveryNote] = useState('');
  const [deliveryFiles, setDeliveryFiles] = useState<FreelanceAsset[]>([]);
  const [revisionNote, setRevisionNote] = useState('');
  const [disputeNote, setDisputeNote] = useState('');
  const [proposalResponseRate, setProposalResponseRate] = useState('');
  const [proposalResponseHours, setProposalResponseHours] = useState('1');
  const [proposalResponseNote, setProposalResponseNote] = useState('');
  const [clientReviewDraft, setClientReviewDraft] = useState<ReviewDraftState>(EMPTY_CLIENT_REVIEW);
  const [freelancerReviewDraft, setFreelancerReviewDraft] =
    useState<ReviewDraftState>(EMPTY_FREELANCER_REVIEW);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawNote, setWithdrawNote] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<FreelanceInvoice | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});

  const paymentVerificationRef = useRef<string | null>(null);

  const boardSummary = useMemo(() => {
    const activeListings = listings.filter((listing) => listing.isActive).length;
    const totalEscrowHeld = [...clientOrders, ...freelancerOrders]
      .filter((order) => order.escrowStatus === 'held')
      .reduce((sum, order) => sum + order.agreedPriceBDT, 0);

    return {
      activeListings,
      myServices: serviceListings.length,
      clientOrders: clientOrders.length,
      freelancerOrders: freelancerOrders.length,
      totalEscrowHeld,
    };
  }, [clientOrders, freelancerOrders, listings, serviceListings]);

  const myListings = useMemo(
    () => serviceListings.filter((listing) => listing.canEdit),
    [serviceListings]
  );

  const financeSummary = financeData?.summary ?? {
    accountBalanceBDT: 0,
    totalEarningsBDT: 0,
    totalSpendingsBDT: 0,
    totalWithdrawnBDT: 0,
    totalPlatformFeesBDT: 0,
    pendingWithdrawalsBDT: 0,
    clientInvoiceCount: 0,
    freelancerInvoiceCount: 0,
  };

  const allInvoices = useMemo(
    () =>
      [...(financeData?.freelancerInvoices ?? []), ...(financeData?.clientInvoices ?? [])].sort(
        (a, b) => {
          const aTime = a.issuedAt ? new Date(a.issuedAt).getTime() : 0;
          const bTime = b.issuedAt ? new Date(b.issuedAt).getTime() : 0;
          return bTime - aTime;
        }
      ),
    [financeData?.clientInvoices, financeData?.freelancerInvoices]
  );

  const requestJson = useCallback(async <T,>(url: string, init?: RequestInit) => {
    const response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      cache: 'no-store',
    });

    const data = (await response.json().catch(() => ({}))) as T & {
      error?: string;
      details?: ApiFieldErrors;
    };
    if (!response.ok) {
      throw new Error(formatApiErrorMessage(data.error, data.details));
    }

    return data;
  }, []);

  const switchTab = useCallback(
    (nextTab: WorkspaceTab) => {
      setActiveTab(nextTab);
      const params = new URLSearchParams(searchParams.toString());
      params.set('view', nextTab);
      params.delete('payment');
      params.delete('payment_intent');
      params.delete('order');
      router.replace(`/${role}/freelance?${params.toString()}`);
    },
    [role, router, searchParams]
  );

  const loadListings = useCallback(
    async (nextPage = listingPage, nextPageSize = listingPageSize) => {
      setBoardLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(nextPage),
          limit: String(nextPageSize),
        });
        if (filters.search.trim()) params.set('search', filters.search.trim());
        if (filters.category) params.set('category', filters.category);
        if (filters.skill.trim()) params.set('skill', filters.skill.trim());
        if (filters.minBudget.trim()) params.set('minBudget', filters.minBudget.trim());
        if (filters.maxBudget.trim()) params.set('maxBudget', filters.maxBudget.trim());

        const boardRequest = requestJson<{
          listings: Listing[];
          pagination?: { total?: number };
        }>(`/api/freelance/listings?${params.toString()}`);

        if (role === 'student') {
          const mineRequest = requestJson<{ listings: Listing[] }>(
            '/api/freelance/listings?mine=true'
          );
          const [boardData, mineData] = await Promise.all([boardRequest, mineRequest]);
          setListings(boardData.listings ?? []);
          setListingTotal(boardData.pagination?.total ?? boardData.listings?.length ?? 0);
          setServiceListings(mineData.listings ?? []);
        } else {
          const data = await boardRequest;
          setListings(data.listings ?? []);
          setListingTotal(data.pagination?.total ?? data.listings?.length ?? 0);
          setServiceListings([]);
        }
      } catch (error) {
        setFlash({
          tone: 'error',
          text: error instanceof Error ? error.message : 'Failed to load the freelance board.',
        });
      } finally {
        setBoardLoading(false);
      }
    },
    [filters, listingPage, listingPageSize, requestJson, role]
  );

  const loadFinance = useCallback(async () => {
    setFinanceLoading(true);
    try {
      const data = await requestJson<FreelanceFinancePayload>('/api/freelance/finance');
      setFinanceData(data);
    } catch (error) {
      setFlash({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Failed to load freelance finance data.',
      });
    } finally {
      setFinanceLoading(false);
    }
  }, [requestJson]);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const data = await requestJson<{
        clientOrders: OrderSummary[];
        freelancerOrders: OrderSummary[];
      }>('/api/freelance/orders');
      setClientOrders(data.clientOrders ?? []);
      setFreelancerOrders(data.freelancerOrders ?? []);
    } catch (error) {
      setFlash({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Failed to load freelance orders.',
      });
    } finally {
      setOrdersLoading(false);
    }
  }, [requestJson]);

  async function uploadAssets(kind: 'sample' | 'requirements' | 'delivery', files: File[]) {
    if (!files.length) return [];

    const uploader =
      kind === 'sample'
        ? uploadSamples
        : kind === 'requirements'
          ? uploadRequirements
          : uploadDeliveries;

    const uploaded = await uploader(files);

    return (uploaded ?? [])
      .map((item, index) =>
        item?.ufsUrl
          ? {
              url: item.ufsUrl,
              name: item.name ?? files[index]?.name ?? `file-${index + 1}`,
              type: item.type ?? files[index]?.type ?? 'application/octet-stream',
            }
          : null
      )
      .filter((item): item is FreelanceAsset => Boolean(item));
  }

  function openCreateListingModal() {
    setEditingListing(null);
    setListingForm(EMPTY_LISTING_FORM);
    setListingEditorOpen(true);
  }

  function openEditListingModal(listing: Listing) {
    setEditingListing(listing);
    setListingForm({
      title: listing.title,
      description: listing.description,
      category: listing.category,
      skillsText: listing.skills.join(', '),
      priceType: listing.priceType,
      priceBDT: String(listing.priceBDT),
      deliveryDays: String(listing.deliveryDays),
      sampleFiles: listing.sampleFiles ?? [],
      isActive: listing.isActive,
    });
    setListingEditorOpen(true);
  }

  async function submitListing() {
    setSubmitting(true);
    try {
      const payload = {
        title: listingForm.title.trim(),
        description: listingForm.description.trim(),
        category: listingForm.category,
        skills: toSkillList(listingForm.skillsText),
        priceType: listingForm.priceType,
        priceBDT: Number(listingForm.priceBDT),
        deliveryDays: Number(listingForm.deliveryDays),
        sampleFiles: listingForm.sampleFiles,
        isActive: listingForm.isActive,
      };

      if (editingListing) {
        await requestJson(`/api/freelance/listings/${editingListing._id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setFlash({ tone: 'success', text: 'Freelance service updated successfully.' });
      } else {
        await requestJson('/api/freelance/listings', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setFlash({
          tone: 'success',
          text: 'Freelance service published. Clients can now place funded orders.',
        });
      }

      setListingEditorOpen(false);
      setEditingListing(null);
      await loadListings();
    } catch (error) {
      setFlash({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Failed to save freelance listing.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleListingActive(listing: Listing) {
    setSubmitting(true);
    try {
      await requestJson(`/api/freelance/listings/${listing._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !listing.isActive }),
      });
      setFlash({
        tone: 'success',
        text: listing.isActive
          ? 'Listing paused. It is hidden from new buyers now.'
          : 'Listing reactivated on the freelance board.',
      });
      await loadListings();
    } catch (error) {
      setFlash({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Failed to update listing visibility.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  function startOrderComposer(listing: Listing) {
    setOrderComposerListing(listing);
    setRequirementsText('');
    setRequirementFiles([]);
    setOrderQuotedRate(String(listing.priceBDT));
    setOrderQuotedHours('1');
    setOrderProposalNote('');
    setOrderPaymentMethod('bkash');
  }

  async function startBkashPayment(orderId: string) {
    try {
      const data = await requestJson<{ bkashURL: string }>('/api/freelance/payment/bkash/create', {
        method: 'POST',
        body: JSON.stringify({ orderId }),
      });
      if (!data.bkashURL) {
        throw new Error('bKash checkout URL was not returned.');
      }
      window.location.assign(data.bkashURL);
    } catch (error) {
      setFlash({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Failed to launch bKash checkout.',
      });
    }
  }

  async function submitOrder() {
    if (!orderComposerListing) return;

    const requirements = requirementsText.trim();
    const proposalNote = orderProposalNote.trim();
    const quotedRateInput = orderQuotedRate.trim();
    const quotedRateBDT = quotedRateInput ? Number(quotedRateInput) : orderComposerListing.priceBDT;

    if (requirements.length < 20) {
      setFlash({
        tone: 'error',
        text: 'Project requirements must be at least 20 characters so the freelancer has enough detail.',
      });
      return;
    }

    if (!Number.isInteger(quotedRateBDT) || quotedRateBDT < 1 || quotedRateBDT > 500000) {
      setFlash({
        tone: 'error',
        text: 'Quote amount must be a whole number between 1 and 500000 BDT.',
      });
      return;
    }

    let quotedHours: number | undefined;
    if (orderComposerListing.priceType === 'hourly') {
      const parsedQuotedHours = Number(orderQuotedHours.trim() || '1');

      if (
        !Number.isInteger(parsedQuotedHours) ||
        parsedQuotedHours < 1 ||
        parsedQuotedHours > 400
      ) {
        setFlash({
          tone: 'error',
          text: 'Estimated hours must be a whole number between 1 and 400.',
        });
        return;
      }

      quotedHours = parsedQuotedHours;
    }

    setSubmitting(true);
    try {
      await requestJson('/api/freelance/orders', {
        method: 'POST',
        body: JSON.stringify({
          listingId: orderComposerListing._id,
          requirements,
          requirementsFiles: requirementFiles,
          quotedRateBDT,
          quotedHours,
          proposalNote,
          paymentMethod: orderPaymentMethod,
        }),
      });

      setFlash({
        tone: 'success',
        text: 'Order request sent. The freelancer can now accept, counter, or reject your quote before payment.',
      });
      setOrderComposerListing(null);
      await Promise.all([loadOrders(), loadFinance()]);
    } catch (error) {
      setFlash({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Failed to create freelance order.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function startCardPayment(order: OrderSummary) {
    setPendingCardCheckout({
      orderId: order._id,
      title: order.listing.title,
      amount: order.agreedPriceBDT,
      method: order.paymentMethod === 'mastercard' ? 'mastercard' : 'visa',
    });
  }

  function openFreelanceChat(orderId: string) {
    router.push(`/${role}/messages?order=${encodeURIComponent(orderId)}`);
  }

  const openOrderWorkspace = useCallback(
    async (orderId: string, perspective?: 'client' | 'freelancer') => {
      setOrderModalOpen(true);
      setOrderDetailLoading(true);
      try {
        const data = await requestJson<{ order: OrderSummary; reviews: Review[] }>(
          `/api/freelance/orders/${orderId}`
        );
        setSelectedOrder(data.order);
        setSelectedOrderReviews(data.reviews ?? []);
        setDeliveryNote(data.order.deliveryNote ?? '');
        setDeliveryFiles(data.order.deliveryFiles ?? []);
        setRevisionNote(data.order.clientNote ?? '');
        setDisputeNote(data.order.clientNote ?? '');
        setProposalResponseRate(String(data.order.quotedRateBDT));
        setProposalResponseHours(String(data.order.quotedHours ?? 1));
        setProposalResponseNote(data.order.proposalNote ?? '');
        setSelectedOrderPerspective(
          perspective ??
            (freelancerOrders.some((order) => order._id === orderId) ? 'freelancer' : 'client')
        );
        setClientReviewDraft(EMPTY_CLIENT_REVIEW);
        setFreelancerReviewDraft(EMPTY_FREELANCER_REVIEW);
      } catch (error) {
        setFlash({
          tone: 'error',
          text: error instanceof Error ? error.message : 'Failed to load order workspace.',
        });
        setOrderModalOpen(false);
      } finally {
        setOrderDetailLoading(false);
      }
    },
    [freelancerOrders, requestJson]
  );

  const refreshSelectedOrder = useCallback(
    async (orderId?: string) => {
      const targetId = orderId ?? selectedOrder?._id;
      if (!targetId) return;
      await Promise.all([loadListings(), loadOrders(), loadFinance()]);
      await openOrderWorkspace(targetId);
    },
    [loadFinance, loadListings, loadOrders, openOrderWorkspace, selectedOrder?._id]
  );

  async function submitOrderAction(
    action:
      | 'accept_proposal'
      | 'counter_proposal'
      | 'reject_proposal'
      | 'deliver'
      | 'request_revision'
      | 'confirm_completion'
      | 'cancel'
      | 'mark_disputed'
  ) {
    if (!selectedOrder) return;

    setSubmitting(true);
    try {
      await requestJson(`/api/freelance/orders/${selectedOrder._id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          action,
          quotedRateBDT:
            action === 'counter_proposal' ? Number(proposalResponseRate || '0') : undefined,
          quotedHours:
            action === 'counter_proposal' && selectedOrder.priceType === 'hourly'
              ? Number(proposalResponseHours || '0')
              : undefined,
          proposalNote:
            action === 'accept_proposal' ||
            action === 'counter_proposal' ||
            action === 'reject_proposal'
              ? proposalResponseNote
              : undefined,
          deliveryNote,
          deliveryFiles,
          clientNote:
            action === 'request_revision'
              ? revisionNote
              : action === 'mark_disputed'
                ? disputeNote
                : undefined,
        }),
      });

      const messages: Record<string, string> = {
        accept_proposal:
          'Proposal accepted. The quote is now locked, freelance chat is open, and the client can fund escrow.',
        counter_proposal: 'Counter proposal sent.',
        reject_proposal: 'Proposal rejected and the request was closed.',
        deliver: 'Delivery submitted. The client can now review the work.',
        request_revision: 'Revision requested and sent back to the freelancer.',
        confirm_completion:
          'Completion confirmed. Nextern escrow has released the payout and the verified sample was synced.',
        cancel: 'Unpaid order cancelled.',
        mark_disputed: 'Dispute opened. Nextern can now review the escrow and order trail.',
      };

      setFlash({ tone: 'success', text: messages[action] });
      await refreshSelectedOrder(selectedOrder._id);
    } catch (error) {
      setFlash({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Failed to update the order.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function submitReview(reviewType: 'client_to_student' | 'student_to_client') {
    if (!selectedOrder) return;

    const draft = reviewType === 'client_to_student' ? clientReviewDraft : freelancerReviewDraft;
    setSubmitting(true);
    try {
      await requestJson('/api/freelance/reviews', {
        method: 'POST',
        body: JSON.stringify({
          orderId: selectedOrder._id,
          reviewType,
          overallRating: draft.overallRating || undefined,
          communicationRating: draft.communicationRating || undefined,
          requirementsClarityRating: draft.requirementsClarityRating || undefined,
          paymentPromptnessRating: draft.paymentPromptnessRating || undefined,
          professionalismRating: draft.professionalismRating || undefined,
          punctualityRating: draft.punctualityRating || undefined,
          skillPerformanceRating: draft.skillPerformanceRating || undefined,
          workQualityRating: draft.workQualityRating || undefined,
          isRecommended: draft.isRecommended,
          recommendationText: draft.recommendationText,
          comment: draft.comment,
        }),
      });

      setFlash({
        tone: 'success',
        text:
          reviewType === 'client_to_student'
            ? 'Verified freelancer review submitted. The student work history is now stronger.'
            : 'Verified client review submitted successfully.',
      });

      await refreshSelectedOrder(selectedOrder._id);
    } catch (error) {
      setFlash({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Failed to submit the verified review.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function submitWithdrawal() {
    const amountBDT = Number(withdrawAmount || '0');
    if (!amountBDT) {
      setFlash({ tone: 'error', text: 'Enter a withdrawal amount first.' });
      return;
    }

    setFinanceSubmitting(true);
    try {
      await requestJson('/api/freelance/withdrawals', {
        method: 'POST',
        body: JSON.stringify({
          amountBDT,
          note: withdrawNote.trim(),
        }),
      });

      setWithdrawAmount('');
      setWithdrawNote('');
      setFlash({
        tone: 'success',
        text: 'Withdrawal request submitted. The amount moved out of available balance and is now waiting for superadmin review.',
      });
      await loadFinance();
    } catch (error) {
      setFlash({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Failed to request withdrawal.',
      });
    } finally {
      setFinanceSubmitting(false);
    }
  }

  useEffect(() => {
    setActiveTab(currentView);
  }, [currentView]);

  useEffect(() => {
    if (!loading) return;
    void Promise.all([loadListings(), loadOrders(), loadFinance()]).finally(() =>
      setLoading(false)
    );
  }, [loading, loadFinance, loadListings, loadOrders]);

  useEffect(() => {
    const paymentState = searchParams.get('payment');
    const paymentIntentId = searchParams.get('payment_intent');
    const orderId = searchParams.get('order');
    const currentPath = getWorkspaceHref(role, paymentState ? 'clientOrders' : currentView);

    async function verifyCardPayment(intentId: string) {
      if (paymentVerificationRef.current === intentId) return;
      paymentVerificationRef.current = intentId;

      try {
        const response = await fetch(
          `/api/freelance/payment/stripe/verify?paymentIntentId=${encodeURIComponent(intentId)}`,
          { cache: 'no-store' }
        );
        const data = await response.json();

        if (!response.ok || data.status !== 'succeeded') {
          setFlash({
            tone: 'error',
            text: data.error ?? data.message ?? 'Card payment verification is still pending.',
          });
          return;
        }

        setFlash({
          tone: 'success',
          text: 'Card payment confirmed. Nextern escrow is now holding the order funds.',
        });
        await Promise.all([loadListings(), loadOrders(), loadFinance()]);
        if (data.order?._id) {
          await openOrderWorkspace(data.order._id);
        }
      } catch {
        setFlash({
          tone: 'error',
          text: 'We could not verify the card payment. Please refresh and try again.',
        });
      } finally {
        router.replace(currentPath);
      }
    }

    if (paymentState === 'processing' && paymentIntentId) {
      void verifyCardPayment(paymentIntentId);
      return;
    }

    if (paymentState === 'success') {
      setFlash({
        tone: 'success',
        text: 'Escrow funded successfully. The freelancer can now start working.',
      });
      void Promise.all([loadListings(), loadOrders(), loadFinance()]).then(async () => {
        if (orderId) await openOrderWorkspace(orderId);
      });
      router.replace(currentPath);
      return;
    }

    if (paymentState === 'cancelled') {
      setFlash({
        tone: 'error',
        text: 'Payment was cancelled before escrow funding completed.',
      });
      router.replace(currentPath);
      return;
    }

    if (paymentState === 'failed' || paymentState === 'error') {
      setFlash({
        tone: 'error',
        text: 'Payment could not be completed. You can retry from the pending order card.',
      });
      router.replace(currentPath);
    }
  }, [
    currentView,
    loadFinance,
    loadListings,
    loadOrders,
    openOrderWorkspace,
    role,
    router,
    searchParams,
  ]);

  const orderComposerQuote = useMemo(() => {
    if (!orderComposerListing) return null;

    return calculateFreelanceQuote({
      priceType: orderComposerListing.priceType,
      rateBDT: Number(orderQuotedRate || orderComposerListing.priceBDT),
      hours:
        orderComposerListing.priceType === 'hourly' ? Number(orderQuotedHours || '0') : undefined,
    });
  }, [orderComposerListing, orderQuotedHours, orderQuotedRate]);

  const selectedOrderCounterQuote = useMemo(() => {
    if (!selectedOrder) return null;

    return calculateFreelanceQuote({
      priceType: selectedOrder.priceType,
      rateBDT: Number(
        proposalResponseRate || selectedOrder.quotedRateBDT || selectedOrder.agreedPriceBDT
      ),
      hours:
        selectedOrder.priceType === 'hourly' ? Number(proposalResponseHours || '0') : undefined,
    });
  }, [proposalResponseHours, proposalResponseRate, selectedOrder]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          color: C.textMuted,
          background: C.bg,
        }}
      >
        <LoaderCircle className="freelance-spin" size={18} />
        Loading the freelance workspace...
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 48 }}>
      <section
        style={{
          marginBottom: 18,
          borderRadius: 24,
          border: `1px solid ${C.border}`,
          background: '#FFFFFF',
          boxShadow: '0 16px 34px rgba(15,23,42,0.06)',
          padding: 22,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ maxWidth: 760 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 11px',
                borderRadius: 999,
                border: `1px solid ${C.blueBorder}`,
                background: C.blueLight,
                color: C.blue,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              <ShieldCheck size={14} />
              Freelance control center
            </div>

            <h2
              style={{
                margin: '16px 0 0',
                color: C.text,
                fontSize: 28,
                lineHeight: 1.08,
                fontWeight: 900,
                letterSpacing: '-0.04em',
                fontFamily: 'var(--font-display)',
              }}
            >
              {role === 'student'
                ? 'Manage services, escrow-backed orders, and verified work history from one place.'
                : 'Manage sourcing, Nextern escrow, and delivery approvals from one place.'}
            </h2>

            <p
              style={{
                margin: '12px 0 0',
                color: C.textMuted,
                fontSize: 14,
                lineHeight: 1.7,
                maxWidth: 720,
              }}
            >
              Nextern holds the payment until client approval. Completed freelance work feeds into
              verified reviews, portfolio proof, opportunity score growth, and graduation reporting
              without leaving this workspace.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => switchTab('board')} style={primaryButtonStyle}>
              <Search size={14} />
              Browse Board
            </button>
            {role === 'student' ? (
              <button type="button" onClick={openCreateListingModal} style={ghostButtonStyle}>
                <Plus size={14} />
                Publish Service
              </button>
            ) : (
              <button
                type="button"
                onClick={() => switchTab('clientOrders')}
                style={ghostButtonStyle}
              >
                <Wallet size={14} />
                Open My Orders
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
          {[
            {
              icon: activeTab === 'finance' ? BadgeDollarSign : ShieldCheck,
              label: `Viewing ${withViewLabel(activeTab)}`,
            },
            { icon: ShieldCheck, label: 'Nextern escrow protected' },
            { icon: BadgeCheck, label: 'Verified review trail' },
            {
              icon: role === 'student' ? FileUp : BriefcaseBusiness,
              label: role === 'student' ? 'Portfolio and GER sync' : 'Verified hiring trail',
            },
            {
              icon: Wallet,
              label:
                role === 'student'
                  ? `+${FREELANCE_OPPORTUNITY_SCORE_DELTA} opportunity score on completed release`
                  : 'Release payment only after satisfactory delivery',
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 12px',
                  borderRadius: 999,
                  background: '#F8FAFC',
                  border: `1px solid ${C.border}`,
                  color: C.textMuted,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <Icon size={14} color={C.blue} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: 14,
            marginTop: 18,
          }}
          className="freelance-info-grid"
        >
          {(role === 'student'
            ? [
                {
                  label: 'Board listings',
                  value: String(boardSummary.activeListings),
                  hint: 'Active student services discoverable right now',
                  accent: C.blue,
                },
                {
                  label: 'Available balance',
                  value: formatMoney(financeSummary.accountBalanceBDT),
                  hint: 'Released freelance income sitting in your account ledger',
                  accent: C.teal,
                },
                {
                  label: 'Total earnings',
                  value: formatMoney(financeSummary.totalEarningsBDT),
                  hint: 'Lifetime released earnings after the Nextern platform fee',
                  accent: '#D97706',
                },
                {
                  label: 'Freelancer orders',
                  value: String(boardSummary.freelancerOrders),
                  hint: 'Orders where you are the delivering freelancer',
                  accent: C.green,
                },
              ]
            : [
                {
                  label: 'Board listings',
                  value: String(boardSummary.activeListings),
                  hint: 'Verified student services available to hire',
                  accent: C.blue,
                },
                {
                  label: 'My orders',
                  value: String(boardSummary.clientOrders),
                  hint: 'Orders you funded or are currently reviewing',
                  accent: C.teal,
                },
                {
                  label: 'Total spendings',
                  value: formatMoney(financeSummary.totalSpendingsBDT),
                  hint: 'Total freelance spending recorded from funded client orders',
                  accent: '#D97706',
                },
                {
                  label: 'Approval queue',
                  value: String(
                    clientOrders.filter((order) => order.status === 'delivered').length
                  ),
                  hint: 'Delivered orders waiting for your final decision',
                  accent: C.green,
                },
              ]
          ).map((item) => (
            <div
              key={item.label}
              style={{
                borderRadius: 18,
                border: `1px solid ${C.border}`,
                background: '#F8FAFC',
                padding: '16px 18px',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: C.textLight,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  marginTop: 8,
                  color: item.accent,
                  fontSize: 26,
                  lineHeight: 1.05,
                  fontWeight: 900,
                  fontFamily: 'var(--font-display)',
                }}
              >
                {item.value}
              </div>
              <div style={{ marginTop: 8, color: C.textMuted, fontSize: 12, lineHeight: 1.6 }}>
                {item.hint}
              </div>
            </div>
          ))}
        </div>
      </section>

      {flash ? (
        <div
          style={{
            marginBottom: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: flash.tone === 'success' ? C.greenBg : C.dangerBg,
            border: `1px solid ${flash.tone === 'success' ? C.greenBorder : C.dangerBorder}`,
            borderRadius: 14,
            padding: '14px 16px',
            color: flash.tone === 'success' ? '#065F46' : '#991B1B',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {flash.tone === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          <span>{flash.text}</span>
          <button
            type="button"
            onClick={() => setFlash(null)}
            style={{
              marginLeft: 'auto',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'inherit',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={14} />
          </button>
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        {[
          { id: 'board', label: 'Marketplace', count: listings.length },
          ...(role === 'student'
            ? [{ id: 'services', label: 'My Services', count: myListings.length }]
            : []),
          { id: 'clientOrders', label: 'Client Orders', count: clientOrders.length },
          ...(role === 'student'
            ? [
                {
                  id: 'freelancerOrders',
                  label: 'Freelancer Orders',
                  count: freelancerOrders.length,
                },
              ]
            : []),
          {
            id: 'finance',
            label: role === 'student' ? 'Earnings & Invoices' : 'Spend & Invoices',
            count: financeSummary.clientInvoiceCount + financeSummary.freelancerInvoiceCount,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => switchTab(tab.id as WorkspaceTab)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 14px',
              borderRadius: 999,
              border: `1px solid ${activeTab === tab.id ? C.blueBorder : C.border}`,
              background: activeTab === tab.id ? C.blueLight : '#FFFFFF',
              color: activeTab === tab.id ? C.blue : C.textMuted,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            <span>{tab.label}</span>
            <span
              style={{
                minWidth: 22,
                height: 22,
                borderRadius: 999,
                background: activeTab === tab.id ? '#FFFFFF' : '#F8FAFC',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 6px',
                fontSize: 11,
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {activeTab === 'board' ? (
        <SectionCard
          title="Freelance Board"
          description="Browse student service offers, filter by budget or skill, and place orders that stay in Nextern escrow until delivery is approved."
          action={
            <button type="button" onClick={() => void loadListings()} style={ghostButtonStyle}>
              <RefreshCw size={14} />
              Refresh board
            </button>
          }
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
              gap: 12,
              marginBottom: 18,
            }}
            className="freelance-filter-grid"
          >
            <div style={{ position: 'relative' }}>
              <Search
                size={14}
                color={C.textLight}
                style={{ position: 'absolute', left: 12, top: 12 }}
              />
              <input
                value={filters.search}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, search: event.target.value }))
                }
                placeholder="Search title or skill"
                style={{ ...fieldInputStyle, paddingLeft: 34 }}
              />
            </div>
            <select
              value={filters.category}
              onChange={(event) =>
                setFilters((current) => ({ ...current, category: event.target.value }))
              }
              style={fieldInputStyle}
            >
              <option value="">All categories</option>
              {FREELANCE_CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
            <input
              value={filters.skill}
              onChange={(event) =>
                setFilters((current) => ({ ...current, skill: event.target.value }))
              }
              placeholder="Filter by skill"
              style={fieldInputStyle}
            />
            <input
              value={filters.minBudget}
              onChange={(event) =>
                setFilters((current) => ({ ...current, minBudget: event.target.value }))
              }
              placeholder="Min budget"
              inputMode="numeric"
              style={fieldInputStyle}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                value={filters.maxBudget}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, maxBudget: event.target.value }))
                }
                placeholder="Max budget"
                inputMode="numeric"
                style={{ ...fieldInputStyle, flex: 1 }}
              />
              <button
                type="button"
                onClick={() => {
                  setListingPage(1);
                  void loadListings(1, listingPageSize);
                }}
                style={primaryButtonStyle}
              >
                <Filter size={14} />
                Apply
              </button>
            </div>
          </div>

          {boardLoading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: '42px 0',
                color: C.textMuted,
              }}
            >
              <LoaderCircle className="freelance-spin" size={18} />
              Loading the freelance board...
            </div>
          ) : listings.length ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gridAutoRows: '1fr',
                gap: 16,
              }}
              className="freelance-card-grid"
            >
              {listings.map((listing) => (
                <article
                  key={listing._id}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 22,
                    border: `1px solid ${listing.isActive ? C.border : C.dangerBorder}`,
                    padding: 20,
                    boxShadow: '0 12px 28px rgba(15,23,42,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 12,
                      marginBottom: 12,
                    }}
                  >
                    <div>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
                      >
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '5px 10px',
                            borderRadius: 999,
                            background: C.blueLight,
                            border: `1px solid ${C.blueBorder}`,
                            color: C.blue,
                            fontSize: 11,
                            fontWeight: 800,
                          }}
                        >
                          {FREELANCE_CATEGORIES.find((item) => item.id === listing.category)
                            ?.label ?? formatStatus(listing.category)}
                        </span>
                        {listing.freelancer.hasVerifiedFreelancerBadge ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '5px 10px',
                              borderRadius: 999,
                              background: C.greenBg,
                              border: `1px solid ${C.greenBorder}`,
                              color: '#047857',
                              fontSize: 11,
                              fontWeight: 800,
                            }}
                          >
                            <BadgeCheck size={13} />
                            Verified Freelancer
                          </span>
                        ) : null}
                      </div>
                      <h3
                        style={{
                          margin: '12px 0 0',
                          fontSize: 18,
                          fontWeight: 800,
                          color: C.text,
                          fontFamily: 'var(--font-display)',
                          minHeight: 45,
                          lineHeight: 1.25,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {listing.title}
                      </h3>
                    </div>
                    {!listing.isActive ? <StatusPill value="inactive" /> : null}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: 12,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 900,
                        color: C.text,
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      {formatMoney(listing.priceBDT)}
                    </div>
                    <div style={{ color: C.textMuted, fontSize: 12, fontWeight: 700 }}>
                      {listing.priceType === 'hourly' ? 'per hour' : 'fixed package'}
                    </div>
                  </div>

                  <div style={{ minHeight: 108 }}>
                    <p
                      style={{
                        margin: 0,
                        color: C.textMuted,
                        fontSize: 13,
                        lineHeight: 1.7,
                      }}
                    >
                      {expandedDescriptions[listing._id]
                        ? listing.description
                        : shortenText(listing.description, 170)}
                    </p>
                    {listing.description.length > 170 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedDescriptions((current) => ({
                            ...current,
                            [listing._id]: !current[listing._id],
                          }))
                        }
                        style={{
                          marginTop: 8,
                          border: 'none',
                          background: 'transparent',
                          color: C.blue,
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 800,
                          padding: 0,
                        }}
                      >
                        {expandedDescriptions[listing._id] ? 'Read less' : 'Read more'}
                      </button>
                    ) : null}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
                    {listing.skills.map((skill) => (
                      <span
                        key={skill}
                        style={{
                          padding: '4px 9px',
                          borderRadius: 999,
                          background: '#F8FAFC',
                          border: `1px solid ${C.border}`,
                          color: C.textMuted,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div
                    style={{
                      marginTop: 16,
                      padding: '14px 0',
                      borderTop: `1px solid ${C.border}`,
                      borderBottom: `1px solid ${C.border}`,
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: 10,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          color: '#D97706',
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        <Star size={13} fill="#F59E0B" />
                        {listing.averageRating ? listing.averageRating.toFixed(1) : 'New'}
                      </div>
                      <div style={{ fontSize: 11, color: C.textLight, marginTop: 4 }}>
                        Verified rating
                      </div>
                    </div>
                    <div>
                      <div style={{ color: C.text, fontSize: 13, fontWeight: 800 }}>
                        {listing.totalOrdersCompleted}
                      </div>
                      <div style={{ fontSize: 11, color: C.textLight, marginTop: 4 }}>
                        Completed orders
                      </div>
                    </div>
                    <div>
                      <div style={{ color: C.text, fontSize: 13, fontWeight: 800 }}>
                        {listing.deliveryDays} day{listing.deliveryDays > 1 ? 's' : ''}
                      </div>
                      <div style={{ fontSize: 11, color: C.textLight, marginTop: 4 }}>
                        Standard delivery
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 12, color: C.textLight, fontWeight: 700 }}>
                      Freelancer
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>
                          {listing.freelancer.name}
                        </div>
                        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>
                          {[listing.freelancer.university, listing.freelancer.department]
                            .filter(Boolean)
                            .join(' • ') || 'Student freelancer'}
                        </div>
                      </div>
                      <div
                        style={{
                          background: C.tealBg,
                          border: `1px solid ${C.tealBorder}`,
                          borderRadius: 12,
                          padding: '7px 10px',
                          color: C.teal,
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        Score {listing.freelancer.opportunityScore}
                      </div>
                    </div>
                  </div>

                  {listing.sampleFiles.length ? (
                    <div style={{ marginTop: 14 }}>
                      <div
                        style={{
                          fontSize: 12,
                          color: C.textLight,
                          fontWeight: 700,
                          marginBottom: 8,
                        }}
                      >
                        Sample work
                      </div>
                      <AssetList assets={listing.sampleFiles.slice(0, 2)} tone="blue" />
                    </div>
                  ) : null}

                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      marginTop: 'auto',
                      paddingTop: 16,
                      flexWrap: 'wrap',
                    }}
                  >
                    {listing.canOrder ? (
                      <button
                        type="button"
                        onClick={() => startOrderComposer(listing)}
                        style={{ ...primaryButtonStyle, flex: 1 }}
                      >
                        <Wallet size={14} />
                        Request Quote
                      </button>
                    ) : null}
                    {listing.canEdit ? (
                      <>
                        <button
                          type="button"
                          onClick={() => openEditListingModal(listing)}
                          style={ghostButtonStyle}
                        >
                          <PencilLine size={14} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void toggleListingActive(listing)}
                          disabled={submitting}
                          style={{
                            ...ghostButtonStyle,
                            border: `1px solid ${
                              listing.isActive ? C.dangerBorder : C.greenBorder
                            }`,
                            background: listing.isActive ? C.dangerBg : C.greenBg,
                            color: listing.isActive ? C.danger : '#047857',
                          }}
                        >
                          {listing.isActive ? 'Pause' : 'Reactivate'}
                        </button>
                      </>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No freelance services match these filters"
              description="Try widening the budget range, removing a skill filter, or publishing the first student service in this category."
            />
          )}
          {!boardLoading && listingTotal > 0 ? (
            <PaginationControls
              page={listingPage}
              pageSize={listingPageSize}
              totalItems={listingTotal}
              itemLabel="freelance services"
              onPageChange={(nextPage) => {
                setListingPage(nextPage);
                void loadListings(nextPage, listingPageSize);
              }}
              onPageSizeChange={(nextPageSize) => {
                setListingPageSize(nextPageSize);
                setListingPage(1);
                void loadListings(1, nextPageSize);
              }}
            />
          ) : null}
        </SectionCard>
      ) : null}
      {activeTab === 'services' && role === 'student' ? (
        <SectionCard
          title="My Services"
          description="Manage the offers clients see on the board, update sample files, and pause services when you are unavailable."
          action={
            <button type="button" onClick={openCreateListingModal} style={primaryButtonStyle}>
              <Plus size={14} />
              New Service
            </button>
          }
        >
          {myListings.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {myListings.map((listing) => (
                <div
                  key={listing._id}
                  style={{
                    border: `1px solid ${C.border}`,
                    borderRadius: 18,
                    padding: '18px 20px',
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1fr) auto',
                    gap: 18,
                  }}
                  className="freelance-service-row"
                >
                  <div>
                    <div
                      style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          fontSize: 18,
                          color: C.text,
                          fontWeight: 800,
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        {listing.title}
                      </h3>
                      <StatusPill value={listing.isActive ? 'active' : 'paused'} />
                    </div>
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8 }}>
                      <span style={{ color: C.textMuted, fontSize: 13, fontWeight: 600 }}>
                        {formatMoney(listing.priceBDT)}{' '}
                        {listing.priceType === 'hourly' ? '/ hour' : '/ package'}
                      </span>
                      <span style={{ color: C.textMuted, fontSize: 13 }}>
                        Delivery in {listing.deliveryDays} day{listing.deliveryDays > 1 ? 's' : ''}
                      </span>
                      <span style={{ color: C.textMuted, fontSize: 13 }}>
                        {listing.totalOrdersCompleted} verified deliveries
                      </span>
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <p style={{ margin: 0, color: C.textMuted, fontSize: 13, lineHeight: 1.7 }}>
                        {expandedDescriptions[listing._id]
                          ? listing.description
                          : shortenText(listing.description, 190)}
                      </p>
                      {listing.description.length > 190 ? (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedDescriptions((current) => ({
                              ...current,
                              [listing._id]: !current[listing._id],
                            }))
                          }
                          style={{
                            marginTop: 8,
                            border: 'none',
                            background: 'transparent',
                            color: C.blue,
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 800,
                            padding: 0,
                          }}
                        >
                          {expandedDescriptions[listing._id] ? 'Read less' : 'Read more'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div
                    style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}
                  >
                    <button
                      type="button"
                      onClick={() => openEditListingModal(listing)}
                      style={ghostButtonStyle}
                    >
                      <PencilLine size={14} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggleListingActive(listing)}
                      style={{
                        ...ghostButtonStyle,
                        border: `1px solid ${listing.isActive ? C.dangerBorder : C.greenBorder}`,
                        background: listing.isActive ? C.dangerBg : C.greenBg,
                        color: listing.isActive ? C.danger : '#047857',
                      }}
                    >
                      {listing.isActive ? 'Pause' : 'Reactivate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No services published yet"
              description="Create your first student freelance offer with a clear scope, delivery time, sample work, and pricing."
              action={
                <button type="button" onClick={openCreateListingModal} style={primaryButtonStyle}>
                  <Plus size={14} />
                  Publish My First Service
                </button>
              }
            />
          )}
        </SectionCard>
      ) : null}

      {activeTab === 'clientOrders' ? (
        <SectionCard
          title="Client Orders"
          description="These are the orders you placed as a buyer. Fund pending jobs, review deliveries, approve escrow release, and leave verified client reviews."
        >
          {ordersLoading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: '42px 0',
                color: C.textMuted,
              }}
            >
              <LoaderCircle className="freelance-spin" size={18} />
              Loading your client orders...
            </div>
          ) : clientOrders.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {clientOrders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  role={role}
                  mode="client"
                  onOpen={() => void openOrderWorkspace(order._id, 'client')}
                  onPayNow={() =>
                    order.paymentMethod === 'bkash'
                      ? void startBkashPayment(order._id)
                      : void startCardPayment(order)
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No client orders yet"
              description="When you place a freelance order from the board, it will appear here for escrow funding, delivery review, and verified completion."
              action={
                <button type="button" onClick={() => switchTab('board')} style={primaryButtonStyle}>
                  <Search size={14} />
                  Browse Services
                </button>
              }
            />
          )}
        </SectionCard>
      ) : null}

      {activeTab === 'freelancerOrders' && role === 'student' ? (
        <SectionCard
          title="Freelancer Orders"
          description="Track work you are delivering for clients, upload revisions, and build verified portfolio history after escrow release."
        >
          {ordersLoading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: '42px 0',
                color: C.textMuted,
              }}
            >
              <LoaderCircle className="freelance-spin" size={18} />
              Loading your freelancer orders...
            </div>
          ) : freelancerOrders.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {freelancerOrders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  role={role}
                  mode="freelancer"
                  onOpen={() => void openOrderWorkspace(order._id, 'freelancer')}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No freelancer orders yet"
              description="Once a client funds one of your services, the order will appear here and the money will remain in Nextern escrow until approval."
              action={
                <button type="button" onClick={openCreateListingModal} style={primaryButtonStyle}>
                  <Plus size={14} />
                  Publish a Service
                </button>
              }
            />
          )}
        </SectionCard>
      ) : null}

      {activeTab === 'finance' ? (
        <SectionCard
          title={role === 'student' ? 'Earnings, Accounts & Invoices' : 'Spend, Escrow & Invoices'}
          description={
            role === 'student'
              ? 'Track lifetime earnings, current account balance, platform fee deductions, verified invoices, and manual withdrawal requests from one place.'
              : 'Track freelance spend, escrow exposure, and client-side invoices from a dedicated finance workspace.'
          }
          action={
            <button type="button" onClick={() => void loadFinance()} style={ghostButtonStyle}>
              <RefreshCw size={14} />
              Refresh finance
            </button>
          }
        >
          {financeLoading && !financeData ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: '42px 0',
                color: C.textMuted,
              }}
            >
              <LoaderCircle className="freelance-spin" size={18} />
              Loading your finance workspace...
            </div>
          ) : (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                  gap: 14,
                  marginBottom: 18,
                }}
                className="freelance-info-grid"
              >
                {(role === 'student'
                  ? [
                      {
                        label: 'Available balance',
                        value: formatMoney(financeSummary.accountBalanceBDT),
                        hint: 'Released payout available inside your freelance account',
                        accent: C.blue,
                      },
                      {
                        label: 'Total earnings',
                        value: formatMoney(financeSummary.totalEarningsBDT),
                        hint: 'Lifetime earnings credited after platform fee deduction',
                        accent: C.teal,
                      },
                      {
                        label: 'Withdrawn',
                        value: formatMoney(financeSummary.totalWithdrawnBDT),
                        hint: 'Funds already requested out of your account balance',
                        accent: '#D97706',
                      },
                      {
                        label: 'Platform fees',
                        value: formatMoney(financeSummary.totalPlatformFeesBDT),
                        hint: `${Math.round(FREELANCE_PLATFORM_FEE_RATE * 100)}% retained by Nextern from released earnings`,
                        accent: C.green,
                      },
                    ]
                  : [
                      {
                        label: 'Total spendings',
                        value: formatMoney(financeSummary.totalSpendingsBDT),
                        hint: 'Funded freelance orders recorded against your account',
                        accent: C.blue,
                      },
                      {
                        label: 'Held in escrow',
                        value: formatMoney(boardSummary.totalEscrowHeld),
                        hint: 'Funds still being held by Nextern pending delivery approval',
                        accent: C.teal,
                      },
                      {
                        label: 'Client invoices',
                        value: String(financeSummary.clientInvoiceCount),
                        hint: 'Professional invoice records for your freelance orders',
                        accent: '#D97706',
                      },
                      {
                        label: 'Approval queue',
                        value: String(
                          clientOrders.filter((order) => order.status === 'delivered').length
                        ),
                        hint: 'Delivered projects waiting for your final release decision',
                        accent: C.green,
                      },
                    ]
                ).map((item) => (
                  <div
                    key={item.label}
                    style={{
                      borderRadius: 18,
                      border: `1px solid ${C.border}`,
                      background: '#F8FAFC',
                      padding: '16px 18px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: C.textLight,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        color: item.accent,
                        fontSize: 24,
                        lineHeight: 1.08,
                        fontWeight: 900,
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      {item.value}
                    </div>
                    <div
                      style={{ marginTop: 8, color: C.textMuted, fontSize: 12, lineHeight: 1.6 }}
                    >
                      {item.hint}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: role === 'student' ? '1.1fr 1.3fr' : '1fr',
                  gap: 16,
                  marginBottom: 18,
                }}
                className="freelance-modal-grid"
              >
                {role === 'student' ? (
                  <div style={orderBlockStyle}>
                    <div style={orderBlockHeaderStyle}>
                      <div>
                        <div style={orderBlockTitleStyle}>Freelance account</div>
                        <p style={orderBlockCopyStyle}>
                          Released income lands here first. You can request a withdrawal now, and
                          superadmin can process it later without affecting your lifetime earnings.
                        </p>
                      </div>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 12px',
                          borderRadius: 999,
                          background: C.blueLight,
                          border: `1px solid ${C.blueBorder}`,
                          color: C.blue,
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        <Wallet size={14} />
                        {formatMoney(financeSummary.accountBalanceBDT)}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <label>
                        <span style={fieldLabelStyle}>Withdraw amount</span>
                        <input
                          value={withdrawAmount}
                          onChange={(event) => setWithdrawAmount(event.target.value)}
                          placeholder="1000"
                          inputMode="numeric"
                          style={fieldInputStyle}
                        />
                      </label>
                      <label>
                        <span style={fieldLabelStyle}>Internal note</span>
                        <input
                          value={withdrawNote}
                          onChange={(event) => setWithdrawNote(event.target.value)}
                          placeholder="Optional note for superadmin"
                          style={fieldInputStyle}
                        />
                      </label>
                    </div>

                    <div
                      style={{
                        marginTop: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.6 }}>
                        Pending review: {formatMoney(financeSummary.pendingWithdrawalsBDT)}. Total
                        earnings stay fixed even after withdrawal requests.
                      </div>
                      <button
                        type="button"
                        onClick={() => void submitWithdrawal()}
                        style={primaryButtonStyle}
                        disabled={
                          financeSubmitting ||
                          financeSummary.accountBalanceBDT <= 0 ||
                          Number(withdrawAmount || '0') <= 0
                        }
                      >
                        {financeSubmitting ? (
                          <>
                            <LoaderCircle className="freelance-spin" size={14} />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <BanknoteArrowUp size={14} />
                            Request Withdrawal
                          </>
                        )}
                      </button>
                    </div>

                    <div style={{ marginTop: 18 }}>
                      <div style={orderBlockTitleStyle}>Withdrawal timeline</div>
                      <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                        {financeData?.withdrawals?.length ? (
                          financeData.withdrawals.map((withdrawal) => (
                            <div
                              key={withdrawal._id}
                              style={{
                                padding: '14px 16px',
                                borderRadius: 16,
                                border: `1px solid ${C.border}`,
                                background: '#F8FAFC',
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                gap: 12,
                                flexWrap: 'wrap',
                              }}
                            >
                              <div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>
                                  {formatMoney(withdrawal.amountBDT)}
                                </div>
                                <div style={{ marginTop: 5, fontSize: 12, color: C.textMuted }}>
                                  Requested {formatDate(withdrawal.createdAt, true)}
                                </div>
                                {withdrawal.adminNote ? (
                                  <div style={{ marginTop: 6, fontSize: 12, color: C.textMuted }}>
                                    Admin note: {withdrawal.adminNote}
                                  </div>
                                ) : null}
                              </div>
                              <StatusPill value={withdrawal.status} />
                            </div>
                          ))
                        ) : (
                          <EmptyState
                            title="No withdrawals yet"
                            description="Requested withdrawals will appear here with their review status."
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div style={orderBlockStyle}>
                  <div style={orderBlockHeaderStyle}>
                    <div>
                      <div style={orderBlockTitleStyle}>Invoice desk</div>
                      <p style={orderBlockCopyStyle}>
                        Every freelance invoice includes service pricing, hourly breakdown where
                        applicable, escrow status, payment method, and the Nextern platform fee.
                      </p>
                    </div>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 12px',
                        borderRadius: 999,
                        background: C.tealBg,
                        border: `1px solid ${C.tealBorder}`,
                        color: C.teal,
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      <ReceiptText size={14} />
                      {allInvoices.length} total invoices
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                      gap: 12,
                    }}
                    className="freelance-info-grid"
                  >
                    <div
                      style={{
                        padding: '14px 16px',
                        borderRadius: 16,
                        background: '#F8FAFC',
                        border: `1px solid ${C.border}`,
                      }}
                    >
                      <div style={summaryLabelStyle}>Spendings</div>
                      <div style={summaryValueStyle}>
                        {formatMoney(financeSummary.totalSpendingsBDT)}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: '14px 16px',
                        borderRadius: 16,
                        background: '#F8FAFC',
                        border: `1px solid ${C.border}`,
                      }}
                    >
                      <div style={summaryLabelStyle}>Freelancer invoices</div>
                      <div style={summaryValueStyle}>{financeSummary.freelancerInvoiceCount}</div>
                    </div>
                    <div
                      style={{
                        padding: '14px 16px',
                        borderRadius: 16,
                        background: '#F8FAFC',
                        border: `1px solid ${C.border}`,
                      }}
                    >
                      <div style={summaryLabelStyle}>Client invoices</div>
                      <div style={summaryValueStyle}>{financeSummary.clientInvoiceCount}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
                    {allInvoices.length ? (
                      allInvoices.map((invoice) => (
                        <div
                          key={invoice.id}
                          style={{
                            padding: '14px 16px',
                            borderRadius: 16,
                            border: `1px solid ${C.border}`,
                            background: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: 14,
                            flexWrap: 'wrap',
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                flexWrap: 'wrap',
                              }}
                            >
                              <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>
                                {invoice.listingTitle}
                              </div>
                              <StatusPill value={invoice.status} />
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '5px 10px',
                                  borderRadius: 999,
                                  background: '#F8FAFC',
                                  border: `1px solid ${C.border}`,
                                  color: C.textMuted,
                                  fontSize: 11,
                                  fontWeight: 700,
                                }}
                              >
                                {invoice.invoiceNumber}
                              </span>
                            </div>
                            <div style={{ marginTop: 6, fontSize: 12, color: C.textMuted }}>
                              {invoice.counterpartyRole}: {invoice.counterpartyName} · Issued{' '}
                              {formatDate(invoice.issuedAt)} · Total{' '}
                              {formatMoney(invoice.clientTotalBDT)}
                            </div>
                            <div style={{ marginTop: 6, fontSize: 12, color: C.textMuted }}>
                              {invoice.priceType === 'hourly'
                                ? `${formatMoney(invoice.rateBDT)}/hr × ${invoice.hours ?? 1}h`
                                : 'Fixed package'}
                              {invoice.perspective === 'freelancer'
                                ? ` · Net payout ${formatMoney(invoice.freelancerNetBDT ?? 0)}`
                                : ` · Escrow ${formatStatus(invoice.escrowStatus)}`}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(invoice)}
                            style={ghostButtonStyle}
                          >
                            <ReceiptText size={14} />
                            Open invoice
                          </button>
                        </div>
                      ))
                    ) : (
                      <EmptyState
                        title="No invoices yet"
                        description="Freelance invoices will appear here once you request, fund, or complete orders."
                      />
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </SectionCard>
      ) : null}

      <section
        style={{
          marginTop: 22,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 16,
        }}
        className="freelance-info-grid"
      >
        {[
          {
            title: 'Escrow workflow',
            copy: 'Client payments are held by Nextern in escrow and released only after the client confirms satisfactory delivery.',
            icon: ShieldCheck,
            color: C.blue,
            bg: C.blueLight,
            border: C.blueBorder,
          },
          {
            title: 'Verified history',
            copy: 'Both sides leave verified reviews after completion, creating tamper-resistant work history for students and clients.',
            icon: BadgeCheck,
            color: C.green,
            bg: C.greenBg,
            border: C.greenBorder,
          },
          {
            title: 'Portfolio sync',
            copy: 'Completed student deliveries are added automatically to the Portfolio Builder, Opportunity Score, and GER work experience metrics.',
            icon: BriefcaseBusiness,
            color: C.teal,
            bg: C.tealBg,
            border: C.tealBorder,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              style={{
                background: '#FFFFFF',
                border: `1px solid ${item.border}`,
                borderRadius: 22,
                padding: 20,
                boxShadow: '0 10px 24px rgba(15,23,42,0.05)',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: item.bg,
                  border: `1px solid ${item.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: item.color,
                  marginBottom: 14,
                }}
              >
                <Icon size={20} />
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: C.text,
                  fontFamily: 'var(--font-display)',
                  marginBottom: 8,
                }}
              >
                {item.title}
              </div>
              <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.7 }}>{item.copy}</div>
            </div>
          );
        })}
      </section>
      <ModalFrame
        open={listingEditorOpen}
        onClose={() => setListingEditorOpen(false)}
        title={editingListing ? 'Edit Freelance Service' : 'Publish Freelance Service'}
        subtitle="Define your offer clearly so clients can compare scope, pricing, and sample work with confidence."
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 14,
          }}
          className="freelance-modal-grid"
        >
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={fieldLabelStyle}>Service title</label>
            <input
              value={listingForm.title}
              onChange={(event) =>
                setListingForm((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="Professional landing page design for student startups"
              style={fieldInputStyle}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={fieldLabelStyle}>Description</label>
            <textarea
              rows={5}
              value={listingForm.description}
              onChange={(event) =>
                setListingForm((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Explain deliverables, process, revision policy, and the kind of clients you serve best."
              style={{ ...fieldInputStyle, resize: 'vertical', minHeight: 120 }}
            />
          </div>
          <div>
            <label style={fieldLabelStyle}>Category</label>
            <select
              value={listingForm.category}
              onChange={(event) =>
                setListingForm((current) => ({ ...current, category: event.target.value }))
              }
              style={fieldInputStyle}
            >
              {FREELANCE_CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={fieldLabelStyle}>Pricing model</label>
            <select
              value={listingForm.priceType}
              onChange={(event) =>
                setListingForm((current) => ({
                  ...current,
                  priceType: event.target.value as 'fixed' | 'hourly',
                }))
              }
              style={fieldInputStyle}
            >
              <option value="fixed">Fixed package</option>
              <option value="hourly">Hourly</option>
            </select>
          </div>
          <div>
            <label style={fieldLabelStyle}>Rate (BDT)</label>
            <input
              value={listingForm.priceBDT}
              inputMode="numeric"
              onChange={(event) =>
                setListingForm((current) => ({ ...current, priceBDT: event.target.value }))
              }
              placeholder="3500"
              style={fieldInputStyle}
            />
          </div>
          <div>
            <label style={fieldLabelStyle}>Delivery time (days)</label>
            <input
              value={listingForm.deliveryDays}
              inputMode="numeric"
              onChange={(event) =>
                setListingForm((current) => ({ ...current, deliveryDays: event.target.value }))
              }
              placeholder="7"
              style={fieldInputStyle}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={fieldLabelStyle}>Skills</label>
            <input
              value={listingForm.skillsText}
              onChange={(event) =>
                setListingForm((current) => ({ ...current, skillsText: event.target.value }))
              }
              placeholder="React, Next.js, UI design, Tailwind CSS"
              style={fieldInputStyle}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={fieldLabelStyle}>Sample work files</label>
            <div
              style={{
                border: `1px dashed ${C.blueBorder}`,
                borderRadius: 16,
                background: C.blueLight,
                padding: 16,
              }}
            >
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: '#FFFFFF',
                  border: `1px solid ${C.blueBorder}`,
                  color: C.blue,
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: sampleUploading ? 'not-allowed' : 'pointer',
                }}
              >
                <Upload size={14} />
                {sampleUploading ? 'Uploading samples...' : 'Upload sample files'}
                <input
                  type="file"
                  multiple
                  hidden
                  onChange={async (event) => {
                    const input = event.currentTarget;
                    const files = Array.from(input.files ?? []);
                    if (!files.length) return;
                    input.value = '';
                    const uploaded = await uploadAssets('sample', files);
                    setListingForm((current) => ({
                      ...current,
                      sampleFiles: [...current.sampleFiles, ...uploaded].slice(0, 6),
                    }));
                  }}
                />
              </label>
              <p style={{ margin: '10px 0 0', color: C.textMuted, fontSize: 12, lineHeight: 1.6 }}>
                Upload portfolio snapshots, case studies, decks, or sample deliverables to prove
                quality before clients place escrow-funded orders.
              </p>
              <div style={{ marginTop: 14 }}>
                <AssetList
                  assets={listingForm.sampleFiles}
                  tone="blue"
                  removable
                  onRemove={(index) =>
                    setListingForm((current) => ({
                      ...current,
                      sampleFiles: current.sampleFiles.filter(
                        (_, itemIndex) => itemIndex !== index
                      ),
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: C.text,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <input
                type="checkbox"
                checked={listingForm.isActive}
                onChange={(event) =>
                  setListingForm((current) => ({ ...current, isActive: event.target.checked }))
                }
              />
              Keep this listing visible on the live freelance board
            </label>
          </div>
        </div>

        <div
          style={{
            marginTop: 22,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ color: C.textMuted, fontSize: 12, lineHeight: 1.6, maxWidth: 420 }}>
            Students who consistently complete funded work with strong verified reviews can earn the
            Verified Freelancer badge.
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setListingEditorOpen(false)}
              style={ghostButtonStyle}
            >
              Cancel
            </button>
            <button type="button" onClick={() => void submitListing()} style={primaryButtonStyle}>
              {submitting ? (
                <>
                  <LoaderCircle className="freelance-spin" size={14} />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  {editingListing ? 'Save Service' : 'Publish Service'}
                </>
              )}
            </button>
          </div>
        </div>
      </ModalFrame>
      <ModalFrame
        open={Boolean(orderComposerListing)}
        onClose={() => setOrderComposerListing(null)}
        title={
          orderComposerListing ? `Request Quote: ${orderComposerListing.title}` : 'Request Quote'
        }
        subtitle="Send scope, preferred pricing, and payment method. The freelancer must accept the quote before escrow funding starts."
      >
        {orderComposerListing ? (
          <>
            <div
              style={{
                background: '#F8FAFC',
                border: `1px solid ${C.border}`,
                borderRadius: 18,
                padding: 16,
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 14,
                marginBottom: 18,
              }}
              className="freelance-modal-grid"
            >
              <div>
                <div style={summaryLabelStyle}>
                  {orderComposerListing.priceType === 'hourly'
                    ? 'Listed hourly rate'
                    : 'Listed price'}
                </div>
                <div style={summaryValueStyle}>
                  {orderComposerListing.priceType === 'hourly'
                    ? `${formatMoney(orderComposerListing.priceBDT)}/hr`
                    : formatMoney(orderComposerListing.priceBDT)}
                </div>
              </div>
              <div>
                <div style={summaryLabelStyle}>Delivery time</div>
                <div style={summaryValueStyle}>
                  {orderComposerListing.deliveryDays} day
                  {orderComposerListing.deliveryDays > 1 ? 's' : ''}
                </div>
              </div>
              <div>
                <div style={summaryLabelStyle}>Current quote</div>
                <div style={summaryValueStyle}>
                  {orderComposerQuote ? formatMoney(orderComposerQuote.totalBDT) : formatMoney(0)}
                </div>
              </div>
            </div>

            <div>
              <label style={fieldLabelStyle}>Project requirements</label>
              <textarea
                rows={6}
                value={requirementsText}
                onChange={(event) => setRequirementsText(event.target.value)}
                placeholder="Describe goals, scope, file formats, content references, deadline context, and any must-have deliverables."
                style={{ ...fieldInputStyle, resize: 'vertical', minHeight: 150 }}
              />
            </div>

            <div style={{ marginTop: 18 }}>
              <div style={fieldLabelStyle}>Quote proposal</div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    orderComposerListing.priceType === 'hourly'
                      ? 'repeat(3, minmax(0, 1fr))'
                      : 'repeat(2, minmax(0, 1fr))',
                  gap: 12,
                }}
                className="freelance-modal-grid"
              >
                <div>
                  <label style={fieldLabelStyle}>
                    {orderComposerListing.priceType === 'hourly'
                      ? 'Proposed hourly rate (BDT)'
                      : 'Proposed total (BDT)'}
                  </label>
                  <input
                    value={orderQuotedRate}
                    onChange={(event) => setOrderQuotedRate(event.target.value)}
                    inputMode="numeric"
                    placeholder={String(orderComposerListing.priceBDT)}
                    style={fieldInputStyle}
                  />
                </div>
                {orderComposerListing.priceType === 'hourly' ? (
                  <div>
                    <label style={fieldLabelStyle}>Estimated hours</label>
                    <input
                      value={orderQuotedHours}
                      onChange={(event) => setOrderQuotedHours(event.target.value)}
                      inputMode="numeric"
                      placeholder="4"
                      style={fieldInputStyle}
                    />
                  </div>
                ) : null}
                <div>
                  <label style={fieldLabelStyle}>Quoted total</label>
                  <div
                    style={{
                      ...fieldInputStyle,
                      display: 'flex',
                      alignItems: 'center',
                      fontWeight: 800,
                      color: C.text,
                      background: '#F8FAFC',
                    }}
                  >
                    {orderComposerQuote ? formatMoney(orderComposerQuote.totalBDT) : formatMoney(0)}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={fieldLabelStyle}>Negotiation note</label>
                <textarea
                  rows={3}
                  value={orderProposalNote}
                  onChange={(event) => setOrderProposalNote(event.target.value)}
                  placeholder="Optional: explain the budget, planned hours, or why you are requesting this quote."
                  style={{ ...fieldInputStyle, resize: 'vertical', minHeight: 92 }}
                />
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={fieldLabelStyle}>Requirement files</label>
              <div
                style={{
                  border: `1px dashed ${C.tealBorder}`,
                  borderRadius: 16,
                  background: C.tealBg,
                  padding: 16,
                }}
              >
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: '#FFFFFF',
                    border: `1px solid ${C.tealBorder}`,
                    color: C.teal,
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: requirementUploading ? 'not-allowed' : 'pointer',
                  }}
                >
                  <FileUp size={14} />
                  {requirementUploading ? 'Uploading files...' : 'Upload requirement files'}
                  <input
                    type="file"
                    multiple
                    hidden
                    onChange={async (event) => {
                      const input = event.currentTarget;
                      const files = Array.from(input.files ?? []);
                      if (!files.length) return;
                      input.value = '';
                      const uploaded = await uploadAssets('requirements', files);
                      setRequirementFiles((current) => [...current, ...uploaded].slice(0, 6));
                    }}
                  />
                </label>
                <p
                  style={{ margin: '10px 0 0', color: C.textMuted, fontSize: 12, lineHeight: 1.6 }}
                >
                  Attach briefs, wireframes, datasets, or reference documents so the freelancer has
                  everything needed before work starts.
                </p>
                <div style={{ marginTop: 14 }}>
                  <AssetList
                    assets={requirementFiles}
                    tone="teal"
                    removable
                    onRemove={(index) =>
                      setRequirementFiles((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index)
                      )
                    }
                  />
                </div>
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <div style={fieldLabelStyle}>Escrow payment method</div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: 12,
                }}
                className="freelance-method-grid"
              >
                {FREELANCE_PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() =>
                      setOrderPaymentMethod(method.id as 'bkash' | 'visa' | 'mastercard')
                    }
                    style={{
                      padding: '14px 10px',
                      borderRadius: 16,
                      border: `2px solid ${orderPaymentMethod === method.id ? C.blue : C.border}`,
                      background: orderPaymentMethod === method.id ? C.blueLight : '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                    }}
                  >
                    <PaymentMethodLogo method={method.id} height={28} />
                    <span
                      style={{
                        color: orderPaymentMethod === method.id ? C.blue : C.textMuted,
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {method.label}
                    </span>
                  </button>
                ))}
              </div>
              <p style={{ margin: '10px 0 0', color: C.textMuted, fontSize: 12 }}>
                Your payment choice is locked now, but escrow is funded only after the freelancer
                accepts the quote.
              </p>
            </div>

            <div
              style={{
                marginTop: 22,
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ color: C.textMuted, fontSize: 12, lineHeight: 1.7, maxWidth: 430 }}>
                Once the freelancer accepts, chat unlocks for the order and you can fund escrow from
                your client orders panel.
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setOrderComposerListing(null)}
                  style={ghostButtonStyle}
                >
                  Close
                </button>
                <button type="button" onClick={() => void submitOrder()} style={primaryButtonStyle}>
                  {submitting ? (
                    <>
                      <LoaderCircle className="freelance-spin" size={14} />
                      Sending request...
                    </>
                  ) : (
                    <>
                      <Wallet size={14} />
                      Send Quote Request
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : null}
      </ModalFrame>
      <ModalFrame
        open={orderModalOpen}
        width={860}
        onClose={() => {
          setOrderModalOpen(false);
          setSelectedOrder(null);
          setSelectedOrderPerspective(null);
          setSelectedOrderReviews([]);
        }}
        title={selectedOrder ? selectedOrder.listing.title : 'Order Workspace'}
        subtitle="Review requirements, delivery files, verified reviews, and escrow status in one place."
      >
        {orderDetailLoading || !selectedOrder ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '48px 0',
              color: C.textMuted,
            }}
          >
            <LoaderCircle className="freelance-spin" size={18} />
            Loading order workspace...
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: 12,
                marginBottom: 18,
              }}
              className="freelance-modal-grid"
            >
              <OrderMetric
                label="Order status"
                value={<StatusPill value={selectedOrder.status} />}
              />
              <OrderMetric
                label="Quote status"
                value={<StatusPill value={selectedOrder.proposalStatus} />}
              />
              <OrderMetric
                label="Escrow"
                value={<StatusPill value={selectedOrder.escrowStatus} />}
              />
              <OrderMetric
                label="Quote total"
                value={<span>{formatMoney(selectedOrder.agreedPriceBDT)}</span>}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 0.8fr',
                gap: 16,
              }}
              className="freelance-order-layout"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={orderBlockStyle}>
                  <div style={orderBlockHeaderStyle}>
                    <div>
                      <div style={orderBlockTitleStyle}>Requirements</div>
                      <div style={orderBlockCopyStyle}>
                        Buyer notes, scope, and reference files shared before the order started.
                      </div>
                    </div>
                  </div>
                  <p style={orderParagraphStyle}>{selectedOrder.requirements}</p>
                  <AssetList assets={selectedOrder.requirementsFiles} tone="neutral" />
                </div>

                <div style={orderBlockStyle}>
                  <div style={orderBlockHeaderStyle}>
                    <div>
                      <div style={orderBlockTitleStyle}>Delivery</div>
                      <div style={orderBlockCopyStyle}>
                        Final work, revision submissions, or the current delivery package.
                      </div>
                    </div>
                  </div>
                  {selectedOrder.deliveryNote ? (
                    <p style={orderParagraphStyle}>{selectedOrder.deliveryNote}</p>
                  ) : (
                    <div style={{ color: C.textLight, fontSize: 13 }}>
                      No delivery note uploaded yet.
                    </div>
                  )}
                  <AssetList assets={selectedOrder.deliveryFiles} tone="blue" />
                </div>

                <div style={orderBlockStyle}>
                  <div style={orderBlockHeaderStyle}>
                    <div>
                      <div style={orderBlockTitleStyle}>Verified Reviews</div>
                      <div style={orderBlockCopyStyle}>
                        Reviews are unlocked after escrow release and permanently linked to this
                        order.
                      </div>
                    </div>
                  </div>
                  {selectedOrderReviews.length ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {selectedOrderReviews.map((review) => (
                        <div
                          key={review._id}
                          style={{
                            padding: '14px 16px',
                            borderRadius: 16,
                            background: '#F8FAFC',
                            border: `1px solid ${C.border}`,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 10,
                              flexWrap: 'wrap',
                              marginBottom: 8,
                            }}
                          >
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>
                                {review.reviewer?.companyName ||
                                  review.reviewer?.name ||
                                  'Verified user'}
                              </div>
                              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>
                                {review.reviewType === 'client_to_student'
                                  ? 'Client to freelancer review'
                                  : 'Freelancer to client review'}
                              </div>
                            </div>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 10px',
                                borderRadius: 999,
                                background: C.amberBg,
                                border: `1px solid ${C.amberBorder}`,
                                color: '#D97706',
                                fontSize: 12,
                                fontWeight: 800,
                              }}
                            >
                              <Star size={14} fill="#F59E0B" />
                              {getReviewAverage(review).toFixed(1)}
                            </div>
                          </div>
                          {review.comment ? (
                            <p
                              style={{
                                margin: '0 0 8px',
                                color: C.textMuted,
                                fontSize: 13,
                                lineHeight: 1.7,
                              }}
                            >
                              {review.comment}
                            </p>
                          ) : null}
                          {review.recommendationText ? (
                            <div style={{ color: C.text, fontSize: 13, lineHeight: 1.7 }}>
                              <strong>Recommendation:</strong> {review.recommendationText}
                            </div>
                          ) : null}
                          <div style={{ fontSize: 11, color: C.textLight, marginTop: 8 }}>
                            Added {formatDate(review.createdAt, true)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: C.textLight, fontSize: 13 }}>
                      Verified reviews will appear here after both sides submit them.
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={orderBlockStyle}>
                  <div style={orderBlockTitleStyle}>Order Summary</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
                    <OrderSummaryRow
                      label="Freelancer"
                      value={selectedOrder.freelancer.name}
                      sublabel={
                        [selectedOrder.freelancer.university, selectedOrder.freelancer.department]
                          .filter(Boolean)
                          .join(' • ') || undefined
                      }
                    />
                    <OrderSummaryRow
                      label="Client"
                      value={selectedOrder.client.companyName || selectedOrder.client.name}
                    />
                    <OrderSummaryRow
                      label={selectedOrder.priceType === 'hourly' ? 'Agreed quote' : 'Quoted price'}
                      value={quoteLabel(selectedOrder)}
                      sublabel={
                        selectedOrder.priceType === 'hourly'
                          ? `Total ${formatMoney(selectedOrder.agreedPriceBDT)}`
                          : 'Freelancer can counter before acceptance'
                      }
                    />
                    <OrderSummaryRow label="Due date" value={formatDate(selectedOrder.dueDate)} />
                    <OrderSummaryRow
                      label="Payment method"
                      value={
                        selectedOrder.paymentMethod
                          ? formatStatus(selectedOrder.paymentMethod)
                          : 'Not set'
                      }
                    />
                    <OrderSummaryRow
                      label="Client total"
                      value={formatMoney(selectedOrder.agreedPriceBDT)}
                      sublabel="Amount funded into Nextern escrow"
                    />
                    <OrderSummaryRow
                      label="Platform fee"
                      value={formatMoney(selectedOrder.nexternCutBDT)}
                      sublabel={`${Math.round(FREELANCE_PLATFORM_FEE_RATE * 100)}% retained before freelancer payout`}
                    />
                    <OrderSummaryRow
                      label="Escrow payout"
                      value={formatMoney(selectedOrder.freelancerPayoutBDT)}
                      sublabel="Released after approval"
                    />
                    <OrderSummaryRow
                      label="Latest offer from"
                      value={formatStatus(selectedOrder.latestOfferBy)}
                    />
                    <OrderSummaryRow
                      label="Revision count"
                      value={String(selectedOrder.revisionCount)}
                    />
                    {selectedOrder.proposalNote ? (
                      <OrderSummaryRow
                        label="Quote note"
                        value={selectedOrder.proposalNote}
                        sublabel="Latest negotiation note"
                      />
                    ) : null}
                    {selectedOrder.adminNote ? (
                      <OrderSummaryRow
                        label="Nextern note"
                        value={selectedOrder.adminNote}
                        sublabel="Visible to both client and freelancer"
                      />
                    ) : null}
                  </div>
                  {selectedOrder.negotiationHistory.length ? (
                    <div style={{ marginTop: 18 }}>
                      <div style={{ ...orderBlockTitleStyle, fontSize: 14 }}>Quote history</div>
                      <div
                        style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}
                      >
                        {selectedOrder.negotiationHistory
                          .slice()
                          .reverse()
                          .map((entry, index) => (
                            <div
                              key={`${entry.createdAt ?? 'history'}-${index}`}
                              style={{
                                padding: '12px 14px',
                                borderRadius: 14,
                                background: '#F8FAFC',
                                border: `1px solid ${C.border}`,
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  gap: 10,
                                  flexWrap: 'wrap',
                                  marginBottom: 6,
                                }}
                              >
                                <span style={{ fontSize: 12, fontWeight: 800, color: C.text }}>
                                  {formatStatus(entry.by)} · {formatStatus(entry.action)}
                                </span>
                                <span style={{ fontSize: 11, color: C.textLight }}>
                                  {formatDate(entry.createdAt, true)}
                                </span>
                              </div>
                              <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.6 }}>
                                {selectedOrder.priceType === 'hourly'
                                  ? `${formatMoney(entry.rateBDT)}/hr x ${entry.hours ?? 1}h = ${formatMoney(entry.totalBDT)}`
                                  : formatMoney(entry.totalBDT)}
                              </div>
                              {entry.note ? (
                                <div
                                  style={{
                                    marginTop: 6,
                                    fontSize: 12,
                                    color: C.textMuted,
                                    lineHeight: 1.6,
                                  }}
                                >
                                  {entry.note}
                                </div>
                              ) : null}
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                {proposalWaitingFor(selectedOrder, selectedOrderPerspective) ? (
                  <div style={actionPanelStyle}>
                    <div style={orderBlockTitleStyle}>
                      {selectedOrder.latestOfferBy === 'client'
                        ? 'Review Client Quote Request'
                        : 'Review Freelancer Counter-Offer'}
                    </div>
                    <p style={orderBlockCopyStyle}>
                      Accept the current quote, send a counter, or decline the request. Escrow
                      payment unlocks only after acceptance.
                    </p>
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: 14,
                        background: '#F8FAFC',
                        border: `1px solid ${C.border}`,
                        fontSize: 13,
                        color: C.textMuted,
                      }}
                    >
                      Current quote:{' '}
                      <strong style={{ color: C.text }}>{quoteLabel(selectedOrder)}</strong>
                      {selectedOrder.priceType === 'hourly' ? (
                        <span style={{ color: C.textLight }}>
                          {' '}
                          · Total {formatMoney(selectedOrder.agreedPriceBDT)}
                        </span>
                      ) : null}
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          selectedOrder.priceType === 'hourly'
                            ? 'repeat(3, minmax(0, 1fr))'
                            : 'repeat(2, minmax(0, 1fr))',
                        gap: 10,
                      }}
                      className="freelance-modal-grid"
                    >
                      <div>
                        <label style={fieldLabelStyle}>
                          {selectedOrder.priceType === 'hourly'
                            ? 'Counter hourly rate'
                            : 'Counter total'}
                        </label>
                        <input
                          value={proposalResponseRate}
                          onChange={(event) => setProposalResponseRate(event.target.value)}
                          inputMode="numeric"
                          style={fieldInputStyle}
                        />
                      </div>
                      {selectedOrder.priceType === 'hourly' ? (
                        <div>
                          <label style={fieldLabelStyle}>Counter hours</label>
                          <input
                            value={proposalResponseHours}
                            onChange={(event) => setProposalResponseHours(event.target.value)}
                            inputMode="numeric"
                            style={fieldInputStyle}
                          />
                        </div>
                      ) : null}
                      <div>
                        <label style={fieldLabelStyle}>Counter total</label>
                        <div
                          style={{
                            ...fieldInputStyle,
                            display: 'flex',
                            alignItems: 'center',
                            fontWeight: 800,
                            background: '#F8FAFC',
                            color: C.text,
                          }}
                        >
                          {selectedOrderCounterQuote
                            ? formatMoney(selectedOrderCounterQuote.totalBDT)
                            : formatMoney(selectedOrder.agreedPriceBDT)}
                        </div>
                      </div>
                    </div>
                    <textarea
                      rows={3}
                      value={proposalResponseNote}
                      onChange={(event) => setProposalResponseNote(event.target.value)}
                      placeholder="Optional: explain your acceptance, counter, or reason for declining."
                      style={{ ...fieldInputStyle, resize: 'vertical', minHeight: 96 }}
                    />
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => void submitOrderAction('accept_proposal')}
                        style={primaryButtonStyle}
                      >
                        <CheckCircle2 size={14} />
                        Accept Quote
                      </button>
                      <button
                        type="button"
                        onClick={() => void submitOrderAction('counter_proposal')}
                        style={ghostButtonStyle}
                      >
                        <RefreshCw size={14} />
                        Send Counter
                      </button>
                      <button
                        type="button"
                        onClick={() => void submitOrderAction('reject_proposal')}
                        style={dangerButtonStyle}
                      >
                        <X size={14} />
                        Reject
                      </button>
                    </div>
                  </div>
                ) : null}

                {['requested', 'countered'].includes(selectedOrder.proposalStatus) &&
                !proposalWaitingFor(selectedOrder, selectedOrderPerspective) ? (
                  <div style={actionPanelStyle}>
                    <div style={orderBlockTitleStyle}>Waiting on the other party</div>
                    <p style={orderBlockCopyStyle}>
                      Your latest quote is pending a response. Once it is accepted, the order chat
                      unlocks and the client can fund escrow.
                    </p>
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: 14,
                        background: '#F8FAFC',
                        border: `1px solid ${C.border}`,
                        fontSize: 13,
                        color: C.textMuted,
                      }}
                    >
                      Latest quote:{' '}
                      <strong style={{ color: C.text }}>{quoteLabel(selectedOrder)}</strong>
                    </div>
                    {selectedOrderPerspective === 'client' ? (
                      <button
                        type="button"
                        onClick={() => void submitOrderAction('cancel')}
                        style={dangerButtonStyle}
                      >
                        <X size={14} />
                        Withdraw Request
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {selectedOrder.proposalStatus === 'accepted' ? (
                  <div style={actionPanelStyle}>
                    <div style={orderBlockTitleStyle}>Freelance Chat</div>
                    <p style={orderBlockCopyStyle}>
                      Use the dedicated order chat for scope clarification, file follow-ups, and
                      delivery coordination until the order is closed.
                    </p>
                    <button
                      type="button"
                      onClick={() => openFreelanceChat(selectedOrder._id)}
                      style={ghostButtonStyle}
                    >
                      <ArrowRight size={14} />
                      Open Order Chat
                    </button>
                  </div>
                ) : null}

                {selectedOrderPerspective === 'client' &&
                selectedOrder.proposalStatus === 'accepted' &&
                selectedOrder.status === 'pending' &&
                selectedOrder.escrowStatus === 'pending_payment' ? (
                  <div style={actionPanelStyle}>
                    <div style={orderBlockTitleStyle}>Fund Escrow</div>
                    <p style={orderBlockCopyStyle}>
                      The quote is accepted. Pay now so the freelancer can begin and the money moves
                      into Nextern escrow.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <button
                        type="button"
                        onClick={() =>
                          selectedOrder.paymentMethod === 'bkash'
                            ? void startBkashPayment(selectedOrder._id)
                            : void startCardPayment(selectedOrder)
                        }
                        style={primaryButtonStyle}
                      >
                        <Wallet size={14} />
                        Pay Now
                      </button>
                      <button
                        type="button"
                        onClick={() => void submitOrderAction('cancel')}
                        style={dangerButtonStyle}
                      >
                        <X size={14} />
                        Cancel Unpaid Order
                      </button>
                    </div>
                  </div>
                ) : null}

                {(selectedOrder.status === 'in_progress' ||
                  selectedOrder.status === 'revision_requested') &&
                selectedOrderPerspective === 'freelancer' ? (
                  <div style={actionPanelStyle}>
                    <div style={orderBlockTitleStyle}>Submit Delivery</div>
                    <p style={orderBlockCopyStyle}>
                      Upload the finished work package. The client will review it before approving
                      escrow release.
                    </p>
                    <textarea
                      rows={4}
                      value={deliveryNote}
                      onChange={(event) => setDeliveryNote(event.target.value)}
                      placeholder="Summarize what you delivered, mention included files, and explain any implementation notes."
                      style={{ ...fieldInputStyle, resize: 'vertical', minHeight: 110 }}
                    />
                    <label style={uploadButtonStyle}>
                      <Upload size={14} />
                      {deliveryUploading ? 'Uploading files...' : 'Upload delivery files'}
                      <input
                        type="file"
                        multiple
                        hidden
                        onChange={async (event) => {
                          const input = event.currentTarget;
                          const files = Array.from(input.files ?? []);
                          if (!files.length) return;
                          input.value = '';
                          const uploaded = await uploadAssets('delivery', files);
                          setDeliveryFiles((current) => [...current, ...uploaded].slice(0, 8));
                        }}
                      />
                    </label>
                    <AssetList
                      assets={deliveryFiles}
                      tone="blue"
                      removable
                      onRemove={(index) =>
                        setDeliveryFiles((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index)
                        )
                      }
                    />
                    <button
                      type="button"
                      onClick={() => void submitOrderAction('deliver')}
                      style={primaryButtonStyle}
                    >
                      <CheckCircle2 size={14} />
                      Submit Delivery
                    </button>
                  </div>
                ) : null}

                {selectedOrderPerspective === 'client' && selectedOrder.status === 'delivered' ? (
                  <div style={actionPanelStyle}>
                    <div style={orderBlockTitleStyle}>Client Review Decision</div>
                    <p style={orderBlockCopyStyle}>
                      Review the delivery and either request a revision or confirm completion to
                      release the escrow payout.
                    </p>
                    <textarea
                      rows={3}
                      value={revisionNote}
                      onChange={(event) => setRevisionNote(event.target.value)}
                      placeholder="Optional note for revision requests or final approval context."
                      style={{ ...fieldInputStyle, resize: 'vertical', minHeight: 96 }}
                    />
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => void submitOrderAction('request_revision')}
                        style={ghostButtonStyle}
                      >
                        <RefreshCw size={14} />
                        Request Revision
                      </button>
                      <button
                        type="button"
                        onClick={() => void submitOrderAction('confirm_completion')}
                        style={primaryButtonStyle}
                      >
                        <ShieldCheck size={14} />
                        Confirm Completion
                      </button>
                    </div>
                  </div>
                ) : null}

                {selectedOrder.escrowStatus === 'held' &&
                ['in_progress', 'revision_requested', 'delivered'].includes(
                  selectedOrder.status
                ) ? (
                  <div style={actionPanelStyle}>
                    <div style={orderBlockTitleStyle}>Escrow Dispute</div>
                    <p style={orderBlockCopyStyle}>
                      Open a dispute only when there is a serious delivery or scope conflict.
                      Nextern can review the payment hold, files, and notes.
                    </p>
                    <textarea
                      rows={3}
                      value={disputeNote}
                      onChange={(event) => setDisputeNote(event.target.value)}
                      placeholder="Explain the dispute clearly so Nextern has enough context."
                      style={{ ...fieldInputStyle, resize: 'vertical', minHeight: 96 }}
                    />
                    <button
                      type="button"
                      onClick={() => void submitOrderAction('mark_disputed')}
                      style={dangerButtonStyle}
                    >
                      <AlertCircle size={14} />
                      Mark as Disputed
                    </button>
                  </div>
                ) : null}

                {selectedOrderPerspective === 'client' &&
                selectedOrder.status === 'completed' &&
                selectedOrder.escrowStatus === 'released' &&
                !selectedOrder.clientReviewSubmitted ? (
                  <div style={actionPanelStyle}>
                    <div style={orderBlockTitleStyle}>Leave Client-to-Freelancer Review</div>
                    <ReviewComposer
                      kind="client_to_student"
                      draft={clientReviewDraft}
                      setDraft={setClientReviewDraft}
                      onSubmit={() => void submitReview('client_to_student')}
                      submitting={submitting}
                    />
                  </div>
                ) : null}

                {selectedOrderPerspective === 'freelancer' &&
                selectedOrder.status === 'completed' &&
                selectedOrder.escrowStatus === 'released' &&
                !selectedOrder.freelancerReviewSubmitted ? (
                  <div style={actionPanelStyle}>
                    <div style={orderBlockTitleStyle}>Leave Freelancer-to-Client Review</div>
                    <ReviewComposer
                      kind="student_to_client"
                      draft={freelancerReviewDraft}
                      setDraft={setFreelancerReviewDraft}
                      onSubmit={() => void submitReview('student_to_client')}
                      submitting={submitting}
                    />
                  </div>
                ) : null}

                {selectedOrder.status === 'completed' &&
                selectedOrder.escrowStatus === 'released' &&
                selectedOrder.clientReviewSubmitted &&
                (selectedOrderPerspective !== 'freelancer' ||
                  selectedOrder.freelancerReviewSubmitted) ? (
                  <div style={actionPanelStyle}>
                    <div style={orderBlockTitleStyle}>Verified Completion Locked</div>
                    <p style={orderBlockCopyStyle}>
                      This order is fully completed. The delivery is recorded in verified work
                      history, and the student portfolio sample has already been synced.
                    </p>
                    {role === 'student' ? (
                      <Link
                        href="/student/resume"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          color: C.blue,
                          textDecoration: 'none',
                          fontSize: 13,
                          fontWeight: 800,
                        }}
                      >
                        Open Portfolio Builder
                        <ArrowRight size={14} />
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </>
        )}
      </ModalFrame>
      <ModalFrame
        open={Boolean(selectedInvoice)}
        width={820}
        onClose={() => setSelectedInvoice(null)}
        title={selectedInvoice ? `Invoice ${selectedInvoice.invoiceNumber}` : 'Invoice'}
        subtitle={
          selectedInvoice?.perspective === 'freelancer'
            ? 'Professional invoice record for freelance delivery, escrow release, and net payout breakdown.'
            : 'Professional invoice record for freelance scope, escrow handling, and client payment confirmation.'
        }
      >
        {selectedInvoice ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div
              style={{
                borderRadius: 22,
                border: `1px solid ${C.border}`,
                background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                padding: 22,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 10px',
                      borderRadius: 999,
                      background: C.blueLight,
                      border: `1px solid ${C.blueBorder}`,
                      color: C.blue,
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                    }}
                  >
                    <ReceiptText size={13} />
                    Verified freelance invoice
                  </div>
                  <h3
                    style={{
                      margin: '12px 0 0',
                      fontSize: 24,
                      fontWeight: 900,
                      color: C.text,
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {selectedInvoice.listingTitle}
                  </h3>
                  <p
                    style={{ margin: '8px 0 0', color: C.textMuted, fontSize: 13, lineHeight: 1.7 }}
                  >
                    {selectedInvoice.counterpartyRole}: {selectedInvoice.counterpartyName}
                  </p>
                </div>
                <div style={{ display: 'grid', gap: 10, justifyItems: 'end' }}>
                  <StatusPill value={selectedInvoice.status} />
                  <div
                    style={{
                      fontSize: 28,
                      color: C.text,
                      fontWeight: 900,
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {formatMoney(selectedInvoice.clientTotalBDT)}
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>Invoice total</div>
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: 12,
              }}
              className="freelance-modal-grid"
            >
              <OrderMetric label="Invoice no." value={selectedInvoice.invoiceNumber} />
              <OrderMetric label="Issued" value={formatDate(selectedInvoice.issuedAt)} />
              <OrderMetric
                label="Payment method"
                value={
                  selectedInvoice.paymentMethod
                    ? formatStatus(selectedInvoice.paymentMethod)
                    : 'Pending'
                }
              />
              <OrderMetric
                label="Escrow"
                value={<StatusPill value={selectedInvoice.escrowStatus} />}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.1fr 0.9fr',
                gap: 16,
              }}
              className="freelance-modal-grid"
            >
              <div style={orderBlockStyle}>
                <div style={orderBlockHeaderStyle}>
                  <div>
                    <div style={orderBlockTitleStyle}>Invoice breakdown</div>
                    <div style={orderBlockCopyStyle}>
                      {selectedInvoice.perspective === 'freelancer'
                        ? 'Pricing structure, platform fee deduction, and payout logic stored against this freelance order.'
                        : 'Pricing structure and escrow-covered client payment stored against this freelance order.'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gap: 12 }}>
                  {selectedInvoice.lineItems.map((line) => (
                    <div
                      key={line.label}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        paddingBottom: 12,
                        borderBottom: `1px solid ${C.border}`,
                      }}
                    >
                      <div style={{ fontSize: 13, color: C.text }}>{line.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>
                        {formatMoney(line.amountBDT)}
                      </div>
                    </div>
                  ))}
                  {selectedInvoice.perspective === 'freelancer' &&
                  selectedInvoice.platformFeeRate !== null &&
                  selectedInvoice.platformFeeBDT !== null ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <div style={{ fontSize: 13, color: C.textMuted }}>
                        Nextern platform fee ({Math.round(selectedInvoice.platformFeeRate * 100)}%)
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#B45309' }}>
                        {formatMoney(selectedInvoice.platformFeeBDT)}
                      </div>
                    </div>
                  ) : null}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      paddingTop: 14,
                      borderTop: `1px solid ${C.border}`,
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>
                      {selectedInvoice.perspective === 'freelancer'
                        ? 'Client total'
                        : 'Escrow amount'}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: C.text }}>
                      {formatMoney(selectedInvoice.clientTotalBDT)}
                    </div>
                  </div>
                  {selectedInvoice.perspective === 'freelancer' &&
                  selectedInvoice.freelancerNetBDT !== null ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>
                        Freelancer net
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: C.teal }}>
                        {formatMoney(selectedInvoice.freelancerNetBDT)}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div style={orderBlockStyle}>
                <div style={orderBlockHeaderStyle}>
                  <div>
                    <div style={orderBlockTitleStyle}>Order timeline</div>
                    <div style={orderBlockCopyStyle}>
                      Key moments tied to this invoice and escrow record.
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gap: 14 }}>
                  <OrderSummaryRow
                    label="Due date"
                    value={formatDate(selectedInvoice.dueDate)}
                    sublabel="Original delivery promise from the service package"
                  />
                  <OrderSummaryRow
                    label="Delivered"
                    value={formatDate(selectedInvoice.deliveredAt)}
                    sublabel="When the latest delivery package was submitted"
                  />
                  <OrderSummaryRow
                    label="Completed"
                    value={formatDate(selectedInvoice.completedAt)}
                    sublabel="Client confirmation timestamp"
                  />
                  <OrderSummaryRow
                    label="Released"
                    value={formatDate(selectedInvoice.releasedAt)}
                    sublabel="When payout moved out of escrow"
                  />
                </div>
              </div>
            </div>

            <div style={actionPanelStyle}>
              <div style={orderBlockTitleStyle}>Invoice note</div>
              <p style={{ ...orderBlockCopyStyle, marginTop: 8 }}>{selectedInvoice.notes}</p>
            </div>
          </div>
        ) : null}
      </ModalFrame>
      <FreelanceStripeCheckoutModal
        open={Boolean(pendingCardCheckout)}
        role={role}
        orderId={pendingCardCheckout?.orderId ?? ''}
        title={pendingCardCheckout?.title ?? 'Freelance escrow'}
        amount={pendingCardCheckout?.amount ?? 0}
        method={pendingCardCheckout?.method ?? 'visa'}
        onClose={() => setPendingCardCheckout(null)}
      />

      <style>{`
          .freelance-spin {
            animation: freelance-spin 0.9s linear infinite;
          }

          @keyframes freelance-spin {
            to {
              transform: rotate(360deg);
            }
          }

          @media (max-width: 1100px) {
            .freelance-order-layout {
              grid-template-columns: 1fr !important;
            }

            .freelance-card-grid,
            .freelance-info-grid {
              grid-template-columns: 1fr 1fr !important;
            }
          }

          @media (max-width: 860px) {
            .freelance-card-grid,
            .freelance-info-grid,
            .freelance-filter-grid,
            .freelance-modal-grid,
            .freelance-method-grid,
            .freelance-service-row {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
    </div>
  );
}

function RatingRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            style={{
              width: 30,
              height: 30,
              borderRadius: 999,
              border: `1px solid ${score <= value ? C.amberBorder : C.border}`,
              background: score <= value ? C.amberBg : '#FFFFFF',
              color: score <= value ? '#D97706' : C.textLight,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Star size={14} fill={score <= value ? '#F59E0B' : 'none'} />
          </button>
        ))}
      </div>
    </div>
  );
}

function ModalFrame({
  open,
  width = 760,
  title,
  subtitle,
  onClose,
  children,
}: {
  open: boolean;
  width?: number;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2100,
        background: 'rgba(15,23,42,0.64)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: width,
          maxHeight: '88vh',
          overflow: 'auto',
          background: '#FFFFFF',
          borderRadius: 28,
          border: `1px solid ${C.border}`,
          boxShadow: '0 32px 90px rgba(15,23,42,0.22)',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 900,
                color: C.text,
                fontFamily: 'var(--font-display)',
              }}
            >
              {title}
            </h3>
            {subtitle ? (
              <p style={{ margin: '6px 0 0', color: C.textMuted, fontSize: 13 }}>{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              background: '#FFFFFF',
              color: C.textMuted,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

function OrderCard({
  order,
  role,
  mode,
  onOpen,
  onPayNow,
}: {
  order: OrderSummary;
  role: WorkspaceRole;
  mode: 'client' | 'freelancer';
  onOpen: () => void;
  onPayNow?: () => void;
}) {
  return (
    <article
      style={{
        background: '#FFFFFF',
        borderRadius: 20,
        border: `1px solid ${C.border}`,
        padding: '18px 20px',
        boxShadow: '0 10px 24px rgba(15,23,42,0.05)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          gap: 16,
          alignItems: 'start',
        }}
        className="freelance-service-row"
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h3
              style={{
                margin: 0,
                fontSize: 18,
                color: C.text,
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
              }}
            >
              {order.listing.title}
            </h3>
            <StatusPill value={order.proposalStatus} />
            <StatusPill value={order.status} />
            <StatusPill value={order.escrowStatus} />
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8 }}>
            <span style={{ fontSize: 13, color: C.textMuted, fontWeight: 600 }}>
              {quoteLabel(order)}
            </span>
            <span style={{ fontSize: 13, color: C.textMuted }}>
              Total {formatMoney(order.agreedPriceBDT)}
            </span>
            <span style={{ fontSize: 13, color: C.textMuted }}>
              Due {formatDate(order.dueDate)}
            </span>
            <span style={{ fontSize: 13, color: C.textMuted }}>
              {mode === 'client'
                ? `Freelancer: ${order.freelancer.name}`
                : `Client: ${order.client.companyName || order.client.name}`}
            </span>
          </div>
          <p style={{ margin: '10px 0 0', color: C.textMuted, fontSize: 13, lineHeight: 1.7 }}>
            {order.requirements}
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
            {order.paymentMethod ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '6px 10px',
                  borderRadius: 999,
                  background: '#F8FAFC',
                  border: `1px solid ${C.border}`,
                  color: C.textMuted,
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                <PaymentMethodLogo method={order.paymentMethod} height={18} />
                {formatStatus(order.paymentMethod)}
              </span>
            ) : null}
            {order.revisionCount > 0 ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 10px',
                  borderRadius: 999,
                  background: C.amberBg,
                  border: `1px solid ${C.amberBorder}`,
                  color: '#B45309',
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                <RefreshCw size={12} />
                {order.revisionCount} revision{order.revisionCount > 1 ? 's' : ''}
              </span>
            ) : null}
            {role === 'student' && mode === 'freelancer' && order.status === 'completed' ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 10px',
                  borderRadius: 999,
                  background: C.greenBg,
                  border: `1px solid ${C.greenBorder}`,
                  color: '#047857',
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                <BadgeCheck size={12} />
                Portfolio synced
              </span>
            ) : null}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {order.proposalStatus === 'accepted' &&
          order.status === 'pending' &&
          order.escrowStatus === 'pending_payment' &&
          onPayNow ? (
            <button type="button" onClick={onPayNow} style={primaryButtonStyle}>
              <Wallet size={14} />
              Pay Now
            </button>
          ) : null}
          <button type="button" onClick={onOpen} style={ghostButtonStyle}>
            Open Workspace
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

function ReviewComposer({
  kind,
  draft,
  setDraft,
  onSubmit,
  submitting,
}: {
  kind: 'client_to_student' | 'student_to_client';
  draft: ReviewDraftState;
  setDraft: Dispatch<SetStateAction<ReviewDraftState>>;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
      {kind === 'client_to_student' ? (
        <>
          <RatingRow
            label="Professionalism"
            value={draft.professionalismRating}
            onChange={(value) =>
              setDraft((current) => ({ ...current, professionalismRating: value }))
            }
          />
          <RatingRow
            label="Punctuality"
            value={draft.punctualityRating}
            onChange={(value) => setDraft((current) => ({ ...current, punctualityRating: value }))}
          />
          <RatingRow
            label="Skill performance"
            value={draft.skillPerformanceRating}
            onChange={(value) =>
              setDraft((current) => ({ ...current, skillPerformanceRating: value }))
            }
          />
          <RatingRow
            label="Work quality"
            value={draft.workQualityRating}
            onChange={(value) => setDraft((current) => ({ ...current, workQualityRating: value }))}
          />
        </>
      ) : (
        <>
          <RatingRow
            label="Overall experience"
            value={draft.overallRating}
            onChange={(value) => setDraft((current) => ({ ...current, overallRating: value }))}
          />
          <RatingRow
            label="Communication"
            value={draft.communicationRating}
            onChange={(value) =>
              setDraft((current) => ({ ...current, communicationRating: value }))
            }
          />
          <RatingRow
            label="Requirements clarity"
            value={draft.requirementsClarityRating}
            onChange={(value) =>
              setDraft((current) => ({ ...current, requirementsClarityRating: value }))
            }
          />
          <RatingRow
            label="Payment promptness"
            value={draft.paymentPromptnessRating}
            onChange={(value) =>
              setDraft((current) => ({ ...current, paymentPromptnessRating: value }))
            }
          />
        </>
      )}

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 13,
          fontWeight: 700,
          color: C.text,
        }}
      >
        <input
          type="checkbox"
          checked={draft.isRecommended}
          onChange={(event) =>
            setDraft((current) => ({ ...current, isRecommended: event.target.checked }))
          }
        />
        I recommend this {kind === 'client_to_student' ? 'freelancer' : 'client'}
      </label>

      <textarea
        rows={3}
        value={draft.comment}
        onChange={(event) => setDraft((current) => ({ ...current, comment: event.target.value }))}
        placeholder="Share the verified experience, strengths, and any delivery highlights."
        style={{ ...fieldInputStyle, resize: 'vertical', minHeight: 96 }}
      />
      <textarea
        rows={3}
        value={draft.recommendationText}
        onChange={(event) =>
          setDraft((current) => ({ ...current, recommendationText: event.target.value }))
        }
        placeholder="Optional recommendation note that becomes part of the verified work history."
        style={{ ...fieldInputStyle, resize: 'vertical', minHeight: 96 }}
      />
      <button type="button" onClick={onSubmit} style={primaryButtonStyle} disabled={submitting}>
        {submitting ? (
          <>
            <LoaderCircle className="freelance-spin" size={14} />
            Submitting...
          </>
        ) : (
          <>
            <Star size={14} />
            Submit Verified Review
          </>
        )}
      </button>
    </div>
  );
}

function OrderMetric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 16,
        background: '#F8FAFC',
        border: `1px solid ${C.border}`,
      }}
    >
      <div
        style={{ fontSize: 11, color: C.textLight, fontWeight: 800, textTransform: 'uppercase' }}
      >
        {label}
      </div>
      <div style={{ marginTop: 8, color: C.text, fontSize: 13, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function OrderSummaryRow({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <div>
      <div
        style={{ fontSize: 11, color: C.textLight, fontWeight: 800, textTransform: 'uppercase' }}
      >
        {label}
      </div>
      <div style={{ marginTop: 5, color: C.text, fontSize: 13, fontWeight: 700 }}>{value}</div>
      {sublabel ? (
        <div style={{ marginTop: 3, color: C.textMuted, fontSize: 12 }}>{sublabel}</div>
      ) : null}
    </div>
  );
}

const fieldLabelStyle: CSSProperties = {
  display: 'block',
  marginBottom: 8,
  color: C.text,
  fontSize: 13,
  fontWeight: 800,
};

const fieldInputStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 14,
  border: `1px solid ${C.border}`,
  fontSize: 13,
  color: C.text,
  fontFamily: 'var(--font-body)',
  background: '#FFFFFF',
};

const primaryButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '11px 16px',
  borderRadius: 12,
  border: 'none',
  background: C.blue,
  color: '#FFFFFF',
  fontSize: 13,
  fontWeight: 800,
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
};

const ghostButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '11px 16px',
  borderRadius: 12,
  border: `1px solid ${C.border}`,
  background: '#FFFFFF',
  color: C.text,
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
};

const dangerButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '11px 16px',
  borderRadius: 12,
  border: `1px solid ${C.dangerBorder}`,
  background: C.dangerBg,
  color: C.danger,
  fontSize: 13,
  fontWeight: 800,
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
};

const uploadButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 14px',
  borderRadius: 12,
  background: '#FFFFFF',
  border: `1px solid ${C.blueBorder}`,
  color: C.blue,
  fontSize: 13,
  fontWeight: 800,
  cursor: 'pointer',
};

const summaryLabelStyle: CSSProperties = {
  fontSize: 11,
  color: C.textLight,
  fontWeight: 800,
  textTransform: 'uppercase',
};

const summaryValueStyle: CSSProperties = {
  fontSize: 15,
  color: C.text,
  fontWeight: 800,
  marginTop: 6,
};

const orderBlockStyle: CSSProperties = {
  padding: '18px 20px',
  borderRadius: 20,
  background: '#FFFFFF',
  border: `1px solid ${C.border}`,
  boxShadow: '0 8px 18px rgba(15,23,42,0.04)',
};

const actionPanelStyle: CSSProperties = {
  padding: '18px 20px',
  borderRadius: 20,
  background: '#F8FAFC',
  border: `1px solid ${C.border}`,
};

const orderBlockHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 12,
};

const orderBlockTitleStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 800,
  color: C.text,
  fontFamily: 'var(--font-display)',
};

const orderBlockCopyStyle: CSSProperties = {
  fontSize: 12,
  color: C.textMuted,
  lineHeight: 1.65,
  marginTop: 6,
};

const orderParagraphStyle: CSSProperties = {
  margin: '0 0 12px',
  color: C.textMuted,
  fontSize: 13,
  lineHeight: 1.75,
};
