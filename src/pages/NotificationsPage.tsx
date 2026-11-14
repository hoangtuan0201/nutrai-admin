import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  App as AntApp,
  Button,
  Form,
  Input,
  Radio,
  Select,
  Table,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { BellRing, Send, Smartphone } from 'lucide-react';
import { adminApi } from '@/api/admin.api';
import { extractApiError } from '@/api/http';
import type {
  BroadcastAudience,
  BroadcastHistoryRow,
} from '@/types/admin.types';
import { formatDateTime, formatNumber } from '@/utils/format';

const AUDIENCE_LABEL: Record<BroadcastAudience, { label: string; color: string; desc: string }> = {
  ALL: {
    label: 'All Users',
    color: 'blue',
    desc: 'Every active USER account on NutrAI.',
  },
  FREE: {
    label: 'FREE Plan Users',
    color: 'orange',
    desc: 'Ideal for NutrAI Pro upgrade discounts and promotions.',
  },
  INACTIVE_3D: {
    label: 'Inactive ≥ 3 Days',
    color: 'gold',
    desc: 'Users who have not logged meals or opened the app in the past 72 hours.',
  },
};

interface BroadcastFormValues {
  audience: BroadcastAudience;
  title: string;
  body: string;
  route?: string;
}

export const NotificationsPage: React.FC = () => {
  const { message } = AntApp.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<BroadcastFormValues>();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [audienceFilter, setAudienceFilter] = useState<BroadcastAudience | undefined>();

  const watchedTitle = Form.useWatch('title', form) || '20% off NutrAI Pro today';
  const watchedBody =
    Form.useWatch('body', form) ||
    'Unlock unlimited AI food scanning and your personal AI nutrition coach.';

  const historyQuery = useQuery({
    queryKey: ['admin', 'notifications', 'history', { page, limit, audienceFilter }],
    queryFn: () =>
      adminApi.listBroadcastHistory({
        page,
        limit,
        audience: audienceFilter,
      }),
  });

  const broadcastMutation = useMutation({
    mutationFn: adminApi.sendBroadcast,
    onSuccess: (res) => {
      message.success(
        `Sent to ${res.totalRecipients} users (${res.pushSuccessCount}/${res.activeTokensTargeted} devices delivered).`,
      );
      form.resetFields(['title', 'body', 'route']);
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
    },
    onError: (err) => message.error(extractApiError(err)),
  });

  const tokenStats = historyQuery.data?.tokenStats;

  const columns: ColumnsType<BroadcastHistoryRow> = [
    {
      title: 'Campaign Content',
      key: 'content',
      render: (_, r) => (
        <div className="max-w-md">
          <div className="font-semibold text-[#151914]">{r.title}</div>
          <div className="mt-0.5 text-xs text-[#5C594E] line-clamp-2">{r.body}</div>
        </div>
      ),
    },
    {
      title: 'Audience',
      dataIndex: 'audience',
      width: 175,
      render: (a: BroadcastAudience) => {
        const meta = AUDIENCE_LABEL[a] ?? { label: a, color: 'default' };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: 'Recipients / Devices',
      key: 'reach',
      width: 165,
      render: (_, r) => (
        <div className="text-xs tabular-nums">
          <div className="font-semibold text-[#151914]">{formatNumber(r.totalRecipients)} users</div>
          <div className="text-[#5C594E]">
            {r.pushSuccessCount}/{r.activeTokensTargeted} devices OK
          </div>
        </div>
      ),
    },
    {
      title: 'Success Rate',
      dataIndex: 'successRate',
      width: 135,
      align: 'right',
      render: (rate: number, r) => (
        <span
          className={`font-bold tabular-nums ${
            r.activeTokensTargeted === 0
              ? 'text-[#8A8679]'
              : rate >= 80
                ? 'text-[#3B7A23]'
                : 'text-[#C47B09]'
          }`}
        >
          {r.activeTokensTargeted === 0 ? 'In-app only' : `${rate}%`}
        </span>
      ),
    },
    {
      title: 'Sent At',
      dataIndex: 'createdAt',
      width: 150,
      render: (val: string) => <span className="text-xs tabular-nums">{formatDateTime(val)}</span>,
    },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* Left: Broadcast Composer + Live Mobile Preview */}
      <section className="xl:col-span-5 nutrai-panel p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[rgba(21,25,20,0.08)] pb-4">
          <h2 className="m-0 text-base font-bold text-[#151914]">Compose Broadcast</h2>
          <Tag color="orange">Firebase FCM + In-App</Tag>
        </div>

        <Form<BroadcastFormValues>
          form={form}
          layout="vertical"
          initialValues={{ audience: 'ALL' }}
          onFinish={(values) => broadcastMutation.mutate(values)}
          requiredMark={false}
        >
          <Form.Item
            label="Target Audience"
            name="audience"
            rules={[{ required: true }]}
          >
            <Radio.Group className="w-full space-y-2">
              {(['ALL', 'FREE', 'INACTIVE_3D'] as BroadcastAudience[]).map((key) => (
                <Radio
                  key={key}
                  value={key}
                  className="!flex w-full rounded-xl border border-[rgba(21,25,20,0.1)] bg-[#FAF9F3] px-3.5 py-2.5 mr-0"
                >
                  <div className="font-semibold text-sm text-[#151914]">
                    {AUDIENCE_LABEL[key].label}
                  </div>
                  <div className="text-xs text-[#5C594E]">{AUDIENCE_LABEL[key].desc}</div>
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>

          <Form.Item label="Deep-Link Screen" name="route">
            <Select
              allowClear
              placeholder="Default (Notification Center)"
              options={[
                { label: 'Home Dashboard', value: '/(main)' },
                { label: 'Upgrade to Pro', value: '/settings/subscription' },
                { label: 'Meal Log', value: '/(main)/meals' },
                { label: 'AI Coach', value: '/(main)/ai/chat' },
                { label: 'Calorie Progress', value: '/(main)/progress/calorie' },
                { label: 'Notification Center', value: '/notifications' },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Notification Title"
            name="title"
            rules={[{ required: true, message: 'Please enter a title' }]}
          >
            <Input maxLength={120} showCount placeholder="e.g. Weekend Flash Sale: 20% off NutrAI Pro!" />
          </Form.Item>

          <Form.Item
            label="Notification Body"
            name="body"
            rules={[{ required: true, message: 'Please enter a message body' }]}
          >
            <Input.TextArea
              rows={3}
              maxLength={500}
              showCount
              placeholder="Write a clear, concise message for the lock screen..."
            />
          </Form.Item>

          {/* Realistic Push Notification Banner Preview */}
          <div className="mb-5 rounded-xl bg-[#151914] p-4 text-[#F6F4EC]">
            <div className="flex items-center justify-between text-[11px] text-white/60 mb-2">
              <span className="flex items-center gap-1.5">
                <img
                  src="/logo-transparent-dark.png"
                  alt="NutrAI"
                  className="h-4 w-auto object-contain"
                />
                <span>· Mobile push preview</span>
              </span>
              <span>now</span>
            </div>
            <div className="font-bold text-sm text-[#F6F4EC]">{watchedTitle}</div>
            <div className="mt-0.5 text-xs text-white/80 leading-relaxed">{watchedBody}</div>
          </div>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            icon={<Send size={15} />}
            loading={broadcastMutation.isPending}
          >
            Send Broadcast Now
          </Button>
        </Form>
      </section>

      {/* Right: Device Reach + Broadcast History */}
      <section className="xl:col-span-7 space-y-5">
        {/* Devices Summary Strip */}
        <div className="nutrai-panel p-5 grid grid-cols-2 gap-4 divide-x divide-[rgba(21,25,20,0.08)]">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-[#5C594E]">
              <Smartphone size={14} /> Active Devices
            </div>
            <div className="mt-1 text-2xl font-extrabold text-[#151914] tabular-nums">
              {formatNumber(tokenStats?.totalActiveTokens ?? 0)}
            </div>
          </div>
          <div className="pl-4">
            <div className="text-xs text-[#5C594E]">Users with Push</div>
            <div className="mt-1 text-2xl font-extrabold text-[#3B7A23] tabular-nums">
              {formatNumber(tokenStats?.usersWithActivePush ?? 0)}
            </div>
          </div>
        </div>

        {historyQuery.isError && (
          <Alert
            type="error"
            showIcon
            message="Failed to load broadcast history"
            description={extractApiError(historyQuery.error)}
          />
        )}

        {/* History Table */}
        <div className="nutrai-panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-[rgba(21,25,20,0.08)]">
            <div className="flex items-center gap-2 font-bold text-sm text-[#151914]">
              <BellRing size={16} />
              <span>Sent Broadcast History</span>
            </div>
            <Select
              allowClear
              placeholder="Filter by audience"
              value={audienceFilter}
              onChange={(v) => {
                setAudienceFilter(v);
                setPage(1);
              }}
              className="w-48"
              options={[
                { label: 'All Users', value: 'ALL' },
                { label: 'FREE Plan', value: 'FREE' },
                { label: 'Inactive ≥ 3 Days', value: 'INACTIVE_3D' },
              ]}
            />
          </div>

          <Table<BroadcastHistoryRow>
            rowKey="broadcastId"
            columns={columns}
            dataSource={historyQuery.data?.items ?? []}
            loading={historyQuery.isLoading || historyQuery.isFetching}
            scroll={{ x: 760 }}
            locale={{ emptyText: 'No broadcast campaigns have been sent yet.' }}
            pagination={{
              current: page,
              pageSize: limit,
              total: historyQuery.data?.meta.total ?? 0,
              onChange: (p, ps) => {
                setPage(p);
                setLimit(ps);
              },
              className: 'px-5 pb-1',
            }}
          />
        </div>
      </section>
    </div>
  );
};

