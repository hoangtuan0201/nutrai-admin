import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  App as AntApp,
  Button,
  Descriptions,
  Drawer,
  Form,
  Input,
  Modal,
  Select,
  Skeleton,
  Table,
  Tabs,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckCircle2, Eye, Search, Zap } from 'lucide-react';
import { adminApi } from '@/api/admin.api';
import { extractApiError } from '@/api/http';
import type {
  AdminPaymentItem,
  PaymentEventItem,
  PaymentEventStatus,
  PaymentMethod,
  PaymentStatus,
} from '@/types/admin.types';
import { formatDateTime, formatVnd } from '@/utils/format';

const STATUS_TAG: Record<PaymentStatus, { color: string; label: string }> = {
  PENDING: { color: 'gold', label: 'PENDING' },
  COMPLETED: { color: 'green', label: 'PAID' },
  EXPIRED: { color: 'default', label: 'EXPIRED' },
  FAILED: { color: 'red', label: 'FAILED' },
  REFUNDED: { color: 'purple', label: 'REFUNDED' },
};

const EVENT_TAG: Record<PaymentEventStatus, string> = {
  PROCESSED: 'green',
  IGNORED: 'gold',
  FAILED: 'red',
};

interface ActivateFormValues {
  bankReference?: string;
  note?: string;
}

