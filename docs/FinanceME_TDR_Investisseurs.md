# TERMES DE REFERENCE (TDR)

## FinanceME

### Dossier de presentation pour banques, ONG, fonds d'amorcage et investisseurs d'impact

Date: 11 mars 2026  
Version: 1.0  
Statut: Document de travail externe  

---

## 1. Resume executif

FinanceME est une solution numerique de gestion financiere personnelle construite autour d'une application mobile et d'une API backend securisee. Le produit permet a un utilisateur de centraliser ses transactions, suivre ses budgets, piloter ses comptes, organiser ses objectifs d'epargne, surveiller ses investissements et administrer ses dettes actives ou passives dans une seule interface.

Le projet repond a un besoin structurel: une grande partie des particuliers, travailleurs independants, jeunes actifs et micro-entrepreneurs gere encore ses flux financiers avec des outils fragmentes, peu fiables ou non adaptes au mobile. Cette fragmentation reduit la visibilite sur les depenses, augmente le risque de surendettement, freine l'epargne reguliere et complique la prise de decision financiere.

FinanceME propose une approche integree, simple et extensible. Le socle technique deja developpe montre un produit en fonctionnement avec authentification, gestion de comptes, transactions synchronisees, budgets, epargne, investissements, dettes et tableaux de bord mobiles. Ce positionnement en fait une base credible pour une phase d'acceleration produit, de structuration commerciale et de preparation a une mise a l'echelle.

Le present TDR a pour objectif de formaliser le cadre d'intervention, les finalites, le perimetre, les besoins de financement, les hypotheses de deployment et les attentes de partenariat autour de FinanceME. Il est concu pour des interlocuteurs institutionnels ou financiers recherchant un document clair, rigoureux et directement exploitable pour l'instruction d'un dossier.

---

## 2. Contexte et justification

Dans de nombreux environnements a forte penetration mobile, la relation aux services financiers evolue rapidement, mais les outils de pilotage du budget personnel restent insuffisants. Les utilisateurs ont souvent acces a plusieurs canaux de paiement, plusieurs comptes ou portefeuilles, des revenus irreguliers et des engagements de dette informels ou semi-formels. Pourtant, ils disposent rarement d'un outil unifie leur permettant de transformer ces donnees en decisions financieres concretes.

Les consequences sont visibles a plusieurs niveaux:

- absence de vision consolidee des entrees et sorties d'argent;
- difficultes de planification mensuelle et de discipline budgetaire;
- faibles taux d'epargne programmee;
- suivi insuffisant des dettes dues ou a recouvrer;
- faible culture de suivi de portefeuille pour les investissements debutants;
- manque d'outils simples, mobile-first, adaptes a un usage quotidien.

FinanceME s'inscrit comme une reponse pragmatique a cette insuffisance. Le projet vise a democratiser l'acces a des pratiques de gestion financiere plus rigoureuses, non pas a travers un outil bancaire lourd, mais via une couche d'orchestration personnelle, pedagogique et actionnable. Dans une logique ONG, banque de detail, institution de microfinance ou investisseur d'impact, FinanceME peut devenir un levier d'inclusion financiere, d'education economique et d'amelioration de la resilience des menages.

---

## 3. Presentation du projet

FinanceME est une plateforme de gestion financiere personnelle composee de deux briques principales:

- une API backend construite en Node.js, Express et MongoDB;
- une application mobile construite avec React Native et Expo.

Le perimetre fonctionnel observe dans la base actuelle couvre deja les modules suivants:

- creation de compte utilisateur, connexion securisee et recuperation du profil;
- enregistrement, consultation, modification et suppression de transactions;
- association des transactions a des comptes financiers;
- creation et suivi de budgets avec historique d'ajustement;
- creation et suivi de comptes et soldes courants;
- suivi d'objectifs d'epargne;
- suivi d'investissements;
- suivi de dettes, remboursements et encaissements;
- tableaux de bord mobiles et ecrans de synthese par domaine.

Cette base confirme que FinanceME n'est pas seulement une idee conceptuelle. Le projet dispose deja d'un socle applicatif permettant de supporter une feuille de route de professionnalisation et de mise sur le marche.

