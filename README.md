# Mosaïque Santé

Prototype web mobile-first pour les futurs managers d’établissements sanitaires, sociaux et médico-sociaux en France.

## Contenu

- Panorama de structures et de dispositifs, avec publics, métiers, partenaires et repères de management.
- Pistes de métiers adaptées au Master Management des établissements de santé et à une expérience d’adjoint de direction en MAS.
- **Nouveau : Corps de métier support sous la responsabilité du dirigeant** (gouvernante, ASH/ASR, ASL, maintenance, logistique, SI, qualité, guichet unique) avec rôles, organigramme, défis et matrice d'interactions transversales.
- **Nouveau : Module Qualité, Sécurité & Événements Indésirables** avec l'outil AgEval (ANAP), les 4 niveaux d'EI (quand les choisir et ce qu'ils provoquent), et la matrice des déclarations externes obligatoires (ARS e-SIN, parquet, procureur, assureur).
- **Nouveau : Guide méthodologique des Retours d'Expérience (REX & CREX)** en 6 étapes (grille ALARM / 5M, sécurité psychologique, avec qui les mener, 4 formats adaptés).
- **Nouveau : Onglet Politique de Santé & Veille Réglementaire** (10 grandes lois de 2002 à la loi Bien Vieillir 2024, cadre régional PRS 3 de l'ARS, schémas départementaux et grille de synthèse des compétences institutionnelles).
- Fiches réunions/instances (enrichies avec COPIL Qualité, CREX et RMM), documents de pilotage, acteurs et questions RH (enrichies de 10+ FAQ pratiques).
- Repères sur les conventions collectives et le statut public, avec liens Légifrance et Service-Public.
- Calculateurs interactifs ETP / ETPT et forfait jours, dont un calendrier annuel lun–ven ajustable.
- Guides pratiques de fiche de poste, rédaction d’offre, entretien structuré et recherche des effectifs disponibles.
- Répertoire filtrable des grandes familles de logiciels sanitaires et médico-sociaux (DPI, DUI, SIRH, planning, qualité/AgEval, budget, coordination, etc.).
- Carte 3D animée en temps réel : bulles mobiles dans l’espace, liens directionnels et libellés projetés à chaque mouvement ; rotation libre, translation, profondeur, zoom et perspective.
- Raccourcis cliquables depuis l’accueil vers les métiers, la qualité, les outils, la politique de santé et les partenaires.
- Navigation précédent/suivant avec conservation de la page, du scroll et des filtres.
- Annuaire de promotion volontaire enrichi d'exemples réalistes (MAS, EHPAD, IME, HAD, CHU), avec filtres par rôle, région et domaine d’expérience.
- Connexion et inscription par email via Firebase Authentication dès l’ouverture ; une session existante est restaurée automatiquement. La déconnexion est disponible dans le menu et dans « Abonnement & accès » et ramène à l’écran de connexion.
- Affichage mobile, thème sombre/clair, panneaux de détails en feuille iOS, fermeture par glissement, animations Motion/Web Animations API, mode hors-ligne de base et ajout à l’écran d’accueil.
- Document de pitch commercial complet pour les écoles (abonnements Découverte, Partenaire, Campus Santé) et tarification individuelle dans `pitch-mosaique-sante-ecoles.md`.

## Lancer en local

Servez ce dossier avec l’extension Live Server de VS Code ou `npx serve .`. Firebase Authentication utilise des modules chargés depuis le CDN Google et nécessite une connexion réseau ainsi qu’un domaine autorisé dans Firebase. Le service worker et l’installation PWA nécessitent HTTPS ou `localhost`.

Avant d’utiliser la connexion ou l’inscription, initialisez Authentication dans la console Firebase du projet et activez le fournisseur « Adresse e-mail/Mot de passe ». Vérifiez aussi que le domaine de l’application figure dans les domaines autorisés.

Le projet ne nécessite pas de compilation. Motion est chargé de façon facultative après le premier affichage depuis jsDelivr ; si le CDN est inaccessible, les animations intégrées au navigateur prennent le relais. Les transitions courtes utilisent principalement `transform` et `opacity` et respectent le réglage de réduction des animations.

## Publier avec GitHub Pages

Copiez le contenu de ce dossier à la racine d’un dépôt GitHub, activez GitHub Pages pour la branche et le dossier souhaités, puis ouvrez l’URL HTTPS. Vous pouvez aussi conserver cette application dans un sous-dossier, à condition de publier ce dossier comme racine du site afin que les chemins relatifs restent corrects.

## Données de l’annuaire

Les fiches ajoutées au formulaire sont enregistrées dans `localStorage` et leur synchronisation avec Firestore est également tentée. Le bouton d’export produit un fichier JSON local. « Tout supprimer » efface les données locales de ce navigateur ; la suppression distante dépend des droits Firestore.

Avant une collecte collective, définir une information de confidentialité, une finalité, les accès, une durée de conservation et une procédure de suppression. Firebase Authentication et Firestore sont configurés ; les accès aux données partagées doivent être encadrés par les règles Firestore et une validation côté serveur. L’écran de connexion ne protège pas à lui seul les fichiers publics de l’application.

## Sources et limites

Les liens officiels sont regroupés dans l’interface : Légifrance, HAS, CNSA, ANAP, FINESS, service-public et EHESP. La base couvre les grandes familles et les types courants, sans prétendre remplacer la nomenclature FINESS exhaustive ni l’autorisation propre à chaque site. Les catégories, sigles, missions et calendriers évoluent ; les repères réglementaires doivent être vérifiés avant une décision.

Les fiches RH et de responsabilité sont pédagogiques, pas un avis juridique, médical ou financier. Le statut de l’employeur, les textes, conventions, autorisations, délégations et règles territoriales priment.

Les calculateurs RH fonctionnent localement dans la page : les valeurs saisies ne sont pas enregistrées et ne sont pas envoyées à un serveur. Le calcul forfait jours est une estimation sur un calendrier standard du lundi au vendredi ; il doit être rapproché de l’accord applicable, du planning réel et du statut. Les logiciels cités sont des exemples et non une recommandation d’achat.

## Repères design

Interface pensée pour une lecture mobile et des contenus denses : navigation courte, zones tactiles confortables, surfaces de verre réservées aux regroupements utiles, contraste, focus clavier, réduction des animations et palette colorée limitée aux repères visuels. Les captures fournies dans `parametrage` et leur transcription ont servi de référence pour les espacements, transitions, hiérarchie et lisibilité.
