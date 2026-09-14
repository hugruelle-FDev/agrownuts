import { ModulePlaceholder } from "@/components/module-placeholder";

export default function AdminPage() {
  return (
    <ModulePlaceholder
      titre="Partie administrative"
      sousTitre="Contrats, devis et factures."
      etape="Étape 5"
      points={[
        "Contrats de production",
        "Devis",
        "Factures",
      ]}
    />
  );
}
