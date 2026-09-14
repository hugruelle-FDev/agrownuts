import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm bg-card-elevated">
        <CardHeader className="items-center text-center">
          <div className="mb-1 font-display text-2xl font-extrabold tracking-tight text-foreground">
            AGRO<span className="text-accent">NUTS</span>
          </div>
          <CardTitle>Connexion</CardTitle>
          <CardDescription>Accédez à la plateforme de gestion</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
