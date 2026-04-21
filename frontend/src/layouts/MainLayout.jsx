import Sidebar from "@/components/Sidebar";
import Header  from "@/components/Header";

const MainLayout = ({ children }) => (
  <div className="flex h-screen overflow-hidden" style={{ background: "inherit" }}>
    {/* nav landmark handled inside Sidebar */}
    <Sidebar />

    <div className="flex flex-col flex-1 min-w-0">
      {/* banner landmark */}
      <Header />

      {/* main content landmark */}
      <main
        id="main-content"
        className="flex-1 overflow-y-auto focus:outline-none"
        tabIndex={-1}
      >
        {children}
      </main>
    </div>
  </div>
);

export default MainLayout;
