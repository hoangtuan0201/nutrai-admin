import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Alert, Button, Form, Input } from 'antd';
import { LockKeyhole, Mail } from 'lucide-react';
import { adminApi } from '@/api/admin.api';
import { extractApiError } from '@/api/http';
import { useAuthStore } from '@/stores/auth.store';

interface LoginFormValues {
  email: string;
  password: string;
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { accessToken, user, setSession } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (accessToken && user?.role === 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  const handleFinish = async (values: LoginFormValues) => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await adminApi.login(values.email.trim(), values.password);
      if (res.user.role !== 'ADMIN') {
        setErrorMsg(
          'This account has the USER role and is not authorized to access the NutrAI Admin Console.',
        );
        return;
      }

      setSession({
        accessToken: res.tokens.accessToken,
        refreshToken: res.tokens.refreshToken,
        user: res.user,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setErrorMsg(extractApiError(err, 'Invalid email or password.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F4EC] px-6 py-12">
      <div className="w-full max-w-[420px]">
        <div className="mb-7 flex justify-center">
          <img
            src="/logo-transparent.png"
            alt="NutrAI"
            className="h-11 w-auto object-contain"
          />
        </div>

        <div className="nutrai-panel p-8 sm:p-9">
          <h2 className="m-0 text-2xl font-bold tracking-tight text-[#151914]">
            Admin Sign In
          </h2>
          <p className="mt-2 mb-6 text-sm text-[#5C594E]">
            Sign in with an <strong className="text-[#151914]">ADMIN</strong> account to manage NutrAI.
          </p>

          {errorMsg && (
            <Alert
              type="error"
              showIcon
              message={errorMsg}
              className="mb-5"
            />
          )}

          <Form<LoginFormValues>
            layout="vertical"
            onFinish={handleFinish}
            requiredMark={false}
            size="large"
          >
            <Form.Item
              label={<span className="font-semibold text-[#151914]">Admin Email</span>}
              name="email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email address' },
              ]}
            >
              <Input
                prefix={<Mail size={16} className="text-[#8A8679] mr-1" />}
                placeholder="admin@nutraai.com"
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item
              label={<span className="font-semibold text-[#151914]">Password</span>}
              name="password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password
                prefix={<LockKeyhole size={16} className="text-[#8A8679] mr-1" />}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              className="mt-2 h-11 text-[15px] font-bold"
            >
              Sign In
            </Button>
          </Form>
        </div>
      </div>
    </div>
  );
};

