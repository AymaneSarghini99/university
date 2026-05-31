import { useUniAuth } from "@/context/UniAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const { account } = useUniAuth();

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <section className="space-y-2">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Your partner account details. Contact Sallam to update university information.
        </p>
      </section>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Name</p>
            <p className="font-medium">{account?.full_name}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
            <p className="font-medium">{account?.email}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Role</p>
            <Badge variant="secondary" className="mt-1 capitalize">
              {account?.role}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">University</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Institution</p>
            <p className="font-medium">{account?.university?.name}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Country</p>
            <p className="font-medium">{account?.university?.country ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Partner tier</p>
            <Badge variant="outline" className="mt-1 capitalize">
              {account?.university?.tier ?? "partner"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
