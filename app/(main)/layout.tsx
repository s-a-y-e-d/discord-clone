import { ModeToggle } from "@/components/mode-toggle";

const MainLayout = async ({
  children
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className="h-full">
      <div className="hidden md:flex h-full w-[72px] z-30 flex-col fixed inset-y-0">
        {/* Placeholder for Navigation Sidebar */}
      </div>
      <main className="md:pl-[72px] h-full">
        <div className="absolute top-4 right-4 z-50">
          <ModeToggle />
        </div>
        {children}
      </main>
    </div>
  );
}

export default MainLayout;
