import { ModulePlaceholder } from "@/components/module-placeholder";

export default function ProductionPage() {
  return (
    <ModulePlaceholder
      titre="Gestion de la production"
      sousTitre="Ce que produisent les machines et la planification."
      etape="Étape 4"
      points={[
        "Production des machines à l'instant T",
        "Outil de planification de la production",
        "Gestion de la maintenance",
      ]}
    />
  );
}
