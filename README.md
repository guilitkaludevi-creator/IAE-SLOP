# Mosaïque Santé

Prototype web mobile-first pour les futurs managers d’établissements sanitaires, sociaux et médico-sociaux en France.

## Contenu

- Panorama de structures et de dispositifs, avec publics, métiers, partenaires et repères de management.
- Filtres déroulants translucides par famille ou secteur dans les pages Établissements, Métiers de direction et Métiers support, combinables avec la recherche et utilisables au clavier.
- Onglets thématiques sur les pages de repères les plus denses, navigables avec les flèches du clavier. Les grandes listes affichent six résultats par page ; les recherches et filtres portent toujours sur l’ensemble des résultats accessibles.
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
- Carte des interactions 3D plein format : un doigt pour orbiter (ou déplacer une bulle), pincement à deux doigts pour zoomer, glissement à deux doigts pour se déplacer, torsion pour tourner, double-tap pour zoomer / recentrer, boutons +/−/recentrer/agrandir, réglages avancés repliés ; panneau de détails flottant repliable ; ctrl + molette (ou pincement du pavé tactile) pour zoomer sur ordinateur.
- Carte 3D animée en temps réel : bulles mobiles dans l’espace, liens directionnels et libellés projetés à chaque mouvement ; rotation libre, translation, profondeur, zoom et perspective.
- Raccourcis cliquables depuis l’accueil vers les métiers, la qualité, les outils, la politique de santé et les partenaires.
- Navigation précédent/suivant avec conservation de la page, du scroll et des filtres.
- Réseau de promotion volontaire en deux onglets distincts : « Réseau » (consultation Premium, recherche et filtres) et « Inscription au réseau » (formulaire accessible aussi en Freemium).
- Fil d’actualités : publication d’offres, événements et annonces ; commentaires via une boîte de dialogue permettant d’indiquer sa venue ou l’envoi d’un salarié, d’un alternant, de résidents / patients ou d’une autre délégation ; suppression de ses propres publications après confirmation (règles Firestore : auteur ou administrateur).
- Connexion et inscription par email ou Google via Firebase Authentication ; après création d’un compte, inscription facultative au réseau avant l’accueil, ou possibilité de passer et de s’inscrire plus tard. Une étape inachevée est reprise sur le même navigateur. La page « Mon compte » permet de modifier le nom affiché, gérer son mot de passe si la connexion utilise un mot de passe, et se déconnecter.
- Affichage mobile, thème sombre/clair, panneaux de détails en feuille iOS, fermeture par glissement, transitions fluides, mode hors-ligne de base et ajout à l’écran d’accueil.
- Document de pitch commercial complet pour les écoles (abonnements Découverte, Partenaire, Campus Santé) et tarification individuelle dans `pitch-mosaique-sante-ecoles.md`.

## Lancer en local

Servez ce dossier avec l’extension Live Server de VS Code ou `npx serve .`. Firebase Authentication utilise des modules chargés depuis le CDN Google et nécessite une connexion réseau ainsi qu’un domaine autorisé dans Firebase. Le service worker et l’installation PWA nécessitent HTTPS ou `localhost`.

Avant d’utiliser la connexion ou l’inscription, initialisez Authentication dans la console Firebase du projet et activez les fournisseurs « Adresse e-mail/Mot de passe » et « Google ». Vérifiez aussi que le domaine de l’application figure dans les domaines autorisés. La connexion Google utilise une fenêtre pop-up, qui doit être autorisée dans le navigateur.

Pour tester le mode complet, connectez-vous avec une adresse vérifiée, puis saisissez `TEST-MOSAIQUE-COMPLET` dans « Abonnement & accès » → « Utiliser un code d’accès ». Ce code est public : tout utilisateur connecté avec un email vérifié peut l’utiliser. L’accès est enregistré dans le navigateur, sans paiement ni abonnement Stripe ; retirez ce mode avant une commercialisation. Le contenu Premium reste accessible dans les fichiers publics et n’est pas protégé côté serveur.

Le projet ne nécessite pas de compilation. Les transitions de navigation privilégient un fondu et respectent le réglage de réduction des animations. Une mise à jour du service worker ne recharge pas automatiquement une page en cours de saisie ; elle prend effet au prochain chargement.

Le paiement en ligne et la gestion des abonnements de groupe ne sont pas opérationnels. La création de comptes de groupe nécessite au préalable un statut d’abonnement vérifié côté serveur.

## Publier avec GitHub Pages

Copiez le contenu de ce dossier à la racine d’un dépôt GitHub, activez GitHub Pages pour la branche et le dossier souhaités, puis ouvrez l’URL HTTPS. Vous pouvez aussi conserver cette application dans un sous-dossier, à condition de publier ce dossier comme racine du site afin que les chemins relatifs restent corrects.

## Données de l’annuaire

La création d’une fiche attend la confirmation de Firestore avant de continuer et en conserve aussi une copie dans `localStorage`. Les fiches synchronisées, y compris les adresses de contact, sont accessibles publiquement selon les règles actuelles ; le lien LinkedIn n’est conservé que sur l’appareil. Le bouton d’export produit un fichier JSON local. « Tout supprimer » efface les données locales de ce navigateur ; la suppression distante dépend des droits Firestore.

Avant une collecte collective, définir une information de confidentialité, une finalité, les accès, une durée de conservation et une procédure de suppression. Firebase Authentication et Firestore sont configurés ; les accès aux données partagées doivent être encadrés par les règles Firestore et une validation côté serveur. L’écran de connexion ne protège pas à lui seul les fichiers publics de l’application.

## Sources et limites

Les liens officiels sont regroupés dans l’interface : Légifrance, HAS, CNSA, ANAP, FINESS, service-public et EHESP. La base couvre les grandes familles et les types courants, sans prétendre remplacer la nomenclature FINESS exhaustive ni l’autorisation propre à chaque site. Les catégories, sigles, missions et calendriers évoluent ; les repères réglementaires doivent être vérifiés avant une décision.

Les fiches RH et de responsabilité sont pédagogiques, pas un avis juridique, médical ou financier. Le statut de l’employeur, les textes, conventions, autorisations, délégations et règles territoriales priment.

Les calculateurs RH fonctionnent localement dans la page : les valeurs saisies ne sont pas enregistrées et ne sont pas envoyées à un serveur. Le calcul forfait jours est une estimation sur un calendrier standard du lundi au vendredi ; il doit être rapproché de l’accord applicable, du planning réel et du statut. Les logiciels cités sont des exemples et non une recommandation d’achat.

## Repères design

Interface pensée pour une lecture mobile et des contenus denses : navigation courte, zones tactiles confortables, surfaces de verre réservées aux regroupements utiles, contraste, focus clavier, réduction des animations et palette colorée limitée aux repères visuels. Les captures fournies dans `parametrage` et leur transcription ont servi de référence pour les espacements, transitions, hiérarchie et lisibilité.
