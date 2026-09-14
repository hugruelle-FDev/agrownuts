# AgroNuts — Plateforme de gestion

Plateforme interne AgroNuts : stock, séchage, production et administratif, dans une seule application modulaire.

**Étape 0 — Socle.** Cette version contient les fondations techniques : authentification multi-rôles, base de données, shell à onglets à la charte AgroNuts, thème clair/sombre, Docker. Les modules métier arrivent aux étapes suivantes.

## Stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript strict**
- **TailwindCSS** + composants maison façon Shadcn UI
- **Prisma** + **PostgreSQL**
- **Auth.js** (next-auth v5) — connexion par identifiants, rôles, journal des connexions
- **Docker** + docker-compose

## Démarrage rapide (tout en Docker)

Prérequis : Docker.

```bash
# 1. Copier les variables d'environnement
cp .env.example .env
# (générez un vrai secret : openssl rand -base64 32, à mettre dans AUTH_SECRET)

# 2. Lancer la base + l'application
docker compose up --build
```

L'application est sur **http://localhost:3000**.
Connexion initiale (définie dans `.env`) : **admin@agrownuts.fr** / **AgroNuts2026!** — à changer après la première connexion.

## Développement (base en Docker, app en local)

C'est le mode recommandé pour itérer (rechargement à chaud).

```bash
# 1. La base seule
docker compose up -d db

# 2. L'application en local
npm install
cp .env.example .env          # DATABASE_URL pointe déjà sur localhost:5432
npm run db:push               # crée les tables à partir du schéma Prisma
npm run db:seed               # crée le compte admin + parcelles d'exemple
npm run dev
```

## Scripts utiles

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production (génère aussi le client Prisma) |
| `npm run typecheck` | Vérification TypeScript stricte |
| `npm run db:push` | Applique le schéma Prisma à la base |
| `npm run db:seed` | Crée le compte admin et des parcelles d'exemple |
| `npm run prisma:migrate` | Crée une migration versionnée (à partir de l'Étape 1) |

## Rôles

| Rôle | Accès |
| --- | --- |
| `ADMIN` | Tout, y compris l'onglet Administratif et la gestion des comptes |
| `OPERATEUR` | Saisie quotidienne (lots, séchage, production) |
| `LECTURE` | Consultation seule |

Le rôle est porté par la session et contrôle l'affichage des onglets (registre de modules) et les droits d'écriture.

## Structure du projet

```
src/
  app/
    login/            Page de connexion (Server Action)
    (app)/            Zone protégée (session requise)
      layout.tsx      Shell : sidebar + header
      stock/          Module Stock (MVP — Étape 1)
      sechage/        Module Séchage (Étape 2)
      production/     Module Production (Étape 4)
      admin/          Module Administratif (Étape 5)
    api/auth/         Routes Auth.js
  components/         UI (button, card, input…) + sidebar/header + thème
  lib/
    prisma.ts         Client Prisma (singleton)
    modules.ts        Registre des modules = source de la navigation
  auth.ts             Configuration Auth.js (providers, callbacks)
  auth.config.ts      Config "edge" utilisée par le middleware
prisma/
  schema.prisma       Modèle de données
  seed.ts             Données initiales
```

## Ajouter un onglet plus tard

1. Ajouter une entrée dans `src/lib/modules.ts` (label, href, icône, rôles).
2. Créer le dossier de page `src/app/(app)/<clé>/page.tsx`.
3. (Si besoin) ajouter les modèles dans `prisma/schema.prisma` puis `npm run db:push`.

L'onglet apparaît automatiquement dans la navigation, avec le contrôle de rôle.

## Numéro de lot

Format : `LOT-<Parcelle>-<MM/AAAA>-<Remorque>-<Numéro>` (ex. `LOT-DEF-06/2026-B2-3`).
Un lot = un chargement de remorque. Le module Stock (Étape 1) génère cette référence automatiquement à partir du formulaire de création.

## Feuille de route

- **Étape 0** — Socle _(cette version)_
- **Étape 1** — Module Stock (formulaire de lot, liste, statuts, dashboard, audit)
- **Étape 2** — Module Séchage
- **Étape 3** — Notifications + tableau de bord économique
- **Étape 4** — Module Production
- **Étape 5** — Module Administratif
- **Étape 6** — Import/export, sauvegardes, tests, Swagger
