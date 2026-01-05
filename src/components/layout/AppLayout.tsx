import { ReactNode } from "react";
import BottomNav from "./BottomNav";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header with brand logo */}
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
        <div className="max-w-5xl mx-auto px-5 h-32 sm:h-40 md:h-48 lg:h-56 flex items-center justify-center">
          <a href="/" className="flex items-center">
            <img src="/logo.png" alt="Cabernet Wine Club" className="h-28 sm:h-36 md:h-44 lg:h-52 w-auto object-contain" />
          </a>
        </div>
      </header>

      <main className="pb-28 pt-2">{children}</main>

      {/* Footer logo and copyright above bottom nav */}
      <footer className="border-t border-border/40">
        <div className="max-w-5xl mx-auto px-5 py-6 flex flex-col items-center justify-center gap-3 text-center">
          <img src="/logo.png" alt="Cabernet Wine Club" className="h-14 sm:h-[4.5rem] md:h-[5.5rem] lg:h-[6.5rem] w-auto opacity-90 object-contain" />
          <p className="text-xs sm:text-sm text-muted-foreground">
            © 2026 Cabernet Steakhouse. All Rights Reserved. Developed by The Graphix Guru LLC.
          </p>
        </div>
      </footer>

      <BottomNav />
    </div>
  );
};

export default AppLayout;
