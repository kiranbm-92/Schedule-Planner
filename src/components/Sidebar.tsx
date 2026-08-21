import React from 'react'
import { useAuthStore } from '@/stores/auth'
import {
  BarChart3,
  Calendar,
  Users,
  Activity,
  Settings,
  FileText,
  LogOut,
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

interface NavItem {
  icon: React.ReactNode
  label: string
  path: string
  roles: string[]
}

const Sidebar: React.FC = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const navItems: NavItem[] = [
    {
      icon: <BarChart3 className="w-5 h-5" />,
      label: 'Dashboard',
      path: '/dashboard',
      roles: ['admin', 'wfm', 'tl'],
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      label: 'Schedule Planner',
      path: '/schedule',
      roles: ['admin', 'wfm'],
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      label: 'My Schedule',
      path: '/agent/schedule',
      roles: ['agent'],
    },
    {
      icon: <Activity className="w-5 h-5" />,
      label: 'Real-Time Status',
      path: '/realtime',
      roles: ['admin', 'wfm', 'tl'],
    },
    {
      icon: <FileText className="w-5 h-5" />,
      label: 'AUX Dashboard',
      path: '/aux-dashboard',
      roles: ['admin', 'wfm', 'tl'],
    },
    {
      icon: <FileText className="w-5 h-5" />,
      label: 'Reports',
      path: '/reports',
      roles: ['admin', 'wfm', 'tl'],
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: 'Agent Master',
      path: '/agent-master',
      roles: ['admin', 'wfm'],
    },
    {
      icon: <Settings className="w-5 h-5" />,
      label: 'AUX Master',
      path: '/aux-master',
      roles: ['admin', 'wfm'],
    },
    {
      icon: <Settings className="w-5 h-5" />,
      label: 'Settings',
      path: '/settings',
      roles: ['admin'],
    },
  ]

  const visibleItems = navItems.filter((item) => item.roles.includes(user?.role || ''))

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <aside className="w-64 bg-gray-900 text-white h-screen flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-800">
        <h2 className="font-bold text-lg">WFM System</h2>
        <p className="text-xs text-gray-400 mt-1">{user?.role?.toUpperCase()}</p>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {visibleItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              isActive(item.path)
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-900/20 transition"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
