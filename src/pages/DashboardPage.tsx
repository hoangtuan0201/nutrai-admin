import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Progress, Skeleton } from 'antd';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { adminApi } from '@/api/admin.api';
import { extractApiError } from '@/api/http';
import type { PaymentMethod, RevenueByMethod } from '@/types/admin.types';
import { formatNumber, formatVnd } from '@/utils/format';

const METHOD_META: Record<string, { label: string; color: string }> = {
  SEPAY: { label: 'SePay (VietQR)', color: '#FF9114' },
  BANK_TRANSFER: { label: 'Bank Transfer', color: '#3B7A23' },
  GOOGLE_PLAY: { label: 'Google Play', color: '#5C594E' },
  APPLE_PAY: { label: 'Apple Pay', color: '#151914' },
  VNPAY: { label: 'VNPay', color: '#3B62D4' },
  MOMO: { label: 'MoMo', color: '#C93826' },
};

function findMethodAmount(list: RevenueByMethod[], method: PaymentMethod): RevenueByMethod {
  return list.find((m) => m.method === method) ?? { method, amount: 0, transactions: 0 };
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const overviewQuery = useQuery({
    queryKey: ['admin', 'dashboard', 'overview'],
    queryFn: adminApi.getDashboardOverview,
  });

  if (overviewQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="nutrai-panel p-6">
          <Skeleton active paragraph={{ rows: 4 }} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="nutrai-panel p-6">
            <Skeleton active paragraph={{ rows: 5 }} />
          </div>
          <div className="nutrai-panel p-6">
            <Skeleton active paragraph={{ rows: 5 }} />
          </div>
        </div>
      </div>
    );
  }

  if (overviewQuery.isError || !overviewQuery.data) {
    return (
      <Alert
        type="error"
        showIcon
        message="Unable to load overview metrics"
        description={extractApiError(overviewQuery.error)}
        action={
          <Button size="small" onClick={() => overviewQuery.refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  const { users, revenue } = overviewQuery.data;
  const proRate = users.total > 0 ? Math.round((users.proUsers / users.total) * 1000) / 10 : 0;

  const sepayAll = findMethodAmount(revenue.collectedAllTime.byMethod, 'SEPAY');
  const allTimeTotal = revenue.collectedAllTime.total;

  const gatewayBreakdown = revenue.collectedAllTime.byMethod.length
    ? revenue.collectedAllTime.byMethod
    : [sepayAll];

  return (
    <div className="space-y-6">
      {/* Header action bar */}
      <div className="flex justify-end">
        <Button
          icon={<RefreshCw size={15} className={overviewQuery.isFetching ? 'animate-spin' : ''} />}
          onClick={() => overviewQuery.refetch()}
        >
          Refresh metrics
        </Button>
      </div>

      {/* Primary Asymmetric Grid: Revenue Ledger (7 cols) + User Acquisition (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Ledger */}
        <section className="lg:col-span-7 nutrai-panel p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-[rgba(21,25,20,0.08)] pb-5">
              <div>
                <div className="text-sm font-semibold text-[#5C594E]">
                  Monthly Recurring Revenue (MRR)
                </div>
                <div className="mt-1 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#151914] tabular-nums">
                  {formatVnd(revenue.mrr)}
                </div>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-xs font-medium text-[#5C594E]">Annual Run Rate (ARR)</div>
                <div className="mt-0.5 text-xl font-bold text-[#B85E00] tabular-nums">
                  {formatVnd(revenue.arr)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-5 border-b border-[rgba(21,25,20,0.08)]">
              <div>
                <div className="text-xs font-medium text-[#5C594E]">Collected this month</div>
                <div className="mt-1 text-xl font-bold text-[#3B7A23] tabular-nums">
                  {formatVnd(revenue.collectedThisMonth.total)}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-[#5C594E]">Collected all-time</div>
                <div className="mt-1 text-xl font-bold text-[#151914] tabular-nums">
                  {formatVnd(allTimeTotal)}
                </div>
              </div>
            </div>

            {/* Gateway distribution */}
            <div className="pt-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#151914]">
                  Gateway breakdown (SePay VietQR)
                </span>
                <span className="text-xs text-[#5C594E] tabular-nums">
                  Successful transactions:{' '}
                  {revenue.collectedAllTime.byMethod.reduce((s, m) => s + m.transactions, 0)}
                </span>
              </div>

              {gatewayBreakdown.map((item) => {
                const meta = METHOD_META[item.method] ?? {
                  label: item.method,
                  color: '#5C594E',
                };
                const pct =
                  allTimeTotal > 0 ? Math.round((item.amount / allTimeTotal) * 1000) / 10 : 0;
                return (
                  <div key={item.method} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-[#151914]">{meta.label}</span>
                      <span className="tabular-nums text-[#5C594E]">
                        <strong className="text-[#151914]">{formatVnd(item.amount)}</strong> ·{' '}
                        {item.transactions} txns ({pct}%)
                      </span>
                    </div>
                    <Progress
                      percent={pct}
                      showInfo={false}
                      strokeColor={meta.color}
                      trailColor="#EFECE1"
                      size="small"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[rgba(21,25,20,0.08)] flex justify-end">
            <Button type="link" className="!px-0 font-semibold text-[#B85E00]" onClick={() => navigate('/payments')}>
              Open payments & SePay webhook logs <ArrowRight size={15} className="ml-1 inline" />
            </Button>
          </div>
        </section>

        {/* User Acquisition & Plan Mix */}
        <section className="lg:col-span-5 nutrai-panel p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-baseline justify-between border-b border-[rgba(21,25,20,0.08)] pb-5">
              <div>
                <div className="text-sm font-semibold text-[#5C594E]">Total users</div>
                <div className="mt-1 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#151914] tabular-nums">
                  {formatNumber(users.total)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-medium text-[#5C594E]">Pro conversion rate</div>
                <div className="mt-0.5 text-xl font-bold text-[#3B7A23] tabular-nums">
                  {proRate}%
                </div>
              </div>
            </div>

            {/* Clean tabular grid for Today / Week / Month */}
            <div className="grid grid-cols-3 divide-x divide-[rgba(21,25,20,0.08)] py-5 border-b border-[rgba(21,25,20,0.08)]">
              <div className="pr-3">
                <div className="text-xs text-[#5C594E]">Today</div>
                <div className="mt-1 text-2xl font-bold text-[#151914] tabular-nums">
                  +{formatNumber(users.newToday)}
                </div>
              </div>
              <div className="px-3">
                <div className="text-xs text-[#5C594E]">This week</div>
                <div className="mt-1 text-2xl font-bold text-[#151914] tabular-nums">
                  +{formatNumber(users.newThisWeek)}
                </div>
              </div>
              <div className="pl-3">
                <div className="text-xs text-[#5C594E]">This month</div>
                <div className="mt-1 text-2xl font-bold text-[#151914] tabular-nums">
                  +{formatNumber(users.newThisMonth)}
                </div>
              </div>
            </div>

            {/* Free vs Pro Split */}
            <div className="pt-5 space-y-3">
              <div className="flex items-center justify-between text-sm font-semibold text-[#151914]">
                <span>Plan tiers</span>
                <span className="tabular-nums text-xs font-medium text-[#5C594E]">
                  {formatNumber(users.proUsers)} PRO / {formatNumber(users.freeUsers)} FREE
                </span>
              </div>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-[#EFECE1]">
                <div
                  className="bg-[#FF9114] transition-all duration-300"
                  style={{ width: `${proRate}%` }}
                  title={`PRO: ${users.proUsers}`}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-[#5C594E]">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#FF9114]" />
                  NutrAI Pro ({formatNumber(users.proUsers)})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#D8D3C2]" />
                  Free ({formatNumber(users.freeUsers)})
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[rgba(21,25,20,0.08)] flex justify-end">
            <Button type="link" className="!px-0 font-semibold text-[#B85E00]" onClick={() => navigate('/users')}>
              View users & BMR/TDEE profiles <ArrowRight size={15} className="ml-1 inline" />
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};

