import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { GraduationCap } from "lucide-react";
import { useUniAuth } from "@/context/UniAuthContext";
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

const formSchema = z.object({
  email: z.string().email({ message: "Enter a valid email address." }),
  password: z.string().min(4, { message: "Password must be at least 4 characters." }),
});

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, user, account, loading } = useUniAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (!loading && user && account) {
      navigate("/uni/dashboard", { replace: true });
    }
  }, [user, account, loading, navigate]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    const result = await signIn(values.email, values.password);

    if (result.success) {
      toast({ title: "Welcome back", description: "Redirecting to your dashboard." });
      return;
    }

    toast({
      title: "Sign in failed",
      description: result.error ?? "Please check your credentials.",
      variant: "destructive",
    });
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e8f3f2_0,_#fafafa_45%,_#ffffff_100%)] px-4 py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-md flex-col justify-center">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/20">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Sallam Partner Portal
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Discover qualified students for your university.
          </p>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Sign in</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="recruiter@university.edu" {...field} />
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
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-brand hover:bg-brand-dark"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Need access? Contact Sallam to activate your partner account.
        </p>
      </div>
    </div>
  );
}
