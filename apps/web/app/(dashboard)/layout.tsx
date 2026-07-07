import DashboardNavbar from '@/components/dashboard/navbar'
import DashboardTabs from '@/components/dashboard/tabs'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-scale-zone="dashboard"
      className="flex flex-col bg-gray-50 overflow-hidden"
      style={{ height: '100dvh' }}
    >
      <DashboardNavbar />
      <DashboardTabs />
      {/* flex-1 + min-h-0 gives <main> a concrete height so h-full in each page resolves correctly */}
      <main className="flex-1 min-h-0 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
