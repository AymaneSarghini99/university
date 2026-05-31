import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Heart,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
} from "lucide-react";
import { useUniAuth } from "@/context/UniAuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const navItems = [
  { to: "/uni/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/uni/students", label: "Students", icon: Search },
  { to: "/uni/interested", label: "Interested", icon: Heart },
  { to: "/uni/settings", label: "Settings", icon: Settings },
];

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, account, loading, isDevPreview } = useUniAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  if (isDevPreview || (user && account)) {
    return <>{children}</>;
  }

  return <Navigate to="/uni/login" replace />;
}

export function AppShell() {
  const { account, signOut } = useUniAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed out" });
    navigate("/uni/login");
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#fafafa]">
        <div className="flex min-h-screen">
          <aside className="hidden w-64 shrink-0 border-r border-border/60 bg-white md:flex md:flex-col">
            <div className="flex items-center gap-3 border-b border-border/60 px-6 py-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Sallam Partners</p>
                <p className="text-xs text-muted-foreground">University Portal</p>
              </div>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-brand-light text-brand-dark"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </nav>

            <div className="border-t border-border/60 p-4">
              <div className="mb-3 rounded-lg bg-secondary/60 px-3 py-2">
                <p className="truncate text-sm font-medium text-foreground">
                  {account?.university?.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">{account?.full_name}</p>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-muted-foreground"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-20 border-b border-border/60 bg-white/80 backdrop-blur-md">
              <div className="flex items-center justify-between px-4 py-4 md:px-8">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Partner Portal
                  </p>
                  <h1 className="text-lg font-semibold text-foreground">
                    {account?.university?.name}
                  </h1>
                </div>
                <div className="flex items-center gap-2 md:hidden">
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <nav className="flex gap-1 overflow-x-auto border-t border-border/40 px-4 py-2 md:hidden">
                {navItems.map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      cn(
                        "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium",
                        isActive ? "bg-brand text-white" : "bg-secondary text-muted-foreground",
                      )
                    }
                  >
                    {label}
                  </NavLink>
                ))}
              </nav>
            </header>

            <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