---

## 4. Vision, mission et proposition de valeur

### Vision

Permettre a toute personne disposant d'un smartphone de piloter sa vie financiere avec clarte, discipline et autonomie.

### Mission

Construire une solution mobile fiable, intuitive et evolutive qui aide les particuliers et petits acteurs economiques a mieux depenser, mieux epargner, mieux anticiper et mieux arbitrer leurs choix financiers.

### Proposition de valeur

FinanceME offre une vue unifiee et actionnable de la sante financiere personnelle. La solution transforme des operations dispersees en un systeme simple de pilotage quotidien.

Les principaux benefices utilisateurs sont les suivants:

- meilleure visibilite sur la situation financiere globale;
- reduction des depassements budgetaires grace aux alertes et au suivi par categorie;
- pilotage des soldes reels via la synchronisation avec les comptes suivis;
- capacite de planifier des objectifs d'epargne et de suivre leur progression;
- suivi des dettes et remboursements pour reduire les oublis et les tensions de tresorerie;
- meilleure comprehension du portefeuille d'investissement personnel.

---

## 5. Objectifs du TDR

Le present document poursuit cinq objectifs principaux:

- presenter FinanceME dans un format institutionnel exploitable par des banques, ONG et investisseurs;
- decrire le probleme adresse, la solution proposee et le perimetre deja developpe;
- cadrer la phase d'acceleration souhaitee, les besoins d'appui et les attendus de partenariat;
- structurer une lecture du projet sous l'angle de l'impact, de la viabilite et de la gouvernance;
- servir de base de travail pour des discussions de financement, de subvention, de pilote ou de partenariat de distribution.

---

## 6. Description detaillee de la solution

### 6.1 Gestion des utilisateurs et securite d'acces

FinanceME integre un module d'inscription, de connexion et de consultation du profil utilisateur. L'authentification repose sur des jetons JWT, avec verification des identifiants et securisation des mots de passe. Cette couche represente la base necessaire pour une montee en charge progressive et pour l'introduction future de mesures additionnelles de securite, de conformite ou de segmentation d'utilisateurs.

### 6.2 Gestion des transactions

Les transactions constituent le coeur fonctionnel du produit. L'utilisateur peut enregistrer des operations, les classer, les dater et les rattacher a un compte. Ce module permet de produire une lecture chronologique et categorielle des flux, utile autant pour le budget mensuel que pour l'analyse du comportement financier.

### 6.3 Budgets

Le produit permet de creer des budgets par categorie, de suivre leur niveau de consommation, d'ajuster les enveloppes et d'afficher l'historique des modifications. Des mecanismes d'alerte sur depassement sont deja prevus dans la couche mobile. Ce composant est essentiel pour la prevention des ecarts et l'education a la discipline budgetaire.

### 6.4 Comptes et soldes

FinanceME propose un module de gestion de comptes avec type de compte, solde d'ouverture, solde courant et ajustements. Les transactions peuvent synchroniser les variations de solde. Cette approche renforce la fiabilite du suivi et rapproche l'utilisateur d'une logique de comptabilite personnelle simplifiee.

### 6.5 Epargne

Le module epargne permet de definir des objectifs et de suivre leur progression. Il renforce une logique de planification financiere et de projection. Dans une future phase d'evolution, il pourra supporter des mecanismes de recommandation, d'arrondi automatique ou d'integration avec des partenaires financiers.

### 6.6 Investissements

La solution inclut un espace de suivi des investissements personnels, avec affichage mobile dedie. Ce module positionne FinanceME au-dela d'un simple carnet de depenses: il s'agit d'un outil de pilotage patrimonial de base, accessible a des profils debutants ou intermediaires.

### 6.7 Dettes et remboursements

Le produit couvre les dettes a payer et les creances a recouvrer. Il permet d'enregistrer les montants initiaux, les paiements, le solde restant et le statut. Cette fonctionnalite est particulierement utile pour les utilisateurs en environnement informel ou semi-formel ou la dette relationnelle et les avances personnelles jouent un role important.

### 6.8 Experience mobile

