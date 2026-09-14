import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";

export const dynamic = "force-dynamic";

/** Layout protégé : toutes les pages sous (app) exigent une session valide. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { name, email, role } = session.user;
  const nbAValider = await prisma.lot.count({ where: { statut: "DECLARE" } });

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar userRole={role} />
      <div className="flex min-h-screen flex-1 flex-col">
        <AppHeader userName={name ?? email ?? "Utilisateur"} userRole={role} nbAValider={nbAValider} />
        <main className="flex-1 animate-fade-in p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
