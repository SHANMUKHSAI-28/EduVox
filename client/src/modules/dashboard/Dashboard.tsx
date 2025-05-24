import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Sidebar } from '../../components/layout/Sidebar'
import { 
  Menu, 
  GraduationCap, 
  FileText, 
  Calendar, 
  TrendingUp,
  Users,
  BookOpen,
  Bell
} from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  icon: React.ElementType
  trend?: string
  trendUp?: boolean
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, trendUp }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <Icon className="h-8 w-8 text-primary-600" />
      </div>
      <div className="ml-5 w-0 flex-1">
        <dl>
          <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
          <dd className="text-lg font-medium text-gray-900">{value}</dd>
        </dl>
      </div>
    </div>
    {trend && (
      <div className="mt-4">
        <div className={`inline-flex items-baseline px-2.5 py-0.5 rounded-full text-sm font-medium ${
          trendUp ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <TrendingUp className={`-ml-1 mr-0.5 flex-shrink-0 h-4 w-4 ${
            trendUp ? 'text-green-500' : 'text-red-500 transform rotate-180'
          }`} />
          <span>{trend}</span>
        </div>
      </div>
    )}
  </div>
)

export const Dashboard: React.FC = () => {
  const { profile } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const stats = [
    {
      title: 'Universities Shortlisted',
      value: '12',
      icon: GraduationCap,
      trend: '+2 this week',
      trendUp: true
    },
    {
      title: 'Applications Submitted',
      value: '8',
      icon: FileText,
      trend: '+3 this month',
      trendUp: true
    },
    {
      title: 'Upcoming Deadlines',
      value: '5',
      icon: Calendar,
      trend: '2 this week',
      trendUp: false
    },
    {
      title: 'Consultations',
      value: '3',
      icon: Users,
      trend: 'Next: Tomorrow',
      trendUp: true
    }
  ]

  const recentActivities = [
    {
      id: 1,
      type: 'university',
      message: 'Added University of Toronto to shortlist',
      time: '2 hours ago'
    },
    {
      id: 2,
      type: 'application',
      message: 'Submitted application to MIT',
      time: '1 day ago'
    },
    {
      id: 3,
      type: 'consultation',
      message: 'Consultation scheduled with Dr. Smith',
      time: '2 days ago'
    },
    {
      id: 4,
      type: 'document',
      message: 'Uploaded SOP for Stanford University',
      time: '3 days ago'
    }
  ]

  const upcomingTasks = [
    {
      id: 1,
      task: 'Complete application for Harvard University',
      deadline: 'Dec 15, 2024',
      priority: 'high'
    },
    {
      id: 2,
      task: 'Submit IELTS scores to University of Cambridge',
      deadline: 'Dec 20, 2024',
      priority: 'medium'
    },
    {
      id: 3,
      task: 'Schedule consultation for visa guidance',
      deadline: 'Dec 25, 2024',
      priority: 'low'
    }
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-gray-500 hover:text-gray-700 lg:hidden"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="ml-4 lg:ml-0 text-2xl font-semibold text-gray-900">
                Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}!
              </h1>
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <Bell className="h-6 w-6" />
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          {/* Stats grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activities */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Activities</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {activity.type === 'university' && <GraduationCap className="h-5 w-5 text-blue-500" />}
                        {activity.type === 'application' && <FileText className="h-5 w-5 text-green-500" />}
                        {activity.type === 'consultation' && <Users className="h-5 w-5 text-purple-500" />}
                        {activity.type === 'document' && <BookOpen className="h-5 w-5 text-orange-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Upcoming Tasks */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Upcoming Tasks</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {upcomingTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{task.task}</p>
                        <p className="text-xs text-gray-500">Due: {task.deadline}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        task.priority === 'high' ? 'bg-red-100 text-red-700' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-600 transition-colors">
                  <GraduationCap className="h-6 w-6 mr-2" />
                  Find Universities
                </button>
                <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-600 transition-colors">
                  <FileText className="h-6 w-6 mr-2" />
                  Start Application
                </button>
                <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-600 transition-colors">
                  <Calendar className="h-6 w-6 mr-2" />
                  Schedule Consultation
                </button>
                <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-600 transition-colors">
                  <BookOpen className="h-6 w-6 mr-2" />
                  Explore Courses
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
