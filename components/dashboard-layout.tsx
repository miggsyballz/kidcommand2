import SidebarProvider from "./SidebarProvider"
import MainContent from "./MainContent"

const DashboardLayout = () => {
  return (
    <div className="dashboard-layout">
      <SidebarProvider defaultOpen={true}>{/* Sidebar component will be rendered here */}</SidebarProvider>
      <MainContent>{/* Main content component will be rendered here */}</MainContent>
    </div>
  )
}

export default DashboardLayout
