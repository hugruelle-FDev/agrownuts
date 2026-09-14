import { redirect } from "next/navigation";

// Page d'accueil : on redirige vers le module par défaut.
export default function Home() {
  redirect("/stock");
}
