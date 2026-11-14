import { http } from '@/api/http';
import type {
  AdminPaymentDetail,
  AdminPaymentItem,
  AdminUserDetail,
  AdminUserListItem,
  BroadcastAudience,
  BroadcastHistoryResponse,
  BroadcastResult,
  DashboardOverview,
  DeviceTokenStats,
  FoodItem,
  LoginResponse,
  NotificationType,
  PaginatedResult,
  PaymentEventItem,
  PaymentEventStatus,
  PaymentMethod,
  PaymentStatus,
  Role,
  UserPlan,
} from '@/types/admin.types';

export const adminApi = {
  // ─── Auth ────────────────────────────────────────────────────────────────
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await http.post<LoginResponse>('/auth/login', { email, password });
    return data;
  },

  // ─── Subsystem 1: Dashboard Overview ─────────────────────────────────────
  getDashboardOverview: async (): Promise<DashboardOverview> => {
    const { data } = await http.get<DashboardOverview>('/admin/dashboard/overview');
    return data;
  },

  // ─── Subsystem 2: Users ──────────────────────────────────────────────────
  listUsers: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: Role;
    plan?: UserPlan;
  }): Promise<PaginatedResult<AdminUserListItem>> => {
    const { data } = await http.get<PaginatedResult<AdminUserListItem>>('/admin/users', {
      params,
    });
    return data;
  },

  getUserDetail: async (id: string): Promise<AdminUserDetail> => {
    const { data } = await http.get<AdminUserDetail>(`/admin/users/${id}`);
    return data;
  },

  // ─── Subsystem 3: Food Database ──────────────────────────────────────────
  listFoods: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    isVerified?: boolean;
  }): Promise<PaginatedResult<FoodItem>> => {
    const { data } = await http.get<PaginatedResult<FoodItem>>('/admin/foods', { params });
    return data;
  },

  createFood: async (payload: {
    name: string;
    description?: string;
    caloriesPer100g: number;
    proteinPer100g: number;
    carbsPer100g: number;
    fatPer100g: number;
    servingUnit?: string;
    defaultServingSize?: number;
    isVerified?: boolean;
    isActive?: boolean;
    imageBase64?: string;
  }): Promise<FoodItem> => {
    const { data } = await http.post<FoodItem>('/admin/foods', payload);
    return data;
  },

  updateFood: async (
    id: string,
    payload: Partial<{
      name: string;
      description: string;
      caloriesPer100g: number;
      proteinPer100g: number;
      carbsPer100g: number;
      fatPer100g: number;
      servingUnit: string;
      defaultServingSize: number;
      isVerified: boolean;
      isActive: boolean;
      imageBase64: string;
      removeImage: boolean;
    }>,
  ): Promise<FoodItem> => {
    const { data } = await http.patch<FoodItem>(`/admin/foods/${id}`, payload);
    return data;
  },

  deactivateFood: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await http.delete<{ success: boolean }>(`/admin/foods/${id}`);
    return data;
  },

  // ─── Subsystem 4: Payments & Webhooks ────────────────────────────────────
  listPayments: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: PaymentStatus;
    method?: PaymentMethod;
  }): Promise<PaginatedResult<AdminPaymentItem>> => {
    const { data } = await http.get<PaginatedResult<AdminPaymentItem>>('/admin/payments', {
      params,
    });
    return data;
  },

  getPaymentDetail: async (id: string): Promise<AdminPaymentDetail> => {
    const { data } = await http.get<AdminPaymentDetail>(`/admin/payments/${id}`);
    return data;
  },

  manualActivatePayment: async (
    id: string,
    payload: { note?: string; bankReference?: string },
  ): Promise<{ success: boolean; status: string; paymentId?: string; subscriptionId?: string }> => {
    const { data } = await http.post(`/admin/payments/${id}/manual-activate`, payload);
    return data;
  },

  listPaymentEvents: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    provider?: string;
    status?: PaymentEventStatus;
    paymentId?: string;
  }): Promise<PaginatedResult<PaymentEventItem>> => {
    const { data } = await http.get<PaginatedResult<PaymentEventItem>>('/admin/payment-events', {
      params,
    });
    return data;
  },

  // ─── Subsystem 5: Push Notifications & Broadcast ─────────────────────────
  getNotificationStats: async (): Promise<DeviceTokenStats> => {
    const { data } = await http.get<DeviceTokenStats>('/admin/notifications/stats');
    return data;
  },

  sendBroadcast: async (payload: {
    title: string;
    body: string;
    audience: BroadcastAudience;
    type?: NotificationType;
    route?: string;
  }): Promise<BroadcastResult> => {
    const { data } = await http.post<BroadcastResult>('/admin/notifications/broadcast', payload);
    return data;
  },

  listBroadcastHistory: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    audience?: BroadcastAudience;
  }): Promise<BroadcastHistoryResponse> => {
    const { data } = await http.get<BroadcastHistoryResponse>('/admin/notifications/history', {
      params,
    });
    return data;
  },
};

