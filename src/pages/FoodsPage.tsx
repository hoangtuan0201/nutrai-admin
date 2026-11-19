import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  App as AntApp,
  Button,
  Drawer,
  Form,
  Image,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Switch,
  Table,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckCircle2,
  ImagePlus,
  Pencil,
  Plus,
  Search,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';
import { adminApi } from '@/api/admin.api';
import { extractApiError } from '@/api/http';
import type { FoodItem } from '@/types/admin.types';
import { fileToDataUri, formatNumber } from '@/utils/format';

interface FoodFormValues {
  name: string;
  description?: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  servingUnit: string;
  defaultServingSize: number;
  isVerified: boolean;
  isActive: boolean;
}

export const FoodsPage: React.FC = () => {
  const { message } = AntApp.useApp();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Food drawer state
  const [foodDrawerOpen, setFoodDrawerOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [pendingBase64, setPendingBase64] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [foodForm] = Form.useForm<FoodFormValues>();

  const foodsQuery = useQuery({
    queryKey: ['admin', 'foods', { page, limit, search, activeFilter }],
    queryFn: () =>
      adminApi.listFoods({
        page,
        limit,
        search: search || undefined,
        isActive:
          activeFilter === 'ALL' ? undefined : activeFilter === 'ACTIVE',
      }),
  });

  const saveFoodMutation = useMutation({
    mutationFn: async (values: FoodFormValues) => {
      if (editingFood) {
        return adminApi.updateFood(editingFood.id, {
          ...values,
          ...(pendingBase64 ? { imageBase64: pendingBase64 } : {}),
          ...(removeImage && !pendingBase64 ? { removeImage: true } : {}),
        });
      }
      return adminApi.createFood({
        ...values,
        ...(pendingBase64 ? { imageBase64: pendingBase64 } : {}),
      });
    },
    onSuccess: () => {
      message.success(editingFood ? 'Food item updated' : 'Standard food item added');
      setFoodDrawerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'foods'] });
    },
    onError: (err) => message.error(extractApiError(err)),
  });

  const deactivateFoodMutation = useMutation({
    mutationFn: adminApi.deactivateFood,
    onSuccess: () => {
      message.success('Food item hidden from search');
      queryClient.invalidateQueries({ queryKey: ['admin', 'foods'] });
    },
    onError: (err) => message.error(extractApiError(err)),
  });

  const openCreateFood = () => {
    setEditingFood(null);
    setPendingBase64(null);
    setRemoveImage(false);
    foodForm.setFieldsValue({
      name: '',
      description: '',
      caloriesPer100g: 100,
      proteinPer100g: 0,
      carbsPer100g: 0,
      fatPer100g: 0,
      servingUnit: 'g',
      defaultServingSize: 100,
      isVerified: true,
      isActive: true,
    });
    setFoodDrawerOpen(true);
  };

  const openEditFood = (food: FoodItem) => {
    setEditingFood(food);
    setPendingBase64(null);
    setRemoveImage(false);
    foodForm.setFieldsValue({
      name: food.name,
      description: food.description ?? '',
      caloriesPer100g: food.caloriesPer100g,
      proteinPer100g: food.proteinPer100g,
      carbsPer100g: food.carbsPer100g,
      fatPer100g: food.fatPer100g,
      servingUnit: food.servingUnit,
      defaultServingSize: food.defaultServingSize,
      isVerified: food.isVerified,
      isActive: food.isActive,
    });
    setFoodDrawerOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      message.error('Only PNG, JPG, or WEBP images are supported');
      return;
    }
    if (file.size > 4.5 * 1024 * 1024) {
      message.error('Image size must not exceed 4.5 MB');
      return;
    }

    try {
      const dataUri = await fileToDataUri(file);
      setPendingBase64(dataUri);
      setRemoveImage(false);
    } catch {
      message.error('Failed to read image file. Please try another image.');
    }
  };

  const previewUrl =
    pendingBase64 || (!removeImage ? editingFood?.imageUrl : null) || null;

  const columns: ColumnsType<FoodItem> = [
    {
      title: 'Food Item',
      key: 'name',
      render: (_, record) => (
        <div className="flex items-center gap-3 min-w-0">
          {record.imageUrl ? (
            <Image
              src={record.imageUrl}
              alt={record.name}
              width={44}
              height={44}
              className="rounded-lg object-cover shrink-0 border border-[rgba(21,25,20,0.08)]"
            />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#FAF9F3] border border-[rgba(21,25,20,0.08)] text-[#8A8679]">
              <UtensilsCrossed size={17} />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-semibold text-[#151914]">{record.name}</span>
              {record.isVerified && (
                <span title="Verified">
                  <CheckCircle2 size={14} className="shrink-0 text-[#3B7A23]" />
                </span>
              )}
            </div>
            <div className="text-xs text-[#5C594E]">
              Serving: {record.defaultServingSize}
              {record.servingUnit}
              {record.description ? ` · ${record.description}` : ''}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Calories / 100g',
      dataIndex: 'caloriesPer100g',
      width: 125,
      align: 'right',
      render: (val: number) => (
        <span className="font-bold text-[#B85E00] tabular-nums">{formatNumber(val)} kcal</span>
      ),
    },
    {
      title: 'P / C / F (g / 100g)',
      key: 'macros',
      width: 185,
      render: (_, r) => (
        <div className="flex items-center gap-2 text-xs tabular-nums">
          <span className="font-semibold text-[#3B62D4]">P {r.proteinPer100g}g</span>
          <span className="text-[#8A8679]">·</span>
          <span className="font-semibold text-[#3B7A23]">C {r.carbsPer100g}g</span>
          <span className="text-[#8A8679]">·</span>
          <span className="font-semibold text-[#C47B09]">F {r.fatPer100g}g</span>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      width: 115,
      render: (active: boolean) =>
        active ? <Tag color="green">Active</Tag> : <Tag color="default">Hidden</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 135,
      align: 'right',
      render: (_, record) => (
        <div className="flex justify-end gap-1">
          <Button
            size="small"
            icon={<Pencil size={13} />}
            onClick={() => openEditFood(record)}
          >
            Edit
          </Button>
          {record.isActive && (
            <Popconfirm
              title="Hide this food item?"
              description="It will no longer appear in search; existing meal history remains intact."
              okText="Hide"
              cancelText="Cancel"
              onConfirm={() => deactivateFoodMutation.mutate(record.id)}
            >
              <Button size="small" danger icon={<Trash2 size={13} />} aria-label="Hide food item" />
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Toolbar */}
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
            placeholder="Search food name (e.g. Pho Bo, Chicken Breast...)"
            prefix={<Search size={15} className="text-[#8A8679]" />}
            className="w-full sm:w-64"
          />

          <Select
            value={activeFilter}
            onChange={(val) => {
              setActiveFilter(val);
              setPage(1);
            }}
            className="w-36"
            options={[
              { label: 'All statuses', value: 'ALL' },
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Hidden', value: 'INACTIVE' },
            ]}
          />
        </div>

        <div className="flex items-center gap-2.5">
          <Button type="primary" icon={<Plus size={15} />} onClick={openCreateFood}>
            Add Standard Food
          </Button>
        </div>
      </div>

      {foodsQuery.isError && (
        <Alert
          type="error"
          showIcon
          message="Failed to load food catalog"
          description={extractApiError(foodsQuery.error)}
          action={<Button size="small" onClick={() => foodsQuery.refetch()}>Retry</Button>}
        />
      )}

      {/* Foods Table */}
      <div className="nutrai-panel overflow-hidden">
        <Table<FoodItem>
          rowKey="id"
          columns={columns}
          dataSource={foodsQuery.data?.items ?? []}
          loading={foodsQuery.isLoading || foodsQuery.isFetching}
          scroll={{ x: 820 }}
          pagination={{
            current: page,
            pageSize: limit,
            total: foodsQuery.data?.meta.total ?? 0,
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

      {/* Create / Edit Food Drawer */}
      <Drawer
        title={editingFood ? `Edit: ${editingFood.name}` : 'Add Standard Food'}
        open={foodDrawerOpen}
        onClose={() => setFoodDrawerOpen(false)}
        width={520}
        extra={
          <Button
            type="primary"
            loading={saveFoodMutation.isPending}
            onClick={() => foodForm.submit()}
          >
            {editingFood ? 'Save Changes' : 'Create Food'}
          </Button>
        }
      >
        <Form<FoodFormValues>
          form={foodForm}
          layout="vertical"
          onFinish={(values) => saveFoodMutation.mutate(values)}
          requiredMark={false}
        >
          {/* Cloudinary Photo Picker */}
          <div className="mb-5 nutrai-panel-subtle p-4">
            <div className="text-xs font-semibold text-[#5C594E] mb-2.5">
              Standard food photo (automatically uploaded to Cloudinary)
            </div>
            <div className="flex items-center gap-4">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-20 w-20 rounded-xl object-cover border border-[rgba(21,25,20,0.12)]"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-white border border-dashed border-[rgba(21,25,20,0.2)] text-[#8A8679]">
                  <ImagePlus size={22} />
                </div>
              )}

              <div className="space-y-2">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[rgba(21,25,20,0.18)] bg-white px-3 py-1.5 text-xs font-semibold text-[#151914] hover:border-[#151914]">
                  <ImagePlus size={14} />
                  <span>{previewUrl ? 'Choose another image' : 'Upload image'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {previewUrl && (
                  <Button
                    type="link"
                    size="small"
                    danger
                    className="!block !px-0"
                    onClick={() => {
                      setPendingBase64(null);
                      setRemoveImage(true);
                    }}
                  >
                    Remove current image
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Form.Item
            label="Food Name"
            name="name"
            rules={[{ required: true, message: 'Please enter the food name' }]}
          >
            <Input placeholder="e.g. Pho Bo Tai Chin (1 standard bowl)" />
          </Form.Item>

          <Form.Item label="Short Description" name="description">
            <Input.TextArea rows={2} placeholder="Ingredient notes or USDA reference source..." />
          </Form.Item>

          <div className="grid grid-cols-2 gap-3">
            <Form.Item
              label="Calories / 100g (kcal)"
              name="caloriesPer100g"
              rules={[{ required: true, message: 'Enter calories' }]}
            >
              <InputNumber min={0} max={900} className="w-full" />
            </Form.Item>
            <Form.Item
              label="Protein / 100g (g)"
              name="proteinPer100g"
              rules={[{ required: true, message: 'Enter protein' }]}
            >
              <InputNumber min={0} max={100} step={0.1} className="w-full" />
            </Form.Item>
            <Form.Item
              label="Carbs / 100g (g)"
              name="carbsPer100g"
              rules={[{ required: true, message: 'Enter carbs' }]}
            >
              <InputNumber min={0} max={100} step={0.1} className="w-full" />
            </Form.Item>
            <Form.Item
              label="Fat / 100g (g)"
              name="fatPer100g"
              rules={[{ required: true, message: 'Enter fat' }]}
            >
              <InputNumber min={0} max={100} step={0.1} className="w-full" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Form.Item label="Serving Unit" name="servingUnit">
              <Input placeholder="g / ml / bowl / piece" />
            </Form.Item>
            <Form.Item label="Default Serving Size" name="defaultServingSize">
              <InputNumber min={1} max={5000} className="w-full" />
            </Form.Item>
          </div>

          <div className="flex items-center gap-8 pt-2">
            <Form.Item name="isVerified" valuePropName="checked" label="Verified" className="mb-0">
              <Switch />
            </Form.Item>
            <Form.Item name="isActive" valuePropName="checked" label="Visible in search" className="mb-0">
              <Switch />
            </Form.Item>
          </div>
        </Form>
      </Drawer>
    </div>
  );
};

