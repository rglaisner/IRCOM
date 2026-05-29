# IRCOM — Studio IA (Management & Communication)

**Studio d'apprentissage bilingue (FR/EN)** pour la formation IRCOM *Intelligence Artificielle Générative Appliquée* — 12 heures réparties en 4 blocs pratiques orientés production social media.

**Application en ligne :** [https://ircom.vercel.app](https://ircom.vercel.app)

L'application transforme l'IA en **assistant de production critique** : l'étudiant briefe, produit avec les outils du marché, puis reçoit une critique structurée avant de réinjecter une finition humaine. L'IA n'est pas la source des idées — la valeur reste dans le raisonnement stratégique de l'étudiant.

---

## À qui s'adresse ce studio ?

- **Public :** étudiants Bac+4/5 en Management et Communication Stratégique (profils académiques variés, débutants en techniques opérationnelles).
- **Objectif :** être opérationnel dès le début de l'alternance — savoir briefer une IA, choisir le bon outil, produire des livrables publiables et exercer un contrôle qualité rigoureux.
- **Pédagogie :** 20 % d'apports méthodologiques, 80 % de pratique en conditions réelles.

---

## Démarrer en 30 secondes

1. Ouvrez [https://ircom.vercel.app](https://ircom.vercel.app) (ou lancez l'app en local — voir [Installation](#installation-développeurs)).
2. Choisissez votre **langue** (FR / EN) en haut à droite du bandeau IRCOM.
3. Depuis le **Parcours**, ouvrez le bloc qui vous intéresse — ou utilisez la navigation principale :
   - **Parcours** (`/`) — vue d'ensemble et progression
   - **Cours** (`/coach`) — leçons écrites des blocs 1 à 3
   - **Atelier** (`/exercise`) — mises en situation pratiques avec briefing vocal
   - **Sprint** (`/sprint`) — simulation agence (bloc 4)

Votre langue et votre progression sont **enregistrées localement** dans le navigateur (localStorage). Vous pouvez fermer l'onglet et reprendre plus tard.

---

## Vue d'ensemble du parcours (4 blocs × 3 h)

| Bloc | Thème | Où dans l'app | Ce que vous faites |
|------|--------|---------------|-------------------|
| **1** | Fondations du prompt & copy stratégique | Cours + Atelier | Structurer un brief d'agence (RACE), définir un ton éditorial, transformer un communiqué en posts LinkedIn/Instagram |
| **2** | Direction artistique & production visuelle | Cours + Atelier | Rédiger des prompts visuels (style, angle, lumière, palette), produire des assets de campagne, critiquer les clichés IA |
| **3** | Formats animés & déclinaison | Cours + Atelier | Structurer un script 30 s, décliner un contenu long en format court (Reels, TikTok, infographie) |
| **4** | Sprint agence & Grand Oral | Sprint | Rush 2 h : brief annonceur réaliste, kit multi-formats, restitution critique |

Chaque bloc 1 à 3 combine un **cours écrit** (théorie, méthode, exemples) et un **atelier pratique** (scénarios guidés). Le bloc 4 est une **simulation de rush agence** avec timer et export de kit.

---

## Guide utilisateur — mode par mode

### Parcours (tableau de bord)

Le Parcours affiche les **4 blocs** avec leurs objectifs et deux actions :

- **Cours** — accéder aux leçons écrites (blocs 1–3)
- **Atelier** — accéder aux scénarios pratiques (blocs 1–3)
- **Commencer** — lancer directement le Sprint (bloc 4)

Une **barre de progression** indique combien d'ateliers vous avez complétés (objectif recommandé : **2 sessions par mode** — Atelier et Sprint). La progression compte les soumissions validées avec feedback IA, pas la simple lecture du cours.

---

### Cours — leçons écrites (blocs 1 à 3)

**Route :** `/coach` (ex. `/coach?bloc=2`)

1. Sélectionnez **Bloc 1, 2 ou 3** via les onglets en haut.
2. Parcourez les **sections** dans le menu latéral (philosophie, leçons, illustrations, etc.).
3. Lisez le contenu au rythme souhaité — aucune limite de temps.
4. Cliquez sur **« Passer à l'Atelier »** en bas de page pour enchaîner sur le scénario pratique du bloc.

**Bloc 1 — Copy stratégique**
- Brief RACE (Rôle, Contexte, Objectif, Contraintes, Format)
- Ton éditorial et charte
- Transformation communiqué → fil LinkedIn

**Bloc 2 — Direction artistique**
- Langage des images (styles, angles, éclairages, palettes)
- Production visuelle professionnelle (Firefly, etc.)
- Limites juridiques et éthiques

**Bloc 3 — Formats courts**
- Script 30 secondes (accroche, corps, appel à l'action)
- Déclinaison article long → script vidéo + infographie

---

### Atelier — pratique guidée (blocs 1 à 3)

**Route :** `/exercise` (ex. `/exercise?bloc=1&scenario=b1-mobilite-launch`)

L'Atelier simule une **séance de travail en agence** : briefing vocal, production avec vos outils, puis critique IA.

#### Étape 1 — Choisir un scénario

Chaque bloc propose **plusieurs scénarios** (ex. lancement mobilité durable, audit anti-jargon, carrousel LinkedIn, script Reel). Cliquez sur la carte du scénario pour l'activer.

#### Étape 2 — Écouter le briefing vocal

Le panneau **Briefing vocal** vous guide comme un formateur :

| Action | Effet |
|--------|--------|
| **Écouter le briefing** | Lance la narration du scénario (voix IA) |
| **Pause / Reprendre** | Contrôle la lecture |
| **Lever la main** | Interrompt pour poser une question (voix ou chat) |
| **Poser une question** | Ouvre un chat texte avec le coach IA |
| **J'ai fini de parler** | Indique que vous avez terminé votre intervention vocale |

Une **transcription en direct** s'affiche pendant la narration. Certains scénarios incluent des **points de contrôle** : le formateur s'arrête et attend que vous soumettiez un livrable intermédiaire avant de continuer.

#### Étape 3 — Produire avec vos outils

1. Consultez la section **Outils recommandés** (Claude, ChatGPT, Gemini, Adobe Firefly, etc.).
2. Ouvrez l'outil adapté via le lien guidé (ou l'intégration connectée si configurée sur le serveur).
3. Produisez votre livrable en dehors de l'app ou dans l'outil externe.

#### Étape 4 — Soumettre et recevoir le feedback

1. **Collez votre livrable** dans la zone de texte (copy, prompt, script, notes visuelles…).
2. **Joignez des fichiers** si besoin (images pour critique visuelle — bloc 2).
3. Cliquez sur **« Obtenir le feedback »**.

Le coach IA renvoie :

- Un **titre** et un **retour détaillé** (cohérence stratégique, clichés IA, hallucinations)
- Un **niveau « prêt à publier »** (jauge 0–100)
- Une **prochaine étape** concrète
- Une **checklist de critique** à appliquer
- Un **outil suggéré** pour la révision
- Des **notes visuelles** (bloc 2) ou une **checklist livrables** selon le contexte

**Objectif :** compléter **2 ateliers** par bloc pour ancrer la méthode critique → révision → amélioration humaine.

#### Exemples de scénarios Atelier

| Bloc | Scénarios |
|------|-----------|
| 1 | Lancement mobilité durable · Audit anti-jargon IA |
| 2 | Carrousel LinkedIn · Critique visuelle de campagne |
| 3 | Script Reel 30 s · Déclinaison article → infographie |

---

### Sprint — simulation agence (bloc 4)

**Route :** `/sprint`

Le Sprint reproduit le **Grand Oral** de fin de formation : brief annonceur, rush 2 heures, kit multi-formats, restitution critique.

#### Déroulement

1. **Choisissez un scénario** (A, B ou C) :

   | Scénario | Situation |
   |----------|-----------|
   | **A — Urban Weave** | Gestion de crise : campagne IA controversée, réponse multicanal urgente |
   | **B — Lumina Tech** | Pivot greenwashing : transparence radicale sous pression médiatique |
   | **C — FinVault** | Friday news dump : éviction fondateur, stabilisation weekend |

2. **Lancez le rush** — un **timer 2 h** démarre (compte à rebours affiché en permanence).

3. **Lisez le brief** — contexte client, contraintes, liste des livrables attendus (texte, visuels, vidéo courte).

4. **Écoutez le briefing vocal** — même panneau que l'Atelier (narration, questions, main levée).

5. **Produisez votre kit de campagne** avec les outils recommandés (Claude, Firefly, Gemini…).

6. **Soumettez** — collez l'ensemble de votre production (textes, notes visuelles, script vidéo) et joignez des captures si utile.

7. **Grand Oral (2ᵉ interaction)** — soumettez à nouveau après révision pour une critique approfondie : cohérence stratégique, finition humaine, justification des choix d'outils.

8. **Exportez** — bouton **« Exporter le kit sprint »** génère un fichier Markdown récapitulatif (feedback, checklist, livrables).

**Objectif :** 2 interactions Sprint (production initiale + restitution révisée).

---

## Fonctionnalités transverses

### Langue FR / EN

Tout le contenu pédagogique (cours, scénarios, feedback, interface) bascule entre français et anglais. Le changement de langue est immédiat et mémorisé.

### Outils recommandés (multi-outils)

Chaque bloc affiche les **outils adaptés au livrable** :

| Outil | Usage typique |
|-------|----------------|
| **Claude** | Copy long, réécriture éditoriale, scripts structurés |
| **ChatGPT** | Brainstorming, variantes rapides |
| **Gemini** | Coach intégré, analyse multimodale |
| **Adobe Firefly** | Assets visuels conformes charte (intégration guidée) |

Statut affiché : **Connecté** (API configurée) ou **Lien guidé** (ouverture externe).

### Critique IA et jauge qualité

Le feedback n'évalue pas la « magie de l'IA » mais :

- Pertinence stratégique (contenu publiable par une marque ?)
- Maîtrise du workflow multi-outils
- Esprit critique à la restitution

La jauge **« prêt à publier »** résume le niveau de finition avant diffusion.

### Progression et historique

- Compteur d'ateliers complétés par mode (Atelier, Sprint)
- Historique des échanges conservé dans le navigateur pour la continuité du coaching
- Pas de compte utilisateur requis — données locales uniquement

### Briefing vocal

Trois moteurs possibles selon la configuration serveur (transparent pour l'utilisateur) :

1. **Gemini Live** (conversation naturelle)
2. **Synthèse vocale Gemini TTS**
3. **Synthèse navigateur** (fallback)

La reconnaissance vocale (poser une question à la voix) fonctionne dans les navigateurs compatibles.

---

## Parcours recommandé (12 h)

```
Bloc 1 : Cours → Atelier (×2 scénarios) → révision copy
    ↓
Bloc 2 : Cours → Atelier (×2 scénarios) → assets visuels
    ↓
Bloc 3 : Cours → Atelier (×2 scénarios) → script court
    ↓
Bloc 4 : Sprint (scénario au choix) → rush 2 h → Grand Oral → export
```

Vous pouvez avancer bloc par bloc ou revenir sur un atelier pour approfondir. Le Parcours indique où vous en êtes.

---

## Principes pédagogiques (rappels)

- **L'IA est un assistant**, pas la source finale des idées.
- **Éviter le style IA générique** — formulations creuses, répétitions, hallucinations.
- **Toujours justifier** les choix stratégiques et d'outils à la restitution.
- **Critique obligatoire** avant toute publication : l'étudiant corrige, l'IA ne remplace pas le jugement.

Contenu de référence : [`context_content/Formation_GenAI_IRCOM.md`](context_content/Formation_GenAI_IRCOM.md)

---

## Installation (développeurs)

L'application Next.js se trouve dans le dossier **`ircom-app/`**. Le dépôt racine contient le contenu pédagogique source et la configuration Cursor.

```bash
cd ircom-app
npm install
cp .env.example .env.local   # puis définir GEMINI_API_KEY
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

Documentation technique complète (déploiement Vercel, variables d'environnement, tests E2E) : [`ircom-app/README.md`](ircom-app/README.md)

### Déploiement Vercel

- **Root Directory** du projet Vercel : `ircom-app`
- Variable requise pour l'IA live : `GEMINI_API_KEY`
- Production : [https://ircom.vercel.app](https://ircom.vercel.app)

Sans clé API, l'app fonctionne en **mode démo** avec des réponses de repli pour tester les parcours.

---

## Structure du dépôt

```
IRCOM/
├── ircom-app/              # Application Next.js (Studio IA)
│   ├── app/                # Routes : /, /coach, /exercise, /sprint
│   ├── components/         # UI, modes, briefing vocal
│   ├── content/            # Cours, scénarios atelier & sprint (FR/EN)
│   └── lib/                # Coach Gemini, progression, outils
├── context_content/        # Programme formation et contenu source
└── README.md               # Ce guide
```

---

## Support

- **Coach IA indisponible ?** Vérifiez la connexion réseau. En production, contactez le formateur si le message « coach non configuré » apparaît.
- **Progression perdue ?** Les données sont dans le navigateur — navigation privée ou suppression du cache les efface.
- **Questions pédagogiques ?** Utilisez **Lever la main** ou **Poser une question** pendant un atelier ou sprint.

---

*IRCOM — Humanités et Management · Studio IA aligné sur [ircom.fr](https://www.ircom.fr/)*
