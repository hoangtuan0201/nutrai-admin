export type Role = 'USER' | 'ADMIN';
export type UserPlan = 'FREE' | 'PRO';
export type AuthProvider = 'EMAIL' | 'GOOGLE';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type ActivityLevel =
  | 'SEDENTARY'
  | 'LIGHT'
  | 'MODERATE'
  | 'VERY_ACTIVE'
  | 'EXTRA_ACTIVE';
export type FitnessGoal = 'WEIGHT_LOSS' | 'MAINTENANCE' | 'MUSCLE_GAIN';
export type PaymentMethod =
  | 'GOOGLE_PLAY'
  | 'APPLE_PAY'
  | 'VNPAY'
  | 'MOMO'
  | 'BANK_TRANSFER'
  | 'SEPAY';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'EXPIRED';
export type PaymentEventStatus = 'PROCESSED' | 'IGNORED' | 'FAILED';
export type BroadcastAudience = 'ALL' | 'FREE' | 'INACTIVE_3D';
export type NotificationType =
  | 'MEAL_REMINDER'
  | 'GOAL_ALERT'
  | 'AI_RECOMMENDATION'
  | 'SUBSCRIPTION'
  | 'SYSTEM';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface AdminAuthUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  avatarUrl?: string | null;
}

export interface LoginResponse {
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  isNewUser: boolean;
  user: AdminAuthUser;
}

export interface RevenueByMethod {
  method: PaymentMethod;
  amount: number;
  transactions: number;
}

export interface DashboardOverview {
  users: {
    total: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
    proUsers: number;
    freeUsers: number;
  };
  revenue: {
    currency: string;
    mrr: number;
    arr: number;
    collectedThisMonth: { total: number; byMethod: RevenueByMethod[] };
    collectedAllTime: { total: number; byMethod: RevenueByMethod[] };
  };
  generatedAt: string;
}

export interface AdminUserListItem {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: Role;
  authProvider: AuthProvider;
  isActive: boolean;
  createdAt: string;
  plan: UserPlan;
  proPlanName: string | null;
  proExpiresAt: string | null;
}

export interface AdminUserDetail extends Omit<AdminUserListItem, 'proPlanName' | 'proExpiresAt'> {
  emailVerified: boolean;
  health: {
    gender: Gender | null;
    age: number | null;
    heightCm: number | null;
    currentWeightKg: number | null;
    targetWeightKg: number | null;
    activityLevel: ActivityLevel | null;
    fitnessGoal: FitnessGoal | null;
    bmr: number | null;
    tdee: number | null;
    timezone: string;
  } | null;
  nutritionTarget: {
    dailyCalories: number;
    dailyProtein: number;
    dailyCarbs: number;
    dailyFat: number;
    effectiveFrom: string;
  } | null;
  subscriptions: Array<{
    id: string;
    status: string;
    startsAt: string;
    expiresAt: string;
    plan: {
      name: string;
      price: number;
      billingPeriod: string;
    };
  }>;
  _count: {
    meals: number;
    payments: number;
  };
}

export interface FoodItem {
  id: string;
  name: string;
  description: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  servingUnit: string;
  defaultServingSize: number;
  imageUrl: string | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPaymentItem {
  id: string;
  userId: string | null;
  user: { id: string; email: string; name: string | null } | null;
  plan: { id: string; name: string; billingPeriod: string } | null;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionId: string;
  paymentCode: string | null;
  providerTxId: string | null;
  expiresAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface AdminPaymentDetail extends AdminPaymentItem {
  receiptData: string | null;
  subscription: {
    id: string;
    status: string;
    startsAt: string;
    expiresAt: string;
  } | null;
  events: Array<{
    id: string;
    provider: string;
    eventId: string;
    eventType: string;
    status: PaymentEventStatus;
    errorMessage: string | null;
    payload: Record<string, unknown>;
    processedAt: string;
    createdAt: string;
  }>;
}

export interface PaymentEventItem {
  id: string;
  paymentId: string | null;
  payment: {
    id: string;
    paymentCode: string | null;
    status: PaymentStatus;
    amount: number;
    userId: string | null;
  } | null;
  provider: string;
  eventId: string;
  eventType: string;
  status: PaymentEventStatus;
  errorMessage: string | null;
  payload: Record<string, unknown>;
  processedAt: string;
  createdAt: string;
}

export interface DeviceTokenStats {
  totalActiveTokens: number;
  androidTokens: number;
  iosTokens: number;
  usersWithActivePush: number;
}

export interface BroadcastResult {
  broadcastId: string;
  audience: BroadcastAudience;
  title: string;
  body: string;
  totalRecipients: number;
  activeTokensTargeted: number;
  pushSuccessCount: number;
  pushFailureCount: number;
  successRate: number;
  sentAt: string;
}

export interface BroadcastHistoryRow {
  broadcastId: string;
  title: string;
  body: string;
  type: NotificationType;
  audience: BroadcastAudience;
  totalRecipients: number;
  activeTokensTargeted: number;
  pushSuccessCount: number;
  pushFailureCount: number;
  successRate: number;
  sentByAdminId: string | null;
  createdAt: string;
}

export interface BroadcastHistoryResponse extends PaginatedResult<BroadcastHistoryRow> {
  tokenStats: DeviceTokenStats;
}

