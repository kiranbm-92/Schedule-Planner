import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { formatDisplayDate, formatDisplayTime } from '@/utils/timeUtils'
import { ChevronDown, LogOut, Settings, Home, Menu, X } from 'lucide-react'

const Header: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showMenu, setShowMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrator',
      wfm: 'WFM Manager',
      tl: 'Team Lead',
      agent: 'Agent',
    }
    return labels[role] || role
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left: Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">WFM Portal</h1>
            <p className="text-xs text-gray-500">Schedule Planner & AUX Tracker</p>
          </div>
        </div>

        {/* Center: Date and Time */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          <div className="text-center">
            <p className="font-semibold text-gray-900">{formatDisplayDate(currentTime)}</p>
            <p className="text-gray-600">{formatDisplayTime(currentTime)}</p>
          </div>
        </div>

        {/* Right: User Menu */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="md:hidden text-gray-600 hover:text-gray-900"
          >
            {showMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{getRoleLabel(user?.role || '')}</p>
              </div>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-gray-200">
                  <p className="font-medium text-gray-900">{user?.name}</p>
                  <p className="text-sm text-gray-500">{user?.employee_id}</p>
                  <p className="text-xs text-gray-400 mt-1">{getRoleLabel(user?.role || '')}</p>
                </div>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-200"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Time Display */}
      <div className="md:hidden px-4 py-2 bg-gray-50 border-t border-gray-200 text-center text-xs">
        <p className="font-semibold text-gray-900">{formatDisplayDate(currentTime)}</p>
        <p className="text-gray-600">{formatDisplayTime(currentTime)}</p>
      </div>
    </header>
  )
}

export default Header
