import DashboardNavbar from '@/components/dashboard/navbar'
import DashboardTabs from '@/components/dashboard/tabs'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-scale-zone="dashboard" className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <DashboardNavbar />
      <DashboardTabs />
      <main className="flex-1 overflow-hidden pb-14 md:pb-0">
        {children}
      </main>
    </div>
  )
}
