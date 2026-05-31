import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you are looking for does not exist.
        </p>
        <Button asChild className="mt-6 bg-brand hover:bg-brand-dark">
          <Link to="/uni/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