L'application mobile fournit une navigation par tableaux de bord, ecrans metiers et formulaires de saisie. L'approche mobile-first est pertinente pour les environnements ou le smartphone constitue le premier point d'acces au service numerique. Elle renforce aussi le potentiel de diffusion via des partenaires terrain, incubateurs, institutions financieres ou programmes d'accompagnement.

---

## 7. Architecture technique et niveau de maturite

L'architecture actuelle de FinanceME presente plusieurs caracteristiques positives:

- backend API organise par domaines fonctionnels;
- separation claire entre routes, modeles, middleware et utilitaires;
- usage de MongoDB et Mongoose pour la persistance;
- securisation applicative de base avec `helmet`, `cors`, limitation de requetes sur l'authentification et middleware de controle d'acces;
- application mobile separee, structuree par navigation, ecrans, contexte d'authentification et theming;
- presence de tests automatises sur plusieurs routes backend.

Le niveau de maturite peut etre qualifie de "prototype avance / pre-produit". Le socle est suffisamment substantiel pour justifier un appui visant:

- le renforcement de la robustesse;
- la preparation de l'observabilite et de la qualite de service;
- la mise en conformite documentaire et juridique;
- l'industrialisation progressive de l'experience utilisateur;
- la preparation a des pilotes ou a une pre-commercialisation.

---

## 8. Beneficiaires cibles et segments prioritaires

FinanceME peut servir plusieurs segments, avec un noyau prioritaire clair:

### Segment coeur

- jeunes actifs;
- salaries et independants ayant des revenus variables;
- etudiants en fin de cycle et primo-actifs;
- micro-entrepreneurs et travailleurs du secteur informel structure;
- particuliers ayant plusieurs poches de depenses, petites dettes ou objectifs d'epargne.

### Segments secondaires

- programmes ONG d'education financiere;
- institutions de microfinance ou cooperatives souhaitant proposer un outil de gestion a leurs membres;
- banques de detail voulant tester une couche d'engagement non transactionnelle;
- incubateurs et programmes d'accompagnement entrepreneurial.

### Benefices institutionnels potentiels

Pour une banque, FinanceME peut devenir un canal d'engagement, d'education client et de pre-qualification de besoins futurs. Pour une ONG, l'outil peut soutenir des programmes d'autonomisation economique. Pour un investisseur d'impact, le projet porte une logique de numerisation de la gestion financiere et de renforcement de la resilience des menages.

---

## 9. Positionnement strategique et avantage comparatif

Le marche des outils financiers personnels est encombre soit par des applications tres simplistes, soit par des services bancaires qui supposent une forte integration institutionnelle. FinanceME se distingue par un positionnement intermediaire:

- outil personnel avant d'etre infrastructure bancaire;
- architecture modulaire propice aux partenariats;
- experience mobile simple, adaptee a une logique d'usage quotidien;
- couverture fonctionnelle large: budget, comptes, epargne, investissements et dettes;
- potentiel d'adaptation a des environnements a revenus irreguliers et pratiques financieres hybrides.

L'avantage comparatif de FinanceME reside dans sa capacite a agreger les decisions financieres de base dans une seule experience coherente. Cette approche est strategiquement interessante parce qu'elle ouvre plusieurs trajectoires de croissance:

- offre B2C directe;
- offre B2B2C en marque blanche ou co-branded;
- distribution via programmes sociaux, ONG ou institutions de microfinance;
- monetisation progressive par services premium, analytics, education ou partenariats.

---

## 10. Modele economique envisage

Le modele economique de FinanceME peut etre hybride afin de reduire le risque et diversifier les revenus.

### 10.1 Piste B2C

- freemium avec modules de base gratuits;
- abonnement premium pour rapports avances, alertes enrichies, objectifs intelligents, export et recommandations;
- options de coaching financier ou contenus premium.

### 10.2 Piste B2B / B2B2C

- licences institutionnelles ou redevances de partenariat;
- pilotes finances par ONG, programmes d'inclusion ou institutions financieres;
- integration a des offres d'accompagnement d'entrepreneurs ou de menages vulnerables;
- mise a disposition de tableaux de bord anonymises et agreges, sous reserve de conformite et de consentement.

### 10.3 Viabilite

