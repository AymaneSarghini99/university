import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useAuthContext } from "@/context/AuthContext";

const formSchema = z.object({
  email: z.string().min(1, { message: "Email is required." }),
  password: z.string().min(4, { message: "Password must be at least 4 characters." }),
});

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const {
    signIn,
    signOut,
    user,
    loading,
    roleLoading,
    isAdmin,
    mode,
    authError,
    retryRoleCheck,
  } = useAuthContext();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!loading && !roleLoading && user && isAdmin) {
      navigate("/ops", { replace: true });
    } else if (!loading && !roleLoading && user && mode === "partner") {
      navigate("/uni/dashboard", { replace: true });
    }
  }, [user, loading, roleLoading, isAdmin, mode, navigate]);

  useEffect(() => {
    if (!isLoading || loading || roleLoading || !user) return;

    if (!isAdmin && mode !== "partner") {
      setIsLoading(false);
      void signOut();
      toast({
        title: "Not an admin account",
        description:
          authError ??
          "This login exists but has no admin or partner access. Contact your Sallam administrator.",
        variant: "destructive",
      });
    }
  }, [isLoading, loading, roleLoading, user, isAdmin, mode, signOut, authError]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const result = await signIn(values.email, values.password);

      if (result.success) {
        toast({
          title: "Login successful",
          description: result.mode === "partner" ? "Opening partner portal…" : "Welcome to University Ops",
        });
        if (result.mode === "partner") navigate("/uni/dashboard", { replace: true });
        else if (result.mode === "admin") navigate("/ops", { replace: true });
        return;
      }

      toast({
        title: "Login failed",
        description: result.error ?? "Invalid email or password",
        variant: "destructive",
      });
    } catch {
      toast({
        title: "Login error",
        description: "An error occurred during login",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }

  const needsRoleRetry = Boolean(user && !isAdmin && mode === null && authError);

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 items-center justify-center py-16">
        <Card className="mx-auto w-full max-w-md animate-fade-in">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          </CardHeader>
          <CardContent>
            {needsRoleRetry ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{authError}</p>
                <Button
                  type="button"
                  className="w-full bg-brand text-white hover:bg-brand-dark"
                  disabled={isLoading || roleLoading}
                  onClick={() => void retryRoleCheck()}
                >
                  {isLoading || roleLoading ? "Retrying…" : "Retry"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => void signOut()}
                >
                  Sign out
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your email" autoComplete="username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="•••••••"
                              className="pr-10"
                              autoComplete="current-password"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((value) => !value)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
                              aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-brand text-white hover:bg-brand-dark"
                    disabled={isLoading}
                  >
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
