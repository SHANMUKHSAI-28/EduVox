import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  FileText,
  Settings,
  User
} from 'lucide-react'

interface SidebarItem {
  name: string
  href: string
  icon: React.ElementType
  badge?: string
}

const sidebarItems: SidebarItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Universities', href: '/universities', icon: GraduationCap },
  { name: 'Applications', href: '/applications', icon: FileText },
  { name: 'Courses', href: '/courses', icon: BookOpen },
  { name: 'Schedule', href: '/schedule', icon: Calendar },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Settings', href: '/settings', icon: Settings },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:inset-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-center h-16 px-4 bg-primary-600">
            <h1 className="text-xl font-semibold text-white">EduVox</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {sidebarItems.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${isActive
                      ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                  {item.badge && (
                    <span className="ml-auto px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              © 2025 EduVox. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
