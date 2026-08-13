import { useEffect, useState } from "react";
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  BookOpen,
  Building2,
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Plus,
  Tag,
} from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { OpsGlobalSearch } from "@/components/ops/OpsGlobalSearch";
import { createBlankOpsUniversity } from "@/services/opsService";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const primaryNavItems = [
  { to: "/ops", label: "Today", icon: LayoutDashboard, end: true },
  { to: "/ops/library", label: "Library", icon: BookOpen },
];

const universitiesPath = "/ops/universities";

const catalogSubNavItems = [
  { to: "/ops/programs", label: "Programs", icon: GraduationCap },
  { to: "/ops/offers", label: "Offers", icon: Tag },
];

const catalogPaths = [universitiesPath, ...catalogSubNavItems.map((item) => item.to)];

function isUniversitiesPath(pathname: string) {
  return pathname === universitiesPath || pathname.startsWith(`${universitiesPath}/`);
}

function isCatalogPath(pathname: string) {
  return catalogPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function navLinkClass(isActive: boolean) {
  return cn(
    "group flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-[13px] font-medium transition-all duration-150",
    isActive
      ? "bg-brand/10 text-brand-dark shadow-[inset_0_0_0_1px_rgba(47,126,109,0.12)]"
      : "text-muted-foreground hover:bg-black/[0.03] hover:text-foreground",
  );
}

function navIconClass(isActive: boolean) {
  return cn(
    "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
    isActive
      ? "bg-brand text-white shadow-sm shadow-brand/25"
      : "bg-black/[0.04] text-muted-foreground group-hover:bg-black/[0.06] group-hover:text-foreground",
  );
}

function OpsAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, roleLoading, isAdmin, mode, authError, retryRoleCheck, signOut } =
    useAuthContext();

  if (loading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f4f6]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  if (user && !isAdmin && mode === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f3f4f6] px-4">
        <p className="max-w-md text-center text-sm text-muted-foreground">
          {authError || "Could not verify admin access."}
        </p>
        <div className="flex gap-2">
          <Button onClick={() => void retryRoleCheck()}>Retry</Button>
          <Button variant="outline" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  if (user && isAdmin) return <>{children}</>;
  if (user && mode === "partner") return <Navigate to="/uni/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