La viabilite economique du projet dependra moins d'un volume initial eleve et davantage de la qualite du ciblage, du taux d'activation, de la retention et de la capacite a nouer des alliances de distribution. Une approche par vagues de maturite est donc recommandee: pilote, validation d'usage, structuration commerciale, puis acceleration.

---

## 11. Besoin d'appui et usage cible des financements

FinanceME recherche un appui financier et strategique pour transformer un socle technique operationnel en produit deployable, gouverne et presentable a l'echelle.

Les categories d'utilisation des financements peuvent etre structurees comme suit:

- 30 % pour finalisation produit, assurance qualite, tests, durcissement securite et optimisation UX;
- 20 % pour infrastructure, observabilite, sauvegarde, monitoring et outillage de production;
- 15 % pour conformite, documentation, cadre juridique, politique de confidentialite et conditions d'utilisation;
- 20 % pour acquisition pilote, partenariats terrain, support utilisateur et animation de communaute;
- 10 % pour suivi d'impact, analytics et instrumentation de la retention;
- 5 % pour gestion de projet, gouvernance et contingences.

Le financement sollicite peut prendre plusieurs formes selon le partenaire:

- subvention d'amorcage;
- financement catalytique;
- investissement pre-seed;
- financement de pilote institutionnel;
- partenariat technique ou programme d'innovation ouverte.

---

## 12. Resultats attendus d'une phase d'acceleration

Une phase d'acceleration de 6 a 12 mois devrait permettre d'atteindre les resultats suivants:

- version produit stabilisee et prete pour un pilote structure;
- documentation produit, technique et conformite renforcee;
- architecture d'exploitation clarifiee avec sauvegardes, journalisation et surveillance;
- meilleure experience d'onboarding et de retention mobile;
- premiers partenariats de distribution ou d'experimentation;
- indicateurs de performance et d'impact mieux traces;
- cadre de monetisation teste sur un ou plusieurs segments.

Au terme de cette phase, FinanceME devra etre en mesure de presenter un dossier d'investissement plus avance, fonde sur des usages documentes et une trajectoire de croissance plus lisible.

---

## 13. Plan de mise en oeuvre indicatif

### Phase 1: Consolidation produit (0 a 3 mois)

- audit fonctionnel et technique;
- priorisation des corrections et dette technique critique;
- renforcement securite, validation et gestion des erreurs;
- standardisation des environnements et procedures de deployment;
- revue UX des parcours cles.

### Phase 2: Preparation pilote (3 a 6 mois)

- production d'une version stable;
- instrumentation analytics et suivi des cohortes;
- formalisation de la documentation utilisateur et partenaire;
- finalisation du dispositif de support et de feedback;
- selection de partenaires pilotes.

### Phase 3: Execution pilote et apprentissages (6 a 9 mois)

- lancement encadre sur un segment cible;
- collecte de retours utilisateurs et institutionnels;
- mesure de l'activation, de l'engagement et de la retention;
- ajustements de produit et de positionnement.

### Phase 4: Structuration de l'echelle (9 a 12 mois)

- consolidation du modele economique;
- preparation du dossier d'investissement ou d'extension programme;
- renforcement des partenariats commerciaux ou institutionnels;
- plan de croissance sur nouveaux segments ou geographies cibles.

---

## 14. Indicateurs cles de performance

Les indicateurs suivants sont recommandes pour le pilotage:

- nombre d'inscriptions et taux d'activation;
- nombre moyen de transactions saisies par utilisateur actif;
- nombre de budgets crees et taux d'utilisation des comptes;
- progression des objectifs d'epargne;
- taux d'utilisation des modules dettes et investissements;
- retention a 30, 60 et 90 jours;
- cout d'acquisition par canal pilote;
- taux de conversion vers offre premium ou institutionnelle;
- score de satisfaction utilisateur;
- nombre et qualite des partenariats de distribution.

Dans un cadre d'impact, il sera aussi pertinent de suivre des indicateurs comportementaux, par exemple la regularite de l'epargne, la diminution des depassements budgetaires ou l'amelioration de la visibilite des engagements de dette.

---

## 15. Risques principaux et mesures d'attenuation

### Risque produit

