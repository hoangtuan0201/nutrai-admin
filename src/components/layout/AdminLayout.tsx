import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Button, Drawer, Dropdown, Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import {
  BellRing,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

const { Sider, Header, Content } = Layout;

const NAV_ITEMS = [
  {
    key: '/',
    label: 'Overview',
    icon: <LayoutDashboard size={17} strokeWidth={1.85} />,
  },
  {
    key: '/users',
    label: 'Users',
    icon: <Users size={17} strokeWidth={1.85} />,
  },
  {
    key: '/foods',
    label: 'Food Database',
    icon: <UtensilsCrossed size={17} strokeWidth={1.85} />,
  },
  {
    key: '/payments',
    label: 'Payments & Pro',
    icon: <CreditCard size={17} strokeWidth={1.85} />,
  },
  {
    key: '/notifications',
    label: 'Push Notifications',
    icon: <BellRing size={17} strokeWidth={1.85} />,
  },
];

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Operations Overview',
  '/users': 'User Management',
  '/foods': 'Food Database',
  '/payments': 'Transactions & SePay Reconciliation',
  '/notifications': 'Push Notification Campaigns',
};

export const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const selectedKey =
    NAV_ITEMS.find((item) => item.key === location.pathname)?.key ?? '/';
  const pageTitle = ROUTE_TITLES[selectedKey] ?? 'NutrAI Admin';

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileNavOpen(false);
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'role',
      label: (
        <div className="py-1">
          <div className="font-semibold text-[#151914]">{user?.name || 'Admin NutrAI'}</div>
          <div className="text-xs text-[#5C594E]">{user?.email}</div>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'logout',
      danger: true,
      icon: <LogOut size={15} />,
      label: 'Sign Out',
      onClick: () => {
        logout();
        navigate('/login', { replace: true });
      },
    },
  ];

  const renderSidebarContent = (isCompact: boolean) => (
    <div className="flex h-full flex-col bg-[#151914] text-[#F6F4EC]">
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
        {!isCompact ? (
          <div className="flex items-center gap-2.5">
            <img
              src="/logo-transparent-dark.png"
              alt="NutrAI"
              className="h-8 w-auto object-contain"
            />
            <span className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-[#FF9114]">
              ADMIN
            </span>
          </div>
        ) : (
          <img
            src="/logo-mark.png"
            alt="NutrAI"
            className="mx-auto h-7 w-7 object-contain"
          />
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={({ key }) => handleNavigate(key)}
          items={NAV_ITEMS}
          className="nutrai-sider-menu border-none"
        />
      </div>

      <div className="border-t border-white/10 p-3">
        {!isCompact ? (
          <div className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.06] px-3 py-2.5">
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-[#F6F4EC]">
                {user?.name || 'Admin NutrAI'}
              </div>
              <div className="truncate text-[11px] text-white/60">{user?.email}</div>
            </div>
            <Button
              type="text"
              size="small"
              aria-label="Sign out"
              onClick={() => {
                logout();
                navigate('/login', { replace: true });
              }}
              className="flex items-center justify-center text-white/70 hover:!text-[#FF9114] hover:!bg-white/10"
              icon={<LogOut size={15} />}
            />
          </div>
        ) : (
          <Button
            type="text"
            block
            aria-label="Sign out"
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
            className="flex items-center justify-center text-white/70 hover:!text-[#FF9114] hover:!bg-white/10"
            icon={<LogOut size={16} />}
          />
        )}
      </div>
    </div>
  );

  return (
    <Layout className="min-h-screen bg-[#F6F4EC]">
      {/* Desktop Left Navigation Rail */}
      <Sider
        width={244}
        collapsedWidth={74}
        collapsible
        collapsed={collapsed}
        trigger={null}
        className="hidden lg:block !bg-[#151914] sticky top-0 h-screen"
      >
        {renderSidebarContent(collapsed)}
      </Sider>

      {/* Mobile Navigation Drawer */}
      <Drawer
        placement="left"
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        width={260}
        styles={{ body: { padding: 0, background: '#151914' }, header: { display: 'none' } }}
      >
        {renderSidebarContent(false)}
      </Drawer>

      <Layout className="bg-[#F6F4EC] min-w-0">
        <Header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[rgba(21,25,20,0.08)] bg-[#F6F4EC]/95 px-4 sm:px-7 backdrop-blur-sm">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              type="text"
              aria-label="Open navigation menu"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden flex items-center justify-center text-[#151914]"
              icon={<MenuIcon size={18} />}
            />
            <Button
              type="text"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={() => setCollapsed((c) => !c)}
              className="hidden lg:inline-flex items-center justify-center text-[#5C594E] hover:!text-[#151914]"
              icon={collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            />
            <h1 className="m-0 truncate text-lg sm:text-xl font-bold tracking-tight text-[#151914]">
              {pageTitle}
            </h1>
          </div>

          <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
            <button
              type="button"
              className="flex cursor-pointer items-center gap-2.5 rounded-full border border-[rgba(21,25,20,0.12)] bg-white py-1 pl-1.5 pr-3 text-left transition-colors hover:border-[rgba(21,25,20,0.28)]"
            >
              <Avatar
                size={28}
                src={user?.avatarUrl || undefined}
                style={{ backgroundColor: '#151914', color: '#F6F4EC', fontSize: 12, fontWeight: 700 }}
              >
                {(user?.name || user?.email || 'A').charAt(0).toUpperCase()}
              </Avatar>
              <span className="hidden sm:inline text-xs font-semibold text-[#151914]">
                {user?.name || 'Admin'}
              </span>
            </button>
          </Dropdown>
        </Header>

        <Content className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-7">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

