import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm bg-card-elevated">
        <CardHeader className="items-center text-center">
          <Logo markClassName="h-10" textClassName="text-2xl" />
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            Triage · Décorticage · Calibrage
          </p>
          <CardTitle className="mt-2">Connexion</CardTitle>
          <CardDescription>Accédez à la plateforme de gestion</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
