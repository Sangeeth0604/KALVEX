export interface PricingPlan {
  id: "free" | "plus" | "pro" | "team";
  name: string;
  price: string;
  period: string;
  badge: string;
  badgeVariant?: "accent" | "popular" | "muted";
  description: string;
  features: string[];
  ctaText: string;
  isCurrent?: boolean;
  isPopular?: boolean;
  isComingSoon?: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    badge: "CURRENT PLAN",
    badgeVariant: "accent",
    description: "For individuals who need private document processing without uploading files to a server.",
    features: [
      "All 12 core document tools",
      "Client-side in-browser processing",
      "Zero server file retention",
      "Offline WASM OCR",
      "Tabular parsing",
      "Document history",
      "Custom workflows",
      "AI Workspace access when configured",
    ],
    ctaText: "Start Using KALVEX",
    isCurrent: true,
  },
  {
    id: "plus",
    name: "Plus",
    price: "$5",
    period: "month",
    badge: "MOST POPULAR",
    badgeVariant: "popular",
    description: "For individuals who need higher limits and more powerful document workflows.",
    features: [
      "Everything in Free",
      "Higher file-size limits",
      "Advanced workflow execution",
      "Extended document history",
      "Priority workflow processing",
      "Advanced AI Workspace features",
      "Enhanced saved workflows",
      "Additional export options",
    ],
    ctaText: "Coming Soon",
    isPopular: true,
    isComingSoon: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$15",
    period: "month",
    badge: "COMING SOON",
    badgeVariant: "muted",
    description: "For developers and professionals who process documents regularly.",
    features: [
      "Everything in Plus",
      "Large-file processing",
      "Advanced automated pipelines",
      "Batch document processing",
      "Advanced AI document reasoning",
      "Extended workflow automation",
      "Advanced privacy controls",
      "Priority support",
    ],
    ctaText: "Coming Soon",
    isComingSoon: true,
  },
  {
    id: "team",
    name: "Team",
    price: "$25",
    period: "month",
    badge: "COMING SOON",
    badgeVariant: "muted",
    description: "For teams that need shared document workflows and collaborative automation.",
    features: [
      "Everything in Pro",
      "Shared team workflows",
      "Team workflow templates",
      "Collaborative workspace",
      "Batch processing",
      "Team-level usage controls",
      "Advanced privacy/compliance features",
      "Priority team support",
    ],
    ctaText: "Coming Soon",
    isComingSoon: true,
  },
];

export interface ComparisonFeatureRow {
  name: string;
  free: boolean;
  plus: boolean;
  pro: boolean;
  team: boolean;
}

export const COMPARISON_FEATURES: ComparisonFeatureRow[] = [
  { name: "Client-side processing", free: true, plus: true, pro: true, team: true },
  { name: "All 12 core tools", free: true, plus: true, pro: true, team: true },
  { name: "WASM OCR", free: true, plus: true, pro: true, team: true },
  { name: "Document history", free: true, plus: true, pro: true, team: true },
  { name: "Custom workflows", free: true, plus: true, pro: true, team: true },
  { name: "AI Workspace", free: true, plus: true, pro: true, team: true },
  { name: "Advanced AI reasoning", free: false, plus: true, pro: true, team: true },
  { name: "Higher file-size limits", free: false, plus: true, pro: true, team: true },
  { name: "Large-file processing", free: false, plus: false, pro: true, team: true },
  { name: "Batch processing", free: false, plus: false, pro: true, team: true },
  { name: "Advanced workflows", free: false, plus: true, pro: true, team: true },
  { name: "Additional exports", free: false, plus: true, pro: true, team: true },
  { name: "Shared workflows", free: false, plus: false, pro: false, team: true },
  { name: "Team workspace", free: false, plus: false, pro: false, team: true },
  { name: "Usage controls", free: false, plus: false, pro: false, team: true },
  { name: "Priority support", free: false, plus: false, pro: true, team: true },
];