export function OpsShell() {
  const { signOut, user } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [catalogOpen, setCatalogOpen] = useState(() => isCatalogPath(location.pathname));
  const [creatingUniversity, setCreatingUniversity] = useState(false);

  const isCatalogActive = isCatalogPath(location.pathname);
  const isUniversitiesActive = isUniversitiesPath(location.pathname);

  useEffect(() => {
    if (isCatalogActive) setCatalogOpen(true);
  }, [isCatalogActive]);

  const userInitial = user?.email?.charAt(0).toUpperCase() ?? "S";
  const userName = user?.email?.split("@")[0]?.replace(".", " ") ?? "Admin";

  const showNewUniversity =
    location.pathname.startsWith("/ops/universities") ||
    location.pathname === "/ops/library";

  const handleNewUniversity = async () => {
    if (creatingUniversity) return;
    setCreatingUniversity(true);
    try {
      const uni = await createBlankOpsUniversity();
      navigate(`/ops/universities/${uni.id}`);
    } catch (e) {
      toast({
        title: "Could not create university",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setCreatingUniversity(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed out" });
    navigate("/login");
  };

  return (
    <OpsAuthGuard>
      <div className="min-h-screen bg-[#f3f4f6]">
        <div className="mx-auto flex min-h-screen max-w-[1600px] gap-3 p-3 md:gap-4 md:p-4">
          <aside className="hidden shrink-0 md:block md:w-[210px]">
            <div className="sticky top-4 flex h-[calc(100vh-4.5rem)] min-h-[520px] max-h-[780px] flex-col rounded-2xl border border-black/[0.06] bg-white/90 p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur-xl">
              <div className="mb-3 flex items-center px-1.5 pt-0.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-dark text-white shadow-sm shadow-brand/20">
                  <GraduationCap className="h-4 w-4" strokeWidth={2.25} />
                </div>
              </div>

              <nav className="flex-1 space-y-0.5 overflow-y-auto">
                {primaryNavItems.map(({ to, label, icon: Icon, end }) => (
                  <NavLink key={to} to={to} end={end} className={({ isActive }) => navLinkClass(isActive)}>
                    {({ isActive }) => (
                      <>
                        <span className={navIconClass(isActive)}>
                          <Icon className="h-[15px] w-[15px]" strokeWidth={2} />
                        </span>
                        {label}
                      </>
                    )}
                  </NavLink>
                ))}

                <div>
                  <div className="relative">
                    <NavLink
                      to={universitiesPath}
                      className={({ isActive }) =>
                        cn(navLinkClass(isActive || isUniversitiesActive), "pr-9")
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span className={navIconClass(isActive || isUniversitiesActive)}>
                            <Building2 className="h-[15px] w-[15px]" strokeWidth={2} />
                          </span>
                          <span className="flex-1 text-left">Universities</span>
                        </>
                      )}
                    </NavLink>
                    <button
                      type="button"
                      aria-label={catalogOpen ? "Collapse programs and offers" : "Expand programs and offers"}
                      onClick={() => setCatalogOpen((open) => !open)}
                      className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-black/[0.04] hover:text-foreground"
                    >
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 opacity-60 transition-transform duration-200",
                          catalogOpen && "rotate-180",
                        )}
                      />
                    </button>
                  </div>

                  {catalogOpen && (
                    <div className="ml-5 mt-0.5 space-y-0.5 border-l border-black/[0.06] pl-2">
                      {catalogSubNavItems.map(({ to, label, icon: Icon }) => (
                        <NavLink key={to} to={to} className={({ isActive }) => navLinkClass(isActive)}>
                          {({ isActive }) => (
                            <>
                              <span className={cn(navIconClass(isActive), "h-7 w-7")}>
                                <Icon className="h-[13px] w-[13px]" strokeWidth={2} />
                              </span>
                              {label}
                            </>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              </nav>

              <div className="mt-3 rounded-xl border border-black/[0.05] bg-black/[0.02] p-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-[11px] font-semibold text-white">
                    {userInitial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium capitalize leading-tight">{userName}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-7 w-full justify-start gap-1.5 rounded-lg text-xs text-muted-foreground hover:bg-black/[0.04] hover:text-foreground"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign out
                </Button>
              </div>
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col gap-3 md:gap-4">
            <header className="sticky top-3 z-30 rounded-2xl border border-black/[0.06] bg-white/85 px-3 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur-xl md:top-4 md:px-4 md:py-3">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-dark text-white md:hidden">
                  <GraduationCap className="h-4 w-4" />
                </div>

                <OpsGlobalSearch />

                <div className="ml-auto flex items-center gap-1.5 md:gap-2">
                  {showNewUniversity ? (
                    <Button
                      size="sm"
                      className="h-9 gap-1.5 rounded-xl px-3.5 shadow-sm shadow-brand/20"
                      disabled={creatingUniversity}
                      onClick={() => void handleNewUniversity()}
                    >
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">New University</span>
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl hover:bg-black/[0.04]"
                  >
                    <Bell className="h-4 w-4" />
                  </Button>
                  <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-xs font-semibold text-white shadow-sm sm:flex">
                    {userInitial}
                  </div>
                </div>
              </div>

              <nav className="mt-2.5 flex flex-wrap gap-1.5 pb-0.5 md:hidden">
                {primaryNavItems.map(({ to, label, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cn(
                        "whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                        isActive
                          ? "bg-brand text-white shadow-sm shadow-brand/25"
                          : "bg-black/[0.04] text-muted-foreground hover:bg-black/[0.06]",
                      )
                    }
                  >
                    {label}
                  </NavLink>
                ))}
                <div className="flex items-center gap-1">
                  <NavLink
                    to={universitiesPath}
                    className={({ isActive }) =>
                      cn(
                        "whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                        isActive || isUniversitiesActive
                          ? "bg-brand text-white shadow-sm shadow-brand/25"
                          : "bg-black/[0.04] text-muted-foreground hover:bg-black/[0.06]",
                      )
                    }
                  >
                    Universities
                  </NavLink>
                  <button
                    type="button"
                    aria-label={catalogOpen ? "Hide programs and offers" : "Show programs and offers"}
                    onClick={() => setCatalogOpen((open) => !open)}
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full transition-all",
                      catalogOpen
                        ? "bg-brand text-white shadow-sm shadow-brand/25"
                        : "bg-black/[0.04] text-muted-foreground hover:bg-black/[0.06]",
                    )}
                  >
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 transition-transform duration-200",
                        catalogOpen && "rotate-180",
                      )}
                    />
                  </button>
                </div>
                {catalogOpen &&
                  catalogSubNavItems.map(({ to, label }) => (
                    <NavLink
                      key={to}
                      to={to}
                      className={({ isActive }) =>
                        cn(
                          "whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                          isActive
                            ? "bg-brand text-white shadow-sm shadow-brand/25"
                            : "bg-black/[0.04] text-muted-foreground hover:bg-black/[0.06]",
                        )
                      }
                    >
                      {label}
                    </NavLink>
                  ))}
              </nav>
            </header>

            <main className="flex-1 px-0.5 pb-2 md:px-1 md:pb-4">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </OpsAuthGuard>
  );
}