export const PaymentsPage: React.FC = () => {
  const { message } = AntApp.useApp();
  const queryClient = useQueryClient();

  // Tab 1: Payments
  const [payPage, setPayPage] = useState(1);
  const [payLimit, setPayLimit] = useState(15);
  const [paySearchInput, setPaySearchInput] = useState('');
  const [paySearch, setPaySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | undefined>();
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | undefined>();

  // Tab 2: Payment Events (Webhook Logs)
  const [evtPage, setEvtPage] = useState(1);
  const [evtLimit, setEvtLimit] = useState(15);
  const [evtSearchInput, setEvtSearchInput] = useState('');
  const [evtSearch, setEvtSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState<string | undefined>();
  const [evtStatusFilter, setEvtStatusFilter] = useState<PaymentEventStatus | undefined>();

  // Drawers & Manual Activate Modal
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<PaymentEventItem | null>(null);
  const [activateTarget, setActivateTarget] = useState<AdminPaymentItem | null>(null);
  const [activateForm] = Form.useForm<ActivateFormValues>();

  const paymentsQuery = useQuery({
    queryKey: [
      'admin',
      'payments',
      { payPage, payLimit, paySearch, statusFilter, methodFilter },
    ],
    queryFn: () =>
      adminApi.listPayments({
        page: payPage,
        limit: payLimit,
        search: paySearch || undefined,
        status: statusFilter,
        method: methodFilter,
      }),
  });

  const eventsQuery = useQuery({
    queryKey: [
      'admin',
      'payment-events',
      { evtPage, evtLimit, evtSearch, providerFilter, evtStatusFilter },
    ],
    queryFn: () =>
      adminApi.listPaymentEvents({
        page: evtPage,
        limit: evtLimit,
        search: evtSearch || undefined,
        provider: providerFilter,
        status: evtStatusFilter,
      }),
  });

  const paymentDetailQuery = useQuery({
    queryKey: ['admin', 'payments', 'detail', selectedPaymentId],
    queryFn: () => adminApi.getPaymentDetail(selectedPaymentId!),
    enabled: Boolean(selectedPaymentId),
  });

  const manualActivateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: ActivateFormValues }) =>
      adminApi.manualActivatePayment(id, values),
    onSuccess: () => {
      message.success('NutrAI Pro activated and notification sent to the user!');
      setActivateTarget(null);
      activateForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'payment-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (err) => message.error(extractApiError(err)),
  });

  const openActivateModal = (payment: AdminPaymentItem) => {
    setActivateTarget(payment);
    activateForm.setFieldsValue({
      bankReference: '',
      note:
        payment.status === 'EXPIRED'
          ? 'Customer transferred late after the 15-minute VietQR code expired'
          : '',
    });
  };

  const paymentColumns: ColumnsType<AdminPaymentItem> = [
    {
      title: 'Payment Code / Transfer Ref',
      key: 'code',
      render: (_, r) => (
        <div>
          <div className="font-mono font-bold text-xs text-[#151914]">
            {r.paymentCode || r.transactionId}
          </div>
          <div className="text-[11px] text-[#8A8679] truncate max-w-[180px]">{r.transactionId}</div>
        </div>
      ),
    },
    {
      title: 'Customer',
      key: 'user',
      render: (_, r) => (
        <div className="min-w-0">
          <div className="font-medium text-sm text-[#151914] truncate">
            {r.user?.name || 'Customer'}
          </div>
          <div className="text-xs text-[#5C594E] truncate">{r.user?.email || '—'}</div>
        </div>
      ),
    },
    {
      title: 'Plan / Amount',
      key: 'amount',
      width: 155,
      render: (_, r) => (
        <div>
          <div className="font-bold text-[#151914] tabular-nums">{formatVnd(r.amount)}</div>
          <div className="text-xs text-[#5C594E]">{r.plan?.name || 'Pro'}</div>
        </div>
      ),
    },
    {
      title: 'Gateway',
      dataIndex: 'paymentMethod',
      width: 120,
      render: (m: PaymentMethod) => (
        <Tag color={m === 'SEPAY' ? 'orange' : 'default'}>{m}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 115,
      render: (s: PaymentStatus) => {
        const meta = STATUS_TAG[s] ?? { color: 'default', label: s };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: 'Timestamp',
      key: 'time',
      width: 155,
      render: (_, r) => (
        <div className="text-xs tabular-nums">
          <div className="text-[#151914]">{formatDateTime(r.paidAt || r.createdAt)}</div>
          {r.status !== 'COMPLETED' && r.expiresAt && (
            <div className="text-[11px] text-[#8A8679]">Expires: {formatDateTime(r.expiresAt)}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'action',
      width: 210,
      align: 'right',
      render: (_, r) => (
        <div className="flex justify-end gap-1.5">
          <Button
            size="small"
            icon={<Eye size={13} />}
            onClick={() => setSelectedPaymentId(r.id)}
          >
            Details
          </Button>
          {r.status !== 'COMPLETED' && r.status !== 'REFUNDED' && r.userId && (
            <Button
              size="small"
              type="primary"
              icon={<Zap size={13} />}
              onClick={() => openActivateModal(r)}
            >
              Activate Pro
            </Button>
          )}
        </div>
      ),
    },
  ];

  const eventColumns: ColumnsType<PaymentEventItem> = [
    {
      title: 'Provider / Event',
      key: 'event',
      render: (_, r) => (
        <div>
          <div className="flex items-center gap-2">
            <Tag color={r.provider === 'SEPAY' ? 'orange' : 'default'}>
              {r.provider}
            </Tag>
            <span className="font-mono text-xs font-semibold text-[#151914]">{r.eventType}</span>
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-[#8A8679]">ID: {r.eventId}</div>
        </div>
      ),
    },
    {
      title: 'Linked Payment',
      key: 'payment',
      width: 170,
      render: (_, r) =>
        r.payment ? (
          <div>
            <div className="font-mono text-xs font-bold text-[#151914]">
              {r.payment.paymentCode || '—'}
            </div>
            <div className="text-xs text-[#5C594E] tabular-nums">{formatVnd(r.payment.amount)}</div>
          </div>
        ) : (
          <span className="text-xs text-[#8A8679]">Unmatched</span>
        ),
    },
    {
      title: 'Result',
      dataIndex: 'status',
      width: 125,
      render: (s: PaymentEventStatus) => <Tag color={EVENT_TAG[s] ?? 'default'}>{s}</Tag>,
    },
    {
      title: 'Notes / Reason',
      dataIndex: 'errorMessage',
      render: (msg: string | null) => (
        <span className="text-xs text-[#5C594E]">{msg || 'Processed successfully'}</span>
      ),
    },
    {
      title: 'Timestamp',
      dataIndex: 'createdAt',
      width: 150,
      render: (val: string) => <span className="text-xs tabular-nums">{formatDateTime(val)}</span>,
    },
    {
      title: 'Payload',
      key: 'view',
      width: 100,
      align: 'right',
      render: (_, r) => (
        <Button size="small" onClick={() => setSelectedEvent(r)}>
          View JSON
        </Button>
      ),
    },
  ];

  const paymentDetail = paymentDetailQuery.data;

  return (
    <div className="space-y-5">
      <Tabs
        defaultActiveKey="payments"
        items={[
          {
            key: 'payments',
            label: 'Transactions & Pro Activation',
            children: (
              <div className="space-y-4">
                <div className="nutrai-panel p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3 flex-1">
                    <Input
                      allowClear
                      value={paySearchInput}
                      onChange={(e) => {
                        const v = e.target.value;
                        setPaySearchInput(v);
                        if (!v) {
                          setPaySearch('');
                          setPayPage(1);
                        }
                      }}
                      onPressEnter={() => {
                        setPaySearch(paySearchInput.trim());
                        setPayPage(1);
                      }}
                      placeholder="Search NUTRA code, email, or transaction ID..."
                      prefix={<Search size={15} className="text-[#8A8679]" />}
                      className="w-full sm:w-72"
                    />
                    <Select
                      allowClear
                      placeholder="Status"
                      value={statusFilter}
                      onChange={(v) => {
                        setStatusFilter(v);
                        setPayPage(1);
                      }}
                      className="w-40"
                      options={[
                        { label: 'PAID (COMPLETED)', value: 'COMPLETED' },
                        { label: 'PENDING', value: 'PENDING' },
                        { label: 'EXPIRED', value: 'EXPIRED' },
                        { label: 'FAILED', value: 'FAILED' },
                      ]}
                    />
                    <Select
                      allowClear
                      placeholder="Payment Gateway"
                      value={methodFilter}
                      onChange={(v) => {
                        setMethodFilter(v);
                        setPayPage(1);
                      }}
                      className="w-44"
                      options={[
                        { label: 'SePay (VietQR)', value: 'SEPAY' },
                        { label: 'Bank Transfer', value: 'BANK_TRANSFER' },
                      ]}
                    />
                  </div>
                </div>

                {paymentsQuery.isError && (
                  <Alert
                    type="error"
                    showIcon
                    message="Failed to load transactions"
                    description={extractApiError(paymentsQuery.error)}
                  />
                )}

                <div className="nutrai-panel overflow-hidden">
                  <Table<AdminPaymentItem>
                    rowKey="id"
                    columns={paymentColumns}
                    dataSource={paymentsQuery.data?.items ?? []}
                    loading={paymentsQuery.isLoading || paymentsQuery.isFetching}
                    scroll={{ x: 960 }}
                    pagination={{
                      current: payPage,
                      pageSize: payLimit,
                      total: paymentsQuery.data?.meta.total ?? 0,
                      showSizeChanger: true,
                      onChange: (p, ps) => {
                        setPayPage(p);
                        setPayLimit(ps);
                      },
                      className: 'px-5 pb-1',
                    }}
                  />
                </div>
              </div>
            ),
          },
          {
            key: 'events',
            label: 'SePay Webhook Logs',
            children: (
              <div className="space-y-4">
                <div className="nutrai-panel p-4 flex flex-wrap items-center gap-3">
                  <Input
                    allowClear
                    value={evtSearchInput}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEvtSearchInput(v);
                      if (!v) {
                        setEvtSearch('');
                        setEvtPage(1);
                      }
                    }}
                    onPressEnter={() => {
                      setEvtSearch(evtSearchInput.trim());
                      setEvtPage(1);
                    }}
                    placeholder="Search transfer ref, order code, or eventId..."
                    prefix={<Search size={15} className="text-[#8A8679]" />}
                    className="w-full sm:w-72"
                  />
                  <Select
                    allowClear
                    placeholder="Webhook Provider"
                    value={providerFilter}
                    onChange={(v) => {
                      setProviderFilter(v);
                      setEvtPage(1);
                    }}
                    className="w-40"
                    options={[
                      { label: 'SEPAY', value: 'SEPAY' },
                      { label: 'MANUAL', value: 'MANUAL' },
                    ]}
                  />
                  <Select
                    allowClear
                    placeholder="Processing Status"
                    value={evtStatusFilter}
                    onChange={(v) => {
                      setEvtStatusFilter(v);
                      setEvtPage(1);
                    }}
                    className="w-40"
                    options={[
                      { label: 'PROCESSED', value: 'PROCESSED' },
                      { label: 'IGNORED', value: 'IGNORED' },
                      { label: 'FAILED', value: 'FAILED' },
                    ]}
                  />
                </div>

                {eventsQuery.isError && (
                  <Alert
                    type="error"
                    showIcon
                    message="Unable to load webhook logs"
                    description={extractApiError(eventsQuery.error)}
                    action={
                      <Button size="small" onClick={() => eventsQuery.refetch()}>
                        Retry
                      </Button>
                    }
                  />
                )}

                <div className="nutrai-panel overflow-hidden">
                  <Table<PaymentEventItem>
                    rowKey="id"
                    columns={eventColumns}
                    dataSource={eventsQuery.data?.items ?? []}
                    loading={eventsQuery.isLoading || eventsQuery.isFetching}
                    scroll={{ x: 900 }}
                    pagination={{
                      current: evtPage,
                      pageSize: evtLimit,
                      total: eventsQuery.data?.meta.total ?? 0,
                      showSizeChanger: true,
                      onChange: (p, ps) => {
                        setEvtPage(p);
                        setEvtLimit(ps);
                      },
                      className: 'px-5 pb-1',
                    }}
                  />
                </div>
              </div>
            ),
          },
        ]}
      />

      {/* Payment Detail Drawer */}
      <Drawer
        title="Transaction Details & Related Webhook Logs"
        open={Boolean(selectedPaymentId)}
        onClose={() => setSelectedPaymentId(null)}
        width={540}
      >
        {paymentDetailQuery.isLoading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : paymentDetailQuery.isError ? (
          <Alert
            type="error"
            showIcon
            message="Failed to load transaction details"
            description={extractApiError(paymentDetailQuery.error)}
          />
        ) : !paymentDetail ? (
          <Alert type="error" message="Transaction details not found" />
        ) : (
          <div className="space-y-5">
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Payment Code (VietQR)">
                <span className="font-mono font-bold">
                  {paymentDetail.paymentCode || paymentDetail.transactionId}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="User">
                {paymentDetail.user?.name} ({paymentDetail.user?.email})
              </Descriptions.Item>
              <Descriptions.Item label="Amount / Plan">
                <strong className="tabular-nums">{formatVnd(paymentDetail.amount)}</strong> ·{' '}
                {paymentDetail.plan?.name}
              </Descriptions.Item>
              <Descriptions.Item label="Method / Status">
                <Tag>{paymentDetail.paymentMethod}</Tag>{' '}
                <Tag color={STATUS_TAG[paymentDetail.status]?.color}>
                  {STATUS_TAG[paymentDetail.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Bank Reference ID">
                {paymentDetail.providerTxId || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Paid At">
                {formatDateTime(paymentDetail.paidAt)}
              </Descriptions.Item>
            </Descriptions>

            {paymentDetail.subscription && (
              <div className="nutrai-panel-subtle p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#5C594E]">Activated Subscription</div>
                  <div className="font-semibold text-sm text-[#151914] tabular-nums">
                    Valid until {formatDateTime(paymentDetail.subscription.expiresAt)}
                  </div>
                </div>
                <Tag color="green" icon={<CheckCircle2 size={12} className="inline mr-1" />}>
                  {paymentDetail.subscription.status}
                </Tag>
              </div>
            )}

            <div>
              <h3 className="m-0 mb-2.5 text-sm font-bold text-[#151914]">
                Webhook Events ({paymentDetail.events.length})
              </h3>
              {paymentDetail.events.length === 0 ? (
                <div className="nutrai-panel-subtle p-4 text-xs text-[#5C594E]">
                  No webhook events linked to this transaction yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {paymentDetail.events.map((ev) => (
                    <div key={ev.id} className="nutrai-panel-subtle p-3 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold">
                          {ev.provider} · {ev.eventType}
                        </span>
                        <Tag color={EVENT_TAG[ev.status]}>{ev.status}</Tag>
                      </div>
                      {ev.errorMessage && (
                        <div className="text-[#C93826]">{ev.errorMessage}</div>
                      )}
                      <pre className="m-0 max-h-40 overflow-auto rounded-lg bg-[#151914] p-2.5 text-[11px] text-[#F6F4EC]">
                        {JSON.stringify(ev.payload, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Raw Webhook JSON Drawer */}
      <Drawer
        title="Webhook Payload Data"
        open={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        width={520}
      >
        {selectedEvent && (
          <div className="space-y-4">
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Provider">{selectedEvent.provider}</Descriptions.Item>
              <Descriptions.Item label="Event ID">{selectedEvent.eventId}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={EVENT_TAG[selectedEvent.status]}>{selectedEvent.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Note">
                {selectedEvent.errorMessage || '—'}
              </Descriptions.Item>
            </Descriptions>
            <pre className="m-0 max-h-[60vh] overflow-auto rounded-xl bg-[#151914] p-4 text-xs text-[#F6F4EC]">
              {JSON.stringify(selectedEvent.payload, null, 2)}
            </pre>
          </div>
        )}
      </Drawer>

      {/* Manual Pro Activation Modal */}
      <Modal
        title="Manual NutrAI Pro Activation"
        open={Boolean(activateTarget)}
        onCancel={() => setActivateTarget(null)}
        okText="Confirm Pro Activation"
        cancelText="Cancel"
        confirmLoading={manualActivateMutation.isPending}
        onOk={() => activateForm.submit()}
      >
        {activateTarget && (
          <div className="space-y-4">
            <Alert
              type="warning"
              showIcon
              message={`Order ${activateTarget.paymentCode || activateTarget.transactionId}`}
              description={`This will grant ${activateTarget.plan?.name || 'Pro'} access to ${activateTarget.user?.email} (${formatVnd(activateTarget.amount)}) and send an immediate push notification to their device.`}
            />

            <Form<ActivateFormValues>
              form={activateForm}
              layout="vertical"
              onFinish={(values) =>
                manualActivateMutation.mutate({ id: activateTarget.id, values })
              }
            >
              <Form.Item label="Bank Statement Reference (Optional)" name="bankReference">
                <Input placeholder="e.g. FT2631799281" />
              </Form.Item>
              <Form.Item label="Manual Activation Reason" name="note">
                <Input.TextArea
                  rows={3}
                  placeholder="Enter reconciliation details (e.g. Customer transferred after the 15-min QR expiry window)"
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