Le risque principal est de disposer d'un produit techniquement riche mais encore insuffisamment simplifie pour un usage massif. La mitigation passe par des tests utilisateurs, une priorisation stricte des parcours coeur et une reduction du nombre de frictions lors de l'onboarding.

### Risque de confiance et de securite

Toute solution manipulant des donnees financieres doit inspirer confiance. Il convient donc de renforcer le chiffrement des secrets, la politique de sauvegarde, la journalisation des incidents, la gestion des acces et la documentation de confidentialite.

### Risque d'adoption

L'utilisateur peut sous-estimer la valeur d'un outil de suivi s'il ne percoit pas de resultat rapide. Il faut donc privilegier des gains immediats: vue consolidee, alertes, objectifs simples et interface pedagogique.

### Risque commercial

Le projet peut rencontrer une dispersion strategique entre B2C, B2B2C et impact. Une gouvernance claire doit arbitrer le segment prioritaire de lancement pour eviter la dilution des efforts.

### Risque de ressources

Comme tout projet en phase d'amorcage, FinanceME peut subir une contrainte de ressources humaines, financieres et operationnelles. Un plan de financement par jalons et un pilotage rigoureux des priorites sont recommandes.

---

## 16. Gouvernance et cadre de partenariat

Le dispositif de gouvernance recommande autour de FinanceME repose sur trois principes:

- pilotage simple avec responsabilites claires entre produit, technique, partenariats et conformite;
- revues periodiques avec les partenaires financiers ou institutionnels;
- logique de financement par jalons, adossee a des livrables et indicateurs mesurables.

Les partenaires susceptibles d'intervenir sont:

- investisseurs d'amorcage et business angels a these fintech ou impact;
- ONG et programmes de resilience economique;
- banques, IMF, cooperatives et fintechs recherchant une couche d'engagement client;
- incubateurs, accelerateurs et programmes d'innovation ouverte;
- partenaires techniques ou cloud pour l'industrialisation.

---

## 17. Pourquoi soutenir FinanceME maintenant

FinanceME se situe a un moment favorable: le projet dispose deja d'un produit concret, mais beneficierait fortement d'un appui qui intervient avant la dispersion ou l'essoufflement d'une phase artisanale. Le risque technologique de base est deja partiellement leve, puisque les principaux modules metiers existent. Le besoin porte desormais sur la professionnalisation, la validation de marche et la structuration du modele.

Soutenir FinanceME maintenant permettrait:

- d'accelerer la mise sur le marche d'un outil numerique a forte utilite pratique;
- de renforcer une solution orientee inclusion et autonomie financiere;
- d'appuyer un actif logiciel deja existant plutot qu'un concept encore abstrait;
- de preparer une trajectoire de croissance fondee sur des usages reels et des partenariats cibles.

---

## 18. Conclusion

FinanceME est un projet pertinent, techniquement engage et strategiquement prometteur dans le champ de la gestion financiere personnelle mobile. Son interet repose sur une combinaison rare a ce stade: une base fonctionnelle deja tangible, une utilite sociale et economique claire, et plusieurs voies de monetisation ou de diffusion institutionnelle.

Le present TDR recommande d'envisager FinanceME comme une opportunite de financement ou de partenariat a impact, avec une approche progressive et disciplinee. L'enjeu n'est pas seulement de financer une application, mais de consolider une infrastructure legere de pilotage financier personnel susceptible d'ameliorer la prise de decision des utilisateurs et d'ouvrir des synergies avec des acteurs bancaires, sociaux et entrepreneuriaux.

---

## 19. Annexe technique resumee

Les elements ci-dessous sont issus du perimetre fonctionnel present dans le depot au 11 mars 2026:

- backend `Node.js / Express / MongoDB` avec routes API pour authentification, transactions, budgets, investissements, epargne, dettes et comptes;
- middleware de securite et de limitation de requetes sur l'authentification;
- application mobile `React Native + Expo` avec navigation, dashboard, ecrans de gestion et theming;
- logique de synchronisation entre transactions et soldes de comptes;
- tests automatises sur le backend pour plusieurs domaines metiers.

Ces elements renforcent la credibilite du projet pour une phase de due diligence initiale.
