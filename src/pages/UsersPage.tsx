import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Avatar,
  Button,
  Descriptions,
  Drawer,
  Input,
  Segmented,
  Select,
  Skeleton,
  Table,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Eye, Search } from 'lucide-react';
import { adminApi } from '@/api/admin.api';
import { extractApiError } from '@/api/http';
import type { AdminUserListItem, Role, UserPlan } from '@/types/admin.types';
import { formatDate, formatDateTime, formatNumber, formatVnd } from '@/utils/format';

const GOAL_LABEL: Record<string, string> = {
  WEIGHT_LOSS: 'Weight Loss',
  MAINTENANCE: 'Maintain Weight',
  MUSCLE_GAIN: 'Muscle Gain',
};

const ACTIVITY_LABEL: Record<string, string> = {
  SEDENTARY: 'Sedentary (1.2x)',
  LIGHT: 'Lightly Active (1.375x)',
  MODERATE: 'Moderately Active (1.55x)',
  VERY_ACTIVE: 'Very Active (1.725x)',
  EXTRA_ACTIVE: 'Extra Active (1.9x)',
};

export const UsersPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [plan, setPlan] = useState<'ALL' | UserPlan>('ALL');
  const [role, setRole] = useState<'ALL' | Role>('ALL');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ['admin', 'users', { page, limit, search, plan, role }],
    queryFn: () =>
      adminApi.listUsers({
        page,
        limit,
        search: search || undefined,
        plan: plan === 'ALL' ? undefined : plan,
        role: role === 'ALL' ? undefined : role,
      }),
  });

  const detailQuery = useQuery({
    queryKey: ['admin', 'users', 'detail', selectedUserId],
    queryFn: () => adminApi.getUserDetail(selectedUserId!),
    enabled: Boolean(selectedUserId),
  });

  const columns: ColumnsType<AdminUserListItem> = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <div className="flex items-center gap-3 min-w-0">
          <Avatar
            size={36}
            src={record.avatarUrl || undefined}
            style={{
              backgroundColor: record.role === 'ADMIN' ? '#151914' : '#EFECE1',
              color: record.role === 'ADMIN' ? '#F6F4EC' : '#151914',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {(record.name || record.email).charAt(0).toUpperCase()}
          </Avatar>
          <div className="min-w-0">
            <div className="truncate font-semibold text-[#151914]">
              {record.name || 'Unnamed'}
            </div>
            <div className="truncate text-xs text-[#5C594E]">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      width: 110,
      render: (r: Role) =>
        r === 'ADMIN' ? (
          <Tag color="#151914" className="font-semibold">
            ADMIN
          </Tag>
        ) : (
          <Tag className="border-[rgba(21,25,20,0.14)] bg-[#FAF9F3] text-[#5C594E]">
            USER
          </Tag>
        ),
    },
    {
      title: 'Plan',
      key: 'plan',
      width: 165,
      render: (_, record) =>
        record.plan === 'PRO' ? (
          <div>
            <Tag color="orange" className="font-semibold">
              PRO · {record.proPlanName || 'Active'}
            </Tag>
            {record.proExpiresAt && (
              <div className="mt-0.5 text-[11px] text-[#5C594E] tabular-nums">
                Exp: {formatDate(record.proExpiresAt)}
              </div>
            )}
          </div>
        ) : (
          <Tag className="border-[rgba(21,25,20,0.12)] bg-white text-[#5C594E]">FREE</Tag>
        ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      width: 120,
      render: (active: boolean) =>
        active ? (
          <Tag color="green">Active</Tag>
        ) : (
          <Tag color="red">Locked</Tag>
        ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      width: 155,
      render: (val: string) => <span className="tabular-nums text-[#5C594E]">{formatDateTime(val)}</span>,
    },
    {
      title: 'Profile',
      key: 'action',
      width: 120,
      align: 'right',
      render: (_, record) => (
        <Button
          size="small"
          icon={<Eye size={14} />}
          onClick={() => setSelectedUserId(record.id)}
        >
          Inspect
        </Button>
      ),
    },
  ];

  const detail = detailQuery.data;

  return (
    <div className="space-y-5">
      {/* Unified Filter Bar */}
      <div className="nutrai-panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <Input
            allowClear
            value={searchInput}
            onChange={(e) => {
              const v = e.target.value;
              setSearchInput(v);
              if (!v) {
                setSearch('');
                setPage(1);
              }
            }}
            onPressEnter={() => {
              setSearch(searchInput.trim());
              setPage(1);
            }}
            placeholder="Search by email or name..."
            prefix={<Search size={15} className="text-[#8A8679]" />}
            className="w-full sm:w-72"
          />

          <Segmented
            value={plan}
            onChange={(val) => {
              setPlan(val as 'ALL' | UserPlan);
              setPage(1);
            }}
            options={[
              { label: 'All Plans', value: 'ALL' },
              { label: 'PRO', value: 'PRO' },
              { label: 'FREE', value: 'FREE' },
            ]}
          />

          <Select
            value={role}
            onChange={(val) => {
              setRole(val);
              setPage(1);
            }}
            className="w-36"
            options={[
              { label: 'All Roles', value: 'ALL' },
              { label: 'USER', value: 'USER' },
              { label: 'ADMIN', value: 'ADMIN' },
            ]}
          />
        </div>

        <div className="text-xs font-medium text-[#5C594E] tabular-nums">
          Total: <strong className="text-[#151914]">{formatNumber(usersQuery.data?.meta.total ?? 0)}</strong> accounts
        </div>
      </div>

      {usersQuery.isError && (
        <Alert
          type="error"
          showIcon
          message="Failed to load users"
          description={extractApiError(usersQuery.error)}
          action={<Button size="small" onClick={() => usersQuery.refetch()}>Retry</Button>}
        />
      )}

      {/* Users Table */}
      <div className="nutrai-panel overflow-hidden">
        <Table<AdminUserListItem>
          rowKey="id"
          columns={columns}
          dataSource={usersQuery.data?.items ?? []}
          loading={usersQuery.isLoading || usersQuery.isFetching}
          scroll={{ x: 820 }}
          onRow={(record) => ({
            onDoubleClick: () => setSelectedUserId(record.id),
          })}
          pagination={{
            current: page,
            pageSize: limit,
            total: usersQuery.data?.meta.total ?? 0,
            showSizeChanger: true,
            pageSizeOptions: [10, 15, 25, 50],
            onChange: (p, ps) => {
              setPage(p);
              setLimit(ps);
            },
            className: 'px-5 pb-1',
          }}
        />
      </div>

      {/* Inspect Health & Subscription Drawer */}
      <Drawer
        title="Health & Nutrition Profile"
        open={Boolean(selectedUserId)}
        onClose={() => setSelectedUserId(null)}
        width={520}
      >
        {detailQuery.isLoading ? (
          <Skeleton active paragraph={{ rows: 10 }} />
        ) : detailQuery.isError || !detail ? (
          <Alert
            type="error"
            showIcon
            message="Failed to load user details"
            description={extractApiError(detailQuery.error)}
          />
        ) : (
          <div className="space-y-6">
            {/* Identity Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-[rgba(21,25,20,0.08)]">
              <Avatar
                size={52}
                src={detail.avatarUrl || undefined}
                style={{ backgroundColor: '#151914', color: '#F6F4EC', fontSize: 18, fontWeight: 700 }}
              >
                {(detail.name || detail.email).charAt(0).toUpperCase()}
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-bold text-[#151914]">
                    {detail.name || 'Unnamed'}
                  </span>
                  <Tag color={detail.plan === 'PRO' ? 'orange' : 'default'}>
                    {detail.plan}
                  </Tag>
                  <Tag color={detail.role === 'ADMIN' ? '#151914' : 'default'}>
                    {detail.role}
                  </Tag>
                </div>
                <div className="text-sm text-[#5C594E] truncate">{detail.email}</div>
                <div className="mt-1 text-xs text-[#8A8679] tabular-nums">
                  {detail._count.meals} logged meals · {detail._count.payments} payments
                </div>
              </div>
            </div>

            {/* Health Metrics */}
            <div>
              <h3 className="m-0 mb-3 text-sm font-bold text-[#151914]">
                Body Metrics (BMR / TDEE / Weight)
              </h3>
              {detail.health ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="nutrai-panel-subtle p-3">
                      <div className="text-[11px] text-[#5C594E]">BMR</div>
                      <div className="mt-0.5 text-lg font-bold text-[#151914] tabular-nums">
                        {detail.health.bmr ? `${formatNumber(detail.health.bmr)} kcal` : '—'}
                      </div>
                    </div>
                    <div className="nutrai-panel-subtle p-3">
                      <div className="text-[11px] text-[#5C594E]">TDEE</div>
                      <div className="mt-0.5 text-lg font-bold text-[#B85E00] tabular-nums">
                        {detail.health.tdee ? `${formatNumber(detail.health.tdee)} kcal` : '—'}
                      </div>
                    </div>
                    <div className="nutrai-panel-subtle p-3">
                      <div className="text-[11px] text-[#5C594E]">Current Weight</div>
                      <div className="mt-0.5 text-lg font-bold text-[#151914] tabular-nums">
                        {detail.health.currentWeightKg ? `${detail.health.currentWeightKg} kg` : '—'}
                      </div>
                    </div>
                    <div className="nutrai-panel-subtle p-3">
                      <div className="text-[11px] text-[#5C594E]">Target Weight</div>
                      <div className="mt-0.5 text-lg font-bold text-[#3B7A23] tabular-nums">
                        {detail.health.targetWeightKg ? `${detail.health.targetWeightKg} kg` : '—'}
                      </div>
                    </div>
                  </div>

                  <Descriptions bordered size="small" column={2}>
                    <Descriptions.Item label="Gender">{detail.health.gender ?? '—'}</Descriptions.Item>
                    <Descriptions.Item label="Age">{detail.health.age ?? '—'}</Descriptions.Item>
                    <Descriptions.Item label="Height">
                      {detail.health.heightCm ? `${detail.health.heightCm} cm` : '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Goal">
                      {detail.health.fitnessGoal
                        ? GOAL_LABEL[detail.health.fitnessGoal] ?? detail.health.fitnessGoal
                        : '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Activity Level" span={2}>
                      {detail.health.activityLevel
                        ? ACTIVITY_LABEL[detail.health.activityLevel] ?? detail.health.activityLevel
                        : '—'}
                    </Descriptions.Item>
                  </Descriptions>
                </div>
              ) : (
                <div className="nutrai-panel-subtle p-4 text-sm text-[#5C594E]">
                  User has not completed health profile onboarding yet.
                </div>
              )}
            </div>

            {/* Daily Nutrition Targets */}
            <div>
              <h3 className="m-0 mb-3 text-sm font-bold text-[#151914]">
                Daily Nutrition Targets
              </h3>
              {detail.nutritionTarget ? (
                <div className="grid grid-cols-4 gap-2.5 nutrai-panel-subtle p-3.5 text-center">
                  <div>
                    <div className="text-[11px] text-[#5C594E]">Calories</div>
                    <div className="mt-0.5 font-bold text-[#B85E00] tabular-nums">
                      {formatNumber(Math.round(detail.nutritionTarget.dailyCalories))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#5C594E]">Protein</div>
                    <div className="mt-0.5 font-bold text-[#3B62D4] tabular-nums">
                      {Math.round(detail.nutritionTarget.dailyProtein)}g
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#5C594E]">Carbs</div>
                    <div className="mt-0.5 font-bold text-[#3B7A23] tabular-nums">
                      {Math.round(detail.nutritionTarget.dailyCarbs)}g
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#5C594E]">Fat</div>
                    <div className="mt-0.5 font-bold text-[#C47B09] tabular-nums">
                      {Math.round(detail.nutritionTarget.dailyFat)}g
                    </div>
                  </div>
                </div>
              ) : (
                <div className="nutrai-panel-subtle p-4 text-sm text-[#5C594E]">
                  No active nutrition target set.
                </div>
              )}
            </div>

            {/* Recent Subscriptions */}
            <div>
              <h3 className="m-0 mb-3 text-sm font-bold text-[#151914]">Subscription History</h3>
              {detail.subscriptions.length > 0 ? (
                <div className="space-y-2">
                  {detail.subscriptions.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between nutrai-panel-subtle px-3.5 py-2.5 text-sm"
                    >
                      <div>
                        <div className="font-semibold text-[#151914]">{sub.plan.name}</div>
                        <div className="text-xs text-[#5C594E] tabular-nums">
                          {formatDate(sub.startsAt)} → {formatDate(sub.expiresAt)}
                        </div>
                      </div>
                      <div className="text-right">
                        <Tag color={sub.status === 'ACTIVE' ? 'green' : 'default'}>
                          {sub.status}
                        </Tag>
                        <div className="mt-0.5 text-xs font-medium text-[#151914] tabular-nums">
                          {formatVnd(sub.plan.price)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="nutrai-panel-subtle p-4 text-sm text-[#5C594E]">
                  No paid subscription history found.
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

