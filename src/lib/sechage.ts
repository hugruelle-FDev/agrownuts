export type ReleveView = { id: string; humidite: number; date: string };

export type CaisseView = {
  lotId: string;
  reference: string;
  parcelle: string;
  place: number;
  humiditeInitiale: number;
  humiditeActuelle: number;
  releves: ReleveView[];
  vitesseObservee: number | null;
  termine: boolean;
  joursRestants: number | null;
  dateFin: string | null;
};

export type SechoirConfig = {
  capacite: number;
  temperatureC: number | null;
  soufflerie: number | null;
  humiditeCible: number;
  vitesseTheorique: number;
};

/**
 * Prévision de fin de séchage.
 * Vitesse = tendance observée sur les relevés (premier → dernier) si au moins
 * deux relevés donnent une baisse ; sinon la vitesse théorique (%/jour).
 * La date de fin part du dernier relevé (ou de maintenant) jusqu'à l'humidité cible.
 */
export function calculerPrevision(params: {
  humiditeInitiale: number;
  releves: { humidite: number; date: string }[];
  cible: number;
  vitesseTheorique: number;
}): {
  humiditeActuelle: number;
  vitesseObservee: number | null;
  termine: boolean;
  joursRestants: number | null;
  dateFin: string | null;
} {
  const { humiditeInitiale, releves, cible, vitesseTheorique } = params;
  const sorted = [...releves].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const dernier = sorted[sorted.length - 1];
  const humiditeActuelle = dernier ? dernier.humidite : humiditeInitiale;
  const dateRef = dernier ? new Date(dernier.date) : new Date();

  let vitesseObservee: number | null = null;
  if (sorted.length >= 2) {
    const premier = sorted[0]!;
    const der = sorted[sorted.length - 1]!;
    const jours = (new Date(der.date).getTime() - new Date(premier.date).getTime()) / 86_400_000;
    if (jours > 0) {
      const v = (premier.humidite - der.humidite) / jours;
      if (v > 0) vitesseObservee = v;
    }
  }

  if (humiditeActuelle <= cible) {
    return { humiditeActuelle, vitesseObservee, termine: true, joursRestants: 0, dateFin: dateRef.toISOString() };
  }

  const vitesse = vitesseObservee ?? vitesseTheorique;
  if (!vitesse || vitesse <= 0) {
    return { humiditeActuelle, vitesseObservee, termine: false, joursRestants: null, dateFin: null };
  }

  const joursRestants = (humiditeActuelle - cible) / vitesse;
  const dateFin = new Date(dateRef.getTime() + joursRestants * 86_400_000);
  return { humiditeActuelle, vitesseObservee, termine: false, joursRestants, dateFin: dateFin.toISOString() };
}
