(function () {
  "use strict";

  const SOURCES = {
    casf: { label: "CASF · catégories ESSMS (L. 312-1)", url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000054137518" },
    finess: { label: "FINESS · nomenclature des établissements", url: "https://finess.esante.gouv.fr/fininter/jsp/pdf.do?xsl=CategEta.xsl" },
    casfRights: { label: "CASF · droits et participation (L. 311-3 à L. 311-12)", url: "https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006074069/LEGISCTA000006157631/" },
    project: { label: "CASF · projet d’établissement (L. 311-8)", url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000045136959" },
    hasEsms: { label: "HAS · référentiel d’évaluation des ESSMS", url: "https://www.has-sante.fr/jcms/p_3324490/fr/referentiel-d-evaluation-de-la-qualite-des-etablissements-et-services-sociaux-et-medico-sociaux" },
    hasProcedure: { label: "HAS · mise en œuvre de l’évaluation ESSMS", url: "https://has-sante.fr/jcms/p_3323069/fr/upload/docs/application/pdf/2022-03/manuel_devaluation_de_la_qualite_essms.pdf" },
    hasHealth: { label: "HAS · certification des établissements de santé", url: "https://www.has-sante.fr/jcms/p_3219174/fr/manuel-et-referentiel-de-la-certification-des-etablissements-pour-la-qualite-des-soins" },
    hospital: { label: "Code de la santé publique · missions des établissements de santé", url: "https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006072665/LEGISCTA000006155106/" },
    cnsaFunding: { label: "CNSA · financement des ESMS", url: "https://www.cnsa.fr/budget-et-financement/financement-des-esms/financement-du-fonctionnement-des-esms" },
    cnsaData: { label: "CNSA · dépôts EPRD, ERRD et comptes administratifs", url: "https://www.cnsa.fr/index.php/donnees/collectes-de-donnees" },
    cnsaCampaign: { label: "CNSA · calendrier annuel CA / ERRD", url: "https://www.cnsa.fr/actualites/campagnes-de-transmission-des-comptes-administratifs-et-des-errd-2025" },
    cnsaCnr: { label: "CNSA · financements ponctuels et CNR", url: "https://www.cnsa.fr/actualites/des-mesures-renforcees-pour-soutenir-les-esms-et-des-credits-exceptionnels-pour" },
    duerp: { label: "Code du travail · mise à jour du DUERP (R. 4121-2)", url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000045386446" },
    cse: { label: "Service-Public · comité social et économique", url: "https://www.service-public.fr/particuliers/vosdroits/F34474" },
    cvs: { label: "Légifrance · conseil de la vie sociale (décret 2022-688)", url: "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000045668446" },
    anap: { label: "ANAP · mission et ressources", url: "https://anap.fr/s/qui-sommes-nous" },
    cnsa: { label: "CNSA · missions de la branche Autonomie", url: "https://www.cnsa.fr/la-cnsa/la-cnsa-branche-autonomie-de-la-securite-sociale/presentation-et-missions-de-la-cnsa" },
    iae: { label: "IAE Paris-Est · Master Management des établissements de santé", url: "https://www.iae-paris-est.fr/formations/master-management-des-etablissements-de-sante/" },
    d3s: { label: "EHESP · concours et métier D3S", url: "https://www.ehesp.fr/formation/formations-fonction-publique/directeur-detablissement-sanitaire-social-et-medico-social/" },
    dh: { label: "EHESP · directeur d’hôpital", url: "https://www.ehesp.fr/formation/formations-fonction-publique/directeur-dhopital/" },
    cafdes: { label: "EHESP · CAFDES", url: "https://www.ehesp.fr/formation/formations-diplomantes/cafdes/" },
    cdu: { label: "Code de la santé publique · droits des patients et CDU", url: "https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006072665/LEGISCTA000006171406/" },
    ars: { label: "ARS · missions et organisation", url: "https://www.ars.sante.fr/" },
    mdph: { label: "Service-Public · MDPH et décisions d’orientation", url: "https://www.service-public.fr/particuliers/vosdroits/N12230" },
    cnil: { label: "CNIL · données de santé", url: "https://www.cnil.fr/fr/definition/donnee-de-sante" },
    servicePublicWork: { label: "Service-Public · santé et sécurité au travail", url: "https://www.service-public.fr/particuliers/vosdroits/F2210" },
    appProject: { label: "CASF · autorisation et appels à projets", url: "https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006074069/LEGISCTA000006142848/" },
    qualiscope: { label: "HAS · Qualiscope et résultats d’évaluation", url: "https://www.has-sante.fr/jcms/p_3644597/fr/foire-aux-questions-faq-sur-la-qualite-des-etablissements-et-services-sociaux-et-medico-sociaux" },
    motion: { label: "Motion · animations JavaScript pour HTML et SVG", url: "https://motion.dev/docs/quick-start" },
    ccIdcc29: { label: "Légifrance · CCN 51 / FEHAP (IDCC 29)", url: "https://www.legifrance.gouv.fr/conv_coll/id/KALICONT000005635234/" },
    ccIdcc413: { label: "Légifrance · CCN 66 (IDCC 413)", url: "https://www.legifrance.gouv.fr/conv_coll/id/KALICONT000005635407" },
    ccIdcc2264: { label: "Légifrance · Hospitalisation privée (IDCC 2264)", url: "https://www.legifrance.gouv.fr/conv_coll/id/KALICONT000005635813" },
    ccIdcc2941: { label: "Légifrance · Branche aide et soins à domicile (IDCC 2941)", url: "https://www.legifrance.gouv.fr/liste/idcc?etatTexte=VIGUEUR_ETEN&idcc_suggest=2941" },
    ccIdcc2046: { label: "Légifrance · Centres de lutte contre le cancer (IDCC 2046)", url: "https://www.legifrance.gouv.fr/liste/idcc?etatTexte=VIGUEUR_ETEN&idcc_suggest=2046" },
    ccIdcc5502: { label: "Légifrance · accords de la Croix-Rouge française (IDCC 5502)", url: "https://www.legifrance.gouv.fr/liste/idcc?etatTexte=VIGUEUR_ETEN&idcc_suggest=5502" },
    ccIdcc218: { label: "Légifrance · organismes de sécurité sociale (IDCC 218)", url: "https://www.legifrance.gouv.fr/conv_coll/id/KALICONT000038292684" },
    collectiveAgreement: { label: "Service-Public · convention collective applicable", url: "https://www.service-public.fr/particuliers/vosdroits/F78" },
    publicServiceCode: { label: "Légifrance · Code général de la fonction publique", url: "https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000044416551/" },
    forfait: { label: "Ministère du Travail · conventions de forfait", url: "https://travail-emploi.gouv.fr/les-conventions-de-forfait" },
    forfaitArticle: { label: "Légifrance · Code du travail, article L. 3121-64", url: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000036262805" },
    dailyRest: { label: "Ministère du Travail · repos quotidien", url: "https://travail-emploi.gouv.fr/le-repos-quotidien-principe-et-derogations" },
    etpGuide: { label: "DGAFP · définition ETP et ETPT", url: "https://www.fonction-publique.gouv.fr/files/files/etudes-statistiques-et-publications/etudes-statistiques/Guide-BDS-FPE%20-%20annexe%20I%20-%20Description%20des%20donn%C3%A9es%20%28mai2025%29.pdf" },
    candidateInfo: { label: "Service-Public · informations demandées en entretien", url: "https://www.service-public.fr/particuliers/actualites/A17894?lang=fr" },
    recruitmentNoDiscrimination: { label: "Ministère du Travail · recruter sans discriminer", url: "https://travail-emploi.gouv.fr/entreprises-bonnes-pratiques-pour-recruter-sans-discriminer" },
    recruitmentPrivacy: { label: "CNIL · données personnelles des candidats", url: "https://www.cnil.fr/fr/le-guide-du-recrutement" },
    jobOffer: { label: "Ministère du Travail · rédiger une offre d’emploi attractive", url: "https://travail-emploi.gouv.fr/sites/travail-emploi/files/2024-10/presentation-160424.pdf" },
    ansDui: { label: "ANS · dossier usager informatisé (DUI)", url: "https://esante.gouv.fr/ens/segur-numerique-sante/vague-2/dispositif-dui-couloir-social-medico-social" },
    ansSoftware: { label: "ANS · solutions référencées Ségur", url: "https://esante.gouv.fr/ens/segur-numerique-sante/solutions-candidates-referencees-segur" },
    mssante: { label: "ANS · MSSanté", url: "https://esante.gouv.fr/produits-services/echange-donnees-sante/mssante" },
    viaTrajectoire: { label: "Service numérique · ViaTrajectoire", url: "https://prod-convergence.esante.gouv.fr/produits-services/ViaTrajectoire" },
    orbis: { label: "Dedalus · DPI ORBIS", url: "https://www.dedalus.com/fr/fr/our-offer/products/dpi-orbis/" },
    dxcare: { label: "ANSM · avis de sécurité DxCare", url: "https://ansm.sante.fr/uploads/2022/02/21/20220217-mes-dxcare-dedalus.pdf" },
    netsoins: { label: "Orisha Care · DUI NETSoins", url: "https://www.orisha.com/fr/care/logiciel/netsoins-logiciel-dui-ehpad" },
    auditHas: { label: "HAS · Guide méthodologique de l'audit clinique et des démarches traceurs", url: "https://www.has-sante.fr/jcms/c_2801940/fr/methodes-et-outils-des-demarches-qualite-et-securite-des-soins" },
    cofrac: { label: "COFRAC · Accréditation des organismes d'évaluation de la qualité des ESSMS", url: "https://www.cofrac.fr/" },
    anapAudit: { label: "ANAP · Outils d'auto-évaluation et grilles d'audit interne", url: "https://anap.fr/" },
    ameli: { label: "Ameli · Assurance Maladie (CNAM)", url: "https://www.ameli.fr/" },
    cnsaSecu: { label: "Sécurité Sociale · Branche Autonomie (CNSA)", url: "https://www.securite-sociale.fr/la-secu-et-vous/la-branche-autonomie" },
    en3s: { label: "EN3S · École Nationale Supérieure de Sécurité Sociale", url: "https://en3s.fr/" },
    carsat: { label: "Assurance Maladie - Risques Professionnels / CARSAT", url: "https://www.ameli.fr/entreprise/tableau-de-bord/prevention-des-risques-professionnels" },
    dreesSecu: { label: "DREES · Les comptes de la Sécurité sociale", url: "https://drees.solidarites-sante.gouv.fr/sources-outils-et-enquetes/les-comptes-de-la-securite-sociale" },
    plfss: { label: "Légifrance · Lois de financement de la Sécurité sociale (LFSS)", url: "https://www.legifrance.gouv.fr/" },
    ageval: { label: "ANAP · AgEval, outil de recueil et de suivi des événements indésirables en ESSMS", url: "https://anap.fr/s/article/ageval-outil-gratuit-de-recueil-et-de-suivi-des-evenements-indesirables" },
    signalement: { label: "HAS · Déclaration et analyse des événements indésirables graves associés aux soins (EIGS)", url: "https://www.has-sante.fr/jcms/p_3098636/fr/les-evenements-indesirables-graves-associes-aux-soins-eigs" },
    rexHas: { label: "HAS · Guide méthodologique du retour d'expérience (REX)", url: "https://www.has-sante.fr/jcms/c_2801940/fr/methodes-et-outils-des-demarches-qualite-et-securite-des-soins" },
    crex: { label: "HAS · Mise en place d'un Comité de Retour d'Expérience (CREX)", url: "https://www.has-sante.fr/jcms/c_2801940/fr/methodes-et-outils-des-demarches-qualite-et-securite-des-soins" },
    rexEssms: { label: "HAS · Gestion des risques et démarche d'amélioration continue en ESSMS", url: "https://www.has-sante.fr/jcms/p_3270037/fr/les-outils-de-la-demarche-qualite-en-essms" },
    pnsp: { label: "Ministère · Programme national pour la sécurité des patients (PNSP 2021-2025)", url: "https://solidarites-sante.gouv.fr/IMG/pdf/pnsp_21-25_vf2.pdf" },
    vigilances: { label: "ANSM · Portail national de signalement des vigilances sanitaires", url: "https://signalement.social-sante.gouv.fr/" },
    loi2002: { label: "Légifrance · Loi n° 2002-2 du 2 janvier 2002 rénovant l'action sociale et médico-sociale", url: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000215460" },
    loi2005: { label: "Légifrance · Loi n° 2005-102 du 11 février 2005 pour l'égalité des droits et des chances (handicap)", url: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000809647" },
    loi2015: { label: "Légifrance · Loi ASV n° 2015-1776 du 28 décembre 2015 (adaptation au vieillissement)", url: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000031047611" },
    loi2016sante: { label: "Légifrance · Loi n° 2016-41 du 26 janvier 2016 de modernisation de notre système de santé", url: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000032171909" },
    loi2022: { label: "Légifrance · LFSS 2022 et réforme des Services Autonomie à Domicile (SAD)", url: "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000044559672" },
    loi2024autonomie: { label: "Légifrance · Loi n° 2024-317 du 8 avril 2024 portant mesures pour bâtir la société du bien vieillir", url: "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000049563600" },
    prs: { label: "ARS · Projets Régionaux de Santé (PRS 3e génération)", url: "https://www.ars.sante.fr/les-projets-regionaux-de-sante-prs" },
    pns: { label: "Ministère · Stratégie nationale de santé et Ma Santé 2022", url: "https://solidarites-sante.gouv.fr/systeme-de-sante/segur-de-la-sante-et-ma-sante-2022/" },
    segurNum: { label: "ANS · Ségur du numérique en santé (DUI / DPI / INS / MSSanté)", url: "https://esante.gouv.fr/segur" },
    stratPsy: { label: "Ministère · Feuille de route santé mentale et psychiatrie", url: "https://solidarites-sante.gouv.fr/IMG/pdf/180628_-_feuille_de_route_sante_mentale_et_psychiatrie.pdf" },
    inclureTransition: { label: "Gouvernement · Stratégie nationale pour l'autisme et les TND 2023-2027", url: "https://www.gouvernement.fr/strategie-nationale-autisme-tnd" },
    spda: { label: "CNSA · Service Public Départemental de l'Autonomie (SPDA)", url: "https://www.cnsa.fr/politiques-de-lautonomie/le-service-public-departemental-de-lautonomie" },
    codeTravailConges: { label: "Code du travail · Congés payés et autorisations d'absence (L. 3141-1 s.)", url: "https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006072050/LEGISCTA000006198547/" },
    citisFph: { label: "Légifrance · Décret n° 2019-122 sur le CITIS dans la FPH", url: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000038158055/" },
    tptAmeli: { label: "Ameli · Temps partiel thérapeutique et reprise progressive", url: "https://www.ameli.fr/assure/droits-demarches/maladie-accident-hospitalisation/arret-travail-maladie/reprise-travail-temps-partiel-therapeutique" },
    anapPlanning: { label: "ANAP · Guide méthodologique de gestion et optimisation des plannings soignants", url: "https://anap.fr/" },
    arsInspection: { label: "Ministère & ARS · Guide des inspections et contrôles en santé et médico-social", url: "https://www.ars.sante.fr/" },
    charteBientraitance: { label: "HAS · Recommandations pour la bientraitance et la dignité des personnes accueillies", url: "https://www.has-sante.fr/jcms/c_703080/fr/la-bientraitance-definition-et-reperes-pour-la-mise-en-oeuvre" },

  };

  const ESTABLISHMENTS = [
    { id: "chu", name: "Centre hospitalier universitaire", short: "CHU", family: "Sanitaire", type: "Public · recours, soins, enseignement et recherche", audience: "Patients de tous âges, notamment les situations complexes ou nécessitant une expertise de recours.", definition: "Établissement public de santé qui associe soins, enseignement universitaire et recherche. Son organisation en pôles, départements et services varie selon le site.", devices: ["Urgences et soins critiques", "Médecine, chirurgie, obstétrique", "Plateaux médico-techniques", "Hôpital de jour et consultations", "SMR, psychiatrie ou HAD selon le groupement"], professions: ["Direction générale et directions fonctionnelles", "Médecins, pharmaciens, sages-femmes", "Directeur des soins, cadres de santé", "IDE, aides-soignants, rééducateurs", "DIM, qualité, finances, RH, logistique, SI"], partners: ["ARS", "Université et organismes de recherche", "GHT et établissements de proximité", "CPTS, professionnels de ville et médico-social", "Assurance maladie"], manager: "Piloter une organisation multi-sites et les interfaces entre activités cliniques, fonctions support, qualité, finances et projet territorial.", sources: ["hospital", "finess"] },
    { id: "ch", name: "Centre hospitalier", short: "CH / CHG", family: "Sanitaire", type: "Public · soins de proximité ou de référence", audience: "Population d’un bassin de vie, avec des parcours allant des consultations à l’hospitalisation.", definition: "Établissement public de santé dont le périmètre dépend de son autorisation et de son projet médical : médecine, chirurgie, obstétrique, psychiatrie, SMR ou soins de proximité.", devices: ["Urgences selon autorisation", "Consultations et hospitalisation", "SMR et soins palliatifs selon l’offre", "Équipes mobiles et consultations avancées", "Coopérations au sein d’un GHT"], professions: ["Direction et responsables de pôle", "Communauté médicale et pharmaceutique", "Cadres, IDE, AS, rééducateurs", "Qualité, affaires médicales, RH, finances", "Admissions, biomédical, technique, restauration"], partners: ["ARS et GHT", "CPTS, médecins de ville, DAC", "EHPAD, MAS, services à domicile", "Université ou instituts de formation", "Collectivités locales"], manager: "Travailler la continuité des parcours, les capacités, la permanence des soins et les équilibres RH et financiers.", sources: ["hospital", "finess"] },
    { id: "mco", name: "Clinique MCO", short: "Clinique MCO", family: "Sanitaire", type: "Privé lucratif ou ESPIC · médecine, chirurgie, obstétrique", audience: "Patients pris en charge en hospitalisation complète, ambulatoire, consultations ou urgences selon les autorisations.", definition: "Établissement de santé privé organisé autour d’activités autorisées. Les modes de financement, la gouvernance et les relations avec les praticiens diffèrent selon le statut.", devices: ["Médecine et chirurgie", "Chirurgie ambulatoire", "Maternité selon autorisation", "Soins critiques ou urgences selon site", "Consultations et parcours de sortie"], professions: ["Direction d’établissement et cadres administratifs", "Médecins salariés ou libéraux", "Cadres de santé, IDE, AS", "Pharmacie, bloc, stérilisation, biomédical", "Qualité, facturation, admissions, RH"], partners: ["ARS et Assurance maladie", "Praticiens et maisons de santé", "GHT et établissements publics", "CPTS, HAD, SMR et réseaux de ville", "Organismes complémentaires"], manager: "Connaître le modèle de gouvernance, les contrats avec les praticiens, les autorisations et les indicateurs d’activité/facturation.", sources: ["hospital", "hasHealth"] },
    { id: "smr", name: "Soins médicaux et de réadaptation", short: "SMR", family: "Sanitaire", type: "Public ou privé · hospitalisation complète ou partielle", audience: "Personnes ayant besoin de soins médicaux, rééducation, réadaptation et préparation du retour à domicile ou en structure.", definition: "Activité hospitalière de soins médicaux et de réadaptation, dénommée auparavant SSR. Elle intervient après ou en alternative à un épisode aigu, selon le parcours.", devices: ["Hospitalisation complète", "Hospitalisation à temps partiel", "Plateaux de rééducation", "Équipes mobiles ou consultations", "Coordination de la sortie et de l’aval"], professions: ["Médecins spécialistes", "Masseurs-kinésithérapeutes, ergothérapeutes", "IDE, AS, orthophonistes", "Assistants sociaux, diététiciens, psychologues", "Cadres et équipes qualité"], partners: ["MCO et urgences", "Médecins traitants et CPTS", "HAD et services à domicile", "EHPAD, MAS, FAM et résidence autonomie", "ARS et Assurance maladie"], manager: "Organiser des parcours et des plateaux, suivre les durées de séjour, les réadmissions, la qualité et les liens avec l’aval.", sources: ["hospital", "hasHealth"] },
    { id: "psy", name: "Psychiatrie et santé mentale", short: "EPSM · CMP · CATTP", family: "Sanitaire", type: "Public ou privé · hospitalier, ambulatoire et mobile", audience: "Enfants, adolescents ou adultes selon l’offre, le secteur et les autorisations.", definition: "Offre de soins en santé mentale qui peut associer hospitalisation, consultation et intervention dans le milieu de vie. Un CMP, un CATTP ou un hôpital de jour est un dispositif ou une unité, pas nécessairement un établissement autonome.", devices: ["Centre médico-psychologique (CMP)", "Centre d’accueil thérapeutique à temps partiel (CATTP)", "Hôpital de jour", "Hospitalisation complète et unités spécialisées", "Équipes mobiles, crise et soins sans consentement selon les cadres"], professions: ["Psychiatres et pédopsychiatres", "Psychologues, IDE, éducateurs", "Cadres de santé et assistants sociaux", "Secrétariats médicaux et équipes mobiles", "Qualité, affaires médicales et gestion des risques"], partners: ["CMP et médecins de ville", "MDA, PJJ, ASE et Éducation nationale", "CPTS, DAC, urgences et SMR", "Associations d’usagers et familles", "ARS et collectivités"], manager: "Concilier sécurité, droits, continuité, capacité des unités, attractivité des équipes et coordination avec le secteur social.", sources: ["hospital", "hasHealth"] },
    { id: "had", name: "Hospitalisation à domicile", short: "HAD", family: "Sanitaire", type: "Public ou privé · soins hospitaliers au lieu de vie", audience: "Patients dont l’état requiert des soins hospitaliers coordonnés au domicile ou dans un établissement médico-social partenaire.", definition: "Établissement de santé qui organise des soins hospitaliers au domicile, avec une équipe de coordination et des intervenants partenaires.", devices: ["Coordination médicale et soignante", "Soins palliatifs, pansements complexes, traitements selon autorisation", "Interventions au domicile ou en ESSMS", "Admissions et sorties coordonnées", "Télésoin ou télésuivi si autorisés"], professions: ["Médecins coordonnateurs et traitants", "IDE de coordination et intervenants", "Aides-soignants, rééducateurs, psychologues", "Assistants sociaux, pharmaciens", "Direction, qualité, facturation et logistique"], partners: ["Établissements MCO et SMR", "Médecins et infirmiers libéraux", "EHPAD, MAS, FAM et SAD", "Pharmacies et dispositifs territoriaux", "ARS et Assurance maladie"], manager: "Sécuriser les critères d’admission, les transmissions, les astreintes, la coordination et la capacité logistique du territoire.", sources: ["hospital", "hasHealth"] },
    { id: "usld", name: "Unité de soins de longue durée", short: "USLD", family: "Sanitaire", type: "Sanitaire · soins médicaux et surveillance continue", audience: "Personnes très dépendantes dont l’état nécessite une surveillance médicale constante et des soins importants.", definition: "Unité sanitaire accueillant des personnes âgées nécessitant des soins médicaux et techniques importants, souvent articulée avec un hôpital ou un EHPAD.", devices: ["Hébergement sanitaire de longue durée", "Soins médicaux et infirmiers continus", "Rééducation et soins de support", "Accompagnement des proches", "Prévention des risques liés à la dépendance"], professions: ["Médecins, IDE, AS", "Cadres de santé et rééducateurs", "Psychologues, assistants sociaux", "Hôtellerie et équipes logistiques", "Direction et qualité"], partners: ["MCO, SMR et équipes mobiles", "EHPAD et services à domicile", "Médecins traitants et familles", "ARS, Assurance maladie et département", "Associations de bénévoles"], manager: "Clarifier le partage des responsabilités sanitaires et médico-sociales, les ressources en soins et le projet de vie.", sources: ["hospital", "hasHealth"] },
    { id: "clcc", name: "Centre de lutte contre le cancer", short: "CLCC", family: "Sanitaire", type: "ESPIC · oncologie et expertise", audience: "Personnes atteintes de cancer, pour le diagnostic, le traitement, le suivi et parfois la recherche.", definition: "Établissement privé d’intérêt collectif spécialisé en cancérologie, participant à la recherche et à la formation selon son organisation.", devices: ["Consultations et hospitalisation", "Chirurgie, radiothérapie et traitements systémiques selon autorisation", "Soins de support et oncogériatrie", "Réunions de concertation pluridisciplinaire", "Recherche clinique"], professions: ["Oncologues et équipes médicales", "IDE, manipulateurs radio, pharmaciens", "Psychologues, assistants sociaux, diététiciens", "Cadres, qualité, recherche clinique", "Direction, finances et fonctions support"], partners: ["ARS et réseaux de cancérologie", "CHU, hôpitaux et cliniques", "Médecins traitants et CPTS", "Associations de patients", "Instituts et équipes de recherche"], manager: "Tenir ensemble qualité/sécurité des soins, recherche, autorisations, activité, expérience patient et partenariats.", sources: ["hospital", "hasHealth"] },
    { id: "centre-sante", name: "Centre de santé / maison de santé", short: "Centre · MSP", family: "Sanitaire", type: "Soins de ville · équipe pluriprofessionnelle", audience: "Habitants d’un territoire, avec ou sans médecin traitant selon la structure.", definition: "Offre de soins ambulatoires de proximité. Un centre de santé et une maison de santé pluriprofessionnelle ont des statuts et modes de gestion différents ; ce ne sont pas des hôpitaux.", devices: ["Consultations et prévention", "Coordination pluriprofessionnelle", "Éducation thérapeutique selon autorisation", "Téléconsultation ou médiation santé selon le projet", "Parcours d’accès aux droits"], professions: ["Médecins généralistes et spécialistes", "Infirmiers, sages-femmes, kinés", "Médiateurs et secrétaires médicales", "Coordinateur de structure", "Gestion, RH et qualité selon taille"], partners: ["CPTS et ARS", "CPAM et collectivités", "Hôpitaux, HAD et SMR", "Pharmacies, laboratoires et professionnels de ville", "Associations locales"], manager: "Distinguer statut juridique, modèle de rémunération et projet de santé ; faire vivre la coordination sans hiérarchie médicale implicite.", sources: ["hospital"] },
    { id: "ehpad", name: "Établissement d’hébergement pour personnes âgées dépendantes", short: "EHPAD", family: "Médico-social · grand âge", type: "ESSMS avec hébergement · financements souvent pluriels", audience: "Personnes âgées en perte d’autonomie ayant besoin d’un accompagnement quotidien et de soins coordonnés.", definition: "Lieu de vie médico-social médicalisé. Le modèle tarifaire et les autorités de tarification dépendent du statut, de l’habilitation et des modalités de financement.", devices: ["Accueil permanent et temporaire", "Pôle d’activités et de soins adaptés (PASA) selon autorisation", "Unité d’hébergement renforcée (UHR) selon autorisation", "Accueil de jour et plateforme de répit", "Soins, restauration, animation et vie sociale"], professions: ["Direction et responsable hôtelier", "Médecin coordonnateur, IDEC, IDE, AS", "Psychologue, ergothérapeute, animateur", "ASH, restauration, linge, maintenance", "Qualité, RH, finances, admissions"], partners: ["ARS et conseil départemental", "Médecins traitants, HAD, équipes mobiles", "DAC, CPTS et services à domicile", "Familles, CVS et associations", "CNSA, CPAM et fournisseurs"], manager: "Suivre qualité de vie, soins, effectifs, absentéisme, occupation, tarifs, prix affichés et dialogue avec les deux autorités quand elles sont compétentes.", sources: ["casf", "cnsaFunding", "hasEsms"] },
    { id: "res-autonomie", name: "Résidence autonomie", short: "Résidence autonomie", family: "Médico-social · grand âge", type: "ESSMS · logement accompagné non médicalisé", audience: "Personnes âgées autonomes ou relativement autonomes qui souhaitent un logement avec des services collectifs.", definition: "Résidence sociale médico-sociale qui propose logements privatifs et services collectifs. Elle n’est pas un EHPAD et n’assure pas le même niveau de médicalisation.", devices: ["Logements privatifs", "Restauration et animations collectives", "Prévention de la perte d’autonomie", "Accueil de jour ou services partenaires", "Actions de lien social"], professions: ["Direction ou responsable de résidence", "Équipe d’accueil et de vie sociale", "Agents hôteliers et maintenance", "Intervenants libéraux ou services extérieurs", "Gestion locative et fonctions support"], partners: ["Conseil départemental et commune", "CCAS, associations et acteurs du lien social", "SAD, médecins et infirmiers de ville", "CPTS et DAC", "Familles et proches aidants"], manager: "Faire connaître la frontière entre services proposés, prestations de soins externes et responsabilités de l’exploitant.", sources: ["casf", "cnsaFunding"] },
    { id: "mas", name: "Maison d’accueil spécialisée", short: "MAS", family: "Médico-social · handicap adulte", type: "ESSMS médicalisé · financement principalement assurance maladie", audience: "Adultes avec handicap lourd nécessitant une aide humaine et une surveillance médicale constantes.", definition: "Établissement médico-social d’hébergement et d’accompagnement permanent, avec soins et soutien dans les actes essentiels, la communication, la participation et la vie sociale.", devices: ["Hébergement permanent, temporaire ou accueil de jour selon autorisation", "Unités de vie et accompagnements personnalisés", "Soins infirmiers et soins de support", "Répit, transition ou accueil séquentiel selon le projet", "CAA, activités, sorties et partenariats de proximité"], professions: ["Direction et adjoint de direction", "Médecin, IDE, aides-soignants, AES", "Éducateurs, AMP/AES, moniteurs-éducateurs", "Ergothérapeutes, psychomotriciens, psychologues", "ASH, restauration, maintenance, qualité et RH"], partners: ["ARS et CPAM", "MDPH/CDAPH et familles", "HAD, hôpital, pharmacie et professionnels libéraux", "Associations, loisirs adaptés et transport", "Écoles/ESAT/foyers selon les parcours"], manager: "Garantir une organisation 24/7, des compétences adaptées, la continuité des soins, les droits, le projet personnalisé et l’équilibre du financement.", sources: ["casf", "hasEsms", "cnsaFunding"] },
    { id: "fam", name: "Foyer d’accueil médicalisé / EAM", short: "FAM · EAM", family: "Médico-social · handicap adulte", type: "ESSMS · accompagnement et soins coordonnés", audience: "Adultes en situation de handicap ayant besoin d’aide quotidienne et de soins réguliers, sans exiger nécessairement le niveau d’une MAS.", definition: "Structure d’hébergement ou d’accueil qui associe accompagnement à la vie quotidienne et soins. Les termes FAM et EAM sont rencontrés selon nomenclature et autorisation.", devices: ["Hébergement permanent ou temporaire", "Accueil de jour", "Accompagnement éducatif et soins", "Unités spécialisées selon public", "Préparation de parcours plus inclusifs"], professions: ["Direction et chefs de service", "Éducateurs, AES, aides-soignants", "IDE, médecins et rééducateurs", "Psychologues et assistants sociaux", "Équipes hôtelières et support"], partners: ["ARS et conseil départemental selon compétence", "MDPH/CDAPH et personnes accompagnées", "Hôpitaux, HAD, SAVS/SAMSAH", "Familles, aidants et associations", "ESAT, entreprises adaptées et loisirs"], manager: "Lire l’autorisation, les CPOM et les financements pour clarifier qui finance quoi ; construire une offre graduée autour de la personne.", sources: ["casf", "finess", "hasEsms"] },
    { id: "ime", name: "Institut médico-éducatif", short: "IME", family: "Médico-social · handicap enfant", type: "ESSMS · éducation et accompagnement médico-social", audience: "Enfants et adolescents en situation de handicap, avec des besoins éducatifs, sociaux, thérapeutiques ou de soins.", definition: "Établissement ou dispositif qui associe enseignement adapté, accompagnement éducatif et interventions médico-sociales. Les formes d’accueil et classes externalisées dépendent de l’autorisation.", devices: ["Internat, semi-internat ou accueil de jour", "Unité d’enseignement", "Interventions éducatives et thérapeutiques", "Classes ou dispositifs externalisés", "Préparation des transitions vers l’âge adulte"], professions: ["Direction et chefs de service", "Éducateurs, enseignants spécialisés", "Psychologues, orthophonistes, psychomotriciens", "IDE, médecins, assistants sociaux", "Partenaires de l’école et familles"], partners: ["ARS, Éducation nationale et MDPH", "CDAPH et familles", "Écoles, collèges, CFA et ESAT", "CMP/CAMSP et professionnels libéraux", "Communes et associations"], manager: "Assurer les interfaces entre projet personnalisé, scolarisation, soins, protection de l’enfance et parcours vers l’âge adulte.", sources: ["casf", "hasEsms", "mdph"] },
    { id: "itep", name: "Institut thérapeutique, éducatif et pédagogique", short: "ITEP · DITEP", family: "Médico-social · handicap enfant", type: "ESSMS · accompagnement modulable", audience: "Enfants et adolescents présentant des difficultés psychologiques qui perturbent gravement la socialisation et les apprentissages.", definition: "Dispositif coordonnant des réponses thérapeutiques, éducatives et pédagogiques, en établissement ou dans les lieux de vie selon le projet.", devices: ["Internat, accueil de jour ou accueil modulé", "Accompagnement en milieu ordinaire", "Unité d’enseignement et inclusion scolaire", "Suivi thérapeutique", "Coordination avec la famille et les partenaires"], professions: ["Direction et responsables d’unité", "Éducateurs et enseignants spécialisés", "Psychologues, psychiatres et thérapeutes", "Assistants sociaux et personnels de santé", "Référents de parcours"], partners: ["ARS et MDPH/CDAPH", "Établissements scolaires et Éducation nationale", "ASE, PJJ et CMP", "Parents, pédopsychiatres et associations", "Acteurs de loisirs et de formation"], manager: "Rendre les séquences et responsabilités lisibles ; soutenir les équipes face aux crises et préserver la cohérence du parcours.", sources: ["casf", "hasEsms", "mdph"] },
    { id: "sessad", name: "Service d’éducation spéciale et de soins à domicile", short: "SESSAD", family: "Médico-social · handicap enfant", type: "ESSMS sans hébergement · interventions en milieu de vie", audience: "Enfants et jeunes en situation de handicap scolarisés ou vivant dans leur famille, selon l’orientation.", definition: "Équipe mobile qui intervient dans les lieux de vie et d’apprentissage. Le nom « à domicile » ne décrit pas toutes les modalités réelles d’intervention.", devices: ["Accompagnement éducatif", "Rééducation et soins selon besoins", "Appui à l’inclusion scolaire", "Coordination de parcours", "Soutien aux familles"], professions: ["Éducateurs spécialisés", "Orthophonistes, psychomotriciens, ergothérapeutes", "Psychologues, médecins et IDE selon service", "Assistants sociaux", "Coordinateurs et secrétariat"], partners: ["MDPH/CDAPH et familles", "Écoles, enseignants référents et AESH", "CAMSP, CMP et professionnels libéraux", "ARS et collectivités", "Associations sportives et culturelles"], manager: "Piloter les déplacements, les temps de coordination, la sécurité des interventions hors les murs et la continuité inter-sites.", sources: ["casf", "hasEsms", "mdph"] },
    { id: "esat", name: "Établissement et service d’accompagnement par le travail", short: "ESAT", family: "Médico-social · travail et inclusion", type: "ESSMS · activité professionnelle protégée et accompagnement", audience: "Personnes handicapées dont les capacités ne permettent pas, temporairement ou durablement, d’exercer une activité en entreprise ordinaire dans les conditions prévues.", definition: "Établissement médico-social qui offre des activités professionnelles et un soutien médico-social. Le statut de la personne accueillie diffère de celui d’un salarié de droit commun.", devices: ["Ateliers de production ou prestations", "Soutien médico-social et formation", "Mise à disposition ou parcours vers le milieu ordinaire", "Hébergement associé selon gestionnaire", "Activités de soutien et participation"], professions: ["Direction et responsables d’atelier", "Moniteurs d’atelier et encadrants techniques", "Éducateurs et conseillers en insertion", "Psychologues, assistants sociaux et infirmiers", "Commerciaux, logistique, qualité et RH"], partners: ["ARS et MDPH/CDAPH", "Entreprises, entreprises adaptées et missions handicap", "Organismes de formation et France Travail", "Familles, SAVS/SAMSAH et foyers", "Clients et réseaux locaux"], manager: "Concilier qualité de l’accompagnement, activité économique, sécurité au travail et projet d’insertion de chaque personne.", sources: ["casf", "hasEsms", "mdph"] },
    { id: "eanm", name: "Établissement d’accueil non médicalisé / foyer de vie", short: "EANM · foyer de vie", family: "Médico-social · handicap adulte", type: "ESSMS · hébergement ou accueil de jour", audience: "Adultes qui ont besoin d’un accompagnement à la vie sociale mais ne relèvent pas d’une activité professionnelle en ESAT ou d’un hébergement très médicalisé.", definition: "Offre d’hébergement ou d’accueil de jour non médicalisée, parfois dénommée foyer de vie, foyer occupationnel ou EANM selon la nomenclature.", devices: ["Hébergement permanent ou temporaire", "Accueil de jour", "Activités de vie sociale et autonomie", "Accompagnement individualisé", "Répit et passerelles vers d’autres solutions"], professions: ["Direction et chefs de service", "Éducateurs, AES, moniteurs-éducateurs", "Psychologues et assistants sociaux", "Veilleurs, hôtellerie et logistique", "Infirmiers ou professionnels de santé partenaires"], partners: ["Conseil départemental et MDPH", "SAVS/SAMSAH, MAS et FAM", "Familles et proches aidants", "Associations, loisirs et collectivités", "Professionnels de santé libéraux"], manager: "Adapter les activités et rythmes à l’autonomie, sécuriser les transitions et préciser les conventions de soins avec les partenaires.", sources: ["casf", "finess", "hasEsms"] },
    { id: "savssamsah", name: "SAVS / SAMSAH", short: "SAVS · SAMSAH", family: "Médico-social · handicap adulte", type: "ESSMS sans hébergement · accompagnement dans le milieu de vie", audience: "Adultes en situation de handicap vivant à domicile ou en logement, avec ou sans besoin de soins coordonnés.", definition: "Le SAVS soutient la vie sociale et l’autonomie ; le SAMSAH ajoute un accompagnement médico-social comprenant une coordination de soins, dans le cadre de son autorisation.", devices: ["Accompagnement à domicile", "Accès aux droits et au logement", "Coordination avec les soignants", "Insertion sociale et professionnelle", "Appui à la gestion de la vie quotidienne"], professions: ["Éducateurs et accompagnants", "IDE et coordinateurs de santé en SAMSAH", "Assistants sociaux, psychologues", "Ergothérapeutes ou conseillers en insertion", "Chefs de service et direction"], partners: ["MDPH/CDAPH et département", "Professionnels de santé et CPTS", "Bailleurs, CCAS et services sociaux", "ESAT, entreprises et organismes de formation", "Familles et associations"], manager: "Organiser l’activité hors les murs, la sécurité des interventions et les limites entre accompagnement social et actes de soins.", sources: ["casf", "hasEsms", "mdph"] },
    { id: "sad", name: "Service autonomie à domicile", short: "SAD · SSIAD · SAAD", family: "Médico-social · domicile", type: "ESSMS ou service autorisé · aide, soins ou offre intégrée", audience: "Personnes âgées ou handicapées vivant à domicile, ainsi que leurs proches aidants.", definition: "Les services d’aide et de soins à domicile évoluent vers les services autonomie à domicile (SAD). Les périmètres et la transformation des anciennes catégories varient selon l’autorisation et le territoire.", devices: ["Aide aux actes de la vie quotidienne", "Soins infirmiers à domicile", "Évaluation et coordination", "Prévention et soutien aux aidants", "Interventions en lien avec les professionnels de ville"], professions: ["Responsables de secteur et coordinateurs", "Aides à domicile et AES", "IDE, aides-soignants et infirmiers libéraux", "Assistants sociaux et gestionnaires de planning", "Direction, RH, qualité et facturation"], partners: ["ARS et conseil départemental", "CNSA, CPAM et MDPH", "CPTS, DAC, médecins et pharmacies", "EHPAD, HAD et hôpitaux", "Aidants, communes et associations"], manager: "Suivre couverture territoriale, temps de déplacement, continuité, absentéisme, coordination aide/soin et cadre de financement.", sources: ["casf", "cnsaFunding", "cnsaData"] },
    { id: "camsp", name: "CAMSP / CMPP", short: "CAMSP · CMPP", family: "Médico-social · enfance", type: "Dépistage, diagnostic et accompagnement précoce ou psychopédagogique", audience: "Jeunes enfants et familles pour le CAMSP ; enfants et adolescents pour le CMPP selon le projet du centre.", definition: "Le CAMSP agit précocement auprès des jeunes enfants présentant ou risquant de présenter un retard ou handicap ; le CMPP propose un accompagnement médico-psychologique et pédagogique ambulatoire.", devices: ["Bilans et évaluations", "Soins ou rééducations ambulatoires", "Soutien et guidance parentale", "Coordination avec crèche et école", "Prévention et orientation"], professions: ["Pédiatres, pédopsychiatres et médecins", "Psychologues et psychomotriciens", "Orthophonistes, kinésithérapeutes", "Assistants sociaux et secrétariat", "Direction et coordination"], partners: ["PMI, maternités et médecins traitants", "MDPH et Éducation nationale", "Crèches, écoles et centres hospitaliers", "ARS, CPAM et collectivités selon le centre", "Familles et associations"], manager: "Gérer les délais, l’accès précoce, les parcours sans rupture et les conventions qui fixent les responsabilités de chaque partenaire.", sources: ["casf", "hasEsms"] },
    { id: "protection-enfance", name: "Protection de l’enfance : MECS, AEMO, accueil", short: "MECS · ASE · AEMO", family: "Social · protection de l’enfance", type: "ESSMS · accueil, soutien et mesures éducatives", audience: "Enfants et jeunes confiés ou accompagnés dans le cadre de la protection de l’enfance, avec leur famille selon les mesures.", definition: "Ensemble d’établissements et services relevant de l’aide sociale à l’enfance ou de mesures judiciaires : MECS, foyers, services d’action éducative et autres modalités d’accueil.", devices: ["Accueil d’urgence et hébergement", "Accueil séquentiel ou familial", "Action éducative en milieu ouvert", "Soutien à la parentalité", "Préparation à l’autonomie et sortie"], professions: ["Direction et chefs de service", "Éducateurs spécialisés et assistants sociaux", "Psychologues et maîtres de maison", "Surveillants de nuit et équipes d’accueil", "Juristes et coordinateurs de parcours"], partners: ["Conseil départemental / ASE", "Juge des enfants et PJJ", "Établissements scolaires et santé mentale", "Parents, avocats, familles d’accueil", "Associations et missions locales"], manager: "Articuler décision judiciaire, protection, projet pour l’enfant, scolarité, santé et continuité lors des changements de lieu.", sources: ["casf", "hasEsms"] },
    { id: "pjj", name: "Protection judiciaire de la jeunesse", short: "PJJ", family: "Social · justice des mineurs", type: "Public · services et unités d’accompagnement éducatif", audience: "Mineurs suivis dans le cadre d’une décision judiciaire, avec une attention aux droits, à la protection et à l’insertion.", definition: "La PJJ met en œuvre des décisions judiciaires et accompagne les mineurs dans des services ou établissements, en lien avec la justice et les partenaires de droit commun.", devices: ["Milieu ouvert et investigation", "Hébergement et centres éducatifs", "Insertion et réparation pénale", "Accompagnement scolaire et professionnel", "Coordination avec la protection de l’enfance"], professions: ["Directeurs et responsables d’unité", "Éducateurs PJJ et psychologues", "Assistants de service social", "Personnels de surveillance et d’insertion", "Greffe, administration et partenaires"], partners: ["Justice et magistrats", "Conseil départemental / ASE", "Éducation nationale et missions locales", "Santé, psychiatrie et addictologie", "Associations et familles"], manager: "Tenir le cadre judiciaire, les exigences de sécurité et la cohérence éducative tout en garantissant la traçabilité des décisions.", sources: ["casf"] },
    { id: "hebergement", name: "CHRS / CADA / hébergement social", short: "CHRS · CADA · FJT", family: "Social · précarité et logement", type: "ESSMS ou structures sociales · accueil, hébergement et insertion", audience: "Personnes ou familles en difficulté, demandeurs d’asile ou jeunes en recherche de logement selon la structure.", definition: "Famille de structures qui accueillent, hébergent ou accompagnent vers l’insertion et le logement. Le public, le financeur et les règles changent selon l’autorisation.", devices: ["Hébergement d’urgence ou d’insertion", "Accompagnement social et accès aux droits", "Accompagnement des demandeurs d’asile", "Logement accompagné et jeunes travailleurs", "Médiation et accès aux soins"], professions: ["Direction et chefs de service", "Travailleurs sociaux et conseillers en insertion", "Veilleurs et intervenants sociaux", "Juristes, interprètes et médiateurs", "Gestion locative, RH et logistique"], partners: ["DDETS / DRIHL et préfecture", "SIAO et collectivités", "OFII pour les dispositifs concernés", "CPAM, hôpitaux, santé mentale et addictologie", "Bailleurs, associations et employeurs"], manager: "Cartographier les conventions, les places financées, les obligations d’accueil et les indicateurs de sortie vers le logement.", sources: ["casf"] },
    { id: "addictologie", name: "CSAPA / CAARUD", short: "CSAPA · CAARUD", family: "Médico-social · difficultés spécifiques", type: "ESSMS · prévention et réduction des risques", audience: "Personnes concernées par les conduites addictives et, pour les CAARUD, usagers de drogues selon les missions du centre.", definition: "Centres médico-sociaux ambulatoires proposant prévention, accompagnement, soins, réduction des risques ou accès aux droits, en lien avec les partenaires sanitaires et sociaux.", devices: ["Accueil à bas seuil et réduction des risques", "Consultations médicales et psychologiques", "Soins ambulatoires et accompagnement social", "Médiation et prévention en milieu festif", "Orientation vers les soins et l’hébergement"], professions: ["Médecins, infirmiers et psychologues", "Éducateurs et assistants sociaux", "Pairs aidants et médiateurs", "Chargés de prévention", "Direction et coordination"], partners: ["ARS et Assurance maladie", "Hôpitaux et psychiatrie", "CCAS, hébergement et justice", "Associations de réduction des risques", "CPTS et professionnels de ville"], manager: "Préserver l’accueil sans jugement, la confidentialité, la sécurité des équipes et les coopérations de santé/social.", sources: ["casf", "hasEsms"] },
    { id: "plateforme", name: "Plateforme de services / communauté 360", short: "Plateforme · 360", family: "Dispositif · coordination territoriale", type: "Modalité de coopération · ce n’est pas toujours un établissement autonome", audience: "Personnes dont les besoins nécessitent une coordination de plusieurs réponses, notamment lorsqu’une solution manque ou doit évoluer.", definition: "Organisation en réseau qui mutualise des ressources et coordonne des réponses autour d’un parcours. Le statut juridique, le financement et le pilotage sont propres au territoire.", devices: ["Équipe mobile ou coordinateur de parcours", "Répit et solutions temporaires", "Appui aux familles et aidants", "Mise en lien des établissements et du droit commun", "Groupes opérationnels de synthèse selon cadre"], professions: ["Coordinateurs et chefs de service", "Professionnels des structures partenaires", "Pairs aidants et représentants d’usagers", "MDPH, département et ARS", "Associations et acteurs de droit commun"], partners: ["MDPH / MDA et CDAPH", "ARS et CNSA selon dispositif", "ESSMS et établissements sanitaires", "Familles, associations et collectivités", "École, emploi, logement et loisirs"], manager: "Ne pas confondre coopération territoriale et transfert de responsabilité : formaliser qui répond, dans quels délais et avec quel financement.", sources: ["casf", "cnsa"] },
    { id: "maison-palliatifs", name: "Maison d’accompagnement et de soins palliatifs", short: "Maison palliatifs", family: "Médico-social · soins palliatifs", type: "Catégorie récente · vérifier le texte d’application et l’offre locale", audience: "Personnes relevant d’une prise en charge palliative qui ne peut être assurée au domicile mais ne nécessite pas une unité de soins palliatifs hospitalière.", definition: "La loi de 2026 inscrit une catégorie de maisons d’accompagnement et de soins palliatifs dans le CASF. Les modalités concrètes dépendent des textes et autorisations applicables.", devices: ["Accompagnement de la personne et des proches", "Soins palliatifs et coordination", "Séjour adapté à la situation", "Lien avec équipes mobiles et domicile", "Soutien des professionnels"], professions: ["Médecins et infirmiers", "Aides-soignants et accompagnants", "Psychologues et assistants sociaux", "Équipes de coordination palliative", "Direction et qualité"], partners: ["ARS et établissements sanitaires", "Équipes mobiles de soins palliatifs", "HAD, médecins traitants et SAD", "Associations et bénévoles", "Familles et aidants"], manager: "Catégorie récente : vérifier le décret, le cahier des charges, le régime d’autorisation et le financement avant d’ouvrir ou de comparer une offre.", sources: ["casf", "hospital"] }
  ];

  const JOBS = [
    { id: "rqgr", name: "Responsable Qualité & Gestion des Risques (RQGR)", level: "Cadre fonctionnel / Direction de la qualité", sector: "Tous secteurs · Sanitaire & Médico-social", placement: "Directement rattaché·e au Directeur d'établissement ou à la Direction Générale. Position d'état-major transverse.", reports: "Chargés de mission qualité, alternants qualité et réseau des correspondants qualité de chaque unité.", decisions: "Élaboration du programme annuel d'amélioration de la qualité, priorisation des audits, validation des fiches réflexes en GED, calendrier des revues de processus. Arbitrage des moyens délégué par la direction.", variants: "En sanitaire : certification HAS, vigilances sanitaires, EIGS, circuit du médicament. En ESSMS : évaluation HAS 3 chapitres, AgEval, bientraitance, projet personnalisé et droits des usagers.", path: "Le Master MES est le diplôme de référence pour ce poste. L'alliance d'une vision stratégique gestion/RH et d'une maîtrise opérationnelle des démarches HAS permet d'accéder directement à cette fonction.", boundary: "Le RQGR conseille, audite et alerte mais n'a pas de pouvoir disciplinaire sur les soignants ou éducateurs. Il convainc par l'expertise et la pédagogie.", sources: ["hasEsms", "hasHealth", "iae"] },
    { id: "dir-adj-qualite", name: "Directeur·rice Adjoint·e Qualité, Risques & Performance", level: "Membre de l'équipe de direction / CODIR", sector: "Sanitaire · ESPIC · Grands ensembles médico-sociaux", placement: "Sous l'autorité du Directeur Général ou Chef d'établissement. Membre permanent du Comité de Direction.", reports: "Responsable qualité, gestionnaires de risques, département d'information médicale (DIM), ingénieurs biomédicaux selon l'organigramme.", decisions: "Arbitrage des investissements qualité, négociation des objectifs qualité du CPOM, validation des signalements EIGS aux autorités, pilotage de la gestion de crise.", variants: "En GHT : coordination de la qualité à l'échelle territoriale multi-sites. En association gestionnaire : harmonisation des 20 à 40 établissements du groupe.", path: "Accessible après un Master MES avec 2 à 4 ans d'expérience comme RQGR ou adjoint de direction en MAS/EHPAD.", boundary: "Porte la responsabilité pénale et administrative déléguée par la direction générale sur les volets de sécurité sanitaire.", sources: ["iae", "hospital", "project"] },
    { id: "charge-qualite-siege", name: "Chargé·e de mission Qualité & Évaluation (Siège / Fédération)", level: "Cadre expert multi-sites", sector: "Sièges associatifs · Fédérations (FEHAP, Nexem, FHF) · Groupes privés", placement: "Rattaché·e à la Direction Qualité du siège ou de la fédération. Intervient en appui des directeurs d'établissements.", reports: "Pas de management direct d'équipe. Animation de groupes de travail régionaux et réseau de directeurs.", decisions: "Conception des grilles d'audit communes, sélection des logiciels qualité groupe (AgEval, BlueKango), organisation des audits blancs préparatoires aux visites HAS.", variants: "Fédérations : veille législative, rédaction de guides pour les adhérents. Groupes : contrôle de conformité des EHPAD ou MAS de la filiale.", path: "Profil Master MES idéal : capacité d'analyse macro, maîtrise du droit médico-social et compétences d'animation de réseau.", boundary: "Rôle de conseil et d'audit : ne se substitue pas au directeur de l'établissement qui reste le responsable légal sur son site.", sources: ["iae", "anap", "hasEsms"] },
    { id: "cgras", name: "Coordonnateur·trice de la Gestion des Risques Associés aux Soins (CGRAS)", level: "Expertise transversale sanitaire", sector: "Sanitaire (Hôpitaux, Cliniques, HAD, SMR)", placement: "Rattaché·e à la direction des soins ou à la direction qualité, en lien étroit avec la Commission Médicale d'Établissement (CME).", reports: "Correspondants de vigilances (hémovigilance, matériovigilance, pharmacovigilance, infectiovigilance).", decisions: "Déclenchement des analyses de causes après événement indésirable grave (EIGS), rédaction des volets 1 et 2 de déclaration à l'ARS, animation des REX et RMM.", variants: "Hôpital public : lien avec le directoire et la F3SCT. Clinique privée : lien avec la commission médicale et la direction des soins.", path: "Master MES avec spécialisation gestion des risques et sécurité des soins, ou profil soignant/cadre ayant validé le Master MES.", boundary: "Ne prescrit aucun traitement médical ; se concentre exclusivement sur les barrières systémiques de sécurité des soins.", sources: ["signalement", "hasHealth", "pnsp"] },
    { id: "auditeur-consultant", name: "Auditeur·trice / Consultant·e Qualité Santé & Évaluateur HAS", level: "Expert indépendant / Cabinet de conseil / Organisme accrédité", sector: "Cabinets de conseil · Organismes évaluateurs accrédités COFRAC", placement: "Intervient en mission externe auprès des directions d'établissements sanitaires et médico-sociaux.", reports: "Équipes de consultants juniors ou binôme d'évaluation COFRAC.", decisions: "Restitution des rapports d'audit, cotation des critères du référentiel HAS, préconisations stratégiques et organisationnelles.", variants: "Évaluation externe HAS : visite sur site de 3 à 5 jours selon le cahier des charges HAS. Conseil : accompagnement de 6 mois à la restructuration d'un pôle.", path: "Master MES très recherché par les organismes évaluateurs accrédités COFRAC pour réaliser les visites officielles d'évaluation des ESSMS.", boundary: "Indépendance et déontologie strictes : interdiction d'évaluer une structure pour laquelle on a réalisé du conseil dans les 2 années précédentes.", sources: ["cofrac", "hasEsms", "hasProcedure"] },
    { id: "responsable-usagers", name: "Responsable Relations Usagers, Droits & Médiation", level: "Cadre fonctionnel de proximité", sector: "Tous secteurs", placement: "Rattaché·e à la Direction ou à la Direction Qualité. En lien avec les médiateurs médicaux et non médicaux.", reports: "Chargés d'accueil, secrétariat des usagers.", decisions: "Instruction des réclamations et plaintes, préparation des avis et recommandations de la Commission des Usagers (CDU) ou du CVS, gestion des dossiers contentieux avec l'assureur.", variants: "En EHPAD/MAS : garant de l'effectivité des droits loi 2002-2, prévention de la maltraitance, écoute des familles en détresse. En hôpital : secrétariat de la CDU.", path: "Master MES avec forte sensibilité éthique, droit des usagers et médiation relationnelle.", boundary: "Ne prend pas parti : garantit l'impartialité de l'instruction et le respect des droits de la personne accueillie.", sources: ["cdu", "cvs", "casfRights"] },

    { id: "adjoint", name: "Adjoint·e de direction en ESSMS", level: "Management intermédiaire / membre d’équipe de direction", sector: "Médico-social", placement: "Sous l’autorité du directeur ou de la direction générale. Peut porter un périmètre fonctionnel ou opérationnel délégué.", reports: "Chefs de service, responsables ou fonctions support si l’organigramme et la délégation le prévoient.", decisions: "Organisation quotidienne, pilotage des projets confiés, préparation budgétaire, qualité et RH dans les limites d’une délégation écrite. Les décisions de l’employeur et de la personne morale restent au niveau habilité.", variants: "En MAS : continuité 24/7, soins, organisation des unités. En EHPAD : qualité de vie, soins, tarification et proches. En IME/MECS : parcours, scolarité/protection et partenariats.", path: "Le Master MES et l’expérience d’alternance en direction donnent une base cohérente. Le niveau d’autonomie demandé dépend du gestionnaire, de l’expérience et des délégations ; un CAFDES est souvent valorisé ou exigé par certains employeurs.", boundary: "Le titre de master ne donne pas automatiquement une délégation de direction ni une compétence clinique. Vérifier la fiche de poste, la convention collective et les délégations.", sources: ["iae", "d3s", "cafdes"] },
    { id: "chef-service", name: "Chef·fe de service / responsable d’unité", level: "Encadrement de proximité", sector: "Médico-social / sanitaire", placement: "Entre la direction et les équipes de terrain ; parfois rattaché à un directeur adjoint ou à un cadre supérieur.", reports: "Professionnels d’une unité, équipe éducative/soignante ou coordonnateurs selon le service.", decisions: "Répartition du travail, animation d’équipe, suivi des projets, transmissions, gestion des alertes et proposition d’ajustements. Les décisions disciplinaires, médicales ou financières dépassant la délégation sont escaladées.", variants: "MAS : unités et coordination des soins ; IME/ITEP : parcours enfant/famille/école ; EHPAD : unités de vie et qualité ; CHRS/MECS : sécurité, droits et continuité éducative.", path: "Les postes existent dans de nombreux ESSMS. Le CAFERUIS ou une qualification sectorielle peut être demandé ; les critères varient selon employeur, convention et périmètre.", boundary: "Préciser la responsabilité hiérarchique et fonctionnelle, l’astreinte, les décisions autorisées et la suppléance.", sources: ["casf", "cafdes"] },
    { id: "qualite", name: "Responsable qualité et gestion des risques", level: "Expertise transversale / cadre fonctionnel", sector: "Tous secteurs", placement: "Rattaché à la direction ou à une direction qualité. Influence plusieurs services sans toujours les encadrer hiérarchiquement.", reports: "Chargés qualité ou référents si l’équipe existe ; animation d’un réseau de professionnels.", decisions: "Méthodes, calendrier d’évaluation, registre de risques, plan d’actions et reporting ; arbitrages de moyens restent à la direction.", variants: "ESSMS : référentiel HAS et amélioration des accompagnements. Santé : certification, sécurité des soins, vigilances et expérience patient.", path: "Master MES, qualité, santé publique ou expérience de terrain ; expérience de l’évaluation, audit, indicateurs, animation et conduite du changement.", boundary: "L’évaluateur externe ou la HAS ne remplace pas le pilotage interne ; distinguer auto-évaluation, évaluation ESSMS et certification sanitaire.", sources: ["hasEsms", "hasHealth", "iae"] },
    { id: "projet", name: "Chef·fe de projet / chargé·e de mission", level: "Pilotage de projet / transversal", sector: "Tous secteurs", placement: "Auprès de la direction, d’une direction fonctionnelle, d’un GHT ou d’un gestionnaire multi-établissements.", reports: "Équipe projet temporaire, référents métier et prestataires ; pas nécessairement de management hiérarchique.", decisions: "Cadrage, planning, risques, animation, suivi des livrables et remontée des arbitrages. Le sponsor valide les ressources et les changements de périmètre.", variants: "Transformation numérique, DUI, qualité HAS, nouveaux dispositifs, parcours, immobilier, data RH ou réorganisation.", path: "Profil MES pertinent avec méthode de projet, analyse de données, conduite du changement et connaissance du terrain.", boundary: "Écrire sponsor, comité de pilotage, budget, critères d’acceptation, gouvernance des données et responsables après la mise en production.", sources: ["iae", "anap"] },
    { id: "finance", name: "Responsable administratif·ve, financier·ère ou contrôle de gestion", level: "Cadre fonctionnel", sector: "Tous secteurs", placement: "Sous la direction ou la direction financière ; relation fonctionnelle avec les responsables d’activité.", reports: "Comptabilité, contrôle de gestion, facturation ou administration selon taille.", decisions: "Préparation budgétaire, analyse d’écarts, scénarios et alerte. L’engagement de dépense et l’arbitrage suivent la délégation, le statut et les circuits de validation.", variants: "ESSMS : EPRD/ERRD ou budget prévisionnel selon régime, tarification et CPOM. Santé : EPRD hospitalier, activité, recettes, masse salariale et investissement.", path: "Le Master MES est cohérent avec une spécialisation en finance/gestion. Consolider comptabilité, règles du financeur, analyse des coûts et outils de pilotage.", boundary: "L’EPRD n’est pas le cadre de tous les ESMS ; ne confondre ni prévision, ni autorisation budgétaire, ni réalisation.", sources: ["iae", "cnsaData", "cnsaFunding"] },
    { id: "rh", name: "Responsable RH / organisation", level: "Cadre fonctionnel ou encadrement de proximité", sector: "Tous secteurs", placement: "Sous direction générale/RH ; interface avec managers et représentants du personnel.", reports: "Gestionnaires RH, paie, recrutement ou planning selon taille ; managers restent responsables de leurs équipes.", decisions: "Organisation des recrutements et processus RH selon délégation ; conseil sur le droit, les temps, le dialogue social et les compétences.", variants: "MAS/EHPAD : continuité 24/7, remplacements, fidélisation. Hôpital : gestion statutaire et dialogue social FPH. Privé : convention collective et CSE.", path: "Master MES + alternance de direction et expérience de pilotage RH constituent une passerelle ; renforcer droit social/statutaire et paie.", boundary: "Distinguer conseil RH, décision employeur, avis du CSE/CST et responsabilité médicale/soignante.", sources: ["iae", "cse", "duerp"] },
    { id: "cadre-sante", name: "Cadre de santé / cadre supérieur de santé", level: "Encadrement soignant", sector: "Sanitaire", placement: "Hiérarchie soignante de proximité ou de pôle, en lien avec direction des soins et chefs de service.", reports: "Équipes soignantes et parfois plusieurs cadres pour un cadre supérieur, selon l’organisation.", decisions: "Organisation des équipes, qualité et continuité des soins dans un périmètre défini, en coordination avec le responsable médical et la direction.", variants: "Services hospitaliers, SMR, psychiatrie, HAD ou activités médico-techniques ; l’environnement change fortement la responsabilité.", path: "Le Master MES seul ne remplace pas les prérequis professionnels et la qualification de cadre de santé attendus pour ces postes. Vérifier les concours, diplômes et statuts.", boundary: "Le cadre ne se substitue ni au prescripteur pour la décision médicale, ni aux compétences réglementées des professionnels.", sources: ["hospital", "hasHealth"] },
    { id: "dessms", name: "Directeur·rice d’établissement sanitaire, social et médico-social", level: "Direction d’établissement / haut encadrement public", sector: "Fonction publique hospitalière", placement: "Chef d’établissement ou directeur adjoint au sein d’une équipe de direction ; rattachement à la gouvernance prévue par le statut.", reports: "Équipe de direction, cadres et fonctions support ; équipes de soins ou d’accompagnement selon l’organigramme.", decisions: "Projet stratégique, organisation, ressources humaines et financières, qualité et gestion des risques dans le cadre légal, des instances et des délégations.", variants: "Établissements sociaux, médico-sociaux et certains établissements sanitaires ; périmètre de poste selon corps, affectation et personnalité morale.", path: "Accès au corps D3S/DESSMS par concours et formation statutaire EHESP, ou voies statutaires prévues. Un Master MES prépare des connaissances mais ne vaut pas réussite au concours.", boundary: "Le directeur répond des décisions déléguées et du cadre juridique ; vérifier le statut de l’établissement, l’autorité de rattachement et la fiche de poste.", sources: ["d3s", "iae"] },
    { id: "dh", name: "Directeur·rice d’hôpital", level: "Direction / haut encadrement public", sector: "Fonction publique hospitalière", placement: "Chef d’établissement ou directeur adjoint dans un hôpital public ou un GHT.", reports: "Directions fonctionnelles et cadres ; la communauté médicale conserve ses responsabilités cliniques propres.", decisions: "Pilotage stratégique, organisation, ressources, qualité et coopération, dans le cadre du statut et des instances hospitalières.", variants: "CHU, CH, établissement spécialisé ou direction de groupement ; la taille et les activités changent l’étendue des responsabilités.", path: "Dans la fonction publique hospitalière, voie de concours et formation EHESP. Le Master MES constitue un socle académique mais n’est pas une nomination.", boundary: "Le directeur d’hôpital n’est pas le décideur clinique de chaque soin ; préserver les compétences médicales, pharmaceutiques et soignantes.", sources: ["dh", "iae"] },
    { id: "direction-prive", name: "Directeur·rice d’ESSMS associatif ou privé", level: "Direction d’établissement", sector: "Associatif / privé / public territorial", placement: "Rattaché à l’organisme gestionnaire, à une direction générale ou à un conseil d’administration selon la personne morale.", reports: "Direction adjointe, chefs de service, équipes et fonctions support selon la taille.", decisions: "Mise en œuvre du projet, management, budget, sécurité, qualité et représentation, dans le cadre des pouvoirs confiés par le gestionnaire.", variants: "Association mono-site : proximité forte ; groupe : pilotage multi-sites ; secteur public local : statut et délégations publiques.", path: "Master MES et expérience d’adjoint sont un parcours cohérent. Les exigences de qualification et d’expérience, dont CAFDES, dépendent du poste, de la catégorie et des textes applicables.", boundary: "Vérifier la délégation écrite, les exigences réglementaires de qualification, les actes du CA et les obligations de l’employeur.", sources: ["iae", "cafdes", "project"] },
    { id: "territoire", name: "Chargé·e de mission offre de soins / médico-sociale", level: "Expertise territoriale / administration", sector: "ARS · département · fédération · gestionnaire", placement: "Au sein d’une direction métier, d’une délégation territoriale ou d’une direction de l’offre.", reports: "Coordination de groupes de travail ; encadrement hiérarchique seulement si prévu au poste.", decisions: "Analyse, préparation de décisions, suivi de contrats et animation partenariale ; l’autorité compétente signe les actes réglementaires.", variants: "ARS : planification/autorisation ; département : politiques sociales/tarification selon compétence ; fédération : appui à des adhérents.", path: "Master MES utile avec connaissance du système, analyse, rédaction et concertation ; les recrutements publics suivent les voies statutaires/contractuelles.", boundary: "L’ANAP apporte un appui et des outils, elle ne régule pas et ne contrôle pas les établissements.", sources: ["iae", "ars", "anap"] },

    // --- HAUTE AUTORITÉ DE SANTÉ (HAS) ---
    {
      id: "has-expert-visiteur",
      name: "Expert·e-Visiteur / Évaluateur certifié HAS",
      level: "Expertise institutionnelle / Évaluation externe",
      sector: "Haute Autorité de Santé (HAS)",
      placement: "Mandaté par la HAS ou un organisme évaluateur accrédité COFRAC. Position d'auditeur externe indépendant.",
      reports: "Binôme ou trinôme d'évaluation (médecin, soignant, directeur). Restitution directe au Collège de la HAS.",
      decisions: "Cotation des 15 objectifs et 131 critères du référentiel national ESSMS ou certification hospitalière. Détection des écarts critiques ou impératifs.",
      variants: "En sanitaire : visites de certification V2020/V2026. En médico-social (MAS, EHPAD, IME) : évaluation externe quadriennale obligatoire.",
      path: "Le Master MES apporte les compétences méthodologiques parfaites (analyse de processus, patient traceur, éthique). Recrutement par la HAS après sélection sur dossier et formation certifiante.",
      boundary: "Devoir de réserve absolu : ne donne aucun conseil opérationnel pendant la visite et ne peut auditer un établissement où il a exercé.",
      isPremium: true,
      sources: ["hasEsms", "hasHealth", "cofrac"]
    },
    {
      id: "has-chef-projet",
      name: "Chef·fe de projet Certification & Évaluation (HAS)",
      level: "Cadre de conception / Siège HAS",
      sector: "Haute Autorité de Santé (HAS)",
      placement: "Rattaché·e à la Direction de l'Amélioration de la Qualité et de la Sécurité des Soins (DAQSS) ou Service Évaluation ESSMS à la HAS (Saint-Denis).",
      reports: "Chargés d'études, statisticiens et groupes d'experts pluridisciplinaires.",
      decisions: "Conception et révision des manuels d'évaluation nationaux, élaboration des fiches repères et méthodes traceurs, analyse des rapports d'audit.",
      variants: "Pôle médico-social : suivi du déploiement de la plateforme Synaé et Qualiscope. Pôle sanitaire : indicateurs IQSS et certification.",
      path: "Master MES ou EHESP avec appétence forte pour la méthodologie, la santé publique et la réglementation nationale.",
      boundary: "Travail d'ingénierie et de doctrine nationale : pas de contrôle direct sur le terrain au quotidien.",
      isPremium: true,
      sources: ["hasEsms", "qualiscope"]
    },
    {
      id: "has-charge-mission",
      name: "Chargé·e de mission Qualité, Sécurité du Patient & EIGS (HAS)",
      level: "Cadre d'études & retour d'expérience",
      sector: "Haute Autorité de Santé (HAS)",
      placement: "Service de la sécurité des patients et de la gestion des risques de la HAS.",
      reports: "Groupes de travail thématiques, réseau des CGRAS et associations d'usagers.",
      decisions: "Analyse nationale du retour d'expérience des EIGS reçus, rédaction des flashs sécurité patient et guides méthodologiques REX.",
      variants: "Volet circuit du médicament, volet réanimation, volet psychiatrie et contention, volet chutes graves en EHPAD/MAS.",
      path: "Accessible avec le Master MES après expérience de RQGR ou de coordination des vigilances.",
      boundary: "Analyse systémique anonymisée : la HAS n'a pas de pouvoir de sanction, contrairement à l'ARS ou aux tribunaux.",
      isPremium: true,
      sources: ["signalement", "hasHealth"]
    },

    // --- AGENCE RÉGIONALE DE SANTÉ (ARS) ---
    {
      id: "ars-iass",
      name: "Inspecteur·rice des Affaires Sanitaires et Sociales (IASS - ARS)",
      level: "Corps d'encadrement supérieur de l'État (Catégorie A+)",
      sector: "Agence Régionale de Santé (ARS)",
      placement: "Rattaché·e à la Direction Générale de l'ARS ou à une Délégation Départementale (DD-ARS). Pôle Inspection-Contrôle.",
      reports: "Équipes d'inspecteurs adjoints et techniciens sanitaires.",
      decisions: "Conduite d'inspections inopinées ou programmées, injonctions de mise en conformité, propositions de suspension d'autorisation ou nomination d'administrateur provisoire.",
      variants: "Inspection médico-sociale (EHPAD, MAS, protection de l'enfance) ou sanitaire (sécurité anesthésie, pharmacie à usage intérieur).",
      path: "Concours IASS (EHESP) ou recrutement contractuel pour les titulaires d'un Master MES grâce à leur maîtrise du droit et des financements.",
      boundary: "Pouvoir de police administrative : applique la loi avec procès-verbaux et rapports contradictoires formels.",
      isPremium: true,
      sources: ["ars", "casf"]
    },
    {
      id: "ars-cpom",
      name: "Chargé·e de mission Autorisations, CPOM & Allocation des Ressources (ARS)",
      level: "Cadre territorial / Allocation des ressources",
      sector: "Agence Régionale de Santé (ARS)",
      placement: "Direction de l'Autonomie (médico-social) ou Direction de l'Offre de Soins (sanitaire) de l'ARS.",
      reports: "Instruction de dossiers en binôme avec les référents tarification.",
      decisions: "Instruction des demandes d'autorisation et d'extension de lits/places, négociation des avenants CPOM, attribution des Crédits Non Reconductibles (CNR).",
      variants: "Pôle Personnes Âgées, Pôle Handicap, ou Pôle Investissement et Modernisation hospitalière.",
      path: "Débouché naturel très fréquent du Master MES : parfaite maîtrise de la dialectique budget/qualité/organisation territoriale.",
      boundary: "Rôle de régulateur et d'autorité tarificatrice : relation partenariale mais asymétrique avec les directeurs d'établissements.",
      isPremium: true,
      sources: ["ars", "cnsaFunding", "cnsaCampaign"]
    },
    {
      id: "ars-eigs",
      name: "Référent·e Gestion des Signalements, Réclamations & Veille Sanitaire (ARS)",
      level: "Cadre opérationnel de veille",
      sector: "Agence Régionale de Santé (ARS)",
      placement: "Point Focal Régional (PFR) de l'ARS ou Pôle Qualité et Sécurité des Soins.",
      reports: "Correspondants territoriaux et cellule de crise sanitaire.",
      decisions: "Qualification immédiate des signalements e-SIN reçus (niveaux 1 à 4), décision de déclenchement d'une mission d'appui ou d'une inspection d'urgence.",
      variants: "Gestion des signalements de maltraitance, fugues en MAS, épidémies d'IRA/gastro en EHPAD, erreurs médicamenteuses graves.",
      path: "Master MES avec solide formation en gestion des risques et communication de crise.",
      boundary: "Doit réagir dans des délais d'urgence (H+2 à H+24) selon la gravité de l'événement.",
      isPremium: true,
      sources: ["ars", "signalement"]
    },

    // --- AGENCE NATIONALE D'APPUI À LA PERFORMANCE (ANAP) ---
    {
      id: "anap-expert-perf",
      name: "Expert·e / Consultant·e Performance Sanitaire & Médico-Sociale (ANAP)",
      level: "Expertise méthodologique nationale",
      sector: "Appui & Performance (ANAP)",
      placement: "Agence Nationale d'Appui à la Performance (Paris / national). Rattaché·e aux pôles médico-social ou sanitaire.",
      reports: "Consultants externes mandatés et groupes de directeurs d'établissements pilotes.",
      decisions: "Création des outils et simulateurs nationaux (RH, immobilier, blocs, transports), diagnostic d'établissements en difficulté.",
      variants: "Accompagnement 'Flash' de structures sous tension ou appui pluriannuel aux groupements (GHT, associations).",
      path: "Très valorisant pour un diplômé de Master MES : allie approche conseil et culture du service public.",
      boundary: "L'ANAP accompagne et outille, elle ne contrôle pas et ne sanctionne jamais : posture d'allié bienveillant.",
      isPremium: true,
      sources: ["anap"]
    },
    {
      id: "anap-chef-orga",
      name: "Chef·fe de projet Organisation des Soins, RH & Logistique (ANAP)",
      level: "Management de projets nationaux",
      sector: "Appui & Performance (ANAP)",
      placement: "Pôle Ressources Humaines et Organisation du travail de l'ANAP.",
      reports: "Groupes de travail pluriprofessionnels (DRH, directeurs des soins, cadres).",
      decisions: "Conception de guides sur l'attractivité des métiers, la gestion des plannings en 12h, la réduction de l'absentéisme et les ratios d'encadrement.",
      variants: "Focus EHPAD/MAS : organisation du bionettoyage, circuit du linge, mutualisation de gardes d'astreinte.",
      path: "Master MES avec expérience terrain en direction ou RH d'établissement.",
      boundary: "Produit des référentiels d'aide à la décision : le choix final reste sous la responsabilité du directeur local.",
      isPremium: true,
      sources: ["anap", "duerp"]
    },
    {
      id: "anap-numerique",
      name: "Chargé·e d'accompagnement Transformation Numérique & Ségur (ANAP)",
      level: "Expertise numérique et conduite du changement",
      sector: "Appui & Performance (ANAP)",
      placement: "Département Transformation Numérique de l'ANAP, en lien avec l'ANS et la DNS.",
      reports: "Réseau des ambassadeurs numériques en région (GRADeS, directeurs SI).",
      decisions: "Accompagnement au déploiement du Dossier Usager Informatisé (DUI Ségur), interopérabilité MSSanté et Mon Espace Santé.",
      variants: "Accompagnement des directeurs de MAS/FAM au choix de leur logiciel métier et gestion du changement avec les soignants.",
      path: "Master MES profil hybride gestion / systèmes d'information santé.",
      boundary: "Accompagne l'usage et l'appropriation : ne se substitue pas aux éditeurs de logiciels pour le paramétrage technique.",
      isPremium: true,
      sources: ["anap", "ansSoftware"]
    },

    // --- SÉCURITÉ SOCIALE (ASSURANCE MALADIE, CARSAT, EN3S) ---
    {
      id: "secu-manager-cpam",
      name: "Cadre Dirigeant·e / Manager Opérationnel de Caisse (CPAM / EN3S)",
      level: "Encadrement supérieur Sécurité Sociale",
      sector: "Sécurité Sociale (CPAM, CARSAT, CAF)",
      placement: "Direction générale d'une CPAM ou CARSAT départementale. Membre du comité de direction.",
      reports: "Responsables de départements (gestion des droits, régulation des dépenses, relations professionnels de santé).",
      decisions: "Pilotage des budgets de la caisse, déploiement de la Convention d'Objectifs et de Gestion (COG), relations avec les autorités régionales.",
      variants: "CPAM : accès aux droits et ONDAM de ville/hospitalier. CARSAT : retraite et prévention des accidents du travail.",
      path: "Concours de l'EN3S (École Nationale Supérieure de Sécurité Sociale) ou recrutement direct en CDI de droit privé (convention collective UCANSS) avec le Master MES.",
      boundary: "Les organismes de Sécurité Sociale ont un statut d'organismes de droit privé chargés d'une mission de service public.",
      isPremium: true,
      sources: ["ameli", "en3s", "ccIdcc218"]
    },
    {
      id: "secu-dam",
      name: "Délégué·e de l’Assurance Maladie (DAM) & Conseiller Maîtrise Médicalisée",
      level: "Cadre relationnel terrain",
      sector: "Sécurité Sociale (CPAM, CARSAT, CAF)",
      placement: "Rattaché·e au Pôle Gestion du Risque et Relations Professionnels de Santé de la CPAM.",
      reports: "Interventions individuelles en cabinet médical, cliniques et établissements médico-sociaux.",
      decisions: "Sensibilisation aux référentiels de prescription de l'Assurance Maladie (antibiotiques, transports sanitaires, arrêts de travail).",
      variants: "DAM Établissements : accompagnement des directeurs et médecins coordonnateurs d'EHPAD/MAS sur les consommations de soins.",
      path: "Master MES très apprécié pour sa double compréhension des contraintes soignantes et des impératifs d'équilibre budgétaire.",
      boundary: "Conseil et incitation : ne réalise pas de contrôles répressifs (rôle réservé au contentieux et au service médical).",
      isPremium: false,
      sources: ["ameli"]
    },
    {
      id: "secu-auditeur-t2a",
      name: "Auditeur·rice / Référent·e Contrôle Contentieux & Facturation (CPAM)",
      level: "Cadre d'investigation médico-financière",
      sector: "Sécurité Sociale (CPAM, CARSAT, CAF)",
      placement: "Direction du Contentieux et de la Lutte contre la Fraude (CPAM / CRAMIF).",
      reports: "Enquêtes en binôme avec les médecins-conseils du service médical.",
      decisions: "Contrôle de la conformité du codage T2A hospitalier, détection de surfacturations, émission d'indus et pénalités financières.",
      variants: "Contrôle des dotations globales MAS/FAM : vérification des présences effectives et respect du forfait journalier.",
      path: "Master MES avec excellente maîtrise des règles de tarification de la sécurité sociale et du droit hospitalier.",
      boundary: "Procédure contradictoire stricte : tout indu doit être juridiquement motivé et contestable devant la CRA (Commission de Recours Amiable).",
      isPremium: true,
      sources: ["ameli", "hospital"]
    },
    {
      id: "secu-carsat-prevention",
      name: "Ingénieur·e Conseil / Contrôleur·se Sécurité Prévention AT/MP (CARSAT)",
      level: "Cadre expert des conditions de travail",
      sector: "Sécurité Sociale (CPAM, CARSAT, CAF)",
      placement: "Direction des Risques Professionnels de la CARSAT (ou CRAMIF en Île-de-France).",
      reports: "Portefeuille d'établissements sanitaires et médico-sociaux du département.",
      decisions: "Attribution des subventions financières (TMS Pros Action, aides soignants), visites de sécurité sur site, injonctions de prévention.",
      variants: "Accompagnement ciblé des EHPAD et MAS : plans de prévention des lombalgies, rails de transfert et aménagement ergonomique des chambres.",
      path: "Master MES complété d'une formation interne CARSAT agréée par le Ministère du Travail.",
      boundary: "Peut majorer le taux de cotisation accidents du travail d'un établissement en cas de carence grave de prévention.",
      isPremium: true,
      sources: ["carsat", "duerp"]
    },

    // --- AUTRES DÉBOUCHÉS TERRITORIAUX & DE COORDINATION LIÉS AU MASTER MES ---
    {
      id: "coordinateur-dac",
      name: "Coordinateur·rice de Dispositif d’Appui à la Coordination (DAC) / CPTS",
      level: "Coordination territoriale de santé",
      sector: "Territoires & Coordination (DAC, CD, CPTS)",
      placement: "Au sein d'un DAC (loi OTSS 2019) ou d'une CPTS (Communauté Professionnelle Territoriale de Santé).",
      reports: "Gestionnaires de cas MAIA, infirmiers coordinateurs, assistants sociaux de parcours.",
      decisions: "Orientation des situations complexes sans solution (personnes âgées isolées, polypathologies, handicap complexe), déclenchement d'aides d'urgence.",
      variants: "DAC : guichet unique territorial pour les professionnels. CPTS : coordination des libéraux sur les soins non programmés.",
      path: "Cœur de cible du Master MES : parfaite compréhension des passerelles entre ville, hôpital et médico-social.",
      boundary: "Le DAC coordonne et oriente, mais ne prodigue pas de soins directs et ne se substitue pas aux équipes traitantes.",
      isPremium: false,
      sources: ["ars", "casf"]
    },
    {
      id: "cd-charge-autonomie",
      name: "Chargé·e de mission Autonomie & Tarification (Conseil Départemental)",
      level: "Cadre territorial (Fonction Publique Territoriale - FPT)",
      sector: "Territoires & Coordination (DAC, CD, CPTS)",
      placement: "Direction de l'Autonomie (ou Direction Générale Adjointe Solidarités) au Conseil Départemental.",
      reports: "Instructeurs tarification et binômes avec l'ARS pour les structures sous compétence conjointe.",
      decisions: "Fixation des prix de journée et arrêtés tarifaires dépendance/hébergement des EHPAD, FAM et foyers de vie. Suivi des crédits APA et PCH.",
      variants: "Instruction des demandes d'aide sociale à l'hébergement (ASH), tarification des Services Autonomie à Domicile (SAD).",
      path: "Master MES très valorisé pour les postes de cadres contractuels ou par voie de concours d'attaché territorial.",
      boundary: "Défend les équilibres financiers du Département tout en veillant à la solvabilité des usagers hébergés.",
      isPremium: true,
      sources: ["casf", "cnsaFunding"]
    },
    {
      id: "spsti-responsable",
      name: "Responsable de Centre / Cadre de Gestion en Santé au Travail (SPSTI)",
      level: "Management de centre pluridisciplinaire",
      sector: "Territoires & Coordination (DAC, CD, CPTS)",
      placement: "Rattaché·e à la direction générale du Service de Prévention et de Santé au Travail Interentreprises.",
      reports: "Secrétaires médicales, infirmiers de santé au travail, ergonomes et techniciens hygiène-sécurité.",
      decisions: "Organisation des plannings de visites médicales obligatoires, suivi des adhésions d'entreprises, gestion budgétaire et logistique du centre.",
      variants: "Coordination avec les médecins du travail et déploiement de la téléconsultation en santé au travail (loi Août 2021).",
      path: "Débouché très dynamique pour les titulaires du Master MES cherchant un poste managérial de jour avec rythme régulier.",
      boundary: "Autonomie de gestion administrative et d'équipe, dans le strict respect de l'indépendance déontologique des médecins du travail.",
      isPremium: false,
      sources: ["duerp", "servicePublicWork"]
    }
  ];

  const MEETINGS = [
    { id: "codir", name: "CODIR", full: "Comité de direction", kind: "Interne · pratique d’organisation", decision: "Arbitrage interne selon délégation", who: "Direction, directions adjointes et responsables invités selon l’ordre du jour.", purpose: "Aligner les priorités, suivre activité, RH, budget, qualité, risques et décisions à escalader.", manager: "Préparer une note courte, distinguer information / arbitrage / alerte, consigner décision, pilote et échéance.", caution: "Instance de management interne, sans composition nationale uniforme. Le pouvoir dépend des délégations et du statut.", sources: ["project"] },
    { id: "codirel", name: "CODIREL", full: "Comité de direction élargi (appellation locale)", kind: "Interne · appellation variable", decision: "Concertation ; arbitrage si délégation", who: "CODIR et responsables de services, cadres ou experts selon le sujet.", purpose: "Partager les orientations et coordonner les équipes au-delà du cercle de direction.", manager: "Définir à l’avance qui participe, ce qui est décidé et ce qui doit être remonté au CODIR.", caution: "Le sigle et le périmètre varient d’un gestionnaire à l’autre ; il n’a pas de définition juridique nationale.", sources: [] },
    { id: "copil", name: "COPIL", full: "Comité de pilotage", kind: "Interne · gouvernance de projet", decision: "Arbitrage du sponsor / décisionnaire désigné", who: "Sponsor, chef de projet, métiers concernés, finance, SI ou partenaires utiles.", purpose: "Suivre objectifs, budget, risques, calendrier et choix de conception d’un projet.", manager: "Chaque décision doit avoir un responsable habilité, une date, une trace et une conséquence sur le projet.", caution: "Le COPIL ne remplace pas les consultations légales ni les décisions réservées à l’employeur, au CA ou à l’autorité.", sources: ["anap"] },
    { id: "cvs", name: "CVS", full: "Conseil de la vie sociale", kind: "Participation des personnes en ESSMS", decision: "Avis, propositions et expression des personnes", who: "Personnes accompagnées, représentants des familles/proches, représentants du personnel et de l’organisme gestionnaire ; composition selon le cadre en vigueur.", purpose: "Associer les personnes au fonctionnement de l’ESSMS et recueillir leurs propositions sur la vie quotidienne.", manager: "Transmettre l’ordre du jour, rendre l’information compréhensible, faciliter la participation et répondre aux avis avec suites visibles.", caution: "Le CVS n’est ni un CODIR, ni une instance de représentation des salariés, ni un organe qui dirige les soins.", sources: ["cvs", "casfRights"] },
    { id: "cse", name: "CSE / CSE d’établissement", full: "Comité social et économique (privé) ou comité social d’établissement (FPH)", kind: "Dialogue social · statut de l’employeur", decision: "Consultation et attributions légales ; selon sujet", who: "Représentants élus du personnel et représentants de l’employeur ; modalités selon secteur et effectif.", purpose: "Représenter les salariés ou agents et traiter les sujets relevant des compétences de l’instance.", manager: "Anticiper les consultations, partager des informations utiles et tracer les réponses dans le bon calendrier.", caution: "Même sigle, deux instances différentes selon le statut : privé (CSE) et fonction publique hospitalière (comité social d’établissement). Ne pas les confondre avec le CVS.", sources: ["cse"] },
    { id: "f3sct", name: "F3SCT", full: "Formation spécialisée en santé, sécurité et conditions de travail", kind: "Dialogue social · fonction publique", decision: "Avis / propositions sur prévention et conditions de travail", who: "Représentants du personnel et représentants de l’administration selon le texte applicable.", purpose: "Examiner les risques professionnels, la prévention, les conditions de travail et les événements pertinents.", manager: "Faire remonter le DUERP et les actions de prévention ; associer les équipes concernées et vérifier le suivi.", caution: "Les modalités et l’instance compétente varient entre fonction publique et secteur privé (CSSCT du CSE le cas échéant).", sources: ["duerp"] },
    { id: "cme", name: "CME", full: "Commission médicale d’établissement", kind: "Gouvernance médicale · établissement public de santé", decision: "Avis et contribution médicale aux décisions de gouvernance", who: "Représentants des personnels médicaux, odontologiques et pharmaceutiques selon les textes.", purpose: "Contribuer à la stratégie médicale, aux parcours, à la qualité et à la politique médicale de l’établissement.", manager: "Arriver avec une question qui relève de l’expérience médicale et respecter le champ de décision des instances.", caution: "La CME est propre à l’organisation hospitalière concernée ; elle ne se substitue pas à la direction ni au CA.", sources: ["hospital"] },
    { id: "csirmt", name: "CSIRMT", full: "Commission des soins infirmiers, de rééducation et médico-techniques", kind: "Gouvernance soignante · hôpital public", decision: "Avis et propositions sur les soins et pratiques professionnelles", who: "Représentants des catégories de professionnels de soins et médico-techniques.", purpose: "Contribuer à la politique des soins, à la qualité et à l’organisation des activités soignantes.", manager: "Utiliser ses retours pour comprendre les effets d’une réorganisation sur la pratique et les parcours.", caution: "Le périmètre réglementaire dépend du statut de l’établissement ; vérifier le règlement intérieur local.", sources: ["hospital"] },
    { id: "cdu", name: "CDU", full: "Commission des usagers", kind: "Droits des patients · établissement de santé", decision: "Avis et recommandations ; traitement de réclamations dans le cadre prévu", who: "Représentants des usagers, médiateurs et représentants de l’établissement selon le texte.", purpose: "Veiller au respect des droits, faciliter les démarches et contribuer à améliorer l’accueil et la prise en charge.", manager: "Analyser les réclamations et retours d’expérience, répondre dans les délais et suivre les actions correctives.", caution: "La CDU concerne l’établissement de santé ; ne pas la confondre avec le CVS des ESSMS.", sources: ["cdu", "hasHealth"] },
    { id: "clan-clin", name: "CLAN / CLIN", full: "Comité de liaison en alimentation et nutrition / équipe ou comité d’hygiène et prévention des infections", kind: "Comités thématiques · organisation locale", decision: "Avis et recommandations internes", who: "Professionnels concernés, médecins, soignants, restauration, hygiène et direction selon les besoins.", purpose: "Structurer la politique nutrition ou la prévention des infections et faire circuler les recommandations.", manager: "Vérifier le mandat, les résultats attendus et l’articulation avec les vigilances, équipes opérationnelles et instances réglementaires.", caution: "Intitulé, obligation et forme dépendent du type d’établissement et des textes applicables ; confirmer localement.", sources: ["hospital", "hasHealth"] },
    { id: "reunion-equipe", name: "Réunion d’équipe / transmissions", full: "Réunion de service, relève ou analyse de pratiques", kind: "Coordination opérationnelle", decision: "Décisions opérationnelles dans le périmètre de l’équipe", who: "Professionnels du service, encadrant et partenaires invités avec accord et nécessité.", purpose: "Partager les informations nécessaires au travail, ajuster les interventions et préserver la continuité.", manager: "Ordre du jour, temps limité, règles de confidentialité, compte rendu adapté et actions suivies.", caution: "Ne pas exposer plus de données personnelles ou de santé que nécessaire ; utiliser les canaux institutionnels autorisés.", sources: ["casfRights", "cnil"] }
  ];

  const DOCUMENTS = [
    { id: "projet-etablissement", name: "Projet d’établissement ou de service", category: "Pilotage · ESSMS", status: "Obligatoire pour les ESSMS", who: "Direction pilote la démarche ; la personne morale valide selon ses statuts.", involve: "Personnes accompagnées, proches, CVS ou autre forme de participation, professionnels, partenaires et gestionnaire.", when: "Élaboré et actualisé dans le cycle du projet ; le CASF prévoit une durée maximale de 5 ans et une consultation du CVS ou forme de participation.", purpose: "Donner les objectifs, l’organisation, la coopération, l’évaluation de la qualité et la prévention de la maltraitance.", manager: "En extraire quelques priorités mesurables, responsables, ressources et indicateurs ; relier le projet au CPOM, au budget et au plan qualité.", steps: ["Diagnostic besoins et territoire", "Ateliers avec les personnes et équipes", "Arbitrage des priorités et moyens", "Consultation/validation selon gouvernance", "Diffusion, suivi annuel et révision"], sources: ["project", "casf", "hasEsms"] },
    { id: "projet-personnalise", name: "Projet personnalisé d’accompagnement", category: "Personne accompagnée · ESSMS", status: "Repère central des droits et de la qualité", who: "Professionnels référents et direction organisent le processus ; la personne reste au centre.", involve: "Personne accompagnée, représentant légal si nécessaire, proches selon choix, équipe pluridisciplinaire et partenaires utiles.", when: "À construire avec la personne et à réévaluer selon son parcours, ses besoins et le cadre applicable à la catégorie ; pas de délai unique universel pour tous les ESSMS.", purpose: "Traduire ses attentes, besoins, choix, risques et objectifs en accompagnement concret, partagé et révisable.", manager: "Vérifier accessibilité des échanges, traçabilité, consentement, référent, échéance de revue et coordination du dossier usager.", steps: ["Préparer le recueil de la parole", "Distinguer souhaits et évaluations professionnelles", "Définir objectifs et actions", "Partager aux professionnels concernés", "Réévaluer avec la personne"], sources: ["casfRights", "hasEsms"] },
    { id: "livret", name: "Livret d’accueil et charte des droits", category: "Droits · ESSMS", status: "Obligatoire dans le cadre CASF", who: "Direction ou gestionnaire en assure la rédaction et la remise.", involve: "Personnes accompagnées, représentants et équipes ; formats accessibles et adaptés au public.", when: "Remis à l’admission ou à l’entrée dans l’accompagnement selon les règles de la structure ; actualisé lorsque les informations changent.", purpose: "Présenter les droits, prestations, contacts, recours et modalités pratiques.", manager: "Tester avec les usagers : langage simple, pictogrammes/FALC si utile, versions à jour, contact d’une personne qualifiée et accessibilité.", steps: ["Lister les informations attendues", "Vérifier les droits et recours", "Adapter au public et aux handicaps", "Faire relire par des personnes accompagnées", "Tracer la remise et réviser"], sources: ["casfRights"] },
    { id: "contrat-sejour", name: "Contrat de séjour ou DIPC", category: "Droits · ESSMS", status: "Selon le type d’accueil et le CASF", who: "Le gestionnaire prépare le document ; la personne ou son représentant échange et signe selon le cadre.", involve: "Personne accompagnée, représentant légal si nécessaire, professionnel référent et équipe d’admission.", when: "À l’admission, dans le délai prévu pour le type de structure ; réviser quand les prestations ou les conditions évoluent.", purpose: "Formaliser objectifs, prestations, droits, participation et éléments financiers lorsque cela s’applique.", manager: "Éviter le formulaire générique : relier les engagements au projet personnalisé, expliquer les clauses et conserver une preuve de remise.", steps: ["Vérifier le régime applicable", "Présenter en format compréhensible", "Personnaliser les objectifs", "Recueillir signatures/observations", "Contrôler les mises à jour"], sources: ["casfRights"] },
    { id: "reglement", name: "Règlement de fonctionnement", category: "Droits · organisation", status: "Obligatoire pour les ESSMS concernés", who: "Direction prépare ; instance de gouvernance adopte ou valide selon le statut.", involve: "CVS ou forme de participation, professionnels, représentant des usagers et gestionnaire.", when: "Établi pour la structure, remis/accessible aux personnes et actualisé selon les règles applicables et l’évolution de l’organisation.", purpose: "Définir les droits, les règles de vie collective et les obligations nécessaires au respect de chacun.", manager: "Vérifier cohérence avec droits fondamentaux, liberté d’aller et venir, sécurité, sanctions et pratiques réelles.", steps: ["Partir des droits et textes", "Décrire règles proportionnées", "Consulter les personnes et équipes", "Valider et diffuser", "Réviser après incident ou changement"], sources: ["casfRights"] },
    { id: "cpom", name: "CPOM", category: "Pilotage · financement", status: "Contrat pluriannuel selon les catégories et politiques applicables", who: "Organisme gestionnaire et autorités de tarification/contrôle compétentes.", involve: "Directions, responsables de site, fonctions finances/RH/qualité, ARS et/ou département selon compétence.", when: "Négociation sur un cycle pluriannuel ; calendrier et périmètre dépendent du secteur et de l’autorité.", purpose: "Convenir d’objectifs, d’engagements, de transformations de l’offre et d’indicateurs, avec des moyens et un suivi.", manager: "Faire le lien entre indicateurs, projet d’établissement, EPRD, effectifs, investissements et risques.", steps: ["Diagnostic partagé", "Priorités et indicateurs", "Négociation des moyens", "Signature par les autorités habilitées", "Suivi, bilan et avenants"], sources: ["casf", "cnsaFunding"] },
    { id: "eprd", name: "EPRD", category: "Finances · prévision", status: "Selon le régime budgétaire de la structure", who: "Gestionnaire/établissement prépare ; directions financières consolident ; autorité compétente reçoit ou valide selon le cadre.", involve: "Direction, comptabilité, RH, responsables d’activité, organisme gestionnaire et financeurs concernés.", when: "Prévisions de l’exercice N selon calendrier du régime ; la CNSA indique une échéance de dépôt au plus tard le 30 juin N pour les dossiers qui relèvent de sa collecte.", purpose: "Présenter prévisions de recettes/dépenses et équilibres financiers ; certains régimes intègrent un PGFP.", manager: "Vérifier les hypothèses d’activité, effectifs, prix, revalorisations, mesures nouvelles, investissements et scénarios de risque.", steps: ["Rassembler réalisé N-1 et budget N-1", "Construire activité et recettes", "Chiffrer masse salariale et dépenses", "Scénariser les risques", "Faire valider puis déposer dans le bon cadre"], sources: ["cnsaData", "cnsaFunding"] },
    { id: "errd", name: "ERRD / compte administratif", category: "Finances · réalisé", status: "Selon le régime de l’établissement", who: "Gestionnaire ou établissement prépare les comptes ; l’organe habilité approuve ; dépôt aux autorités concernées.", involve: "Comptabilité, direction, contrôle de gestion, responsables, commissaires aux comptes le cas échéant.", when: "Après clôture ; pour la collecte CNSA 2025, le CA/ERRD était attendu au 30 avril N+1. Toujours vérifier l’exercice et la campagne en cours.", purpose: "Comparer le réalisé aux prévisions et justifier écarts, résultats et affectations.", manager: "Utiliser les écarts comme signal de pilotage : remplacements, activité, intérim, achats, recettes et qualité de service.", steps: ["Fiabiliser clôture et imputations", "Analyser écart prévision/réalisé", "Documenter faits et actions", "Valider selon les statuts", "Transmettre à l’autorité"], sources: ["cnsaData", "cnsaCampaign"] },
    { id: "ppi", name: "PPI / PPIF / PGFP", category: "Finances · investissement", status: "Outil de programmation ; autorisation selon régime", who: "Gestionnaire, direction et fonction finances ; autorité de tarification lorsque son approbation est requise.", involve: "Services techniques, utilisateurs, qualité, RH, maîtrise d’œuvre, financeurs et gouvernance.", when: "Avant un programme pluriannuel d’investissements ; actualiser selon travaux, financement, capacité d’emprunt et calendrier.", purpose: "Programmer opérations, coûts, financements, emprunts, amortissements et impact sur l’exploitation.", manager: "Comparer besoin de service, urgence patrimoniale, coût complet, économies d’énergie, maintenance et capacité de financement.", steps: ["Recenser besoins et risques", "Chiffrer les scénarios", "Planifier et identifier financements", "Analyser impact sur trésorerie et charges", "Obtenir validations/accords applicables"], sources: ["cnsaData", "casf"] },
    { id: "cnr", name: "Demande de crédits non reconductibles", category: "Finances · financement ponctuel", status: "Dispositif ponctuel · selon campagne et financeur", who: "Direction/gestionnaire rédige la demande à l’autorité ou au financeur compétent.", involve: "Équipe concernée, finances, achats, qualité, personnes accompagnées si le projet touche leur cadre de vie.", when: "À la publication d’une instruction ou d’un appel, ou lors du dialogue budgétaire ; aucune date nationale unique.", purpose: "Financer une dépense ou action ponctuelle qui n’est pas garantie en base récurrente.", manager: "Présenter un besoin démontré, un budget sincère, un calendrier, des devis et des résultats attendus ; prévoir la fin du financement.", steps: ["Décrire besoin et public", "Relier au projet et aux priorités", "Chiffrer avec devis et coûts induits", "Définir indicateurs et pérennité", "Déposer dans le canal/date du financeur"], sources: ["cnsaCnr", "cnsaFunding"] },
    { id: "aap", name: "Appel à projets / autorisation", category: "Offre · autorisations", status: "Pour certaines créations, extensions ou transformations ; exceptions prévues par les textes", who: "Autorité ou autorités compétentes publient le cahier des charges ; candidats gestionnaires déposent le dossier.", involve: "Direction, personnes accompagnées, équipes métiers, finance, immobilier, partenaires et élus si pertinent.", when: "Selon calendrier du cahier des charges ; ne pas engager une création avant d’avoir clarifié si une autorisation est requise.", purpose: "Sélectionner une réponse à un besoin territorial et attribuer une autorisation ou une capacité dans le cadre fixé.", manager: "Démontrer le besoin, la qualité du projet, les compétences, le budget soutenable, le calendrier et la coopération territoriale.", steps: ["Lire critères et pièces du cahier", "Construire diagnostic et réponse", "Chiffrer fonctionnement/investissement", "Sécuriser gouvernance et partenariats", "Déposer puis préparer le démarrage"], sources: ["appProject", "casf"] },
    { id: "duerp", name: "DUERP + programme de prévention", category: "RH · santé au travail", status: "Obligation de l’employeur", who: "Employeur responsable ; direction, encadrement, prévention et professionnels contribuent.", involve: "Salariés/agents, représentants du personnel, SPST, préventeur, encadrants et CSE/CST/F3SCT selon statut.", when: "Au moins chaque année dans les entreprises d’au moins 11 salariés ; aussi lors d’un changement important ou d’une information nouvelle sur un risque.", purpose: "Inventorier les risques par unité de travail et planifier des actions de prévention adaptées.", manager: "Inclure risques biologiques, manutention, agressions, RPS, nuit, fortes chaleurs, déplacements et risques d’isolement ; suivre les actions, pas seulement le document.", steps: ["Découper les unités de travail", "Recueillir les situations réelles", "Évaluer gravité/fréquence", "Prioriser avec les équipes", "Attribuer responsable, délai et preuve"], sources: ["duerp", "servicePublicWork"] },
    { id: "duerme", name: "« DUERME » : vérifier l’intitulé local", category: "RH · clarification", status: "Le document national de référence est le DUERP", who: "Employeur et fonction prévention.", involve: "Encadrants, équipes, représentants du personnel et service de prévention et de santé au travail.", when: "Même cycle que le DUERP si « DUERME » désigne un support local de risques.", purpose: "Clarifier si l’établissement vise un DUERP, un document métier complémentaire ou un outil interne.", manager: "Je n’ai pas identifié de dénomination nationale uniforme « DUERME ». Conserver le DUERP réglementaire et documenter tout support local complémentaire.", steps: ["Demander le nom complet à l’employeur", "Vérifier l’articulation avec le DUERP", "Éviter deux registres contradictoires", "Faire valider par le préventeur/RH", "Tracer la version et les responsabilités"], sources: ["duerp"] },
    { id: "evaluation-has", name: "Évaluation de la qualité ESSMS", category: "Qualité · ESSMS", status: "Évaluation externe par organisme autorisé, en principe tous les 5 ans selon la programmation", who: "ESSMS prépare et transmet le rapport ; organisme évaluateur accrédité réalise la visite ; autorités de tarification/contrôle programment.", involve: "Personnes accompagnées, professionnels, gouvernance, CVS, référents qualité et organisme évaluateur.", when: "Selon le calendrier fixé par les autorités. L’auto-évaluation interne est recommandée pour piloter la démarche, mais elle ne remplace pas la visite externe.", purpose: "Évaluer les pratiques, l’expérience des personnes, les droits, l’accompagnement, les RH et le pilotage qualité.", manager: "Partir des critères applicables, preuves et situations vécues ; prioriser les critères impératifs et suivre le plan d’amélioration.", steps: ["Vérifier date de programmation", "Actualiser la démarche et preuves", "Associer personnes et équipes", "Organiser la visite et les entretiens", "Publier/transmettre et suivre le plan"], sources: ["hasEsms", "hasProcedure", "qualiscope"] },
    { id: "certification", name: "Certification HAS des établissements de santé", category: "Qualité · sanitaire", status: "Procédure nationale pour les établissements de santé concernés", who: "Établissement prépare la démarche ; experts-visiteurs mandatés par la HAS réalisent la visite.", involve: "Patients, représentants des usagers, gouvernance, professionnels, qualité/risques, équipes médicales et soignantes.", when: "Selon le cycle et le calendrier HAS de certification applicable au site.", purpose: "Apprécier la qualité et la sécurité des soins dans les établissements de santé.", manager: "Distinguer le cycle de certification sanitaire du dispositif d’évaluation des ESSMS ; mobiliser les équipes autour des pratiques et résultats.", steps: ["Vérifier le cycle et le référentiel courant", "Faire un diagnostic partagé", "Préparer les situations et preuves", "Conduire la visite", "Suivre les décisions et actions"], sources: ["hasHealth", "hasEsms"] },
    { id: "rapport", name: "Rapport d’activité / rapport de gestion", category: "Pilotage · redevabilité", status: "Obligations et contenu variables selon le statut et financeur", who: "Direction et responsables de pôles/services ; validation par la gouvernance si requise.", involve: "Finance, RH, qualité, professionnels, représentants des personnes et partenaires.", when: "Cycle annuel ou calendrier contractuel/statutaire.", purpose: "Rendre compte de l’activité, des résultats, des ressources, des événements et des actions d’amélioration.", manager: "Présenter quelques indicateurs interprétés, expliquer les écarts, donner la parole aux personnes et relier les suites au budget/projet.", steps: ["Fiabiliser sources", "Analyser tendances par public/activité", "Expliquer écarts et limites", "Proposer actions et responsables", "Valider et diffuser selon règles"], sources: ["hasEsms", "cnsaData"] },
    { id: "crise", name: "Plan de continuité et gestion de crise", category: "Sécurité · continuité", status: "Selon les catégories et obligations de l’établissement", who: "Direction pilote ; fonctions sécurité, soins, technique et gouvernance construisent les scénarios.", involve: "Équipes, gestionnaire, ARS/préfecture selon situation, partenaires, résidents et proches selon le plan.", when: "Avant la crise ; tester, revoir après exercice, incident ou évolution des locaux/risques.", purpose: "Maintenir les fonctions essentielles et protéger les personnes lors d’une crise sanitaire, climatique, technique ou numérique.", manager: "Nommer cellule de crise, suppléants, contacts, priorités, seuils d’alerte et messages ; tester les listes et solutions de repli.", steps: ["Lister scénarios prioritaires", "Définir fonctions vitales", "Attribuer rôles et suppléances", "Écrire checklists et contacts", "Faire exercices et retours d’expérience"], sources: ["project", "servicePublicWork"] },
    { id: "autorisation", name: "Autorisation, habilitation ou agrément", category: "Gouvernance · conformité", status: "Dépend de l’activité, de la catégorie et du statut", who: "Autorité compétente délivre l’autorisation ; gestionnaire conserve et suit ses conditions.", involve: "Direction, juridique, qualité, finances, équipes et autorités compétentes.", when: "Avant création, extension ou transformation lorsqu’un régime d’autorisation s’applique ; vérifier les échéances et obligations propres.", purpose: "Définir le périmètre légal, la capacité, le public et les modalités autorisées.", manager: "Ne pas employer « agrément » comme synonyme de toute autorisation : vérifier le nom juridique, l’autorité, les conditions et les délais de renouvellement.", steps: ["Qualifier activité/statut", "Identifier autorité et texte", "Vérifier capacité et mentions", "Tracer échéances et conditions", "Déclarer les modifications requises"], sources: ["casf", "appProject", "finess"] }
  ];

  const ACTORS = [
    { id: "direction", name: "Direction / organisme gestionnaire", role: "Décide, arbitre et rend compte dans le périmètre de la personne morale.", position: "Au centre de la gouvernance locale ; délégation possible aux directeurs adjoints et responsables.", interaction: "Formaliser les délégations, calendriers de décision, indicateurs et voies d’escalade.", value: "Arbitrage, priorités, représentation, responsabilité de l’organisation et mobilisation des ressources.", type: "Gouvernance", sources: ["project"] },
    { id: "ars", name: "ARS", role: "Agence régionale de santé : régulation régionale, planification, autorisation, financement ou contrôle selon les compétences et le type de structure.", position: "Autorité de tarification/contrôle pour de nombreux ESSMS et établissements sanitaires, parfois en compétence conjointe avec le département.", interaction: "Identifier la délégation territoriale et le service instructeur ; respecter le canal et les échéances ; répondre avec données fiabilisées.", value: "Orientations, autorisations, décisions tarifaires, appels à projets, recommandations et interlocuteurs territoriaux.", type: "Autorité", sources: ["ars", "casf", "hospital"] },
    { id: "departement", name: "Conseil départemental", role: "Porte des politiques d’autonomie, d’aide sociale et de protection de l’enfance ; autorise ou tarifie certaines offres selon les compétences.", position: "Autorité de tarification/contrôle ou partenaire de parcours selon la catégorie.", interaction: "S’appuyer sur la direction autonomie/solidarités/ASE du territoire ; distinguer décision d’orientation et financement.", value: "Schémas départementaux, aide sociale, tarification et priorités territoriales.", type: "Autorité", sources: ["casf", "mdph"] },
    { id: "has", name: "HAS", role: "Définit référentiels et méthodes nationales de qualité, recommandations et dispositifs d’évaluation/certification.", position: "Autorité scientifique et méthodologique ; la HAS ne finance pas les structures et ne remplace pas leur autorité de tutelle.", interaction: "Utiliser la version du référentiel applicable, consulter le manuel courant et partager les résultats dans le cadre prévu.", value: "Repères opposables ou recommandés selon le dispositif, retours publics Qualiscope, outils de qualité.", type: "Qualité", sources: ["hasEsms", "hasHealth"] },
    { id: "anap", name: "ANAP", role: "Agence nationale d’appui à la performance : outils, ressources et accompagnement des organisations sanitaires et médico-sociales.", position: "Appui et expertise, sans mission de régulation ni de contrôle.", interaction: "Mobiliser ses guides, autodiagnostics, communautés et accompagnements selon les thèmes.", value: "Méthodes concrètes pour RH, finances, immobilier, organisation, données, parcours et qualité.", type: "Appui", sources: ["anap"] },
    { id: "cnsa", name: "CNSA / branche Autonomie", role: "Pilote la branche Autonomie, contribue au financement de l’offre et soutient l’équité d’accès aux aides et services.", position: "Finance et pilote des crédits nationaux, en lien avec ARS et départements ; pas l’interlocuteur quotidien de chaque équipe.", interaction: "Suivre les instructions budgétaires, appels et plateformes ; passer par l’autorité de tarification pour les décisions de l’établissement.", value: "Repères de financement, études, données, politiques de l’autonomie et appels ponctuels.", type: "Financement", sources: ["cnsa", "cnsaFunding", "cnsaData"] },
    { id: "mdph", name: "MDPH / CDAPH", role: "La MDPH accueille, évalue et instruit les demandes ; la CDAPH prend des décisions d’orientation et de droits selon son champ.", position: "En lien avec la personne et son parcours ; ne dirige pas l’établissement qui l’accueille.", interaction: "Respecter la décision, informer sur les capacités et évolutions de la réponse, associer la personne et prévenir les ruptures.", value: "Droits, compensation, décisions d’orientation et connaissance des besoins de la personne.", type: "Parcours", sources: ["mdph"] },
    { id: "cpam", name: "Assurance maladie / CPAM", role: "Finance des soins et applique les règles de prise en charge ; interlocuteur selon le statut et le régime du service.", position: "Financeur ou opérateur de gestion, en lien avec ARS, établissements et professionnels.", interaction: "Fiabiliser activité, pièces et conventions ; utiliser les canaux de dépôt prévus.", value: "Référentiels de facturation, prises en charge et informations de financement des soins.", type: "Financement", sources: ["cnsaFunding", "hospital"] },
    { id: "cofrac", name: "Organisme évaluateur accrédité", role: "Réalise la visite d’évaluation ESSMS selon le référentiel HAS lorsqu’il est accrédité et autorisé.", position: "Tiers indépendant mandaté pour une évaluation ; ce n’est pas l’autorité de tarification ni l’équipe interne qualité.", interaction: "Cadrer périmètre, dates, méthodes, personnes rencontrées, confidentialité et accès aux documents.", value: "Constats structurés, cotations et rapport de visite pour alimenter l’amélioration.", type: "Qualité", sources: ["hasProcedure", "hasEsms"] },
    { id: "cvs", name: "CVS et représentants des personnes", role: "Font vivre l’expression et la participation dans l’ESSMS.", position: "Instance de participation distincte de la direction et de la représentation des salariés.", interaction: "Rendre l’information accessible, préparer les sujets, répondre aux avis et suivre les engagements.", value: "Expérience vécue, priorités de vie quotidienne, signaux de risque et propositions d’amélioration.", type: "Participation", sources: ["cvs", "casfRights"] },
    { id: "personnel", name: "CSE / CST / F3SCT", role: "Représentent le personnel et traitent les sujets de dialogue social et de prévention selon le statut.", position: "Instance consultative/représentative, distincte du CVS et de l’équipe de direction.", interaction: "Préparer les informations/consultations, transmettre le DUERP selon le cadre, tracer réponses et suites.", value: "Retour sur les conditions de travail, risques, réorganisations et qualité de vie au travail.", type: "Dialogue social", sources: ["cse", "duerp"] },
    { id: "anpf", name: "ANFH / OPCO Santé / CNFPT", role: "Opérateurs de formation et de compétences selon employeur et statut.", position: "Financeurs/partenaires de formation, pas décideurs de l’organisation quotidienne.", interaction: "Construire le plan de développement des compétences et vérifier l’éligibilité des formations.", value: "Financement, données métiers, formations et accompagnement des compétences.", type: "Compétences", sources: ["cnsa"] },
    { id: "sante-travail", name: "SPST / médecine du travail / prévention", role: "Prévention de la santé au travail, conseil à l’employeur et suivi des travailleurs dans les cadres applicables.", position: "Partenaire de prévention ; l’employeur conserve ses responsabilités d’évaluation et d’action.", interaction: "Associer le service aux risques, aménagements, maintien en emploi et actions de prévention.", value: "Conseils de prévention, études de poste et appui santé au travail.", type: "Prévention", sources: ["duerp", "servicePublicWork"] },
    { id: "anact", name: "ANACT / ARACT, CARSAT, CREAI, SRA", role: "Réseaux d’appui thématiques ou territoriaux : conditions de travail, prévention, connaissance médico-sociale ou qualité des soins.", position: "Ressources et appui ; rôles différents selon l’organisme et le territoire.", interaction: "Contacter l’acteur adapté au problème : QVCT, prévention, appui qualité, études ou transformation.", value: "Diagnostic, guides, formations et retours d’expérience.", type: "Appui", sources: ["anap"] },
    { id: "territoire", name: "CPTS / DAC / GHT / GCSMS", role: "Formes de coopération territoriale qui organisent des parcours, des appuis ou des mutualisations.", position: "Partenaires de coordination ; statut, gouvernance et compétences diffèrent.", interaction: "Définir un interlocuteur, conventions, circuit d’orientation, partage d’information et indicateurs communs.", value: "Ressources territoriales, expertise, relais et capacité de réponse collective.", type: "Territoire", sources: ["anap", "hospital"] },
    { id: "personne", name: "Personne accompagnée, patient, proches", role: "Titulaire de droits, acteur de ses choix et partenaire essentiel de son parcours.", position: "Au cœur du projet personnalisé, du consentement et de l’expérience de service.", interaction: "Informer, écouter, co-construire, respecter les choix et organiser la participation selon les préférences.", value: "Savoirs expérientiels, priorités, alertes, attentes et évaluation de la qualité vécue.", type: "Participation", sources: ["casfRights", "hasEsms"] },
    { id: "finess", name: "FINESS", role: "Répertoire national des établissements, entités juridiques et activités sanitaires et sociales.", position: "Source de référence pour identifier une structure ; ce n’est ni une autorité de contrôle ni une certification.", interaction: "Vérifier FINESS géographique et juridique, catégorie, statut et activités lors des échanges et dépôts.", value: "Identification, nomenclature et données descriptives publiques.", type: "Référentiel", sources: ["finess"] }
  ];

  const FAQ = [
    { q: "Que puis-je décider comme adjoint de direction ?", a: "Ce que prévoient votre fiche de poste, les délégations écrites et les procédures du gestionnaire. Demandez à distinguer décisions autonomes, avis et escalade obligatoire." },
    { q: "Un Master MES suffit-il pour devenir directeur ?", a: "Il prépare à des fonctions de management, mais ne garantit pas une nomination. Dans la FPH, les corps D3S/DH passent par des voies statutaires et concours ; dans le privé/associatif, les critères dépendent du poste et du gestionnaire.", sources: ["iae", "d3s", "dh"] },
    { q: "Puis-je encadrer une équipe soignante avec ce diplôme ?", a: "Certains postes d’organisation ou de direction sont accessibles selon le recrutement. Le Master MES ne remplace pas automatiquement les prérequis professionnels et la qualification demandés pour un poste de cadre de santé." },
    { q: "CODIR et COPIL : quelle différence ?", a: "Le CODIR suit l’organisation et les arbitrages de direction ; le COPIL gouverne un projet donné. Les deux sont des pratiques internes : vérifiez leur mandat local." },
    { q: "CVS et CSE, qui représente qui ?", a: "Le CVS organise la participation des personnes en ESSMS. Le CSE privé ou le comité social d’établissement en FPH représente le personnel. Ces instances ne se remplacent pas.", sources: ["cvs", "cse"] },
    { q: "L’évaluation HAS des ESSMS est-elle une certification ?", a: "Non. L’évaluation ESSMS est une visite externe selon le référentiel HAS, en principe tous les cinq ans selon la programmation. La certification concerne la qualité des soins des établissements de santé.", sources: ["hasEsms", "hasHealth"] },
    { q: "À quelle fréquence réviser le DUERP ?", a: "Au moins chaque année dans les entreprises d’au moins 11 salariés, et aussi lors d’un aménagement important ou d’une information nouvelle sur un risque. Vérifiez les règles applicables au statut de l’employeur.", sources: ["duerp"] },
    { q: "Le DUERME est-il une obligation nationale ?", a: "Le document réglementaire est le DUERP. « DUERME » peut être un intitulé local ou sectoriel : demandez son développement et son articulation avec le DUERP officiel.", sources: ["duerp"] },
    { q: "Tous les ESSMS déposent-ils un EPRD ?", a: "Non. Le cadre dépend de la catégorie, du statut, du CPOM et des règles budgétaires applicables. Vérifiez avec la fonction finance et l’autorité de tarification.", sources: ["cnsaData"] },
    { q: "Une demande de CNR finance-t-elle une dépense durable ?", a: "Pas par défaut. Un CNR est ponctuel et n’est pas automatiquement reconduit ; explicitez le coût futur, les résultats attendus et la solution après la période financée.", sources: ["cnsaCnr"] },
    { q: "Comment gérer une absence imprévue ?", a: "Évaluez d’abord la sécurité et les compétences minimales requises, activez le circuit de remplacement, tracez les arbitrages et alertez la direction/RH si l’activité ne peut pas être maintenue en sécurité." },
    { q: "Puis-je réaffecter un professionnel à un acte de soin ?", a: "Respectez les compétences réglementées, la prescription, les protocoles validés et l’organisation médicale/soignante. Un objectif de planning ne permet pas de dépasser le champ professionnel." },
    { q: "Comment traiter un événement indésirable ?", a: "Protégez immédiatement les personnes, alertez selon le circuit interne, documentez les faits, respectez les déclarations externes applicables et organisez un retour d’expérience sans recherche hâtive de faute." },
    { q: "Quels indicateurs RH suivre en premier ?", a: "Croisez absentéisme, postes vacants, intérim, accidents du travail, heures supplémentaires, turn-over, formation et stabilité des équipes. Définissez une période, une source fiable et une action associée." },
    { q: "Comment protéger les données d’un annuaire de collègues ?", a: "Ne collectez que des coordonnées volontaires, informez sur la finalité et les destinataires, limitez l’accès et prévoyez une suppression. Ce prototype garde les entrées dans le navigateur ; aucune base distante n’est branchée.", sources: ["cnil"] },
    { q: "Qui valide un investissement ?", a: "Le circuit dépend du montant, du statut, de la délégation, du budget et du financeur. Présentez le besoin, le coût complet, l’impact d’exploitation, les devis et la validation de l’autorité si elle est requise." },
    { q: "Que faire si une famille conteste une décision ?", a: "Écoutez et clarifiez les faits, les droits et l’interlocuteur compétent ; tracez la réponse, proposez le circuit de réclamation/médiation prévu et protégez la confidentialité." },
    { q: "Quels sujets traiter dans un entretien de régulation ?", a: "Partir de situations observables, écouter les points de vue, rappeler le cadre, convenir d’actions et d’un suivi. Pour un sujet disciplinaire ou de santé, associez RH et utilisez le bon processus." },
    { q: "Comment lancer une réunion efficace ?", a: "Annoncez l’objectif et les décisions attendues, envoyez les pièces utiles, désignez un animateur et un preneur de décisions, puis diffusez un relevé avec responsable et échéance." },
    { q: "Où vérifier une catégorie d’établissement ?", a: "Croisez l’autorisation, la fiche FINESS, les textes du CASF/CSP et les décisions de tarification du site. Le nom usuel peut différer de la catégorie juridique.", sources: ["finess", "casf"] },
    { q: "Quelle convention collective s’applique à un EHPAD ou à un ESSMS ?", a: "Le nom de la structure ne suffit pas. En droit privé, partez de l’activité principale de l’employeur, de son champ conventionnel et de l’IDCC indiqué sur le bulletin de paie ou le contrat, puis vérifiez le texte et ses avenants sur Légifrance. En FPH, les agents relèvent d’un statut public, pas d’une convention collective privée.", sources: ["collectiveAgreement", "publicServiceCode"] },
    { q: "Quelles conventions collectives rencontre-t-on le plus souvent ?", a: "Repères fréquents : CCN 51 / FEHAP (IDCC 29), CCN 66 (IDCC 413), hospitalisation privée (IDCC 2264), aide et soins à domicile (IDCC 2941), centres de lutte contre le cancer (IDCC 2046) et accords Croix-Rouge (IDCC 5502). Certains employeurs relèvent d’un cadre spécifique, dont des organismes de Sécurité sociale (IDCC 218). Cette sélection n’est pas exhaustive : vérifier l’employeur, le champ, les accords d’entreprise et les textes en vigueur.", sources: ["ccIdcc29", "ccIdcc413", "ccIdcc2264", "ccIdcc2941", "ccIdcc2046", "ccIdcc5502", "ccIdcc218"] },
    { q: "Un cadre a-t-il automatiquement un forfait jours ?", a: "Non. Il faut une catégorie éligible, un accord collectif qui autorise le dispositif et une convention individuelle écrite acceptée par le salarié. Le titre de cadre ou une grande charge de travail ne suffit pas.", sources: ["forfait", "forfaitArticle"] },
    { q: "Combien de RTT donne un forfait jours à 218 jours ?", a: "Il n’existe pas de nombre fixe de RTT. Le nombre de jours de repos de forfait varie avec le calendrier de l’année, les jours fériés chômés, les congés payés, les congés conventionnels et l’accord applicable. Le calculateur ci-dessus donne une estimation lun–ven à adapter au planning réel.", sources: ["forfait", "forfaitArticle"] },
    { q: "Les jours de repos du forfait jours sont-ils les mêmes que les RTT ?", a: "On parle souvent de RTT par abus de langage, mais en forfait jours il s’agit de jours de repos attribués pour respecter le nombre annuel de jours travaillé convenu. Les RTT d’un dispositif horaire suivent d’autres règles. Vérifiez l’accord, le contrat et le compteur RH.", sources: ["forfait"] },
    { q: "Quelles garanties suivre pour un forfait jours ?", a: "L’employeur suit les jours ou demi-journées travaillées, la charge et l’amplitude, l’articulation avec la vie personnelle, et organise l’échange prévu par l’accord. Le repos quotidien de 11 heures et le repos hebdomadaire restent à respecter, sauf dérogations encadrées.", sources: ["forfait", "dailyRest"] },
    { q: "Comment rédiger une fiche de poste utile ?", a: "Décrivez la finalité, le rattachement, les missions, les activités observables, les responsabilités et délégations, les relations de travail, les compétences et qualifications, les contraintes, les horaires et les critères de réussite. Faites valider par le manager et RH, puis revoyez-la après une évolution importante du poste.", sources: ["candidateInfo"] },
    { q: "Pourquoi publier une offre d’emploi plutôt que diffuser seulement en interne ?", a: "Une offre claire rend le besoin visible, élargit le vivier, permet aux candidats de se projeter et explicite les conditions du poste. Elle ne remplace pas la procédure interne ou statutaire quand celle-ci s’applique. Rédigez sans critère discriminatoire.", sources: ["jobOffer", "recruitmentNoDiscrimination"] },
    { q: "Comment conduire un entretien de recrutement équitable ?", a: "Préparez une grille liée aux missions, posez à tous les candidats les mêmes questions principales, demandez des exemples concrets, notez des éléments observables, laissez du temps aux questions et annoncez les étapes de décision. Ne questionnez que sur des informations directement nécessaires à l’emploi.", sources: ["candidateInfo", "recruitmentNoDiscrimination"] },
    { q: "Qu’est-ce qu’un ETP et comment le calculer ?", a: "À une date donnée, ETP = heures contractuelles hebdomadaires des personnes présentes ÷ durée hebdomadaire de référence à temps plein. Avec une référence de 35 h, 70 h contractuelles représentent 2 ETP. Pour une autre organisation, remplacez la référence par la durée applicable.", sources: ["etpGuide"] },
    { q: "Quelle est la différence entre ETP et ETPT ?", a: "L’ETP décrit une quotité à une date : effectif physique × quotité. L’ETPT pondère la quotité par la période de présence dans l’année. Un poste à 100 % pendant six mois représente 1 ETP à la date où il est occupé, mais environ 0,5 ETPT sur l’année ; les absences et la capacité réellement planifiable se lisent à part.", sources: ["etpGuide"] },
    { q: "Où trouver les ETP disponibles dans un établissement ?", a: "Croisez les emplois autorisés, l’enveloppe ou le tableau des effectifs, le budget/EPRD ou document budgétaire équivalent, le tableau des postes RH, les contrats et quotités en paie, les vacances, absences et renforts. Les autorisations budgétaires, postes pourvus et capacité de travail présente sont des chiffres différents.", sources: ["etpGuide", "cnsaData"] },
    { q: "À quoi sert un DPI ou un DUI ?", a: "Le DPI organise le dossier et les processus de soins dans un établissement sanitaire. Le DUI rassemble les informations utiles à l’accompagnement, au projet personnalisé et à la coordination en ESSMS. Les fonctions et habilitations varient selon le produit et le contexte ; ce ne sont pas de simples dossiers bureautiques.", sources: ["ansDui", "ansSoftware"] },
    { q: "Quels logiciels numériques sont utilisés dans le secteur ?", a: "On rencontre des DPI, DUI, outils de prescription et pharmacie, planning, SIRH/paie, finance/EPRD, qualité/risques, admission/facturation, gestion documentaire, coordination et messagerie sécurisée. La page Logiciels explique les familles et donne quelques exemples repères, sans classement commercial.", sources: ["ansDui", "ansSoftware", "mssante", "viaTrajectoire"] },
    { q: "Comment choisir un logiciel de santé ou médico-social ?", a: "Partir des processus et des utilisateurs, vérifier les exigences de sécurité et d’hébergement, les habilitations, la traçabilité, l’interopérabilité, la reprise de données, la formation, le support, le coût complet et la réversibilité. Vérifier le référencement ou la conformité exigée pour le service visé.", sources: ["ansSoftware", "ansDui"] }
  ];

  const CONVENTIONS = [
    { name: "CCN 51 · FEHAP", idcc: "IDCC 29", scope: "Établissements privés à but non lucratif d’hospitalisation, de soins, de cure et de garde relevant de son champ.", watch: "Classifications, rémunérations, ancienneté, congés, temps de travail et avenants. Lire le texte consolidé et les accords applicables chez l’employeur.", source: "ccIdcc29" },
    { name: "CCN 66 · secteur handicap", idcc: "IDCC 413", scope: "Établissements et services pour personnes inadaptées et handicapées, selon le champ conventionnel de l’employeur.", watch: "La branche a connu des fusions de champ et des dispositions transitoires ; vérifier la situation juridique exacte, notamment après évolutions d’activité ou de gestionnaire.", source: "ccIdcc413" },
    { name: "Hospitalisation privée", idcc: "IDCC 2264", scope: "Entreprises privées entrant dans le champ de l’hospitalisation privée ; présence notamment dans des cliniques et certains EHPAD commerciaux.", watch: "Les annexes et accords peuvent différer selon l’activité. Vérifier le champ, les annexes et avenants en vigueur.", source: "ccIdcc2264" },
    { name: "Aide, accompagnement et soins à domicile", idcc: "IDCC 2941", scope: "Branche des organismes d’aide, d’accompagnement, de soins et de services à domicile relevant du champ de la convention.", watch: "Les temps de déplacement, amplitudes, plannings et classifications sont des sujets structurants ; consulter les avenants récents.", source: "ccIdcc2941" },
    { name: "Centres de lutte contre le cancer", idcc: "IDCC 2046", scope: "Centres de lutte contre le cancer régis par la convention propre à cette branche.", watch: "Convention spécialisée ; vérifier les évolutions et accords de branche avant toute comparaison de poste.", source: "ccIdcc2046" },
    { name: "Croix-Rouge française", idcc: "IDCC 5502", scope: "Salariés de la Croix-Rouge française dans ses établissements sanitaires, sociaux et médico-sociaux.", watch: "Lire les accords nationaux et d’établissement applicables au site ; les dispositions peuvent varier selon l’activité et le périmètre.", source: "ccIdcc5502" },
    { name: "Organismes de Sécurité sociale · cas ciblés", idcc: "IDCC 218", scope: "Des activités sanitaires ou médico-sociales gérées par des organismes de Sécurité sociale peuvent relever de cette convention ou de protocoles spécifiques.", watch: "Vérifier l’entité employeur, le transfert éventuel d’activité et les garanties conventionnelles maintenues.", source: "ccIdcc218" },
    { name: "Fonction publique hospitalière", idcc: "Statut public · pas d’IDCC privé", scope: "Agents des établissements publics relevant de la FPH : corps, grades et règles statutaires encadrent les emplois.", watch: "Ne pas transposer directement les règles d’une CCN privée. Vérifier statut, temps de travail, textes statutaires et accords collectifs applicables.", source: "publicServiceCode" }
  ];

  const SOFTWARES = [
    { group: "Dossier clinique", name: "DPI · dossier patient informatisé", what: "Dossier médical, observations, prescriptions, résultats, transmissions, mouvements et processus de soins à l’hôpital.", examples: "Exemples repères : ORBIS, DxCare ; l’offre et les modules varient selon les sites.", sources: ["orbis", "dxcare"] },
    { group: "Dossier d’accompagnement", name: "DUI · dossier usager informatisé", what: "Projet personnalisé, transmissions, évaluations, accompagnement, événements et informations de vie en ESSMS.", examples: "Exemple repère : NETSoins pour des établissements du grand âge ; de nombreux éditeurs proposent des DUI.", sources: ["ansDui", "netsoins"] },
    { group: "Soins et médicament", name: "Prescription, pharmacie et circuit du médicament", what: "Aide à la prescription, conciliation, préparation, dispensation et traçabilité de l’administration. Parfois intégré au DPI ou au DUI.", examples: "Le logiciel doit s’intégrer aux organisations et protocoles validés du site.", source: "ansSoftware" },
    { group: "Organisation des équipes", name: "Planning et gestion des temps", what: "Cycle de travail, roulements, remplacements, absences, compétences, astreintes, temps réalisés et exports vers la paie.", examples: "Vérifier les règles par métier, accord, repos, annualisation et circuit de validation.", source: "forfait" },
    { group: "Ressources humaines", name: "SIRH · paie · recrutement", what: "Dossier salarié, contrats, paie, formation, entretiens, recrutement, carrières, absences et tableaux d’effectifs.", examples: "L’outil RH ne remplace ni la convention collective, ni le contrôle humain des variables et habilitations.", source: "etpGuide" },
    { group: "Pilotage économique", name: "Comptabilité, ERP et budget", what: "Comptabilité, achats, engagements, suivi budgétaire, EPRD/ERRD, trésorerie, analytique et parfois facturation.", examples: "Contrôler la compatibilité avec le statut, le plan comptable et le cadre budgétaire de l’établissement.", source: "cnsaData" },
    { group: "Activité et recettes", name: "Admissions, facturation et PMSI", what: "Dossiers administratifs, mouvements, séjours, codage de l’activité sanitaire, facturation et télétransmission.", examples: "Le périmètre dépend du modèle de financement, du statut et des activités autorisées.", source: "hospital" },
    { group: "Qualité et risques", name: "Gestion qualité / événements / plans d’action", what: "Cartographie des risques, événements indésirables, réclamations, audits, plans d’action, preuves et préparation des évaluations.", examples: "Un logiciel aide à tracer et suivre ; il ne produit pas à lui seul une démarche qualité vécue.", source: "hasEsms" },
    { group: "Documents", name: "GED · gestion électronique documentaire", what: "Versions, validation, diffusion et archivage des procédures, formulaires, comptes rendus et documents maîtrisés.", examples: "Prévoir propriétaire, version en vigueur, accès, durée de conservation et archivage.", source: "project" },
    { group: "Orientation et parcours", name: "ViaTrajectoire et outils de coordination", what: "Service numérique d’orientation et d’admission vers des solutions sanitaires ou médico-sociales ; les modules disponibles varient par parcours et territoire.", examples: "ViaTrajectoire est un service national d’aide à l’orientation.", source: "viaTrajectoire" },
    { group: "Échanges sécurisés", name: "MSSanté · DMP · Mon espace santé", what: "Échanger des informations de santé par messagerie sécurisée et alimenter/consulter les services numériques nationaux selon les habilitations.", examples: "MSSanté sert à l’échange sécurisé ; ce n’est pas le dossier clinique ou usager de l’établissement.", source: "mssante" },
    { group: "Plateaux médico-techniques", name: "LIS · RIS · PACS", what: "LIS gère les flux de laboratoire, RIS ceux de radiologie et PACS l’archivage et l’accès aux images médicales.", examples: "Ces solutions échangent généralement avec le DPI et les équipements métiers.", source: "ansSoftware" },
    { group: "Suivi à distance", name: "Télésanté et télésuivi", what: "Téléconsultation, téléexpertise, télésurveillance ou suivi à distance selon les actes, les besoins, les règles et l’équipement.", examples: "À articuler avec le parcours de soins, l’information de la personne et la sécurité des données.", source: "hospital" },
    { group: "Données de pilotage", name: "BI · décisionnel et tableaux de bord", what: "Consolider des données d’activité, RH, qualité et finance pour suivre les tendances et éclairer les décisions.", examples: "Documenter chaque indicateur : définition, source, période, responsable et limites de comparaison.", source: "cnsaData" },
    { group: "Compétences", name: "LMS · gestion de la formation", what: "Catalogue, inscriptions, convocations, attestations, évaluations et suivi des habilitations ou formations obligatoires.", examples: "Relier le plan de développement des compétences aux risques, métiers et objectifs de l’établissement.", source: "etpGuide" }
  ];


  const QUALITY_TOOLS = [
    {
      id: "ageval",
      name: "AgEval",
      category: "Recueil et suivi des EI en ESSMS",
      editor: "ANAP (Outil institutionnel gratuit)",
      target: "Établissements et services médico-sociaux (ESSMS)",
      purpose: "Fournir un outil clé en main, sécurisé et gratuit pour déclarer, hiérarchiser par niveau de gravité, analyser et piloter les événements indésirables en secteur médico-social.",
      howItWorks: "1. Déclaration en ligne simplifiée par tout agent. 2. Qualification du niveau de gravité et typologie (chute, fugue, médicament, comportement, technique). 3. Désignation d'un référent d'analyse. 4. Construction et suivi du plan d'actions correctives. 5. Tableau de bord dynamique pour le COPIL Qualité et l'évaluation HAS.",
      strengths: [
        "Totalement gratuit, hébergé et maintenu par l'ANAP",
        "Conforme aux exigences du référentiel HAS pour les ESSMS",
        "Interface simple permettant l'appropriation par les équipes de terrain",
        "Édition instantanée de synthèses statistiques pour le rapport d'activité et le CVS"
      ],
      limits: [
        "Nécessite une démarche d'animation continue pour faire vivre la saisie",
        "Ne remplace pas la discussion humaine lors d'un REX",
        "Moins adapté aux plateaux médico-techniques lourds hospitaliers"
      ],
      link: "ageval",
      sources: ["ageval", "hasEsms"]
    },
    {
      id: "rex",
      name: "Méthode du REX (Retour d'Expérience)",
      category: "Analyse causale et amélioration continue",
      editor: "Méthodologie HAS / ANAP",
      target: "Sanitaire, Médico-social et Social",
      purpose: "Analyser collégialement un événement indésirable marquant ou récurrent afin de comprendre les défaillances systémiques sans rechercher de coupable, et sécuriser durablement l'organisation.",
      howItWorks: "Reconstitution chronologique minute par minute des faits, recherche des facteurs contributifs avec la grille ALARM (humain, organisation, communication, environnement, matériel), formalisation d'un plan d'actions correctives avec pilotes et échéances précises.",
      strengths: [
        "Développe une culture positive de sécurité et de confiance ('culture juste')",
        "Rapproche les équipes soignantes, éducatives et support",
        "Traite les causes racines plutôt que les symptômes de surface",
        "Critère valorisé lors des visites d'évaluation externe HAS"
      ],
      limits: [
        "Exige un animateur neutre et formé à la méthode",
        "Nécessite du temps dédié protégé pour les participants",
        "Risque d'échec si le management adopte une posture punitive"
      ],
      link: "rexHas",
      sources: ["rexHas", "crex", "rexEssms"]
    },
    {
      id: "crex",
      name: "CREX (Comité de Retour d'Expérience)",
      category: "Instance opérationnelle de sécurité",
      editor: "Organisation interne labellisée HAS",
      target: "Établissements sanitaires et grands complexes ESSMS",
      purpose: "Institutionnaliser l'analyse pluriprofessionnelle des événements indésirables à fréquence régulière (mensuelle) pour piloter l'amélioration continue de la sécurité.",
      howItWorks: "Comité permanent composé de la direction, du responsable qualité, de cadres soignants/éducatifs et d'invités métiers. Il passe en revue les fiches déclarées dans le mois, sélectionne 1 à 2 événements pour analyse approfondie et suit la mise en œuvre des plans d'action antérieurs.",
      strengths: [
        "Rythme régulier évitant l'empilement des fiches non traitées",
        "Vision transverse croisant médecine, soins, logistique et technique",
        "Légitimité forte pour faire appliquer les barrières de sécurité"
      ],
      limits: [
        "Risque de lourdeur bureaucratique sans pilotage agile",
        "Doit veiller à informer en retour les déclarants de terrain"
      ],
      link: "crex",
      sources: ["crex", "hasHealth", "hasEsms"]
    },
    {
      id: "rmm",
      name: "RMM (Revue de Mortalité et de Morbidité)",
      category: "Analyse médicale et soignante",
      editor: "HAS / Collèges de spécialités",
      target: "Établissements de santé (MCO, SMR, HAD, Psychiatrie) et EHPAD/MAS médicalisés",
      purpose: "Analyser de manière rétrospective, collégiale et confidentielle les décès inattendus ou les complications graves survenus lors de la prise en charge pour améliorer la sécurité des soins.",
      howItWorks: "Un groupe de pairs (médecins, pharmaciens, soignants) étudie un dossier patient anonymisé, compare la prise en charge aux recommandations de bonnes pratiques, identifie les vulnérabilités et décide d'ajustements thérapeutiques ou protocolaires.",
      strengths: [
        "Rigueur scientifique et médicale approfondie",
        "Impact direct sur la prescription, la surveillance clinique et les transmissions",
        "Protection du secret médical préservée"
      ],
      limits: [
        "Focalisé sur la dimension clinique, moins sur la vie sociale",
        "Exige une implication forte du corps médical"
      ],
      link: "hasHealth",
      sources: ["hasHealth", "crex"]
    },
    {
      id: "evaluation-has-essms",
      name: "Référentiel National d'Évaluation de la Qualité ESSMS",
      category: "Référentiel réglementaire opposable",
      editor: "Haute Autorité de Santé (HAS)",
      target: "Tous les ESSMS relevant de l'article L. 312-1 du CASF",
      purpose: "Évaluer tous les 5 ans le niveau de qualité délivré par l'établissement selon un cadre unique national centré sur la personne accompagnée.",
      howItWorks: "Structuré en 3 chapitres : Chapitre 1 (La personne au cœur de ses choix), Chapitre 2 (Les professionnels acteurs de la démarche), Chapitre 3 (L'établissement promoteur de l'amélioration continue). Comporte des critères impératifs (droit au refus, bientraitance, liberté d'aller et venir, sécurité du circuit médicamenteux). Visite par un organisme tiers accrédité COFRAC.",
      strengths: [
        "Référentiel unique mettant fin aux disparités historiques",
        "Focus majeur sur l'expression et l'autodétermination de la personne",
        "Résultats publics publiés sur la plateforme Qualiscope"
      ],
      limits: [
        "Préparation lourde exigeant une mobilisation transversale de 12 à 18 mois",
        "Cotations exigeantes nécessitant des preuves concrètes (traçabilité, entretiens)"
      ],
      link: "hasEsms",
      sources: ["hasEsms", "hasProcedure", "qualiscope"]
    },
    {
      id: "audit-patient-traceur",
      name: "Méthode du Patient Traceur / Accompagné Traceur",
      category: "Audit des pratiques réelles",
      editor: "HAS",
      target: "Sanitaire et Médico-social",
      purpose: "Évaluer la qualité réelle des soins et de l'accompagnement en suivant pas à pas le parcours d'une personne dans la structure, depuis son admission jusqu'au jour de l'évaluation.",
      howItWorks: "Entretien approfondi avec la personne accompagnée (et/ou ses proches), échange avec l'équipe pluridisciplinaire en charge de sa situation, et confrontation avec son dossier usager (DUI/DPI).",
      strengths: [
        "Vision hyper-concrète, humaine et contextualisée",
        "Permet de tester immédiatement l'application effective des procédures",
        "Favorise l'empathie et la remise en question bienveillante des soignants"
      ],
      limits: [
        "Échantillonnage réduit (quelques personnes seulement)",
        "Nécessite le consentement éclairé de la personne accompagnée"
      ],
      link: "hasEsms",
      sources: ["hasEsms", "hasHealth"]
    }
  ];

  const ADVERSE_EVENTS = {
    definition: "Un Événement Indésirable (EI) désigne tout incident, événement imprévu, dysfonctionnement ou écart par rapport aux pratiques attendues qui a causé, ou aurait pu causer (presque-accident), un dommage physique, psychologique ou matériel à une personne accompagnée, un soignant, un visiteur ou à l'établissement.",
    culture: "La pierre angulaire de la gestion des risques est la 'culture juste' : distinguer l'erreur humaine involontaire (qui relève de l'apprentissage et de l'analyse systémique) de la faute délibérée ou du manquement grave répété. Aucun professionnel ne doit craindre de déclarer un incident. Un établissement qui déclare de nombreux EI est un établissement vigilant et apprenant, non un mauvais établissement.",
    process: [
      "1. Sécuriser immédiatement la personne et les lieux (premiers secours, appel médecin/SAMU si besoin)",
      "2. Déclarer factuellement dans l'outil de signalement (AgEval, logiciel interne ou fiche papier)",
      "3. Classifier le niveau de gravité avec le cadre de service et le responsable qualité",
      "4. Déclencher les actions et déclarations adaptées (internes et externes si EIGS)",
      "5. Analyser les causes profondes en REX/CREX et suivre le plan d'actions d'amélioration"
    ],
    levels: [
      {
        level: 1,
        name: "Niveau 1 — Presque-accident & Signal faible (Near miss)",
        short: "Niveau 1 : Presque-accident",
        color: "mint",
        definition: "Incident survenu qui aurait pu entraîner un dommage mais qui a été intercepté à temps ou qui n'a produit aucune conséquence néfaste pour la personne.",
        whenToChoose: "Choisir ce niveau lorsqu'une anomalie s'est produite mais qu'aucune atteinte physique, psychologique ou matérielle n'est à déplorer.",
        examples: [
          "Erreur dans la préparation du pilulier détectée par l'infirmière avant administration au résident",
          "Produit nettoyant corrosif oublié ouvert dans un couloir mais refermé avant passage des usagers",
          "Porte coupe-feu maintenue ouverte par une cale, retirée lors de la ronde",
          "Rupture temporaire d'un consommable non critique rapidement réapprovisionné"
        ],
        consequences: [
          "Traçabilité dans AgEval ou registre des signaux faibles",
          "Action corrective immédiate de proximité par le déclarant ou son cadre",
          "Pas d'escalade urgente en direction ni de déclaration externe",
          "Agrégation statistique pour repérer des tendances et faiblesses organisationnelles latentes"
        ],
        leadRole: "Professionnel déclarant et cadre de proximité de service.",
        externalDeclaration: false
      },
      {
        level: 2,
        name: "Niveau 2 — Événement Indésirable Mineur ou Modéré",
        short: "Niveau 2 : Mineur / Modéré",
        color: "gold",
        definition: "Incident ayant entraîné un dommage léger, transitoire ou réversible, ne nécessitant pas de soins spécialisés lourds ni de transfert en urgence.",
        whenToChoose: "Choisir ce niveau dès lors qu'il y a une atteinte bénigne (ecchymose, plaie superficielle, retard de traitement sans séquelle, altercation verbale avec anxiété passagère).",
        examples: [
          "Chute de sa hauteur sans fracture avec hématome soigné sur place par l'infirmière",
          "Erreur de posologie ou oubli d'une prise médicamenteuse sans dégradation clinique après avis médical",
          "Fugue courte d'un résident désorienté retrouvé dans le parc de l'établissement sous 15 minutes",
          "Panne de chauffage dans une unité résolue en quelques heures avec mise à disposition de chauffages d'appoint"
        ],
        consequences: [
          "Prise en charge et surveillance de la personne par les soignants",
          "Information du médecin traitant ou coordonnateur et traçabilité au dossier usager (DUI/DPI)",
          "Information bienveillante des proches lors des transmissions",
          "Saisie dans AgEval et analyse rapide lors de la prochaine réunion d'équipe de service",
          "Mise à jour des protocoles ou barrières de prévention locales"
        ],
        leadRole: "Cadre de service, infirmier référent et responsable qualité.",
        externalDeclaration: false
      },
      {
        level: 3,
        name: "Niveau 3 — Événement Indésirable Majeur / Sévère",
        short: "Niveau 3 : Majeur / Sévère",
        color: "coral",
        definition: "Incident ayant entraîné un dommage physique ou psychologique sérieux, une hospitalisation non programmée, une mise en danger prolongée ou une perturbation lourde du service.",
        whenToChoose: "Choisir ce niveau en cas de lésion corporelle grave (fracture, brûlure), fugue prolongée avec intervention des forces de l'ordre, violence physique entre personnes ou agression du personnel.",
        examples: [
          "Chute avec fracture du col du fémur nécessitant transfert aux urgences et intervention chirurgicale",
          "Fausses routes sévères nécessitant manœuvre de Heimlich et oxygénothérapie",
          "Fugue de plusieurs heures de nuit avec battue gendarmerie",
          "Agression physique violente entre résidents avec plaies suturées",
          "Inondation majeure ou panne électrique affectant une unité entière d'hébergement"
        ],
        consequences: [
          "Prise en charge médicale d'urgence et sécurisation de la victime",
          "Alerte immédiate du cadre d'astreinte et du Directeur d'établissement",
          "Information formelle et accompagnement de la famille / représentant légal",
          "Accompagnement psychologique de la victime et des professionnels impliqués",
          "REX (Retour d'Expérience) obligatoire sous 15 jours animé par la qualité",
          "Information de l'autorité de tutelle (ARS / Département) selon la gravité et les protocoles locaux"
        ],
        leadRole: "Direction d'établissement, Cadre de santé, Responsable qualité et Médecin coordonnateur.",
        externalDeclaration: "Selon appréciation de l'autorité locale ou si évolution vers critères EIG."
      },
      {
        level: 4,
        name: "Niveau 4 — Événement Indésirable Grave (EIGS) / Critique / Décès inattendu",
        short: "Niveau 4 : EIGS / Critique",
        color: "red",
        definition: "Événement inattendu dont les conséquences sont le décès, la mise en jeu immédiate du pronostic vital, la perte définitive d'une fonction, un acte de maltraitance grave avéré ou une crise majeure menaçant la survie de la structure.",
        whenToChoose: "Choisir ce niveau impérativement lors de tout décès brutal non lié à l'évolution naturelle d'une pathologie terminale, tentative de suicide grave, viol, agression criminelle, incendie majeur ou épidémie foudroyante.",
        examples: [
          "Décès brutal inattendu d'un résident ou patient sans cause médicale évidente",
          "Tentative de suicide aboutie ou avec réanimation en soins intensifs",
          "Suspicion forte ou constatation de maltraitance physique ou sexuelle sur personne vulnérable",
          "Erreur grave d'administration médicamenteuse létale (choc anaphylactique, surdosage massif)",
          "Intoxication alimentaire collective grave (TIAC) touchant de multiples résidents fragiles",
          "Disparition prolongée avec issue fatale ou accidentelle tragique"
        ],
        consequences: [
          "1. Activation immédiate de la cellule de crise interne sous l'autorité du Directeur",
          "2. Information sans délai de la Direction Générale et de l'assureur responsabilité civile",
          "3. Signalement réglementaire obligatoire Volet 1 à l'ARS (portail e-SIN / signalement) sous 48h",
          "4. Signalement au Procureur de la République (article 40 CPP) si infraction ou mort suspecte",
          "5. Préservation absolue des éléments de preuve (locaux, piluliers, dossier médical scellé)",
          "6. Prise en charge médico-psychologique d'urgence pour la famille et l'équipe (cellule CUMP)",
          "7. Analyse approfondie des causes racines (méthode ALARM) sous 3 mois avec transmission du Volet 2 à l'ARS",
          "8. Préparation de la communication de crise (porte-parole unique, relations presse)"
        ],
        leadRole: "Directeur d'établissement, Direction Générale, Cellule de crise, Juriste et ARS.",
        externalDeclaration: true
      }
    ],
    externalReportingMatrix: [
      {
        authority: "ARS (Agence Régionale de Santé)",
        portal: "Portail des signalements (e-SIN pour le sanitaire / formulaire ARS)",
        scope: "Tout EIGS (sanitaire) et dysfonctionnement grave en ESSMS (art. L.331-8-1 CASF)",
        deadline: "Volet 1 sans délai (maximum 48h) ; Volet 2 (analyse causale ALARM) sous 3 mois",
        legalRef: "Art. R. 1413-67 et s. du CSP · Art. L. 331-8-1 du CASF"
      },
      {
        authority: "Conseil Départemental (Aide Sociale & Autonomie)",
        portal: "Direction de l'Autonomie / Protection de l'Enfance",
        scope: "Tout événement grave touchant un bénéficiaire de l'aide sociale, EHPAD, enfance, handicap",
        deadline: "Immédiat (téléphone puis fiche de signalement sous 24h à 48h)",
        legalRef: "Convention départementale et CASF"
      },
      {
        authority: "Procureur de la République / Parquet",
        portal: "Commissariat / Gendarmerie territoriale",
        scope: "Suspicion de crime, délit, violences volontaires, maltraitances, vol aggravé ou mort suspecte",
        deadline: "Immédiat dès constatation des faits",
        legalRef: "Article 40 alinéa 2 du Code de procédure pénale"
      },
      {
        authority: "ANSM (Agence Nationale de Sécurité du Médicament)",
        portal: "Vigilances sanitaires (matériovigilance, pharmacovigilance, réactovigilance)",
        scope: "Défaillance d'un dispositif médical, effet indésirable médicamenteux grave ou inattendu",
        deadline: "Immédiat pour les incidents graves (< 48h)",
        legalRef: "Code de la santé publique (vigilances)"
      },
      {
        authority: "Assureur de l'établissement (RC Institutionnelle)",
        portal: "Déclaration de sinistre / protection juridique",
        scope: "Tout événement susceptible de mettre en jeu la responsabilité civile ou pénale de la structure",
        deadline: "Sous 5 jours ouvrés suivant la connaissance du fait dommageable",
        legalRef: "Code des assurances"
      }
    ]
  };

  const SUPPORT_JOBS = [
    {
      id: "as-aes",
      name: "Aide-Soignant(e) (AS) / Accompagnant Éducatif et Social (AES/AMP)",
      family: "Soins de proximité & Accompagnement quotidien",
      orgaLevel: "Professionnel de terrain / Exécution soignante",
      placement: "Sous la responsabilité de l'Infirmier·ère (IDE/IDEC) et du Cadre de santé. Travail en binôme indissociable avec l'IDE.",
      reports: "Aucun encadrement hiérarchique. Tuteur·rice de stagiaires AS, AES ou élèves aides-soignants.",
      role: "Cœur battant du quotidien des résidents et patients : soins d'hygiène et de confort (toilettes, changes, prévention d'escarres), aide à la prise des repas et hydratation, surveillance des paramètres vitaux de base (température, pulsations, diurèse), stimulation de l'autonomie et observation clinique continue. Détecte les premiers signes de douleur, de repli ou de détresse psychologique.",
      interactions: {
        ide_soignants: "Binôme direct et permanent (art. R. 4311-4 CSP) : transmission en temps réel de toute anomalie cutanée (rougeur au sacrum), refus d'alimentation ou changement de comportement. Réalisation des soins de nursing délégués.",
        direction_cadre: "Remontée des besoins matériels (lève-personnes, gants, produits d'incontinence), alerte sur les situations d'épuisement ou de sous-effectif, participation active aux réunions de transmissions et au CVS.",
        educateurs: "Coordination quotidienne pour adapter les horaires de soins aux ateliers éducatifs, sorties et activités de vie sociale afin de ne pas enfermer la personne dans le seul statut de soigné.",
        paramedicaux: "Application scrupuleuse des plans de mobilisation kiné et ergothérapeutiques : utilisation des verticalisateurs, positionnement au fauteuil et respect des textures alimentaires prescrites par l'orthophoniste.",
        rh_compta: "Pointage des heures, déclaration des astreintes et dimanches/fériés, expression des souhaits de formation continue (AFGSU, bientraitance, gestes et postures PRAP).",
        usagers_familles: "Premier interlocuteur visuel des familles au quotidien : accueil bienveillant, écoute des angoisses et orientation vers l'IDE ou la direction pour les questions médicales ou administratives."
      },
      challenges: [
        "Pénibilité physique et charge émotionnelle face à la fin de vie, au grand âge ou au polyhandicap",
        "Prévention de l'usure professionnelle (TMS) et turn-over",
        "Maintenir une posture bientraitante même lors des périodes de tensions d'effectifs"
      ],
      tools: [
        "Dossier Usager Informatisé (DUI / NETSoins)",
        "Grilles d'observation de la douleur (Doloplus, Algoplus)",
        "Diagramme de soins",
        "Aides techniques de transfert (lève-personne, draps de glisse)"
      ],
      sources: ["hasEsms", "anap"]
    },
    {
      id: "ide-idec",
      name: "Infirmier(e) Diplômé(e) d'État (IDE) / Infirmier(e) Coordinateur(trice) (IDEC)",
      family: "Soins & Coordination clinique",
      orgaLevel: "Cadre technique / Coordination paramédicale",
      placement: "Sous la responsabilité du Cadre de santé, du Médecin Coordonnateur ou de la Direction. Coordonne le pôle soins.",
      reports: "Supervision fonctionnelle et coordination clinique des Aides-Soignant·e·s (AS), AES et élèves infirmiers.",
      role: "Garant·e de la sécurité et de la continuité des soins : évaluation clinique, dispensation et sécurisation du circuit du médicament (piluliers, semainiers), réalisation des pansements complexes, perfusions et injections. En tant qu'IDEC, organise les admissions de résidents, coordonne les intervenants libéraux (médecins traitants, kinés) et manage le planning soignant.",
      interactions: {
        direction_cadre: "Alerte immédiate en cas d'Événement Indésirable Grave (EIGS niveau 3/4), participation au CODIR élargi, gestion des protocoles sanitaires (épidémies de grippe, gastro, covid) et déclarations ARS.",
        as_aes: "Pilotage et encadrement du binôme soignant : attribution des tournées de soins, vérification des transmissions ciblées (DAR), accompagnement sur les gestes techniques et soutien moral.",
        direction_qualite: "Copilotage de la commission du médicament (COMEDIMS), gestion du circuit des stupéfiants, participation au CREX/REX sur les erreurs médicamenteuses et mise à jour du PAAQ.",
        paramedicaux_medecins: "Préparation des visites du médecin coordonnateur et des médecins traitants, suivi des bilans sanguins, concertation pluridisciplinaire sur les soins palliatifs et limitation de soins.",
        rh_compta: "Gestion des commandes de pharmacie et dispositifs médicaux (DMS), suivi des stocks avec la PUI, validation des fiches de présence soignante et gestion des remplacements urgents.",
        usagers_familles: "Explication pédagogique des traitements, recueil des directives anticipées et désignation de la personne de confiance, soutien lors des dégradations de santé."
      },
      challenges: [
        "Sécurisation absolue du circuit du médicament de la prescription à l'administration",
        "Coordination d'une multitude de médecins traitants libéraux aux pratiques hétérogènes",
        "Gestion du stress face aux urgences vitales et aux décisions de transfert hospitalier"
      ],
      tools: [
        "Logiciel de soins (DUI/DPI)",
        "Piluliers sécurisés & chariots de télémédecine",
        "Grilles d'évaluation GIR / PATHOS",
        "Protocole d'urgence & chariot d'urgence scellé"
      ],
      sources: ["hasHealth", "hasEsms", "anap"]
    },
    {
      id: "educateur-specialise",
      name: "Éducateur(trice) Spécialisé(e) (ES) / Moniteur-Éducateur (ME)",
      family: "Accompagnement socio-éducatif & Inclusion",
      orgaLevel: "Professionnel de terrain / Encadrement éducatif",
      placement: "Rattaché·e hiérarchiquement au Chef de service éducatif ou à la Direction de l'établissement.",
      reports: "Peut animer des groupes d'usagers et encadrer des stagiaires éducateurs ou services civiques.",
      role: "Accompagne les personnes accueillies (enfants, adultes en situation de handicap, publics en difficulté sociale) dans la construction et la réalisation de leur projet de vie. Favorise l'autonomie, l'expression citoyenne, la socialisation et l'insertion scolaire ou professionnelle. Anime des médiations éducatives (ateliers d'expression, sorties culturelles, gestion du budget, préparation à l'habitat autonome).",
      interactions: {
        direction_chef_service: "Rapports réguliers sur l'évolution des projets personnalisés, alertes sur les situations de fugue, de violence ou de décompensation, participation à la rédaction du projet d'établissement.",
        soignants_as_ide: "Concertation étroite pour concilier les soins nécessaires avec les activités éducatives, observation partagée des troubles du comportement et élaboration de stratégies d'apaisement.",
        paramedicaux_psy: "Travail en synergie avec le psychologue et le psychomotricien pour comprendre la dynamique psychique de l'usager et ajuster les médiations éducatives.",
        partenaires_exterieurs: "Lien permanent avec la MDPH (renouvellement des notifications), l'Aide Sociale à l'Enfance (ASE), les juges des enfants ou des tutelles, les mandataires judiciaires et les entreprises/ESAT.",
        rh_compta: "Demandes de budgets pédagogiques pour les sorties et séjours de vacances adaptés, justification des frais de régie.",
        usagers_familles: "Co-construction du projet personnalisé avec la personne accompagnée, médiation avec les parents ou représentants légaux, animation des séances du Conseil de la Vie Sociale (CVS)."
      },
      challenges: [
        "Trouver la juste distance éducative entre protection bienveillante et promotion de l'autonomie",
        "Gérer les troubles majeurs du comportement sans basculer dans la contrainte ou la contention",
        "Articuler les attentes institutionnelles avec les désirs réels de la personne accompagnée"
      ],
      tools: [
        "Dossier Unique de l'Usager (DUI)",
        "Trame de Projet Personnalisé (Loi 2002-2)",
        "Outils de communication alternative (PECS, Makaton)",
        "Grilles d'évaluation de l'autonomie"
      ],
      sources: ["hasEsms", "anap"]
    },
    {
      id: "paramedical-reeducateur",
      name: "Masseur-Kinésithérapeute / Ergothérapeute / Psychomotricien·ne",
      family: "Rééducation, Réadaptation & Autonomie",
      orgaLevel: "Professionnel paramédical expert",
      placement: "Rattaché·e au Cadre de santé ou à la Direction de l'établissement, en coordination avec l'équipe médicale.",
      reports: "Supervise les stagiaires de ses filières de rééducation.",
      role: "Maintient et développe les capacités motrices, sensorielles et cognitives des personnes accueillies. Le kiné prévient l'ankylose et traite les affections respiratoires/motrices. L'ergothérapeute évalue les besoins d'adaptation environnementale (fauteuils roulants sur-mesure, domotique, aménagement de chambre). Le psychomotricien harmonise le schéma corporel, les émotions et la motricité par la relaxation et le jeu.",
      interactions: {
        as_ide_soignants: "Formation des équipes de terrain aux gestes de manutention ergonomique, rédaction des fiches de positionnement au lit/fauteuil, choix des coussins anti-escarres.",
        direction_achats: "Prescription et choix des dispositifs médicaux et aides techniques lourdes (rails de transfert au plafond, fauteuils coquilles, lits médicalisés XXL), dossiers d'investissement CNR.",
        maintenance_securite: "Contrôles périodiques de conformité et réglages fins du matériel de rééducation et des aides à la marche.",
        educateurs: "Conseil sur l'ergonomie des postes d'ateliers et co-animation d'activités physiques adaptées (APA) ou de parcours sensoriels (Snoezelen).",
        medecin_coordonnateur: "Bilans de rééducation pour l'évaluation GIR/PATHOS, proposition de prescription d'aides techniques remboursées par l'Assurance Maladie.",
        usagers_familles: "Essais personnalisés d'aides à la posture, explication aux proches de l'utilisation du matériel pour les retours au domicile le week-end."
      },
      challenges: [
        "Éviter le découragement du patient face aux pathologies neurodégénératives évolutives",
        "Obtenir les financements adéquats (MDPH / Assurance Maladie) pour les aides techniques complexes",
        "Transmettre durablement les bonnes pratiques posturales aux équipes soignantes du quotidien"
      ],
      tools: [
        "Matériel de rééducation et mécanothérapie",
        "Espace Snoezelen (stimulation multi-sensorielle)",
        "Bilan ergothérapeutique d'autonomie",
        "Logiciel de suivi des dispositifs médicaux"
      ],
      sources: ["hasHealth", "hasEsms"]
    },
    {
      id: "responsable-rh",
      name: "Responsable des Ressources Humaines (RRH) / Gestionnaire du Personnel",
      family: "Administration, Gestion & Ressources Humaines",
      orgaLevel: "Cadre fonctionnel de direction",
      placement: "Rattaché·e directement au Directeur d'établissement ou à la Direction Générale de l'association gestionnaire.",
      reports: "Encadre les gestionnaires de paie, secrétaires RH et chargés de recrutement.",
      role: "Pilote l'ensemble de la politique sociale et RH : recrutement des personnels soignants, éducatifs et techniques, gestion administrative des contrats (CCN 51, CCN 66, FPH), élaboration de la paie, suivi des plannings et de l'absentéisme. Élabore le plan de développement des compétences, anime le dialogue social avec le CSE et veille à la santé/sécurité au travail (DUERP, QVCT).",
      interactions: {
        direction_generale: "Conseil juridique en droit du travail, gestion des procédures disciplinaires et contentieuses prud'homales, élaboration du bilan social et du tableau de bord RH.",
        cadres_sante_chefs_service: "Appui quotidien pour la gestion des remplacements d'urgence, arbitrage sur les dépassements d'horaires et plannings, organisation des entretiens professionnels annuels.",
        comptabilite_finance: "Transmission des éléments variables de paie, suivi de la masse salariale (compte 64), déclaration sociale nominative (DSN) et prévision budgétaire EPRD/BP.",
        soignants_educateurs_salaries: "Interlocuteur pour les questions de déroulement de carrière, congés parentaux, validation des acquis (VAE), formations et bilans de compétences.",
        organismes_externes: "Relations avec l'OPCO (financement des formations), la Médecine du Travail (SPSTI), la CARSAT (prévention des AT/MP) et France Travail.",
        instances_representants: "Préparation des réunions du CSE (Comité Social et Économique), négociations d'accords d'entreprise (temps de travail, égalité professionnelle)."
      },
      challenges: [
        "Fidéliser les compétences dans un contexte de pénurie nationale de soignants et d'éducateurs",
        "Maîtriser l'absentéisme et limiter le recours coûteux au travail temporaire (intérim)",
        "Concilier respect strict de la législation sociale avec l'impératif de continuité de service 24h/24 et 365j/an"
      ],
      tools: [
        "SIRH & Logiciel de gestion des temps et plannings (Octime, Chronos)",
        "Logiciel de paie hospitalier/médico-social",
        "Document Unique d'Évaluation des Risques (DUERP)",
        "Bilan Social & Tableau de bord RH ANAP"
      ],
      sources: ["anap", "dreesSecu", "plfss"]
    },
    {
      id: "responsable-comptable",
      name: "Responsable Comptabilité, Finances & Facturation",
      family: "Finances, Budget & Facturation",
      orgaLevel: "Cadre fonctionnel de gestion",
      placement: "Rattaché·e directement au Directeur d'établissement ou au Directeur Administratif et Financier (DAF).",
      reports: "Encadre les comptables, aides-comptables et gestionnaires de facturation usagers.",
      role: "Garant·e de la régularité des comptes et de la santé financière : tenue de la comptabilité générale et budgétaire (instructions budgétaires M22, M21 ou M14). Établit la facturation des forfaits soins, dépendance et hébergement, télétransmet les flux FIDES/B2 aux CPAM et Départements, gère les encaissements, la trésorerie et les relances d'impayés. Participe à l'élaboration de l'EPRD/ERRD et du Compte Administratif.",
      interactions: {
        direction_etablissement: "Suivi en temps réel de la trésorerie, alertes sur les dérives budgétaires, préparation des dialogues de gestion annuels avec l'ARS et le Conseil Départemental.",
        accueil_admissions: "Vérification des pièces de prise en charge (sécurité sociale, mutuelle, notification d'aide sociale ASH/APA/PCH) pour éviter les rejets de facturation.",
        responsable_rh: "Rapprochement et intégration des écritures de paie, paiement des salaires et cotisations URSSAF/caisses de retraite.",
        responsable_achats: "Rapprochement des bons de commande, bons de livraison et factures fournisseurs (triple concordance), mandatement dans les délais légaux (DGP).",
        tutelles_financeurs: "Échanges réguliers avec le trésorier public (comptable public), les contrôleurs de gestion de l'ARS et les inspecteurs du Conseil Départemental.",
        usagers_tuteurs: "Émission des factures de reste à charge, relations avec les mandataires judiciaires à la protection des majeurs (MJPM) et gestion bienveillante des difficultés de paiement."
      },
      challenges: [
        "Zéro rejet de facturation télétransmise FIDES pour sécuriser le fonds de roulement",
        "Maîtriser les délais de paiement fournisseurs pour éviter les pénalités et ruptures d'approvisionnement",
        "Assurer la transition vers les nouveaux cadres budgétaires (SERAFIN-PH, réforme de la tarification)"
      ],
      tools: [
        "Logiciel de comptabilité et gestion budgétaire M22/M21 (Berger-Levrault, Cegid)",
        "Plateforme Chorus Pro (facturation électronique)",
        "Télétransmission FIDES / NOEMIE",
        "Outils de suivi de trésorerie bancaire"
      ],
      sources: ["plfss", "anap", "cnsaSecu"]
    },
    {
      id: "controleur-gestion",
      name: "Contrôleur·euse de Gestion & Performance Médico-Sociale / Hospitalière",
      family: "Pilotage stratégique, Audit & Performance",
      orgaLevel: "Cadre expert / État-major",
      placement: "Rattaché·e directement au Directeur d'établissement, au DAF ou à la Direction Générale du groupe/association.",
      reports: "Pilote transverse sans encadrement direct, en appui méthodologique de tous les services.",
      role: "Transforme les données d'activité et de comptabilité en leviers d'aide à la décision : calcul des coûts de revient par pôle ou usager (comptabilité analytique, RTC - Retraitement Comptable), mesure de l'efficience médico-économique, suivi des indicateurs du Tableau de Bord ANAP et préparation des négociations pluriannuelles de CPOM.",
      interactions: {
        direction_generale: "Présentation des tableaux de bord mensuels, modélisation économique des projets d'extension ou de transformation de places (ex: passage de lits d'hébergement en accueil de jour).",
        responsable_comptable: "Croisement des balances comptables avec les unités d'œuvre pour déterminer les coûts complets par section tarifaire (hébergement, dépendance, soins).",
        responsable_rh: "Analyse fine des ratios d'encadrement (ETP/usager), du coût de l'absentéisme et de l'impact financier des mesures de revalorisation (Ségur).",
        rqgr_qualite: "Corrélation entre les démarches d'amélioration de la qualité et l'optimisation des ressources (diminution des gaspillages, baisse de la sinistralité).",
        medecin_dim: "En sanitaire, analyse du case-mix PMSI, des durées moyennes de séjour (DMS) et de la valorisation T2A par groupe homogène de malades (GHM).",
        autorites_ars_cd: "Production des données médico-économiques réglementaires transmises sur les plateformes nationales (TdB ANAP, Platines, RTC)."
      },
      challenges: [
        "Donner du sens aux chiffres pour mobiliser les cadres soignants et éducatifs sans discours purement gestionnaire",
        "Anticiper l'impact des réformes tarifaires (tarification modulée, dotation globale) sur l'équilibre pérenne de la structure",
        "Fiabiliser la chaîne de collecte des données brutes issues des logiciels métiers"
      ],
      tools: [
        "Tableau de bord de la performance médico-sociale (ANAP)",
        "Logiciel d'analyse décisionnelle (Business Intelligence / PowerBI)",
        "Outils de Retraitement Comptable (RTC)",
        "Tableurs financiers avancés & modélisations prévisionnelles"
      ],
      sources: ["anap", "plfss", "hasEsms"]
    },
    {
      id: "responsable-achats",
      name: "Responsable des Achats, Approvisionnements & Économat",
      family: "Logistique, Achats & Approvisionnements",
      orgaLevel: "Cadre logistique / Support",
      placement: "Rattaché·e à la Direction Adjointe, au DAF ou à la Direction des Services Économiques.",
      reports: "Encadre les magasiniers, gestionnaires de stocks et agents d'économat.",
      role: "Garant·e de la disponibilité continue de l'ensemble des fournitures nécessaires au fonctionnement : dispositifs médicaux (gants, seringues, changes complets), papeterie, produits d'entretien hôtelier et denrées alimentaires. Négocie les tarifs, passe les marchés publics ou consultations privées et mutualise avec les centrales d'achat (UniHA, RESAH, CAIH). Veille à la politique d'achats durables (loi EGAlim).",
      interactions: {
        direction_etablissement: "Validation de la politique d'achats, respect des seuils de passation des marchés et optimisation des gains d'achats.",
        soignants_ide_as: "Recueil des besoins qualitatifs terrain, organisation de tests d'échantillons (confort des changes, tolérance des gants) avant signature de contrats pluriannuels.",
        gouvernante_cuisine: "Approvisionnement des produits alimentaires en circuits courts (loi EGAlim 50% de produits durables dont 20% bio) et des produits de bionettoyage normés.",
        comptabilite: "Transmission des bons de commande visés, traitement des litiges de facturation et respect des délais de paiement.",
        fournisseurs_prestataires: "Négociation des conditions commerciales, suivi des pénalités de retard et gestion des ruptures d'approvisionnement.",
        maintenance_securite: "Achats d'équipements de protection individuelle (EPI) et outillage technique normé."
      },
      challenges: [
        "Zéro rupture sur les produits critiques (médicaments, oxygène, produits d'incontinence)",
        "Concilier impératif d'économies budgétaires avec le confort et la dignité des personnes accueillies",
        "Intégrer les critères RSE et décarbonation dans les grilles de sélection des fournisseurs"
      ],
      tools: [
        "Logiciel de gestion des approvisionnements et stocks",
        "Centrales d'achat hospitalières (UniHA, RESAH)",
        "Baromètres d'achats responsables",
        "Inventaires par code-barres / RFID"
      ],
      sources: ["anap", "hasHealth"]
    }
,
    {
      id: "gouvernante",
      name: "Gouvernante / Responsable hôtelier·ère",
      family: "Hôtellerie, Hébergement & Cadre de vie",
      orgaLevel: "Encadrement de proximité / Maîtrise",
      placement: "Sous l'autorité hiérarchique directe du Directeur ou de l'Adjoint de direction. Membre clé du management de proximité.",
      reports: "Encadre directement les Agents de Service Hôtelier (ASH/ASR), les lingères et le personnel de restauration collective.",
      role: "Garante de la qualité du cadre de vie quotidien, de l'hygiène des locaux et de la bientraitance environnementale des personnes hébergées. Pilote le bionettoyage des chambres et parties communes, la gestion du linge (norme RABC), l'organisation du service des repas, la décoration et l'accueil hôtelier. Coordonne les prestataires extérieurs (blanchisserie, société de nettoyage, 3D dératisation/désinsectisation).",
      interactions: {
        direction: "Rend compte de l'état de propreté et de maintenance des locaux, des réclamations hôtelières des familles, de l'absentéisme des ASH et des besoins en fournitures.",
        soignants_educateurs: "Coordonne quotidiennement les horaires de ménage en chambre avec les heures de soins, toilettes et activités pour préserver le rythme des résidents. Reçoit les alertes soignantes sur les contaminations (gale, covid, clostridium) pour déclencher les protocoles d'isolement septique.",
        qualite_risques: "Participe activement à la commission des menus, aux audits d'hygiène, au plan de maîtrise sanitaire (HACCP) et à la prévention des chutes (sols glissants, encombrement).",
        maintenance: "Signale sans délai les anomalies techniques relevées en chambre (fuite d'eau, ampoule grillée, barre d'appui descellée, dysfonctionnement de volet roulant ou de lit médicalisé).",
        usagers_familles: "Interlocutrice privilégiée pour les questions de confort en chambre, de propreté du linge personnel, de régimes et goûts alimentaires. Contribue au bien-être moral des résidents."
      },
      challenges: [
        "Fidéliser et motiver une équipe d'ASH souvent exposée à la pénibilité physique et au turn-over",
        "Articuler l'exigence d'hygiène hospitalière avec la préservation d'un lieu de vie chaleureux et intime",
        "Gérer les tensions de plannings lors des absences imprévues du personnel hôtelier"
      ],
      tools: ["Plan de bionettoyage", "Fiches techniques produits", "Planning hôtelier", "Logiciel de gestion du linge (puces RFID)", "Cahier de liaison hôtelier/soignant"],
      sources: ["hasEsms", "anap"]
    },
    {
      id: "asr",
      name: "Agent de Service Hôtelier (ASH) / ASR",
      family: "Hôtellerie, Hébergement & Cadre de vie",
      orgaLevel: "Professionnel de terrain / Exécution qualifiée",
      placement: "Sous l'autorité directe de la Gouvernante ou du Chef de service hôtelier / cadre de proximité selon la structure.",
      reports: "Pas de management direct d'équipe. Travail en binôme ou en autonomie sur un secteur défini.",
      role: "Assure au quotidien le bionettoyage des chambres, sanitaires et espaces communs selon des protocoles stricts de décontamination. Assure la distribution des repas, la mise en place de la salle à manger, l'aide au service et le débarrassage dans le respect des règles d'hygiène (marche en avant). Entretient le linge et participe à la réfection des lits. Joue un rôle fondamental de sentinelle bienveillante auprès des résidents isolés.",
      interactions: {
        direction: "Relais essentiel de l'image de marque et de la chaleur humaine de l'établissement auprès des résidents et visiteurs.",
        soignants_educateurs: "Échange permanent et informel lors des passages en chambre : signale immédiatement tout changement de comportement, refus de s'alimenter, plainte de douleur ou risque de chute.",
        gouvernante: "Reçoit les fiches de tâches, signale les ruptures de produits ou les pannes de matériel d'entretien (chariot, autolaveuse, aspirateur).",
        logistique: "Réceptionne les dotations hebdomadaires de produits d'entretien et de consommables hôteliers."
      },
      challenges: [
        "Pénibilité physique (gestes répétitifs, manutention, port de charges, stations debout prolongées)",
        "Gestion de la relation émotionnelle avec des résidents vulnérables ou désorientés",
        "Respect rigoureux des règles d'hygiène sans déshumaniser la chambre qui est le domicile de la personne"
      ],
      tools: ["Chariot de bionettoyage double seau", "Bandeaux microfibres imprégnés", "Fiches de traçabilité d'émargement ménage", "EPI (gants, blouses, tabliers)"],
      sources: ["hasEsms", "anap"]
    },
    {
      id: "asl",
      name: "Agent de Service Logistique (ASL) / Magasinier",
      family: "Logistique & Approvisionnements",
      orgaLevel: "Professionnel de terrain / Support opérationnel",
      placement: "Sous l'autorité hiérarchique du Responsable logistique ou de l'Adjoint de direction.",
      reports: "Pas de subordination directe. Peut guider des livreurs externes ou des stagiaires.",
      role: "Gère la réception physique des marchandises sur le quai de livraison : contrôle des bons de livraison, vérification de l'intégrité des colis et de la température des denrées fraîches (chaîne du froid). Trie, étiquette, range et stocke dans les magasins centraux. Assure la préparation des commandes internes et la distribution dans les étages/unités (produits d'incontinence, gants, papeterie, produits d'entretien, linge propre). Participe à l'évacuation des filières de déchets (OM et DASRI).",
      interactions: {
        direction: "Alerte sur les retards de livraison stratégiques ou les avaries de transporteurs.",
        soignants: "Livre les dotations régulières dans les réserves de soins selon le planning convenu, évite les ruptures de dispositifs médicaux indispensables.",
        gouvernante_ash: "Approvisionne les réserves d'étage en produits d'entretien, sacs poubelle, papier hygiénique et linge plat.",
        maintenance: "Coordonne l'utilisation des engins de levage, transpalettes, monte-charges et bennes de tri des déchets."
      },
      challenges: [
        "Optimisation de l'espace de stockage et gestion des dates limites d'utilisation (FIFO / premier entré premier sorti)",
        "Sécurité des manutentions et prévention des troubles musculosquelettiques (TMS)",
        "Rigueur dans l'émargement des flux pour éviter les écarts d'inventaire"
      ],
      tools: ["Transpalette électrique/manuel", "Logiciel de gestion de stocks", "Scanner codes-barres", "Thermomètre sonde pour chaîne du froid", "Chariots roll grillagés"],
      sources: ["anap"]
    },
    {
      id: "maintenance",
      name: "Équipe de Maintenance / Services Techniques & Biomédical",
      family: "Technique, Sécurité des biens & Biomédical",
      orgaLevel: "Technicien supérieur / Agent de maîtrise technique",
      placement: "Sous l'autorité directe du Responsable des services techniques ou du Directeur d'établissement.",
      reports: "Ouvriers de maintenance, techniciens spécialisés (électriciens, plombiers) et supervision des prestataires sous contrat.",
      role: "Garant du maintien en état opérationnel et sécuritaire du bâti, des réseaux (électricité, eau, gaz, CVC/chauffage-ventilation, désenfumage), des équipements de confort et du matériel médicalisé (lits électriques, verticalisateurs, rails plafonniers, fauteuils roulants). Assure les dépannages d'urgence et la maintenance préventive planifiée. Tient à jour le registre de sécurité incendie, prépare les commissions de sécurité ERP, gère les contrôles périodiques obligatoires (ascenseurs, légionnelle, électricité, extincteurs) et participe aux astreintes techniques 24/7.",
      interactions: {
        direction: "Conseille sur les programmes de travaux, le Plan Pluriannuel d'Investissement (PPI), le bilan énergétique et les dossiers d'autorisation de travaux en mairie/préfecture.",
        soignants_educateurs: "Intervient dans les chambres en prévenant les équipes pour limiter la gêne des résidents. Répare sans délai les équipements indispensables au confort et à la sécurité du résident.",
        qualite_risques: "Participe activement à la mise à jour du DUERP (risques chimiques, électriques, machines), suit les non-conformités des bureaux de contrôle (Apave, Bureau Veritas) et gère les vigilances techniques/matériovigilance.",
        si: "Coopère sur les passages de câbles réseau, la climatisation des baies informatiques, l'alimentation secourue (onduleurs, groupe électrogène) et le système d'appel malade."
      },
      challenges: [
        "Arbitrer en permanence entre l'urgence des pannes quotidiennes et la réalisation de la maintenance préventive",
        "Maîtriser une réglementation ERP sanitaire/médico-sociale extrêmement dense et contraignante",
        "Assurer la continuité d'énergie vitale en cas de coupure réseau (test régulier du groupe électrogène)"
      ],
      tools: ["GMAO", "Registre de sécurité incendie", "Plans de recollement du bâtiment (DOE)", "Appareils de mesure électrique/température", "Outillage technique professionnel"],
      sources: ["anap", "duerp", "project"]
    },
    {
      id: "logistique",
      name: "Responsable Logistique, Achats & Approvisionnements",
      family: "Logistique & Approvisionnements",
      orgaLevel: "Cadre fonctionnel / Encadrement intermédiaire",
      placement: "Rattaché à la Direction de l'établissement ou à la Direction Administrative et Financière (DAF).",
      reports: "Encadre les agents logistiques (ASL), les chauffeurs, les magasiniers et parfois les équipes de restauration/blanchisserie internalisées.",
      role: "Définit et pilote la chaîne d'approvisionnement globale (Supply Chain) de l'établissement. Rédige les cahiers des charges d'achats, consulte les fournisseurs, négocie les tarifs (ou passe par des centrales d'achat comme l'UGAP, le Resah ou UniHA). Suit l'exécution des contrats de sous-traitance (restauration collective, blanchisserie industrielle, élimination des DASRI). Supervise la flotte automobile et les transports des résidents/usagers. Optimise les coûts d'exploitation hôtelière et logistique.",
      interactions: {
        direction_finances: "Présente les prévisions de dépenses d'achats pour l'EPRD, contrôle le service fait avant paiement des factures, propose des plans de réduction des coûts éco-responsables.",
        soignants_gouvernante: "Définit avec eux les standards de qualité des produits (tests d'échantillons de protections, choix des textures repas, ergonomie du mobilier de chambre).",
        maintenance: "Partage la gestion des contrats de maintenance multitechnique et l'achat des pièces détachées.",
        qualite: "Met en place la traçabilité des filières de déchets, le tri sélectif et veille au respect de la réglementation sur les transports adaptés de personnes vulnérables."
      },
      challenges: [
        "Éviter absolument toute rupture de stock sur les produits critiques (nutritions, pansements, protections)",
        "Concilier contraintes budgétaires strictes et maintien d'un haut niveau qualitatif perçu par les usagers",
        "Développer une politique d'achats durables (RSE, circuits courts alimentaires, réduction du plastique jetable)"
      ],
      tools: ["Logiciel ERP / Achats", "Tableaux de bord d'approvisionnement", "Portails centrales d'achat (Resah, UGAP, UniHA)", "Plan de gestion des déchets"],
      sources: ["anap", "cnsaFunding"]
    },
    {
      id: "si",
      name: "Équipe SI / Responsable des Systèmes d'Information (DSI de proximité)",
      family: "Systèmes d'Information & Transformation Numérique",
      orgaLevel: "Cadre fonctionnel / Expert technique transverse",
      placement: "Sous l'autorité directe de la Direction Générale ou de la Direction d'établissement (ou rattaché à la DSI du groupement associatif/GHT).",
      reports: "Techniciens support informatique, administrateurs réseau/système et référents applicatifs métiers.",
      role: "Garantit la disponibilité, la sécurité, l'intégrité et la conformité du système d'information de santé. Administre le parc d'ordinateurs, tablettes soignantes, serveurs et infrastructure réseau (Wi-Fi professionnel sécurisé, fibre). Pilote le déploiement et la maintenance du Dossier Patient/Usager Informatisé (DPI/DUI) conforme Ségur. Gère les habilitations d'accès selon les profils professionnels (matricule RPPS, carte CPS/CPF). Protège les données de santé contre les cyberattaques (politique PSSI, sauvegardes externalisées HDS). Assure le support utilisateur et la formation aux nouveaux outils.",
      interactions: {
        direction: "Élabore le schéma directeur des systèmes d'information (SDSI), alerte sur les risques cyber et la conformité RGPD, chiffre les investissements numériques éligibles aux financements Ségur/ARS.",
        soignants_educateurs: "Paramètre les modules cliniques et éducatifs du DUI/DPI (dossier de soins, transmissions ciblées, projet personnalisé, plans de soins), assiste les équipes sur les pannes logicielles d'urgence.",
        qualite_risques: "Fournit les extractions de données pour les indicateurs qualité, veille à la traçabilité des modifications dans les dossiers usagers et sécurise le canal de déclaration numérique des EI.",
        maintenance: "Coordonne la gestion des locaux techniques climatisés, le câblage baie de brassage, la téléphonie IP et les systèmes d'appel malade interconnectés."
      },
      challenges: [
        "Sécuriser l'établissement face à la menace croissante des ransomwares ciblant les structures de santé",
        "Accompagner la conduite du changement auprès de professionnels réticents à la dématérialisation",
        "Maintenir l'interopérabilité avec les plateformes nationales (Mon Espace Santé, DMP, MSSanté, INS)"
      ],
      tools: ["Console d'administration réseau/firewall", "Logiciel DPI/DUI Ségur", "Gestionnaire de tickets d'assistance (Helpdesk)", "Outils de sauvegarde chiffrée HDS", "Annuaire d'identités (Active Directory)"],
      sources: ["ansDui", "ansSoftware", "segurNum", "cnil"]
    },
    {
      id: "qualite",
      name: "Équipe Qualité, Gestion des Risques & Relations Usagers",
      family: "Qualité, Risques & Droits des Usagers",
      orgaLevel: "Cadre fonctionnel / Expertise méthodologique transverse",
      placement: "Directement rattaché(e) à la Direction d'établissement ou à une Direction Qualité de pôle. Positionnement d'état-major sans autorité hiérarchique directe sur les soignants mais avec mandat fort de contrôle et d'appui.",
      reports: "Chargé·e·s de mission qualité, alternants qualité et réseau de 'correspondants qualité' désignés dans chaque unité.",
      role: "Insuffle et structure la démarche d'amélioration continue et la culture de sécurité. Administre la Gestion Électronique des Documents (GED) pour garantir la validité des procédures et protocoles en vigueur. Centralise, catégorise et exploite les déclarations d'événements indésirables (sur AgEval ou outil dédié). Organise et anime les REX, CREX et revues de pertinence. Pilote l'auto-évaluation interne et coordonne la visite d'évaluation externe HAS ou de certification. Mesure la satisfaction des usagers (enquêtes, recueil des plaintes et réclamations, lien avec le CVS ou la CDU). Tient à jour la cartographie des risques et le plan d'actions d'amélioration global (PAAQ).",
      interactions: {
        direction: "Fournit les indicateurs de pilotage qualité, prépare les revues de direction, alerte immédiatement sur les EIGS et prépare les bilans pour l'ARS et le Conseil Départemental.",
        cadres_proximite: "Accompagne les cadres dans la résolution des dysfonctionnements de terrain, forme les nouveaux arrivants aux protocoles d'hygiène et de sécurité, co-anime les retours d'expérience.",
        equipes_terrain: "Dédramatise le signalement d'erreurs, valorise les réussites et les bonnes pratiques, recueille les idées d'amélioration issues du travail réel.",
        usagers_familles_cvs: "Participe aux séances du CVS/CDU pour présenter les résultats des enquêtes de satisfaction, instruit les réclamations et veille au respect effectif des droits des usagers (loi 2002-2)."
      },
      challenges: [
        "Éviter que la qualité ne soit perçue comme une contrainte administrative déconnectée du soin ou de l'éducatif",
        "Faire vivre le plan d'amélioration continue entre deux échéances d'évaluation externe HAS",
        "Maintenir une culture de transparence et de non-culpabilisation lors de l'analyse des incidents graves"
      ],
      tools: ["AgEval (ANAP)", "Logiciel de GED", "Tableau de bord qualité (indicateurs IQSS)", "Grille d'analyse causale ALARM / 5M", "Questionnaires de satisfaction usagers"],
      sources: ["hasEsms", "hasHealth", "ageval", "rexHas"]
    },
    {
      id: "guichet-unique",
      name: "Guichet Unique / Bureau des Admissions & Régulation",
      family: "Coordination, Admissions & Parcours Territoriaux",
      orgaLevel: "Cadre de proximité / Coordinateur médico-social",
      placement: "Sous l'autorité de la Direction d'établissement ou de la Direction du Pôle territorial. Interface stratégique entre l'externe et l'interne.",
      reports: "Chargés d'admission, secrétaires médicales, assistants de régulation de parcours.",
      role: "Dans les associations et établissements gérant plusieurs dispositifs (ex. Pôle Autonomie : EHPAD + Accueil de jour + SSIAD + Résidence autonomie ; ou Pôle Enfance : IME + SESSAD + DITEP + UEMA), le guichet unique constitue la porte d'entrée centralisée pour les usagers, leurs familles et les prescripteurs. Réceptionne et instruit l'ensemble des demandes d'admission (notamment via ViaTrajectoire). Analyse la recevabilité au regard des autorisations administratives. Gère la liste d'attente centralisée. Organise la commission pluridisciplinaire d'admission. Coordonne les passerelles internes entre dispositifs pour éviter toute rupture de prise en charge et fluidifier les parcours selon l'évolution de la personne.",
      interactions: {
        direction: "Rend compte des flux de demandes, du taux d'occupation prévisionnel, des durées moyennes d'attente et des tensions territoriales de prise en charge pour adapter l'offre.",
        cadres_medecins_poles: "Transmet les dossiers de candidature complets pour avis médical et pluridisciplinaire d'admissibilité ; planifie les visites de pré-admission et les séjours temporaires.",
        usagers_aidants: "Premier contact humain : accueille, informe, écoute l'histoire de vie, rassure les familles angoissées, explique les modalités de fonctionnement et fait visiter les lieux.",
        partenaires_externes: "Lien quotidien avec les prescripteurs hospitaliers (assistants sociaux de MCO/SMR), les commissions de la MDPH/CDAPH, les DAC, les CPTS et les services sociaux départementaux."
      },
      challenges: [
        "Gérer avec empathie et diplomatie la détresse de familles confrontées à des délais d'attente incompressibles",
        "Articuler l'exigence d'un taux d'occupation à 100 % avec la compatibilité humaine et clinique des profils admis",
        "Éviter les ruptures de parcours lors de la transition d'un dispositif à un autre au sein du même gestionnaire"
      ],
      tools: ["ViaTrajectoire", "Logiciel de gestion des dossiers d'admission", "Tableau de bord de suivi capacitaire", "Grille multidimensionnelle d'admissibilité", "Dossier de pré-admission type"],
      sources: ["viaTrajectoire", "casf", "mdph"]
    }
  ];


  const AUDIT_GUIDE = {
    definition: "L'audit qualité est une évaluation méthodique, documentée et indépendante permettant de mesurer objectivement l'écart entre une pratique réelle observée sur le terrain et un référentiel attendu (norme, procédure, recommandation de bonnes pratiques HAS, texte de loi). C'est un instrument d'apprentissage et de prévention, non un contrôle de police.",
    purpose: [
      "Mesurer objectivement la conformité des pratiques réelles au regard des protocoles validés",
      "Identifier les risques latents et les vulnérabilités avant qu'un incident indésirable ne se produise",
      "Apporter les preuves tangibles exigées lors des visites d'évaluation externe HAS et de certification",
      "Valoriser le professionnalisme des équipes de terrain en objectivant leurs réussites",
      "Guider les arbitrages budgétaires et les plans de formation continue du dirigeant"
    ],
    typology: [
      {
        type: "Audit Patient / Accompagné Traceur (HAS)",
        target: "L'usager et l'équipe pluridisciplinaire qui l'accompagne au quotidien.",
        when: "En continu ou lors de la préparation intensive de l'évaluation externe HAS.",
        scope: "Prend le parcours réel d'un résident/patient depuis son entrée : entretien avec lui (et ses proches s'il le souhaite), échange avec les professionnels en charge de sa situation, et vérification de la cohérence de son dossier (DUI/DPI).",
        actors: "Binôme auditeur (cadre + responsable qualité), professionnel référent, personne accompagnée.",
        keyQuestions: "La personne a-t-elle été associée à son projet personnalisé ? Ses choix sont-ils respectés ? La douleur est-elle tracée et soulagée ?"
      },
      {
        type: "Audit de Pratiques Cliniques (APC)",
        target: "Les soignants (infirmiers, aides-soignants, rééducateurs) dans leurs gestes techniques.",
        when: "Recrudescence d'infections nosocomiales, d'escarres, d'erreurs médicamenteuses ou audit annuel planifié.",
        scope: "Observation directe in situ de 20 à 30 situations de soins réelles selon une grille standardisée (ex. friction hydro-alcoolique, réfection de pansement, préparation du pilulier).",
        actors: "Infirmier référent hygiène, IDEC ou cadre de santé.",
        keyQuestions: "Les 5 temps de l'hygiène des mains sont-ils respectés ? Le pilulier est-il vérifié avant administration ? Les règles d'asepsie sont-elles tenues ?"
      },
      {
        type: "Audit Documentaire / Dossier Usager (DUI/DPI)",
        target: "Les dossiers administratifs, médicaux et d'accompagnement informatisés.",
        when: "Chaque trimestre ou avant la révision du contrat de séjour et du CPOM.",
        scope: "Vérification sur un échantillon tiré au sort de 20 à 50 dossiers : présence des 7 outils loi 2002-2, signature du contrat de séjour, réévaluation annuelle du projet personnalisé, désignation de la personne de confiance.",
        actors: "Responsable qualité, chef de service éducatif ou soignant.",
        keyQuestions: "Le projet personnalisé a-t-il été réévalué sous 12 mois ? Les transmissions ciblées respectent-elles le format DAR ? La personne de confiance est-elle identifiée ?"
      },
      {
        type: "Audit Croisé Inter-Services",
        target: "Deux unités d'un même établissement ou deux établissements d'un même groupement.",
        when: "Semestriel pour briser la routine et l'auto-complaisance.",
        scope: "L'Unité A audite l'Unité B sur un thème précis (ex. gestion des stocks de pharmacie, propreté des locaux, accueil des nouveaux résidents).",
        actors: "Binôme de deux professionnels d'un autre service avec une check-list standardisée.",
        keyQuestions: "Le regard neuf permet-il de repérer des habitudes déviantes invisibles pour l'équipe du lieu ?"
      },
      {
        type: "Audit Flash (15 minutes)",
        target: "Un point de sécurité ultra-spécifique de l'environnement de soins ou hôtelier.",
        when: "Hebdomadaire ou mensuel par le cadre de proximité.",
        scope: "Contrôle rapide de 5 critères fermés : chariot d'urgence scellé, dates de péremption des crèmes et bandelettes, fermeture à clé des réserves de produits toxiques.",
        actors: "Cadre de proximité ou gouvernante.",
        keyQuestions: "Les 5 points critiques sont-ils 100 % conformes aujourd'hui ?"
      },
      {
        type: "Audit Environnement & Sécurité Bâtimentaire",
        target: "L'infrastructure, le matériel hôtelier et les installations techniques.",
        when: "Annuel pour le DUERP, la commission de sécurité ERP et le plan de prévention.",
        scope: "Vérification des issues de secours, extincteurs, éclairages d'évacuation, conformité des lits médicalisés et rails de transfert.",
        actors: "Directeur d'établissement, responsable technique/maintenance et référent sécurité incendie.",
        keyQuestions: "Le registre de sécurité est-il à jour ? Les portes coupe-feu fonctionnent-elles librement sans cale ?"
      }
    ],
    steps: [
      {
        step: 1,
        title: "1. Cadrage & Rédaction de la grille d'audit",
        detail: "Définir l'objectif précis de l'audit. Choisir le référentiel opposable (recommandation HAS, protocole interne validé, texte légal). Rédiger une grille simple comprenant 10 à 25 critères observables avec des modalités de réponse exclusives : Conforme (C) / Non-Conforme (NC) / Non-Applicable (NA)."
      },
      {
        step: 2,
        title: "2. Information et adhésion des équipes",
        detail: "Annoncer l'audit lors des réunions d'équipe au moins 10 jours avant. Expliquer la finalité d'amélioration et sanctuariser l'absence de sanction individuelle. Partager la grille pour que les équipes sachent exactement ce qui sera observé."
      },
      {
        step: 3,
        title: "3. Recueil des données sur le terrain",
        detail: "L'auditeur observe les situations de travail réel, examine les dossiers ou échange avec les professionnels et usagers. Il note les faits bruts sans jugement de valeur, consigne les justifications données par les équipes et relève les points positifs."
      },
      {
        step: 4,
        title: "4. Calcul des écarts et restitution à chaud",
        detail: "Calculer le taux de conformité global (Nombre de C / (Nombre de C + NC) x 100). Identifier les critères critiques à 0 % de conformité. Organiser une restitution de 15 minutes le jour même pour partager les constats en toute transparence."
      },
      {
        step: 5,
        title: "5. Plan d'actions correctives (PAC) & Ré-audit",
        detail: "Bâtir avec les professionnels les actions pour corriger les écarts (formation, modification du matériel, réécriture d'un protocole ambigu). Désigner un pilote et une date de fin pour chaque action. Inscrire le ré-audit à 3 ou 6 mois pour mesurer l'efficacité réelle."
      }
    ],
    successFactors: [
      "Toujours valoriser les points forts et réussites avant d'aborder les non-conformités",
      "Ne jamais transformer l'audit en outil de notation individuelle ou de contrôle disciplinaire",
      "Garantir des grilles d'audit courtes, claires et directement compréhensibles sans jargon",
      "Toujours associer les soignants et éducateurs à la recherche des solutions correctives"
    ]
  };

  const REX_GUIDE = {
    definition: "Le Retour d'Expérience (REX) est une démarche méthodologique collective et structurée visant à analyser en profondeur un événement indésirable (incident, presque-accident, défaillance organisationnelle) ou une situation de crise pour en identifier les causes systémiques sous-jacentes et définir des barrières de sécurité préventives. Son principe fondamental repose sur la conviction que l'erreur est inhérente à l'activité humaine et qu'elle constitue la source d'apprentissage organisationnel la plus riche.",
    interest: [
      "Comprendre le 'comment' et le 'pourquoi' d'un dysfonctionnement au lieu de chercher un coupable individuel",
      "Fédérer l'équipe pluriprofessionnelle autour d'un dialogue ouvert et dépassionné après un choc émotionnel",
      "Identifier les facteurs latents d'organisation (sous-effectif, défaut de formation, matériel vétuste, protocoles ambigus)",
      "Bâtir des actions correctives concrètes, réalistes et partagées qui évitent la répétition du même événement",
      "Répondre aux exigences réglementaires et de certification HAS (gestion des risques a posteriori)",
      "Créer une mémoire collective des bonnes pratiques et de la vigilance partagée"
    ],
    preconditions: [
      "Sécurité psychologique garantie : engagement formel de la direction qu'aucune sanction disciplinaire ne découlera des déclarations faites en séance de REX",
      "Neutralité bienveillante de l'animateur : ne pas porter de jugement moral, modérer la parole avec équité",
      "Présence des acteurs réels de terrain : les personnes qui étaient sur place au moment des faits détiennent la réalité du travail ('travail réel' vs 'travail prescrit')",
      "Temporalité adaptée : ni 'à chaud' (émotions brutes, sidération), ni trop tard (oubli des détails, reconstruction a posteriori). Le délai idéal se situe entre 7 et 21 jours après l'événement.",
      "Confidentialité des échanges : le compte rendu diffusé est rigoureusement anonymisé."
    ],
    steps: [
      {
        step: 1,
        title: "1. Sélection et cadrage de l'événement",
        detail: "Le COPIL qualité ou le directeur retient un événement méritant analyse (EI de niveau 2 récurrent, niveau 3 ou niveau 4). L'animateur rédige une note de cadrage rappelant l'objectif d'apprentissage et convoque les participants."
      },
      {
        step: 2,
        title: "2. Reconstitution factuelle de la chronologie",
        detail: "Lors de la réunion, l'animateur trace sur paperboard ou écran une frise chronologique précise des événements (qui a fait quoi, quand, où, avec quel matériel). Seuls les faits observables et vérifiables sont notés, sans interprétation ni adjectifs qualificatifs."
      },
      {
        step: 3,
        title: "3. Identification des facteurs contributifs (Méthode ALARM / 5M)",
        detail: "Pour chaque écart chronologique, le groupe questionne les causes profondes à travers la grille ALARM : facteurs liés au patient/résident (pathologie, anxiété), aux soignants (fatigue, compétence, remplacement), à l'équipe (communication, transmissions), aux tâches (protocole flou), au matériel (panne, non-conformité), à l'environnement de travail (bruit, nuit, surcharge) et au contexte institutionnel (budget, politique de recrutement)."
      },
      {
        step: 4,
        title: "4. Élaboration du plan d'actions correctives SMART",
        detail: "Le groupe conçoit des barrières préventives ciblées. Chaque action doit être Spécifique, Mesurable, Atteignable, Réaliste et Temporellement définie. Un pilote nommément désigné est responsable de sa mise en œuvre, avec un budget ou des moyens identifiés."
      },
      {
        step: 5,
        title: "5. Rédaction et restitution du compte rendu",
        detail: "L'animateur formalise une fiche REX synthétique en 2 pages (Contexte, Chronologie, Causes racines, Plan d'actions). Le document anonymisé est validé par les participants puis transmis à la Direction et partagé aux équipes lors des relèves ou réunions de service."
      },
      {
        step: 6,
        title: "6. Suivi des barrières et évaluation de l'efficacité",
        detail: "À 3 mois et 6 mois, le COPIL Qualité examine si les actions ont bien été déployées sur le terrain et si elles ont effectivement empêché la survenue d'incidents similaires."
      }
    ],
    who: {
      animateur: "Un cadre méthodologique formé et neutre vis-à-vis de l'événement : Responsable qualité, Directeur adjoint ou cadre d'un autre pôle/service.",
      participantsDirects: "Tous les professionnels en poste au moment des faits : aide-soignant, infirmier, éducateur, veilleur de nuit, agent de service hôtelier (ASH).",
      cadreProximite: "Le chef de service ou cadre de santé de l'unité concernée pour garantir la continuité managériale.",
      expertsPonctuels: "Selon la typologie de l'événement : Médecin coordonnateur (si erreur médicamenteuse), Pharmacien PUI, Responsable technique/maintenance (si panne matérielle), Responsable SI (si défaillance logicielle).",
      direction: "Le Directeur ou Directeur adjoint assiste à la restitution pour arbitrer et allouer les budgets ou effectifs requis par le plan d'actions."
    },
    formats: [
      {
        name: "REX Flash / Relève ciblée",
        duration: "20 à 30 minutes",
        target: "Presque-accident ou incident mineur de niveau 1-2 nécessitant un ajustement immédiat en équipe.",
        animation: "Cadre de proximité lors des transmissions de relève."
      },
      {
        name: "REX Standard d'Équipe",
        duration: "1h30 à 2h00",
        target: "Événement indésirable marquant de niveau 2 récurrent ou niveau 3 sans engagement pronostic vital.",
        animation: "Responsable qualité en séance dédiée avec les professionnels concernés."
      },
      {
        name: "CREX Institutionnel",
        duration: "2h00 (périodicité mensuelle)",
        target: "Comité permanent passant en revue l'ensemble des déclarations du mois et approfondissant 1 à 2 dossiers complexes.",
        animation: "Binôme Directeur adjoint / Responsable qualité."
      },
      {
        name: "RMM (Revue de Mortalité et Morbidité)",
        duration: "2h00 à 3h00",
        target: "Décès inattendu ou complication clinique majeure en établissement de santé ou secteur médicalisé.",
        animation: "Médecin coordonnateur / Médecin spécialiste et méthodologue qualité."
      }
    ],
    pitfalls: [
      "Dérive punitive ou culpabilisante : chercher 'qui a fait la faute' au lieu de 'pourquoi le système n'a pas protégé le professionnel'. Cela tue définitivement toute remontée future.",
      "Plan d'actions 'fourre-tout' ou irréaliste : empiler 15 actions impossibles à financer au lieu de 2 ou 3 barrières solides et mesurables.",
      "Oublier d'informer les déclarants en retour : si le soignant déclare mais ne voit jamais le résultat de son signalement, il cesse de déclarer.",
      "Banaliser les signaux faibles : attendre l'accident grave de niveau 4 avant de programmer un REX alors que les alertes de niveau 1 se répétaient depuis des mois."
    ]
  };

  const HEALTH_POLICY = {
    lastUpdate: "Novembre 2026",
    vision: "Le management en santé et médico-social ne peut s'exercer en vase clos. Chaque décision de recrutement, chaque arbitrage budgétaire d'EPRD et chaque évolution du projet d'établissement dépend directement des textes législatifs nationaux, des orientations régionales de l'ARS et des schémas départementaux.",
    nationalLaws: [
      {
        id: "loi-2002-2",
        title: "Loi n° 2002-2 du 2 janvier 2002",
        subtitle: "Rénovation de l'action sociale et médico-sociale",
        year: 2002,
        status: "Texte socle fondamental toujours en vigueur",
        scope: "Ensemble du secteur médico-social et social (art. L. 311-3 et s. CASF)",
        summary: "Place l'usager au cœur du dispositif en affirmant ses droits fondamentaux : respect de la dignité, intégrité, intimité, sécurité, droit à un accompagnement individualisé et consentement éclairé. Elle rend obligatoires 7 outils opérationnels majeurs dans tous les ESSMS.",
        toolsCreated: ["Livret d'accueil", "Charte des droits et libertés de la personne accueillie", "Contrat de séjour ou Document individuel de prise en charge (DIPC)", "Règlement de fonctionnement", "Projet d'établissement ou de service (durée max 5 ans)", "Conseil de la Vie Sociale (CVS) ou autre forme de participation", "Recours à une personne qualifiée"],
        managerImpact: "Le dirigeant est légalement garant de la conformité de ces 7 outils. Leur absence ou non-respect constitue une faute engageant la responsabilité de l'établissement lors des contrôles administratifs et de l'évaluation externe HAS.",
        sources: ["loi2002", "casfRights", "project", "cvs"]
      },
      {
        id: "loi-2005-102",
        title: "Loi n° 2005-102 du 11 février 2005",
        subtitle: "Pour l'égalité des droits et des chances, la participation et la citoyenneté des personnes handicapées",
        year: 2005,
        status: "Texte fondamental handicap en vigueur",
        scope: "Handicap, éducation, emploi, accessibilité universelle",
        summary: "Définit le handicap dans toute sa dimension sociétale et consacre le droit à compensation des conséquences du handicap. Crée les Maisons Départementales des Personnes Handicapées (MDPH) et la Commission des Droits et de l'Autonomie (CDAPH). Pose l'obligation de scolarisation en milieu ordinaire et renforce l'obligation d'emploi (OETH à 6 %).",
        toolsCreated: ["MDPH / CDAPH", "Prestation de Compensation du Handicap (PCH)", "Projet Personnalisé de Scolarisation (PPS)", "Reconnaissance de la Qualité de Travailleur Handicapé (RQTH)"],
        managerImpact: "Oriente toute la transformation de l'offre médico-sociale vers l'inclusion, l'autodétermination, le virage vers le milieu ordinaire (classes externalisées d'IME, passerelles ESAT vers entreprise) et le respect des notifications CDAPH.",
        sources: ["loi2005", "mdph"]
      },
      {
        id: "loi-hpst-2009",
        title: "Loi HPST du 21 juillet 2009",
        subtitle: "Hôpital, Patients, Santé et Territoires",
        year: 2009,
        status: "Organisation administrative socle",
        scope: "Gouvernance sanitaire, décloisonnement et régulation",
        summary: "Crée les Agences Régionales de Santé (ARS) regroupant les compétences sanitaires et médico-sociales de l'État et de l'Assurance Maladie. Réforme la gouvernance hospitalière en renforçant le pouvoir managérial du Directeur d'hôpital, crée les régimes de contractualisation CPOM et introduit les premières coopérations territoriales.",
        toolsCreated: ["Création des ARS", "Projet Régional de Santé (PRS)", "Directoire et Conseil de Surveillance à l'hôpital", "Régime d'autorisation par appel à projets"],
        managerImpact: "L'ARS devient l'interlocuteur unique de tutelle, de tarification et de contrôle pour les volets sanitaires et médico-sociaux.",
        sources: ["ars", "hospital", "prs"]
      },
      {
        id: "loi-asv-2015",
        title: "Loi ASV du 28 décembre 2015",
        subtitle: "Adaptation de la Société au Vieillissement",
        year: 2015,
        status: "En vigueur",
        scope: "Grand âge, domicile, EHPAD, aidants",
        summary: "Anticipe la transition démographique en valorisant le maintien à domicile. Réforme l'Allocation Personnalisée d'Autonomie (APA), consacre le droit au répit pour les proches aidants, transforme les foyers-logements en Résidences Autonomie avec forfait autonomie, et généralise la contractualisation pluriannuelle (CPOM) obligatoire pour les EHPAD.",
        toolsCreated: ["Forfait autonomie", "Statut et droit au répit des aidants", "Généralisation des CPOM obligatoires en EHPAD", "Conseil Départemental de la Citoyenneté et de l'Autonomie (CDCA)"],
        managerImpact: "Passage généralisé du budget annuel négocié au contrat pluriannuel d'objectifs et de moyens (CPOM) adossé à l'EPRD.",
        sources: ["loi2015", "cnsaFunding", "cnsa"]
      },
      {
        id: "loi-sante-2016",
        title: "Loi de Modernisation de notre Système de Santé du 26 janvier 2016",
        subtitle: "Groupements Hospitaliers et Sécurité Sanitaire",
        year: 2016,
        status: "En vigueur",
        scope: "Sanitaire, hôpital public, soins primaires",
        summary: "Crée obligatoirement les Groupements Hospitaliers de Territoire (GHT) pour mutualiser les fonctions support (SI, achats, DIM, pharmacie PUI) entre hôpitaux publics. Met en place les Communautés Professionnelles Territoriales de Santé (CPTS). Institue l'obligation légale de signalement externe des Événements Indésirables Graves associés aux soins (EIGS) à l'ARS.",
        toolsCreated: ["GHT (Groupements Hospitaliers de Territoire)", "CPTS (Communautés Professionnelles Territoriales de Santé)", "Déclaration réglementaire des EIGS (portail e-SIN)"],
        managerImpact: "Intégration des fonctions support hospitalières à l'échelle du groupement territorial ; mise en place impérative d'un circuit de signalement des EIGS conforme à la réglementation.",
        sources: ["loi2016sante", "hospital", "signalement"]
      },
      {
        id: "segur-sante-2020",
        title: "Ségur de la Santé (2020) & Ségur du Numérique (2021-2026)",
        subtitle: "Revalorisations des carrières et virage numérique en santé",
        year: 2020,
        status: "En cours de déploiement opérationnel",
        scope: "Sanitaire, médico-social et ambulatoire",
        summary: "Accords historiques prévoyant une revalorisation salariale massive des soignants et personnels non médicaux (+183 € nets/mois CTI/Ségur étendu par les accords Laforcade). Investissement historique de plusieurs milliards d'euros pour moderniser le parc hospitalier et accélérer le numérique en santé via l'obligation d'installer des logiciels référencés Ségur (DPI/DUI) connectés à Mon Espace Santé et au DMP.",
        toolsCreated: ["Complément de Traitement Indiciaire (CTI Ségur)", "Financements d'équipements numériques à l'usage (programme SONS)", "Identité Nationale de Santé (INS obligatoire)", "Messagerie sécurisée MSSanté"],
        managerImpact: "Gestion des disparités salariales complexes (périmètres d'application du Ségur/Laforcade selon les fiches de poste) et mise en conformité informatique obligatoire sous peine de pénalités financières.",
        sources: ["segurNum", "pns", "ansDui"]
      },
      {
        id: "lfss-2022-sad",
        title: "LFSS 2022 & Réforme des Services Autonomie à Domicile (SAD)",
        subtitle: "Unification de l'aide et du soin à domicile",
        year: 2022,
        status: "En cours de transformation",
        scope: "Domicile, SSIAD, SAAD, SPASAD",
        summary: "Fusionne les anciens SSIAD (soins infirmiers) et SAAD (aide à la personne) en une catégorie juridique unique : les Services Autonomie à Domicile (SAD). Instaure un tarif plancher national pour les heures d'APA et de PCH, assorti d'une dotation complémentaire pour la qualité et la solvabilisation des interventions complexes.",
        toolsCreated: ["Cahier des charges unique des SAD (mixte aide et soin ou aide seule)", "Tarif plancher horaire APA/PCH", "Dotation qualité et valorisation des astreintes"],
        managerImpact: "Rapprochement obligatoire des équipes soignantes et des aides à domicile, refonte complète des plannings, des logiciels métiers et révision des autorisations conjointes ARS / Conseil Départemental.",
        sources: ["loi2022", "cnsaFunding", "cnsaData"]
      },
      {
        id: "loi-bien-vieillir-2024",
        title: "Loi n° 2024-317 du 8 avril 2024",
        subtitle: "Mesures pour bâtir la société du bien vieillir et de l'autonomie",
        year: 2024,
        status: "Législation récente en cours d'application",
        scope: "EHPAD, domicile, protection des résidents, contrôle",
        summary: "Renforce drastiquement la prévention et la lutte contre les maltraitances envers les personnes vulnérables (obligation de signalement, contrôle renforcé des antécédents professionnels). Crée le Service Public Départemental de l'Autonomie (SPDA) pour simplifier le parcours des usagers. Garantit un droit de visite quotidien inconditionnel en EHPAD pour les proches, même en période d'épidémie. Facilite l'accueil des animaux de compagnie en établissement pour personnes âgées.",
        toolsCreated: ["Service Public Départemental de l'Autonomie (SPDA)", "Droit de visite inconditionnel opposable", "Circuit national unifié de recueil des maltraitances", "Contrôles inopinés systématiques des EHPAD"],
        managerImpact: "Refonte impérative des règlements de fonctionnement (droit de visite, animaux), tolérance zéro sur la maltraitance avec traçabilité immédiate, préparation des équipes aux contrôles inopinés conjoints ARS/CD.",
        sources: ["loi2024autonomie", "casfRights", "casf"]
      },
      {
        id: "strategie-tnd-2023",
        title: "Stratégie Nationale pour les Troubles du Neurodéveloppement (2023-2027)",
        subtitle: "Autisme, DYS, TDAH, TDI",
        year: 2023,
        status: "Priorité nationale en cours d'exécution",
        scope: "Enfance, handicap, scolarisation",
        summary: "Renforce le repérage et le diagnostic précoce dès la petite enfance via le déploiement généralisé des Plateformes de Coordination et d'Orientation (PCO 0-6 ans et 7-12 ans). Développe l'école pour tous à travers la multiplication des Unités d'Enseignement Maternelle (UEMA) et Élémentaire (UEEA) autisme, et soutient l'habitat inclusif pour les adultes.",
        toolsCreated: ["Plateformes de Coordination et d'Orientation (PCO)", "Unités d'Enseignement Autisme (UEMA / UEEA)", "Forfait d'intervention précoce remboursé"],
        managerImpact: "Déploiement de dispositifs 'hors les murs', accompagnement précoce en milieu ordinaire et adaptation des pratiques des professionnels d'IME/SESSAD vers les recommandations HAS de bonnes pratiques TND.",
        sources: ["inclureTransition", "mdph"]
      },
      {
        id: "feuille-route-psy-2026",
        title: "Feuille de Route Santé Mentale et Psychiatrie",
        subtitle: "Décloisonnement, réhabilitation et respect des droits",
        year: 2021,
        status: "Orientations stratégiques prioritaires",
        scope: "Santé mentale, psychiatrie adulte et infanto-juvénile",
        summary: "Vise à réinvestir la psychiatrie de secteur, désengorger les urgences par la création d'équipes mobiles de crise et de CMP renforcés, développer la pair-aidance et le modèle de rétablissement, et encadrer très strictement le recours à l'isolement et à la contention mécanique (contrôle du juge des libertés et de la détention JLD).",
        toolsCreated: ["Projets Territoriaux de Santé Mentale (PTSM)", "Registre obligatoire d'isolement et de contention", "Numéro national de prévention du suicide (3114)"],
        managerImpact: "Réduction drastique des mesures d'isolement et de contention, traçabilité juridique renforcée au registre, création de passerelles avec les structures médico-sociales (SAMSAH psy, GEM, foyers).",
        sources: ["stratPsy", "hospital"]
      }
    ],
    regionalFramework: {
      title: "Le Cadre Régional : Le Projet Régional de Santé (PRS 3 de l'ARS)",
      description: "Chaque Agence Régionale de Santé arrête son PRS pour une durée de 5 ans. Il constitue la feuille de route opposable de la politique de santé dans la région.",
      components: [
        {
          name: "Cadre Stratégique Régional (CSR)",
          role: "Fixe les grandes priorités à 10 ans pour l'amélioration de l'état de santé de la population régionale et la réduction des inégalités territoriales."
        },
        {
          name: "Schéma Régional de Santé (SRS)",
          role: "Planifie l'offre de soins et médico-sociale, détermine les implantations géographiques autorisées, les quotas de places et les objectifs quantifiés d'offre."
        },
        {
          name: "Programme Régional d'Accès à la Prévention et aux Soins (PRAPS)",
          role: "Cible spécifiquement les personnes en situation de grande précarité, d'exclusion ou d'isolement territorial pour garantir l'accès aux droits et aux soins."
        }
      ],
      managerAction: "Tout gestionnaire préparant un projet d'établissement, une extension de places ou une négociation de CPOM doit impérativement citer les fiches actions correspondantes du PRS de son ARS régionale pour légitimer sa demande de dotation budgétaire.",
      sources: ["prs", "ars"]
    },
    departmentalFramework: {
      title: "Le Cadre Départemental : Les Politiques de Solidarité et d'Autonomie",
      description: "Le Conseil Départemental est la collectivité chef de file de l'action sociale (aide sociale légale, protection de l'enfance, autonomie des personnes âgées et personnes en situation de handicap).",
      components: [
        {
          name: "Schéma Départemental de l'Autonomie (ou de l'Organisation Sociale et Médico-Sociale)",
          role: "Fixe les priorités locales de création et de transformation des places d'EHPAD, Résidences Autonomie, SAD, FAM et Foyers de vie."
        },
        {
          name: "Schéma Départemental de Protection de l'Enfance et de la Famille",
          role: "Régit l'accueil et le placement des mineurs confiés à l'Aide Sociale à l'Enfance (ASE), l'agrément des MECS et le soutien à la parentalité."
        },
        {
          name: "Tarification et Habilitation à l'Aide Sociale",
          role: "Le Président du Conseil Départemental fixe par arrêté le prix de journée hébergement et la dotation dépendance des établissements habilités."
        }
      ],
      sources: ["casf", "departement"]
    },
    managerSummaryGrid: [
      { level: "National (Lois & Décrets)", authority: "Parlement · Ministère · CNSA · HAS", impact: "Fixe les droits des personnes, les normes d'encadrement, les référentiels qualité et les règles budgétaires (EPRD)." },
      { level: "Régional (PRS & Dotations)", authority: "ARS (Agence Régionale de Santé)", impact: "Délivre les autorisations d'exercer, alloue les dotations soins, pilote les CPOM conjoints et contrôle la sécurité des soins (EIGS)." },
      { level: "Départemental (Schémas & Tarifs)", authority: "Conseil Départemental", impact: "Tarifie le prix de journée hébergement/dépendance, habilite à l'aide sociale, gère l'APA/PCH et oriente via la MDPH." },
      { level: "Territorial de proximité", authority: "CPTS · DAC · Communautés 360", impact: "Mutualise les interventions complexes, évite les ruptures de parcours et soutient les professionnels de terrain." }
    ]
  };

  const SAMPLE_PEERS = [
    {
      id: "peer-mas-direction",
      name: "Alexandre D.",
      email: "alexandre.mes@alumni-sante.fr",
      role: "Adjoint·e de direction",
      region: "Île-de-France",
      sector: "Médico-social · handicap",
      experience: "Gestion des EI & AgEval, Retours d'expérience (REX / CREX), Gouvernance des métiers support",
      experiences: [
        "Gestion des EI & AgEval",
        "Retours d'expérience (REX / CREX)",
        "Gouvernance des métiers support (Hôtellerie, Logistique, SI)"
      ],
      summary: "Alternance de 2 ans puis adjoint en MAS (48 places polyhandicap). Déploiement d'AgEval pour structurer le recueil des 120 fiches d'événements annuels, animation mensuelle du CREX avec l'IDEC et le médecin, et refonte du protocole d'astreinte de direction.",
      consent: true,
      linkedin: "https://www.linkedin.com/in/alexandre-d-mes",
      addedAt: "20/11/2026"
    },
    {
      id: "peer-ehpad-has",
      name: "Camille M.",
      email: "camille.m@alumni-sante.fr",
      role: "Responsable qualité / risques",
      region: "Auvergne-Rhône-Alpes",
      sector: "Médico-social · grand âge",
      experience: "Qualité HAS & Évaluation ESSMS, Droits des personnes & prévention maltraitance, Projet personnalisé",
      experiences: [
        "Qualité HAS & Évaluation ESSMS",
        "Droits des personnes & prévention maltraitance",
        "Projet personnalisé & autodétermination"
      ],
      summary: "Pilotage complet de l'évaluation externe HAS dans un EHPAD de 80 résidents avec PASA. Préparation des entretiens 'accompagné traceur', formation des équipes soignantes et ASH aux critères impératifs, et présentation des résultats au CVS et en conseil d'administration.",
      consent: true,
      linkedin: "https://www.linkedin.com/in/camille-m-qualite",
      addedAt: "19/11/2026"
    },
    {
      id: "peer-ime-cpom",
      name: "Julien B.",
      email: "j.bouvet@alumni-sante.fr",
      role: "Directeur·rice",
      region: "Hauts-de-France",
      sector: "Enfance et jeunesse (IME, SESSAD, ITEP)",
      experience: "Négociation de CPOM & autorisations, Budget, EPRD & contrôle de gestion, Enfance et jeunesse",
      experiences: [
        "Négociation de CPOM & autorisations",
        "Budget, EPRD & contrôle de gestion",
        "Enfance et jeunesse (IME, SESSAD, ITEP)"
      ],
      summary: "Négociation et renouvellement du CPOM d'un pôle enfance (IME 60 lits + SESSAD 30 places + UEMA) auprès de l'ARS et du CD. Transformation de 15 places d'internat en places modulables d'accompagnement précoce.",
      consent: true,
      addedAt: "18/11/2026"
    },
    {
      id: "peer-had-rh",
      name: "Sophie T.",
      email: "sophie.t@alumni-sante.fr",
      role: "Responsable RH / organisation",
      region: "Occitanie",
      sector: "Sanitaire (MCO, SMR, HAD, Psychiatrie)",
      experience: "RH, planning & continuité 24/7, Santé au travail, DUERP & QVCT, Instances & dialogue social",
      experiences: [
        "RH, planning & continuité 24/7",
        "Santé au travail, DUERP & QVCT",
        "Instances & dialogue social (CVS, CSE, CME, CDU)"
      ],
      summary: "Responsable RH dans une structure d'Hospitalisation à Domicile (HAD) de 120 patients. Réorganisation des roulements de 45 soignants, mise en place d'un vivier de remplaçants internes et réduction du recours à l'intérim de 35 % sur 18 mois.",
      consent: true,
      addedAt: "17/11/2026"
    },
    {
      id: "peer-multi-guichet",
      name: "Mehdi K.",
      email: "mehdi.k@alumni-sante.fr",
      role: "Chef·fe de projet / chargé·e de mission",
      region: "Grand Est",
      sector: "Médico-social · handicap",
      experience: "Guichet unique & multi-dispositifs, Transformation numérique, Ségur & DUI/DPI, Coordination territoriale",
      experiences: [
        "Guichet unique & multi-dispositifs",
        "Transformation numérique, Ségur & DUI/DPI",
        "Coordination territoriale & CPTS"
      ],
      summary: "Mise en place d'un guichet unique d'admission mutualisé pour une association gérant 1 MAS, 2 FAM et un SAMSAH. Réduction des délais d'instruction de 45 jours à 12 jours et interface fluide avec ViaTrajectoire et la MDPH.",
      consent: true,
      addedAt: "16/11/2026"
    },
    {
      id: "peer-chu-rex",
      name: "Dr Hélène L.",
      email: "h.laurent@chu-alumni.fr",
      role: "Responsable qualité / risques",
      region: "Nouvelle-Aquitaine",
      sector: "Sanitaire (MCO, SMR, HAD, Psychiatrie)",
      experience: "Retours d'expérience (REX / CREX), Gestion de crise, PCA & sécurité incendie, Sanitaire",
      experiences: [
        "Retours d'expérience (REX / CREX)",
        "Gestion de crise, PCA & sécurité incendie",
        "Sanitaire (MCO, SMR, HAD, Psychiatrie)"
      ],
      summary: "Animation de plus de 40 REX et RMM en pôle chirurgical et urgences. Formation des cadres de santé à l'investigation des causes racines par la méthode ALARM et mise en conformité des signalements EIGS sur e-SIN.",
      consent: true,
      addedAt: "15/11/2026"
    }
  ];

  const MAP_NODES = [
    { id: "personne", label: "Personne\naccompagnée", type: "Participation", x: 435, y: 250 },
    { id: "direction", label: "Direction", type: "Gouvernance", x: 435, y: 385 },
    { id: "equipes", label: "Équipes &\ncadres", type: "Métiers", x: 195, y: 390 },
    { id: "cvscse", label: "CVS · CSE", type: "Instances", x: 190, y: 235 },
    { id: "projet", label: "Projet\nd’établissement", type: "Documents", x: 670, y: 150 },
    { id: "duerp", label: "DUERP", type: "Documents", x: 670, y: 290 },
    { id: "eprd", label: "EPRD · ERRD", type: "Documents", x: 670, y: 430 },
    { id: "has", label: "HAS", type: "Acteurs", x: 830, y: 245 },
    { id: "ars", label: "ARS", type: "Acteurs", x: 835, y: 395 },
    { id: "departement", label: "Département", type: "Acteurs", x: 830, y: 520 },
    { id: "mdph", label: "MDPH / CDAPH", type: "Acteurs", x: 435, y: 95 },
    { id: "cnsa", label: "CNSA", type: "Acteurs", x: 675, y: 555 },
    { id: "anap", label: "ANAP", type: "Acteurs", x: 195, y: 530 },
    { id: "copil", label: "COPIL", type: "Instances", x: 435, y: 525 }
  ];

  const MAP_EDGES = [
    ["personne", "direction", "exprime ses choix"], ["personne", "equipes", "co-construit"], ["personne", "cvscse", "participe au CVS"],
    ["direction", "equipes", "organise et délègue"], ["direction", "projet", "pilote"], ["direction", "duerp", "porte la prévention"], ["direction", "eprd", "arbitre"],
    ["cvscse", "projet", "consultation / contribution"], ["cvscse", "duerp", "dialogue social distinct"], ["copil", "projet", "suit les actions"], ["copil", "eprd", "suit les moyens"],
    ["has", "projet", "référentiel / évaluation"], ["has", "direction", "évalue la qualité"], ["ars", "eprd", "finance / tarifie selon compétence"], ["ars", "direction", "autorise / contrôle selon cadre"],
    ["departement", "projet", "besoins et tarification"], ["departement", "personne", "droits / aide sociale"], ["mdph", "personne", "orientation et compensation"], ["mdph", "direction", "notification de parcours"],
    ["cnsa", "ars", "crédits et orientations"], ["cnsa", "eprd", "cadre et collecte"], ["anap", "direction", "outils et appui"]
  ];

  const RESEARCH_AREAS = [
    "Qualité HAS & Évaluation ESSMS",
    "Gestion des EI & AgEval",
    "Retours d'expérience (REX / CREX)",
    "Management d'équipe de direction",
    "Gouvernance des métiers support (Hôtellerie, Logistique, SI)",
    "RH, planning & continuité 24/7",
    "Santé au travail, DUERP & QVCT",
    "Budget, EPRD & contrôle de gestion",
    "Négociation de CPOM & autorisations",
    "Crédits non reconductibles (CNR) & investissements",
    "Projet personnalisé & autodétermination",
    "Transformation numérique, Ségur & DUI/DPI",
    "Droits des personnes & prévention maltraitance",
    "Instances & dialogue social (CVS, CSE, CME, CDU)",
    "Gestion de crise, PCA & sécurité incendie",
    "Parcours handicap adulte (MAS, FAM, ESAT)",
    "Enfance et jeunesse (IME, SESSAD, ITEP)",
    "Grand âge & perte d'autonomie (EHPAD, SAD)",
    "Protection de l'enfance (MECS, AEMO)",
    "Précarité & réinsertion (CHRS, CADA)",
    "Sanitaire (MCO, SMR, HAD, Psychiatrie)",
    "Coordination territoriale & CPTS",
    "Politique de santé & réformes réglementaires",
    "Guichet unique & multi-dispositifs"
  ];

  /* --- MODULE SÉCURITÉ SOCIALE & LIENS AVEC LES DISPOSITIFS --- */
  const SECURITY_SOCIALE = {
    title: "La Sécurité Sociale & le Système de Santé",
    subtitle: "Principes fondateurs de 1945, les 5 branches, mécanismes de financement (ONDAM, forfaits, T2A) et interactions directes avec le directeur d'établissement.",
    history: {
      year: "1945",
      founders: "Pierre Laroque & Ambroise Croizat (Ordonnances des 4 et 19 octobre 1945)",
      quote: "La Sécurité Sociale est la garantie donnée à chacun qu'en toutes circonstances il disposera des moyens nécessaires pour assurer sa subsistance et celle de sa famille.",
      principles: [
        { title: "Solidarité nationale", desc: "Chacun cotise selon ses moyens et reçoit selon ses besoins, sans sélection du risque." },
        { title: "Universalité", desc: "Vocation à couvrir l'ensemble de la population résidant régulièrement en France (PUMa depuis 2016)." },
        { title: "Gestion paritaire", desc: "Gouvernance assurée par les représentants des assurés sociaux (salariés) et des employeurs." },
        { title: "Autonomie financière", desc: "Budget distinct du budget général de l'État, voté chaque automne via la LFSS." }
      ]
    },
    branches: [
      {
        id: "maladie",
        name: "1. Branche Maladie",
        pilot: "CNAM (Caisse Nationale d'Assurance Maladie)",
        network: "101 CPAM, DRSM (Service Médical), 16 CARSAT",
        budget: "~245 Mds €",
        color: "sky",
        icon: "pulse",
        scope: "Soins ambulatoires, hospitalisations, indemnités journalières, ALD, médicaments et dispositifs médicaux.",
        esmsLink: "Finance l'ONDAM hospitalier, les forfaits de soins en MAS et HAD, les transports sanitaires des résidents et les séjours MCO/SMR.",
        managerAction: "Contrôles de facturation, ententes préalables avec le médecin-conseil de la DRSM, conventionnement FIDES et tiers-payant."
      },
      {
        id: "autonomie",
        name: "2. Branche Autonomie (5e Branche · Loi 2020)",
        pilot: "CNSA (Caisse Nationale de Solidarité pour l'Autonomie)",
        network: "Conseils Départementaux, MDPH, ARS, CPAM",
        budget: "~39 Mds €",
        color: "mint",
        icon: "shield",
        scope: "Perte d'autonomie des personnes âgées et des personnes en situation de handicap (Loi du 7 août 2020).",
        esmsLink: "Financeur pivot des ESSMS (EHPAD, MAS, FAM, SSIAD, SAMSAH), de l'APA, de la PCH et des revalorisations Ségur du médico-social.",
        managerAction: "Dépôt des EPRD/ERRD sur ImportEPRD, négociation des CPOM avec l'ARS/CD, suivi des enveloppes CNR et PAI investissement."
      },
      {
        id: "atmp",
        name: "3. Branche Accidents du Travail / Maladies Pro (AT/MP)",
        pilot: "Commission des AT/MP (CNAM)",
        network: "CARSAT, CRAMIF (Île-de-France), CGSS (Outre-Mer)",
        budget: "~16 Mds €",
        color: "coral",
        icon: "shield",
        scope: "Prise en charge intégrale des soins et rentes liés aux accidents du travail, de trajet et maladies professionnelles.",
        esmsLink: "Fixation du taux de cotisation employeur AT/MP de l'établissement et subventions d'équipements pour soignants (TMS Pros).",
        managerAction: "Déclaration d'AT en 48h, rédaction du DUERP avec la F3SCT, demande de subventions pour rails de transfert plafonniers et lève-malades."
      },
      {
        id: "famille",
        name: "4. Branche Famille",
        pilot: "CNAF (Caisse Nationale des Allocations Familiales)",
        network: "101 Caisses d'Allocations Familiales (CAF)",
        budget: "~55 Mds €",
        color: "gold",
        icon: "people",
        scope: "Prestations familiales, conciliation vie familiale/pro, AEEH, logement social et soutien à la jeunesse.",
        esmsLink: "Versement de l'AEEH pour les enfants accompagnés en IME/SESSAD, financement des crèches et passerelles protection enfance (MECS).",
        managerAction: "Attestations de prise en charge pour les familles d'enfants accueillis, cofinancements de projets d'inclusion et d'accueil temporaire."
      },
      {
        id: "retraite",
        name: "5. Branche Retraite (Assurance Vieillesse)",
        pilot: "CNAV (Caisse Nationale d'Assurance Vieillesse)",
        network: "CARSAT, CNAV Île-de-France, CGSS",
        budget: "~165 Mds €",
        color: "violet",
        icon: "calendar",
        scope: "Versement des pensions de retraite du régime général et prévention de la perte d'autonomie des retraités autonomes (GIR 5-6).",
        esmsLink: "Financement des actions de prévention en Résidences Autonomie et habitats inclusifs (forfait autonomie).",
        managerAction: "Candidature aux appels à projets de la CARSAT pour financer des ateliers équilibre, mémoire et adaptation du cadre de vie."
      },
      {
        id: "recouvrement",
        name: "Branche Recouvrement (Le nerf financier)",
        pilot: "ACOSS (Agence Centrale des Organismes de Sécurité Sociale) / Urssaf Caisse Nationale",
        network: "Réseau national des URSSAF",
        budget: "~580 Mds € collectés",
        color: "sky",
        icon: "layers",
        scope: "Collecte des cotisations sociales patronales et salariales, CSG, CRDS et taxes affectées.",
        esmsLink: "Prélèvement mensuel des cotisations de l'établissement et application des exonérations (allègements Fillon, CICE/Ségur).",
        managerAction: "Déclaration Sociale Nominative (DSN) mensuelle par le service RH/paie, gestion des contrôles URSSAF et régularisations."
      }
    ],
    ondam: {
      name: "L'ONDAM (Objectif National de Dépenses d'Assurance Maladie)",
      role: "Plafond voté chaque automne par le Parlement dans le cadre de la LFSS, fixant l'enveloppe maximale que l'Assurance Maladie peut rembourser.",
      subObjectives: [
        { name: "ONDAM Établissements de santé", share: "~105 Mds € (42%)", desc: "Soins hospitaliers MCO, psychiatrie, SMR, urgences, MIGAC et dotations socles." },
        { name: "ONDAM Médico-social (PA + PH)", share: "~34 Mds € (14%)", desc: "Délégué à la CNSA pour financer le fonctionnement soins des EHPAD, MAS, FAM, SSIAD." },
        { name: "ONDAM Soins de ville", share: "~108 Mds € (44%)", desc: "Médecins généralistes, spécialistes, infirmiers libéraux, officines, biologie." }
      ],
      impactManager: "Si les dépenses nationales dérivent, le Comité d'alerte de l'ONDAM peut geler les crédits de fin d'année et bloquer les aides exceptionnelles (CNR)."
    },
    fundingMechanisms: [
      { name: "T2A (Tarification à l'Activité)", target: "Hôpitaux MCO & Cliniques", desc: "Facturation à l'acte selon le Groupe Homogène de Séjours (GHS) issu du codage PMSI/DIM. Rémunère les séjours au coût standard." },
      { name: "Forfait Soins Journalier", target: "MAS & FAM", desc: "Prix de journée soins fixé par arrêté ARS, financé à 100% par l'Assurance Maladie (CNSA) en MAS, versé par douzièmes mensuels (DGF)." },
      { name: "Tarification Ternaire", target: "EHPAD", desc: "Triple section : Soins (Assurance Maladie 100%), Dépendance (Département via l'APA), Hébergement (Résident / ASH du département)." },
      { name: "Dotation Modulée & Compartimentée", target: "SMR (ex-SSR)", desc: "Mixte d'une dotation socle forfaitaire (sécurisation) et d'une part variable liée à l'activité réelle et aux plateaux techniques." },
      { name: "Dispositif IFAQ", target: "Tous établissements sanitaires", desc: "Incitation Financière à l'Amélioration de la Qualité : bonus budgétaire annuel alloué aux établissements les mieux certifiés par la HAS." }
    ],
    managerInteractions: [
      {
        num: "01",
        title: "Paiement des forfaits & douzièmes d'avance",
        detail: "La CPAM pivot verse chaque mois un douzième de la dotation globale de soins fixée par l'ARS pour sécuriser la trésorerie et la paie des soignants de la MAS/EHPAD."
      },
      {
        num: "02",
        title: "Contrôles T2A & Facturation contentieuse",
        detail: "L'Assurance Maladie contrôle la régularité du codage médico-économique et la présence effective des résidents. En cas d'irrégularité, elle émet des notifications d'indus que le directeur doit instruire sous 2 mois."
      },
      {
        num: "03",
        title: "Relation avec le Médecin-Conseil (DRSM)",
        detail: "Interlocuteur médical obligatoire pour les ententes préalables, le transport sanitaire des résidents, les accords d'appareillage lourd et les admissions sous protocole ALD 30 exonérant le ticket modérateur."
      },
      {
        num: "04",
        title: "Subventions CARSAT pour la santé des soignants",
        detail: "La CARSAT finance via les contrats de prévention jusqu'à 50% de l'achat d'équipements de transfert (lève-personnes, lits médicalisés ergonomiques, rails plafonniers) pour réduire les accidents du travail."
      },
      {
        num: "05",
        title: "Accès aux droits des personnes accueillies (C2S)",
        detail: "L'assistant social et la direction instruisent avec la CPAM l'ouverture des droits à la Complémentaire Santé Solidaire (C2S) pour éviter que les résidents précaires ne subissent de restes à charge non solvabilisés."
      },
      {
        num: "06",
        title: "Conventionnement & Échange de données (FIDES/B2)",
        detail: "Mise en place des flux de télétransmission sécurisés (cartes CPS/CPE soignantes, cartes Vitale des résidents, CDRi) pour automatiser la facturation directe et éliminer les rejets de paiement."
      }
    ],
    whoPaysWhat: [
      { facility: "Hôpital MCO (Chirurgie, Médecine)", soins: "Assurance Maladie (80% à 100% si ALD ou acte lourd)", dependance: "Sans objet", hebergement: "Inclus dans le séjour", userPart: "Forfait journalier (20 €/j) + Ticket modérateur (couvert par mutuelle ou C2S)" },
      { facility: "SMR (Soins Médicaux & Réadaptation)", soins: "Assurance Maladie (dotation socle + part activité)", dependance: "Inclus dans la prise en charge", hebergement: "Inclus dans le séjour hospitalier", userPart: "Forfait journalier (20 €/j) ou mutuelle" },
      { facility: "Hospitalisation à Domicile (HAD)", soins: "Assurance Maladie (100% panier de soins HAD)", dependance: "Sans objet", hebergement: "Domicile personnel de l'usager", userPart: "Zéro euro pour les soins HAD" },
      { facility: "EHPAD (Maison de retraite)", soins: "Assurance Maladie / CNSA (100% section soins)", dependance: "Conseil Départemental (APA selon GIR 1-4)", hebergement: "Résident (ou ASH Département si ressources insuffisantes)", userPart: "Tarif hébergement + Ticket modérateur dépendance (GIR 5-6)" },
      { facility: "MAS (Maison d'Accueil Spécialisée)", soins: "Assurance Maladie / CNSA (100% fonctionnement global)", dependance: "Intégrée dans la dotation globale soins", hebergement: "Intégré dans le forfait global de la structure", userPart: "Forfait journalier hospitalier (20 €/j), prélevé sur l'AAH (reste garanti 30% AAH)" },
      { facility: "FAM (Foyer d'Accueil Médicalisé)", soins: "Assurance Maladie / CNSA (forfait soins journalier)", dependance: "Intégrée dans l'accompagnement", hebergement: "Conseil Départemental (prix de journée hébergement)", userPart: "Participation aux frais d'hébergement plafonnée (AAH laissée à disposition)" },
      { facility: "Foyer de vie / EANM (Non médicalisé)", soins: "Médecine de ville libérale (remboursement classique)", dependance: "Intégrée dans le prix de journée", hebergement: "Conseil Départemental (Aide sociale à l'hébergement)", userPart: "Ressources de la personne (retenue légale avec minimum garanti)" },
      { facility: "SAD / SSIAD (Soins à domicile)", soins: "Assurance Maladie / CNSA (dotation globale SSIAD)", dependance: "Conseil Départemental (Plan d'aide APA / PCH)", hebergement: "Domicile de l'usager", userPart: "Soins 100% gratuits · Reste à charge éventuel sur les heures d'aide ménagère" },
      { facility: "IME / SESSAD (Enfance handicapée)", soins: "Assurance Maladie / CNSA (100% prix de journée / dotation)", dependance: "Intégrée dans l'accompagnement éducatif", hebergement: "Pris en charge par la dotation en internat", userPart: "Zéro euro à charge des familles (complété par l'AEEH de la CAF)" }
    ]
  };

  /* --- MODÈLES DE PRIX, ABONNEMENTS & ACCÈS UNIVERSEL --- */
  const PRICING_DATA = {
    tiers: {
      schools: [
        { id: "school-decouverte", name: "Découverte École", price: "290 €", period: "/ an", priceId:"price_1UeF8cCn4c8lYjEA8b2gJwNi", students: "Jusqu'à 30 comptes", perStudent: "~10 € / utilisateur", features: ["Métiers de direction Premium", "Calculatrices RH Premium", "Sécurité Sociale Premium", "Flashcards PDF Premium"] },
        { id: "school-partenaire", name: "Partenaire École", price: "590 €", period: "/ an", priceId:"price_1UeF8jCn4c8lYjEAcjfT2W8B", students: "Jusqu'à 100 comptes", perStudent: "~6 € / utilisateur", popular: true, features: ["Tous les contenus Premium", "Annuaire et fil d’actualité Premium", "Carte des interactions Premium", "Flashcards PDF Premium"] },
        { id: "school-campus", name: "Campus Santé", price: "990 €", period: "/ an", priceId:"price_1UeF8qCn4c8lYjEApANanQe5", students: "Jusqu'à 300 comptes", perStudent: "~3 € / utilisateur", features: ["Tous les contenus Premium", "Accès annuaire et fil d’actualité", "Métiers, droit, RH et auditatilité", "Flashcards PDF Premium"] }
      ],
      individuals: [
        { id: "indiv-student", name: "Étudiant Individuel", badge: "Offre Étudiante", price: "19 €", period: "/ an", priceId:"price_1UeF6jCn4c8lYjEAbkhzKi0k", subtitle: "Accès Premium annuel étudiant", features: ["Métiers de direction Premium", "Sécurité Sociale et carte 3D", "Calculateurs RH, recrutement et droit santé", "Annuaire, timeline et flashcards PDF"] },
        { id: "indiv-monthly", name: "Pass Mensuel Pro", price: "7,90 €", period: "/ mois", priceId:"price_1UeF7dCn4c8lYjEA651sADRZ", subtitle: "Accès Premium mensuel", features: ["Tous les contenus Premium", "Métiers, RH, audit, REX et politique santé", "Annuaire, timeline et carte 3D", "Flashcards PDF Premium"] },
        { id: "indiv-annual", name: "Pass Annuel Pro", badge: "Le plus populaire", popular: true, price: "59 €", period: "/ an", priceId:"price_1UeF8MCn4c8lYjEAcTVuxqSh", subtitle: "Accès Premium annuel", features: ["Tous les contenus Premium", "Droit santé et Sécurité Sociale", "RH, recrutement et calculateurs", "Annuaire, timeline et flashcards PDF"] },
        { id: "indiv-lifetime", name: "Licence Perpétuelle", price: "149 €", period: "une seule fois", priceId:"price_1UeF8UCn4c8lYjEAskxxen3z", subtitle: "Accès Premium permanent", features: ["Tous les contenus Premium actuels", "Annuaire, timeline et carte 3D", "RH, droit santé et Sécurité Sociale", "Flashcards PDF Premium"] }
      ],
      etablissement: [
        { id: "etab-dir-pack", name: "Pack Équipe Direction", price: "490 €", period: "/ an", priceId:"price_1UeF8yCn4c8lYjEA0k8WKXAI", subtitle: "5 accès Premium pour une équipe", features: ["Tous les contenus Premium", "5 comptes Premium", "Carte 3D, annuaire et timeline", "Flashcards PDF Premium"] }
      ]
    }
  };

  
  /* ==========================================================================
     MODULES COMPLÉMENTAIRES : RH, INSPECTION ARS, TRANSITION & GLOSSAIRE
     ========================================================================== */

  /* --- 1. LES DIFFÉRENTS TYPES DE CONGÉS POUR LES PROFESSIONNELS --- */
  const RH_LEAVE_TYPES = [
    {
      id: "ca-rtt",
      badge: "Repos & Récupération",
      title: "Congés Annuels (CA) & RTT / Repos compensateur",
      subtitle: "Droit fondamental au repos, cycles de travail et règles de fractionnement",
      duration: "CA : 25 j ouvrés (30 j ouvrables) · RTT : selon accord (12 à 23 j)",
      fphRules: "Dans la FPH, l'année de référence est civile (1er janv. - 31 déc.). Droit égal à 5 fois les obligations hebdomadaires de travail (ex: 25 jours pour un temps plein sur 5 jours). Jours de fractionnement : 1 jour supplémentaire si 3 à 5 jours pris hors période 1er mai-31 oct., 2 jours si 6 jours et plus. Les RTT sont accordés en contrepartie d'une durée hebdomadaire supérieure à 35h (ex: 38h ou 38h30).",
      priveRules: "Dans le secteur privé (CCN51, CCN66, Droit commun), la période de référence légale court du 1er juin au 31 mai (sauf accord d'entreprise sur l'année civile). Fractionnement identique au Code du travail. Cadres au forfait jours : 211 à 218 jours travaillés par an, les jours de repos (JRTT/forfait) varient selon le calendrier des jours fériés et chômés.",
      procedure: "Demande formulée via le logiciel GTA ou formulaire interne dans le respect du délai de prévenance (généralement 1 mois avant). Le cadre arbitre en garantissant en premier lieu la continuité et la sécurité des soins des résidents.",
      tips: "Jurisprudence européenne (Loi DDADUE 2024) : un salarié en arrêt maladie avant ou pendant ses congés payés a droit au report de ses congés non pris dans un délai de 15 mois. Les congés s'acquièrent désormais aussi pendant les arrêts maladie (dans la limite de 4 semaines par an).",
      sources: ["codeTravailConges", "publicServiceCode"]
    },
    {
      id: "maternite-paternite",
      badge: "Parentalité",
      title: "Congé Maternité, Paternité & Accueil de l'enfant",
      subtitle: "Protection de la parentalité, durées légales et maintien de rémunération",
      duration: "Maternité : 16 à 46 sem. · Paternité : 25 j (32 j si jumeaux) + 3 j naissance",
      fphRules: "Plein traitement maintenu pendant la totalité du congé maternité et du congé paternité (titulaires et stagiaires). Le congé de paternité comprend 3 jours d'autorisation d'absence pour naissance + 25 jours calendaires fractionnables (dont 4 jours obligatoires consécutifs au congé de naissance).",
      priveRules: "Indemnités journalières maternité/paternité versées par la Sécurité sociale (CPAM) avec maintien de salaire intégral pris en charge par l'employeur selon la convention collective (CCN51 dès 1 an d'ancienneté, CCN66 selon barème). Protection absolue contre le licenciement pendant le congé et les 10 semaines suivantes.",
      procedure: "Transmission à la DRH du certificat médical attestant de l'état de grossesse et de la date présumée d'accouchement. Pour le père / conjoint : information de la direction au moins 1 mois avant la date de début du congé.",
      tips: "Aménagement d'horaires : dans la plupart des conventions et statuts, les professionnelles enceintes bénéficient d'une réduction d'1 heure de travail par jour à compter du 3e ou 4e mois de grossesse, sans perte de salaire.",
      sources: ["codeTravailConges", "publicServiceCode", "ameli"]
    },
    {
      id: "parental-presence",
      badge: "Famille & Enfance",
      title: "Congé Parental d'Éducation (CPE) & Présence Parentale",
      subtitle: "Suspension ou aménagement d'activité pour élever ou soigner un enfant",
      duration: "CPE : jusqu'aux 3 ans de l'enfant · CPP : 310 jours sur 3 ans",
      fphRules: "Le CPE est accordé de droit au fonctionnaire à l'issue du congé maternité/adoption. Peut être pris sous forme de temps partiel (50%, 60%, 70%, 80%). Le fonctionnaire conserve ses droits à avancement d'échelon pour moitié. Le Congé de Présence Parentale (CPP) ouvre droit au versement de l'AJPP (Allocation Journalière de Présence Parentale) par la CAF.",
      priveRules: "Accessible à tout salarié justifiant d'un an d'ancienneté à la date de naissance. Peut être renouvelé 2 fois jusqu'au 3e anniversaire de l'enfant. L'employeur ne peut pas refuser un passage à temps partiel mais la fixation des horaires relève du pouvoir de direction (en concertation bienveillante).",
      procedure: "Demande écrite envoyée au moins 1 mois avant la fin du congé maternité (ou 2 mois avant en cas de demande ultérieure) par lettre recommandée avec AR ou remise en main propre.",
      tips: "À l'issue du congé parental, le professionnel retrouve obligatoirement son précédent emploi ou un emploi similaire assorti d'une rémunération équivalente, avec un entretien professionnel de reprise obligatoire.",
      sources: ["codeTravailConges", "publicServiceCode"]
    },
    {
      id: "aidant-solidarite",
      badge: "Soutien aux Proches",
      title: "Congé de Proche Aidant (CPA) & Solidarité Familiale",
      subtitle: "Accompagner un proche dépendant, handicapé ou en fin de vie",
      duration: "Proche aidant : 3 mois renouvelables (max 1 an) · Solidarité : 3 mois (max 6 mois)",
      fphRules: "Accordé de droit sur présentation des justificatifs (notification GIR 1-3, PCH, carte invalidité). Le fonctionnaire en CPA peut percevoir l'AJPA (Allocation Journalière du Proche Aidant, environ 64 €/jour versée par la CAF/MSA, dans la limite de 66 jours sur la carrière). Le congé de solidarité familiale ouvre droit à l'AJAP.",
      priveRules: "Accessible sans condition d'ancienneté minimale (loi Travail). L'employeur ne peut pas refuser le congé si les conditions sont remplies. Le contrat de travail est suspendu, avec fractionnement possible en demi-journées ou transformation en temps partiel avec l'accord de la direction.",
      procedure: "Demande écrite adressée au moins 1 mois avant la date de départ souhaitée (délai supprimé en cas d'urgence absolue, dégradation soudaine ou fin de vie).",
      tips: "Enjeux RH en santé : de nombreux soignants sont eux-mêmes aidants familiaux. La reconnaissance bienveillante de ce statut par le cadre prévient l'épuisement professionnel (burn-out) et les arrêts maladie de complaisance.",
      sources: ["codeTravailConges", "publicServiceCode", "cnsa"]
    },
    {
      id: "maladie-ordinaire",
      badge: "Santé du Salarié",
      title: "Congé de Maladie Ordinaire (CMO) & Arrêt de travail",
      subtitle: "Délai de carence, indemnisation, subrogation et maintien de traitement",
      duration: "Jusqu'à 6 mois consécutifs ou 1 an par période glissante",
      fphRules: "Délai de carence : 1 jour retenu sur le traitement. Indemnisation : plein traitement pendant 3 mois, puis demi-traitement pendant les 9 mois suivants sur une période de 12 mois glissants. Contrôle médical possible par un médecin agréé diligenté par l'administration.",
      priveRules: "Délai de carence Sécurité sociale : 3 jours. La CPAM verse les IJSS (50% du salaire journalier de base). Maintien conventionnel : en CCN51 et CCN66, maintien du salaire net après un délai de carence réduit ou nul selon l'ancienneté, souvent avec subrogation de l'employeur (l'établissement perçoit les IJSS et verse le salaire net complet).",
      procedure: "Le soignant doit transmettre les volets 1 et 2 du certificat d'arrêt de travail à la CPAM (ou caisse de tutelle) et le volet 3 à l'employeur/cadre impérativement sous 48 heures ouvrées.",
      tips: "Posture du cadre : maintenir un contact respectueux (sans intrusion médicale) pour anticiper le retour, organiser le remplacement et préparer l'entretien de reprise si l'arrêt a dépassé 30 jours.",
      sources: ["codeTravailConges", "publicServiceCode", "ameli"]
    },
    {
      id: "clm-cld-grave",
      badge: "Affections Lourdes",
      title: "Congé Longue Maladie (CLM), Longue Durée (CLD) & Grave Maladie",
      subtitle: "Protection renforcée pour pathologies lourdes, cancers et ALD",
      duration: "CLM : jusqu'à 3 ans · CLD : jusqu'à 5 ans · Grave maladie : jusqu'à 3 ans",
      fphRules: "CLM (titulaires) : 1 an à plein traitement, 2 ans à demi-traitement pour affection nécessitant un traitement prolongé. CLD : 3 ans à plein traitement, 2 ans à demi-traitement (réservé à 5 groupes d'affections : tuberculose, maladie mentale, affections cancéreuses, poliomyélite, déficit immunitaire grave). Saisine du Conseil médical obligatoire.",
      priveRules: "Régime des Affections de Longue Durée (ALD 30) : prise en charge à 100% par la Sécurité sociale pour les soins liés à la pathologie. IJSS versées jusqu'à 3 ans au titre de l'arrêt continu. Les contrats de prévoyance collective (obligatoires en santé) assurent le maintien d'un pourcentage élevé de la rémunération brute (généralement 75% à 90%).",
      procedure: "Demande formulée par le professionnel accompagnée d'un certificat sous pli confidentiel adressé au médecin conseil / conseil médical. Décision formelle de l'autorité territoriale ou de l'employeur.",
      tips: "Visite de pré-reprise : peut être demandée par le salarié auprès du médecin du travail dès que son état se stabilise, afin d'étudier en amont les aménagements ou un mi-temps thérapeutique.",
      sources: ["publicServiceCode", "ameli"]
    },
    {
      id: "at-mp-citis",
      badge: "Risques Professionnels",
      title: "Accident du Travail, Maladie Professionnelle & CITIS",
      subtitle: "Prise en charge intégrale des lésions liées au service et protection légale",
      duration: "Jusqu'à consolidation, guérison ou mise en inaptitude",
      fphRules: "Régime du CITIS (Congé pour Invalidité Temporaire Imputée au Service) créé par décret 2019-122 : l'agent conserve l'intégralité de son traitement indiciaire, primes et indemnités. Remboursement à 100% de tous les frais médicaux et pharmaceutiques engagés. Déclaration sous 15 jours.",
      priveRules: "Régime AT/MP de la Sécurité sociale : aucun jour de carence. IJSS majorées (60% puis 80% du salaire journalier) + complément employeur à 100% dès le premier jour selon CCN. Déclaration d'accident par l'employeur à la CPAM dans les 48 heures suivant l'information par le salarié.",
      procedure: "Remplissage scrupuleux du registre des accidents bénins ou déclaration officielle CERFA. Le cadre doit analyser immédiatement les causes de l'événement (glissade, agression, piqûre AES, manutention lourde) pour actualiser le DUERP.",
      tips: "En cas d'accident avec exposition au sang (AES), le protocole d'urgence médicale doit être enclenché dans les 4 heures (médecin référent, sérologies, traitement prophylactique éventuel).",
      sources: ["citisFph", "carsat", "servicePublicWork"]
    },
    {
      id: "evenements-familiaux",
      badge: "Circonstances Exceptionnelles",
      title: "Congés pour Événements Familiaux & Circonstances Exceptionnelles",
      subtitle: "Mariage, PACS, naissance, décès, enfant malade et annonce de handicap",
      duration: "1 à 14 jours ouvrés selon le motif et la convention",
      fphRules: "Autorisations spéciales d'absence (ASA) accordées par le chef d'établissement : mariage/PACS (5 j ouvrables), décès d'un conjoint/parent (3 j), décès d'un enfant (12 à 14 j selon l'âge + 8 j de deuil), enfant malade (nombre de jours fixé selon la quotité de travail et le nombre d'enfants). Traitement intégral maintenu.",
      priveRules: "Droits minimaux du Code du travail bonifiés par les conventions collectives : CCN51 : 5 jours pour mariage/PACS, 14 jours ouvrés pour décès d'un enfant de moins de 25 ans, 5 jours pour décès conjoint/parent. Annonce de la survenue d'un handicap ou d'une affection de longue durée chez un enfant : 5 jours ouvrés.",
      procedure: "Présentation obligatoire du justificatif d'état civil (acte de mariage, certificat de décès, certificat médical) dans les meilleurs délais au service RH.",
      tips: "Ces congés sont pris au moment de l'événement (ou dans une période raisonnable attenante). Ils sont assimilés à du temps de travail effectif pour le calcul des congés payés et de l'ancienneté.",
      sources: ["codeTravailConges", "publicServiceCode"]
    },
    {
      id: "formation-mobilite",
      badge: "Évolution & Parcours",
      title: "Congé de Formation Professionnelle, Sabbatique & Disponibilité",
      subtitle: "Montée en compétences, reconversion soignante et convenances personnelles",
      duration: "CFP : jusqu'à 3 ans · Sabbatique : 6 à 11 mois · Disponibilité : jusqu'à 5 ans",
      fphRules: "CFP : ouvert aux agents après 3 ans de services effectifs, indemnité égale à 85% du traitement brut pendant 12 mois. Disponibilité pour convenances personnelles : accordée sous réserve des nécessités de service (durée max 5 ans renouvelable dans la limite de 10 ans sur la carrière).",
      priveRules: "Projet de Transition Professionnelle (PTP - ex-CIF) financé par Transitions Pro pour changer de métier avec maintien de salaire. Congé sabbatique : ouvert aux salariés ayant 36 mois d'ancienneté dans l'établissement et 6 années d'activité professionnelle.",
      procedure: "Demande écrite formulée auprès de la direction 3 à 4 mois avant la date de départ envisagée. L'employeur dispose d'un délai légal pour répondre (possibilité de différer pour nécessité de service).",
      tips: "Pour les cadres de santé : accompagner les demandes de formation (ex: aide-soignant préparant le concours infirmier, IDE vers cadre ou IADE) constitue le premier levier de fidélisation et de promotion interne de l'établissement.",
      sources: ["publicServiceCode", "codeTravailConges"]
    }
  ];

  /* --- 2. GESTION DU MI-TEMPS / TEMPS PARTIEL THÉRAPEUTIQUE --- */
  const RH_THERAPEUTIC_PART_TIME = {
    definition: "Le temps partiel thérapeutique (couramment appelé mi-temps thérapeutique) est une modalité temporaire d'aménagement du temps de travail permettant à un professionnel de reprendre progressivement son activité professionnelle ou de la poursuivre afin de favoriser sa guérison, sa réadaptation et son maintien dans l'emploi.",
    legalFramework: [
      "Code de la sécurité sociale (art. L. 323-3) : réforme majeure supprimant l'obligation d'un arrêt de travail à temps complet préalable. Un soignant peut passer directement en mi-temps thérapeutique.",
      "Code général de la fonction publique (art. L. 823-1 à L. 823-6) et décret n° 2021-997 : harmonisation du temps partiel thérapeutique dans la FPH avec maintien du plein traitement.",
      "Conventions collectives de santé (CCN51, CCN66, FHP) : compléments de rémunération et suivi par les services de santé au travail."
    ],
    keyActors: [
      {
        role: "Médecin traitant",
        mission: "Prescrit l'aménagement du travail, préconise la quotité hebdomadaire (50%, 60%, 80%) et fixe la durée prévisionnelle (généralement 1 à 3 mois renouvelables)."
      },
      {
        role: "Médecin du travail / Médecin agréé",
        mission: "Évalue l'adéquation entre l'état de santé du soignant et le poste. Formule des préconisations ergonomiques et organisationnelles formelles (ex: pas de port de charges > 5 kg, pas de travail de nuit, pas de postes isolés)."
      },
      {
        role: "Employeur / Cadre de santé",
        mission: "Donne son accord sur la faisabilité du poste et construit le planning adapté. Un refus de l'employeur est exceptionnel et doit être dûment motivé par des contraintes impérieuses de fonctionnement du service."
      },
      {
        role: "Organisme de Sécurité Sociale (CPAM / MGEN)",
        mission: "Donne son accord de prise en charge financière et verse les Indemnités Journalières de Temps Partiel Thérapeutique (IJ-TPT) en complément du salaire versé par l'établissement."
      }
    ],
    steps: [
      {
        step: 1,
        title: "Prescription par le médecin traitant",
        desc: "Le professionnel consulte son médecin traitant qui rédige l'ordonnance et le volet d'arrêt de travail mentionnant expressément la reprise à temps partiel pour motif thérapeutique, en précisant la quotité recommandée (ex: 50%)."
      },
      {
        step: 2,
        title: "Visite médicale auprès du médecin du travail",
        desc: "Examen médical d'aptitude au poste aménagé. Le médecin du travail émet une fiche d'aptitude assortie d'éventuelles restrictions (gestes répétitifs, horaires, transmissions) nécessaires à la protection de la santé de l'agent."
      },
      {
        step: 3,
        title: "Accord de l'employeur et co-construction du planning",
        desc: "Le cadre de santé et le service RH étudient la répartition horaire avec le professionnel : demi-journées régulières ou journées complètes espacées (ex: lundi, mercredi, vendredi). Rédaction d'un avenant au contrat ou d'un arrêté d'affectation temporaire."
      },
      {
        step: 4,
        title: "Validation de la caisse (CPAM / Conseil médical)",
        desc: "Transmission de l'attestation de salaire et de l'accord employeur à la CPAM (secteur privé) pour le calcul des IJSS, ou notification de l'arrêté dans la FPH."
      },
      {
        step: 5,
        title: "Entretien de reprise et suivi managérial régulier",
        desc: "Le cadre accueille le professionnel, reprécise les missions confiées sans surcharge, informe l'équipe de l'organisation retenue (sans violer le secret médical) et planifie un point d'étape tous les 15 jours."
      }
    ],
    fphVsPrive: {
      fph: {
        title: "Fonction Publique Hospitalière (FPH)",
        remuneration: "Révolution du décret 2021-997 : l'agent conserve l'intégralité de son traitement indiciaire de base (100%), du supplément familial de traitement et de l'indemnité de résidence. Les primes et indemnités de sujétion (ex: prime de dimanche) sont versées au prorata des heures effectivement accomplies.",
        duration: "Période maximale de 1 an pour une même affection. Possibilité d'un nouveau droit après 1 an de reprise à temps plein.",
        formalities: "Autorisation accordée par le chef d'établissement sur demande de l'agent après avis du médecin du travail. En cas de contestation, saisine du Conseil médical."
      },
      prive: {
        title: "Secteur Privé (CCN51, CCN66, Établissements commerciaux)",
        remuneration: "L'employeur rémunère le temps de travail effectif au prorata des heures accomplies. La CPAM verse les IJ-TPT (Indemnités Journalières de Temps Partiel Thérapeutique). Le cumul salaire + IJSS ne peut excéder le salaire net de référence précédant l'arrêt.",
        duration: "Fixée par la CPAM, généralement accordée par tranches de 3 mois, dans la limite de 1 an à 2 ans selon que l'affection relève du droit commun ou d'une ALD.",
        formalities: "Avenant contractuel temporaire précisant la nouvelle durée hebdomadaire, la répartition des heures et le caractère provisoire."
      }
    },
    managerChecklist: [
      "Ne JAMAIS faire effectuer d'heures supplémentaires ou complémentaires à un salarié en temps partiel thérapeutique (interdiction stricte).",
      "Respecter scrupuleusement les restrictions d'aptitude formulées par le médecin du travail (ergonomie, charges, postures).",
      "Anticiper le roulement de l'équipe pour ne pas faire peser la quote-part non travaillée sur les collègues de poste.",
      "Préserver strictement la confidentialité médicale : l'équipe sait que le planning est aménagé pour raison de santé, mais le diagnostic ou la pathologie relèvent du secret médical absolu.",
      "Réaliser un entretien formalisé à mi-parcours pour ajuster la charge de travail si une fatigue anormale est constatée."
    ],
    sources: ["tptAmeli", "publicServiceCode", "servicePublicWork"]
  };

  /* --- 3. DÉROULEMENT D'UN CHANGEMENT DE PLANNING D'UNE ORGANISATION --- */
  const RH_PLANNING_CHANGE = {
    ethicalImperative: "LE MOT D'ORDRE ÉTHIQUE DIRECTEUR : Toute réorganisation du temps de travail, toute modification de trame ou de cycle doit impérativement avoir pour finalité première le bien-être, la sécurité physique et psychique, et la dignité inconditionnelle des résidents et patients accueillis. Le planning soignant n'est pas une simple équation budgétaire : il est le garant de la présence humaine et de la qualité de vie dans l'établissement.",
    whyChange: {
      residents: [
        "Adéquation de la présence soignante aux moments clés de vulnérabilité : levers matinaux, toilettes non précipitées, aide aux repas, couchers personnalisés.",
        "Stabilité et continuité des figures d'attachement : réduction des changements d'intervenants pour sécuriser les personnes désorientées ou anxieuses.",
        "Diminution drastique des événements indésirables (chutes lors des relèves, erreurs médicamenteuses dues à la fatigue soignante)."
      ],
      staff: [
        "Amélioration sensible de la Qualité de Vie et des Conditions de Travail (QVCT).",
        "Visibilité et prévisibilité à long terme sur les repos, week-ends et congés.",
        "Respect physiologique des rythmes de sommeil et diminution du travail en miettes ou des coupures usantes.",
        "Réduction de l'absentéisme de courte durée, des burn-out et des rappels intempestifs sur repos."
      ],
      organization: [
        "Alignement des effectifs sur la charge en soins réelle (ratios soignants par unité).",
        "Conformité juridique absolue avec le Code du travail, les décrets hospitaliers et les accords de branche.",
        "Réduction des coûts d'intérim onéreux et fidélisation des professionnels soignants."
      ]
    },
    regulatoryRules: [
      { label: "Repos quotidien", value: "Minimum 11h consécutives entre deux prises de poste (dérogations exceptionnelles très encadrées)." },
      { label: "Repos hebdomadaire", value: "Minimum 35h consécutives (24h + 11h de repos quotidien), avec au moins 1 week-end sur 2 de repos dans la plupart des CCN." },
      { label: "Durée maximale quotidienne", value: "10 heures max par poste (porté à 12 heures uniquement sur dérogation validée en accord collectif pour assurer la continuité)." },
      { label: "Durée maximale hebdomadaire", value: "48 heures au cours d'une même semaine, et 44 heures en moyenne sur 12 semaines consécutives." },
      { label: "Travail de nuit", value: "Tout travail effectué entre 21h et 6h (ou 22h et 7h selon accord), donnant droit à majoration et temps de repos compensateur." }
    ],
    sevenSteps: [
      {
        step: 1,
        title: "Étape 1 · Diagnostic initial & mesure de la charge en soins",
        detail: "Recueil des données objectives : taux d'absentéisme par unité, nombre d'heures supplémentaires, glissements de tâches, pyramide des âges, et courbe de présence des soignants comparée aux besoins réels des résidents (levers, soins, repas).",
        actors: "Cadre de santé, direction, médecin coordonnateur, référent qualité."
      },
      {
        step: 2,
        title: "Étape 2 · Cadrage réglementaire & cahier des charges",
        detail: "Définition des principes directeurs : choix du cycle (petites et grandes semaines, roulement sur 6 à 12 semaines), amplitudes horaires (7h, 7h30, 8h, 10h ou 12h), temps de transmission inter-équipes sanctuarisé (20 à 30 minutes indispensables).",
        actors: "Direction des ressources humaines, cadre supérieur, direction des soins."
      },
      {
        step: 3,
        title: "Étape 3 · Co-construction participative avec les équipes",
        detail: "Mise en place d'ateliers de travail pluridisciplinaires (IDE, AS, ASH, rééducateurs). Présentation de 2 ou 3 scénarios de trames types. Écoute active des contraintes personnelles et des propositions de terrain. Arbitrage transparent.",
        actors: "Équipes soignantes, cadres de proximité, animateurs de groupe."
      },
      {
        step: 4,
        title: "Étape 4 · Consultation officielle des instances (CSE / F3SCT / CSAL)",
        detail: "Présentation du dossier complet d'impact sur les conditions de travail auprès des représentants du personnel : évaluation des risques dans le DUERP, vote consultatif de l'instance, recueil des avis motivés.",
        actors: "Président de séance (Directeur), membres élus CSE / F3SCT / CSAL."
      },
      {
        step: 5,
        title: "Étape 5 · Période d'expérimentation terrain (3 à 6 mois)",
        detail: "Mise en œuvre du nouveau planning sous forme de test avec clause de réversibilité. Création d'un comité paritaire de suivi mensuel pour analyser les premiers retours, la fatigue ressentie et la continuité des prises en charge.",
        actors: "Comité de suivi paritaire, cadre de santé, professionnels de terrain."
      },
      {
        step: 6,
        title: "Étape 6 · Bilan contradictoire & ajustements opérationnels",
        detail: "Analyse des indicateurs à 3 mois : variation du taux d'absence, satisfaction des résidents et familles (enquête CVS), traçabilité des transmissions, ajustement des micro-dysfonctionnements identifiés.",
        actors: "Direction, cadre, équipes, Conseil de la Vie Sociale."
      },
      {
        step: 7,
        title: "Étape 7 · Validation définitive & paramétrage dans le logiciel GTA",
        detail: "Intégration pérenne dans le système de gestion des temps (Chronos, Octime, Planexa, etc.). Affichage des plannings annuels ou cycliques dans le respect des délais légaux de prévenance (minimum 15 jours à 1 mois avant).",
        actors: "Responsable GTA / RH, cadres de santé, soignants."
      }
    ],
    sources: ["anapPlanning", "codeTravailConges", "publicServiceCode"]
  };

  /* --- 4. GESTION ET ACCUEIL DES STAGIAIRES & ALTERNANTS --- */
  const RH_INTERNS_APPRENTICES = {
    strategicVision: "L'accueil d'un stagiaire ou d'un alternant n'est pas une simple charge administrative : c'est le premier vecteur de pré-recrutement dans un secteur en tension, une responsabilité pédagogique de transmission et une formidable opportunité de dynamisation des équipes grâce au regard neuf des apprenants.",
    ethicalRule: "RÈGLE D'OR DÉONTOLOGIQUE : Un stagiaire ou alternant est en formation, il n'est en aucun cas une variable d'ajustement ni un ETP de remplacement d'un soignant absent. Tout soin, toute intervention auprès d'un résident/patient doit respecter sa pudeur, sa volonté et sa dignité inconditionnelle, sous la supervision active et bienveillante du tuteur désigné.",
    types: [
      {
        category: "Stagiaires de formation initiale",
        profiles: "Étudiants en soins infirmiers (ESI / IFSI), élèves aides-soignants (EAS / IFAS), étudiants universitaires (Licence/Master santé, psychologie, ergothérapie, secrétariat médical).",
        framework: "Convention de stage tripartite obligatoire signée avant le 1er jour. Gratification obligatoire pour tout stage supérieur à 2 mois consécutifs (indexée sur le taux horaire légal de la Sécurité sociale, environ 4,35 €/h exonéré de charges).",
        hours: "35h maximum par semaine, repos hebdomadaire de 2 jours consécutifs, travail de nuit interdit pour les mineurs et strictement encadré pour les majeurs selon objectifs pédagogiques."
      },
      {
        category: "Alternants (Contrat d'apprentissage ou de pro)",
        profiles: "Futurs soignants, cadres administratifs, adjoints de direction (Master MES), apprentis préparateurs en pharmacie, techniciens qualité.",
        framework: "Véritable contrat de travail (CDD ou CDI) avec statut de salarié de l'établissement. Rémunération en pourcentage du SMIC calculée selon l'âge et l'année de cursus. Prise en charge des frais de formation par l'OPCO (ex: OPCO Santé) ou le budget de l'établissement public.",
        hours: "Soumis au temps de travail applicable aux salariés de l'établissement, avec congés payés légaux (2,5 jours par mois) et 5 jours de congés supplémentaires rémunérés pour révision d'examen."
      }
    ],
    fivePhases: [
      {
        phase: "Phase 1 · Préparation en amont (J - 15)",
        actions: [
          "Désignation nominative d'un tuteur ou maître d'apprentissage volontaire, formé et légitime.",
          "Préparation du poste de travail : vestiaire, tenues professionnelles adaptées, badge d'accès sécurisé.",
          "Création des accès informatiques au Dossier Patient/Usager Informatisé (DPI/DUI) avec profil 'Stagiaire' à droits d'écriture et de lecture adaptés et traçables.",
          "Envoi d'un message de bienvenue avec le livret d'accueil, le plan d'accès et les horaires du premier jour."
        ]
      },
      {
        phase: "Phase 2 · Accueil et intégration (J1)",
        actions: [
          "Accueil personnalisé par le cadre de santé et le tuteur dès l'arrivée.",
          "Visite guidée complète des locaux : unités de vie, postes de soins, salle de repos, locaux techniques, issues de secours.",
          "Présentation officielle à l'équipe pluridisciplinaire et aux résidents/patients lors du tour de transmission.",
          "Signature solennelle de la Charte de Bientraitance et rappel impératif du secret professionnel et de la discrétion médicale."
        ]
      },
      {
        phase: "Phase 3 · Suivi pédagogique & progression tutorée",
        actions: [
          "Examen du portfolio de compétences de l'institut (ex: les 10 compétences du référentiel infirmier IFSI) et contractualisation d'objectifs SMART.",
          "Gradation de la prise d'autonomie : 1. Observation guidée -> 2. Pratique accompagnée en binôme -> 3. Réalisation autonome supervisée.",
          "Point hebdomadaire de 15 minutes entre le tuteur et l'apprenant pour débriefer les situations émotionnellement marquantes ou complexes."
        ]
      },
      {
        phase: "Phase 4 · Bilan de mi-parcours",
        actions: [
          "Entretien d'étape à mi-stage avec la grille d'évaluation intermédiaire.",
          "Identification partagée des compétences acquises et des axes de remédiation prioritaires.",
          "Réajustement des activités confiées (ex: participation à une commission qualité, passage dans un autre secteur technique pour enrichir le parcours)."
        ]
      },
      {
        phase: "Phase 5 · Évaluation finale & perspective de pré-recrutement",
        actions: [
          "Entretien tripartite de bilan : Stagiaire, Tuteur de proximité, Cadre de santé.",
          "Remplissage rigoureux, objectif et bienveillant du livret de stage / portfolio avec appréciations écrites valorisantes.",
          "Pour les stagiaires de dernière année ou alternants méritants : proposition formelle d'embauche ou inscription prioritaire dans le vivier de recrutement de l'établissement."
        ]
      }
    ],
    sources: ["codeTravailConges", "publicServiceCode", "charteBientraitance"]
  };

  /* --- 5. GUIDE D'INSPECTION DE L'ARS (AGENCE RÉGIONALE DE SANTÉ) --- */
  const ARS_INSPECTION_GUIDE = {
    overview: "L'inspection de l'Agence Régionale de Santé (ARS) est une mission de contrôle légale diligentée par les inspecteurs assermentés de la santé publique (médecins, pharmaciens, ingénieurs et inspecteurs de l'action sanitaire et sociale). Elle a pour vocation de vérifier la conformité des pratiques, des organisations et des locaux aux lois et règlements en vigueur.",
    ethicalCore: "LA FINALITÉ SUPRÊME DE L'INSPECTION : Loin d'être un simple piège policier ou punitif, l'inspection a pour but impérieux d'assurer la protection, la sécurité sanitaire, la bientraitance et le respect absolu de la dignité et des droits des résidents et patients hébergés. Une direction préparée et transparente démontre sa responsabilité éthique.",
    legalBasis: "Articles L. 1421-1 et suivants et L. 1435-7 du Code de la santé publique ; articles L. 313-13 à L. 313-20 du CASF. Les inspecteurs ont un droit d'accès permanent à tous les locaux, peuvent auditionner tout professionnel sans témoin et saisir tout document utile.",
    typology: [
      {
        type: "Inspection programmée",
        context: "Inscrite au Programme Régional d'Inspection et de Contrôle (PRIC) de l'ARS. L'établissement reçoit un préavis officiel (quelques jours à quelques semaines) précisant la thématique et les documents à préparer."
      },
      {
        type: "Inspection inopinée",
        context: "Sans aucun avertissement préalable. Les inspecteurs se présentent à l'accueil à tout moment (y compris tôt le matin, la nuit ou le week-end) pour constater la réalité brute du fonctionnement opérationnel."
      },
      {
        type: "Inspection conjointe ARS / Conseil Départemental",
        context: "Très fréquente en EHPAD et secteur handicap : associe les inspecteurs de l'ARS (volet soins, hygiène, sécurité sanitaire) et les contrôleurs du Conseil Départemental (volet hébergement, dépendance, personnel socio-éducatif, tarification)."
      },
      {
        type: "Inspection réactive suite à signalement / EIGS",
        context: "Déclenchée en urgence après la déclaration d'un Événement Indésirable Grave associé aux Soins (EIGS), une plainte d'une famille, une alerte syndicale, un signalement de maltraitance sur le portail national ou une médiatisation de crise."
      },
      {
        type: "Inspection thématique",
        context: "Ciblée sur un risque spécifique : circuit et sécurisation du médicament (PUI), sécurité incendie, gestion des effectifs et présence soignante effective, bientraitance et contention, respect des libertés fondamentales."
      }
    ],
    preparationPhase: {
      title: "Phase 1 · Préparation en amont : le 'Classeur d'Inspection' permanent",
      desc: "Une inspection ne se prépare pas la veille : l'établissement doit maintenir un dossier documentaire unique toujours à jour et immédiatement mobilisable.",
      documents: [
        {
          group: "1. Gouvernance & Autorisations",
          items: ["Arrêté d'autorisation et FINESS", "Convention tripartite ou CPOM signé", "Projet d'établissement et Projet de soins à jour", "Livret d'accueil, Règlement de fonctionnement et Charte des droits", "Dernier rapport d'évaluation externe HAS"]
        },
        {
          group: "2. Ressources Humaines & Plannings",
          items: ["Registre Unique du Personnel (RUP) signé et conforme", "Plannings réels des 3 à 6 derniers mois avec émargements", "Tableau de concordance plannings prévus vs réalisés", "Dossiers des soignants : diplômes certifiés, inscriptions aux Ordres (ONI, CNOM)", "Fiches de poste signées et attestations de formation obligatoire (incendie, AFGSU, bientraitance)"]
        },
        {
          group: "3. Qualité, Soins & Bientraitance",
          items: ["Document Unique d'Évaluation des Risques Professionnels (DUERP) actualisé", "Registre des Événements Indésirables (FEI/EIGS) avec analyses de causes REX", "Protocoles de prise en charge de la douleur et protocoles de contention prescrits", "Circuit du médicament : convention pharmacie/PUI, ordonnancier des stupéfiants, chaîne du froid tracée", "Protocoles d'hygiène et prévention des IAS (infections associées aux soins)"]
        },
        {
          group: "4. Sécurité des Locaux & Bâtiment",
          items: ["Registre de sécurité incendie et levée des réserves des commissions", "Contrats de maintenance des dispositifs médicaux et lève-malades", "Carnet sanitaire de l'eau (analyses légionelle et potabilité)", "Plan bleu / Plan blanc et protocoles de canicule / grand froid"]
        }
      ],
      crisisCell: "Constitution immédiate de la cellule d'accueil inspection : Directeur, Cadre de santé / DSI, Médecin coordonnateur, Responsable Qualité."
    },
    dayJPhase: {
      title: "Phase 2 · Déroulement le jour J : les 6 étapes de la visite",
      steps: [
        {
          step: 1,
          name: "Accueil & vérification d'identité",
          action: "Vérifier la carte professionnelle et l'ordre de mission officiel des inspecteurs. Les installer dans une salle dédiée, calme, avec accès réseau et boissons."
        },
        {
          step: 2,
          name: "Réunion d'ouverture (30 à 45 min)",
          action: "Présentation concise de l'établissement par la direction : historique, capacité autorisée, profil des usagers, points forts et chantiers en cours. Écoute du périmètre exact de la mission d'inspection."
        },
        {
          step: 3,
          name: "Visite in situ des unités et des locaux",
          action: "Accompagnement par le cadre de santé et le directeur. Visite des chambres (en demandant l'autorisation préalable des résidents), des salles de soins, de la pharmacie, des locaux DASRI, de la cuisine et de la lingerie. Observation directe de la propreté, des équipements et des interactions soignants/usagers."
        },
        {
          step: 4,
          name: "Entretiens confidentiels avec le personnel et les usagers",
          action: "Les inspecteurs s'entretiennent seuls (sans la hiérarchie) avec des infirmiers, aides-soignants, représentants du personnel (CSE), membres du Conseil de la Vie Sociale (CVS) et des résidents volontaires."
        },
        {
          step: 5,
          name: "Contrôle approfondi sur pièces et logiciels",
          action: "Échantillonnage de dossiers patients/usagers dans le DPI/DUI : traçabilité des prescriptions médicales, concordances d'administration, projet personnalisé, consentement et fiche de liaison d'urgence."
        },
        {
          step: 6,
          name: "Réunion de restitution à chaud",
          action: "Synthèse orale immédiate délivrée par les inspecteurs : points de conformité, vulnérabilités constatées et urgences éventuelles. La direction écoute avec calme, prend des notes exhaustives et s'abstient de toute polémique agressive."
        }
      ]
    },
    postInspectionPhase: {
      title: "Phase 3 · Post-inspection : la phase contradictoire et le plan d'action",
      substeps: [
        {
          name: "1. Réception du rapport provisoire",
          desc: "L'ARS transmet le document sous 1 à 2 mois. S'ouvre alors la phase contradictoire légale : la direction dispose d'un délai impératif (généralement 3 semaines à 1 mois) pour formuler ses observations écrites."
        },
        {
          name: "2. Rédaction du mémoire en réponse contradictoire",
          desc: "Travail minutieux piloté par la direction et le cadre : répondre point par point à chaque constat, en apportant des preuves matérielles tangibles (photos de travaux réalisés, commandes de matériel, protocoles révisés, attestations de formation)."
        },
        {
          name: "3. Rapport définitif et typologie des décisions",
          desc: "Le directeur général de l'ARS notifie le rapport définitif pouvant contenir : des Recommandations (bonnes pratiques), des Prescriptions (obligations de mise en conformité sous délai fixé), ou des Injonctions sous astreinte financière (art. L. 313-14 CASF avec risque d'administration provisoire ou fermeture en cas de danger pour les usagers)."
        },
        {
          name: "4. Pilotage du Plan d'Actions Correctives (PAC)",
          desc: "Désignation de pilotes d'actions (ex: cadre de santé pour le circuit du médicament), calendrier de réalisation, présentation au Conseil d'Administration / Conseil de la Vie Sociale, et envoi régulier de rapports d'avancement à l'ARS."
        }
      ]
    },
    sources: ["arsInspection", "charteBientraitance", "casf"]
  };

  /* --- 6. CHANGEMENT DE DIRECTION DANS UN ÉTABLISSEMENT --- */
  const MANAGEMENT_TRANSITION_GUIDE = {
    overview: "Le changement de direction est une étape cruciale dans la vie d'un établissement de santé ou médico-social. Période de fragilité organisationnelle et de doute pour les équipes, c'est aussi une opportunité majeure de renouveau stratégique, d'impulsion de projets et de revalorisation de la qualité.",
    ethicalAnchor: "LA BIENTRAITANCE ET LA DIGNITÉ EN LIGNE DE MIRE : Quels que soient les bouleversements managériaux, les départs ou les réorganisations au sommet, le premier devoir de l'équipe d'encadrement est de faire rempart pour que jamais les résidents et patients ne subissent une dégradation de l'attention, de la sécurité ou du respect de leur dignité.",
    contexts: [
      {
        title: "Transition anticipée & fluide",
        desc: "Départ à la retraite programmé ou mobilité annoncée. Période de tuilage possible entre l'ancien et le nouveau directeur, transmission sereine des dossiers en cours."
      },
      {
        title: "Départ soudain / Crise institutionnelle",
        desc: "Révocation, démission brutale, burn-out ou crise majeure (conflit social dur, inspection sanction). Climat d'anxiété élevé et rumeurs au sein des équipes."
      },
      {
        title: "Direction par intérim",
        desc: "Désignation temporaire d'un cadre supérieur, d'un directeur adjoint ou d'un directeur d'établissement voisin pour gérer les affaires courantes en attendant le recrutement pérenne."
      },
      {
        title: "Fusion de groupement / Direction commune",
        desc: "Mutualisation de gouvernance au sein d'un GHT ou d'une association multi-sites. Déplacement du centre de décision et nécessité de réaffirmer la place de l'établissement."
      }
    ],
    challenges: [
      {
        icon: "heart",
        challenge: "1. Continuité de service & sécurité des personnes accueillies",
        desc: "Garantir qu'aucune rupture n'intervienne dans les soins, les approvisionnements, les circuits de sécurité ou l'accompagnement humain du quotidien."
      },
      {
        icon: "users",
        challenge: "2. Climat social & gestion de l'incertitude",
        desc: "Canaliser les rumeurs ('il va supprimer nos congés', 'on va fusionner les services'), rassurer les équipes soignantes et maintenir l'engagement au travail."
      },
      {
        icon: "clipboard",
        challenge: "3. Maintien des projets stratégiques et budgétaires",
        desc: "Poursuivre sans interruption la négociation du CPOM, la préparation de la certification HAS, le bouclage de l'EPRD/ERRD et le déploiement du Ségur numérique."
      },
      {
        icon: "network",
        challenge: "4. Relation de confiance avec les tutelles & les familles",
        desc: "Donner des gages de stabilité immédiate à l'ARS, au Conseil Départemental, aux membres du CVS et aux associations de familles."
      }
    ],
    cadreRole: {
      posture: [
        {
          title: "Pilier de stabilité opérationnelle",
          desc: "Le cadre de santé est le repère constant, visible et rassurant pour les soignants et les usagers. Sa présence sereine sur le terrain désamorce les angoisses du changement."
        },
        {
          title: "Devoir de réserve & loyauté institutionnelle",
          desc: "Neutralité absolue vis-à-vis du passé. Refuser le dénigrement de l'ancienne direction comme les procès d'intention envers la nouvelle. Accueillir le nouvel arrivant avec bienveillance professionnelle."
        },
        {
          title: "Courroie de transmission ascendante & descendante",
          desc: "Faire remonter fidèlement au nouveau dirigeant la réalité du terrain (atouts, fragilités réelles) sans fard mais sans alarmisme stérile ; et expliciter aux équipes le sens de la nouvelle vision stratégique."
        }
      ],
      handoverDossier: {
        title: "La constitution du 'Dossier de passation du service/pôle'",
        sections: [
          {
            name: "Volet Ressources Humaines",
            content: "Effectifs réels en ETP, postes vacants, compétences spécifiques, départs programmés, arrêts maladie de longue durée et climat relationnel de l'équipe."
          },
          {
            name: "Volet Résidents & Soins",
            content: "Profil de dépendance des personnes accueillies (GMP/PMP, GIR 1-2), situations cliniques instables, projets personnalisés en cours et dynamiques de vie sociale."
          },
          {
            name: "Volet Qualité & Risques",
            content: "Derniers événements indésirables déclarés (EIGS/FEI), actions de conformité HAS engagées, alertes techniques ou matérielles à résoudre en urgence."
          },
          {
            name: "Volet Projets & Perspectives",
            content: "Chantiers de réorganisation en cours (plannings, DUI, démarches bientraitance) et propositions constructives d'amélioration."
          }
        ]
      },
      firstMeetingTips: [
        "Adopter une posture d'écoute active pour saisir la vision managériale et les priorités du nouveau directeur.",
        "Présenter les réussites et les savoir-faire de son équipe avant de lister les difficultés.",
        "Être force de proposition et se positionner comme un partenaire opérationnel fiable et loyal.",
        "Réaffirmer la dignité de la personne soignée comme boussole commune indiscutable de toutes les décisions futures."
      ]
    },
    sources: ["publicServiceCode", "anap", "charteBientraitance"]
  };

  
  /* --- 8. SÉCURITÉ ERP & COMMISSION DE SÉCURITÉ DANS LES ÉTABLISSEMENTS DE SANTÉ ET MÉDICO-SOCIAUX --- */
  const ERP_SECURITY_GUIDE = {
    overview: "Les établissements de santé et médico-sociaux sont des Établissements Recevant du Public (ERP) soumis à une réglementation incendie renforcée (Code de la construction et de l'habitation - CCH, arrêté du 25 juin 1980 modifié). En raison de la vulnérabilité et de la non-autonomie des personnes accueillies, le principe fondamental n'est pas l'évacuation verticale brutale, mais le transfert horizontal vers des zones refuges compartimentées protégées des fumées et du feu.",
    categories: [
      { cat: "1ère catégorie", capacity: "Plus de 1 500 personnes (public + personnel)", visitPeriod: "Tous les 2 ans" },
      { cat: "2ème catégorie", capacity: "De 701 à 1 500 personnes", visitPeriod: "Tous les 2 ans" },
      { cat: "3ème catégorie", capacity: "De 301 à 700 personnes", visitPeriod: "Tous les 3 ans" },
      { cat: "4ème catégorie", capacity: "Moins de 300 personnes (hors 5ème catégorie)", visitPeriod: "Tous les 3 ans" },
      { cat: "5ème catégorie", capacity: "Petits établissements sous les seuils d'assujettissement", visitPeriod: "Pas de visite périodique obligatoire (sauf locaux à sommeil)" }
    ],
    types: [
      {
        type: "Type U · Établissements de soins (Sanitaire)",
        scope: "Centres hospitaliers, cliniques, SMR, maternités, hôpitaux de jour, unités psychiatriques.",
        rules: [
          "Principe du transfert horizontal : chaque niveau d'hospitalisation est divisé en au moins 2 zones protégées (compartiments coupe-feu 1h ou 2h) séparées par des portes pare-flammes à fermeture automatique.",
          "Système de Sécurité Incendie (SSI) obligatoire de Catégorie A avec détection automatique d'incendie (DAI) dans les chambres, circulations et locaux à risques.",
          "Dégagements et couloirs larges (au minimum 2 unités de passage = 1,40 m) pour permettre le passage aisé de lits médicalisés et brancards.",
          "Désenfumage mécanique renforcé des circulations horizontales et des locaux communs pour éviter l'asphyxie par les gaz de combustion.",
          "Obligation d'une équipe de sécurité incendie permanente (SSIAP 1, 2, 3) 24h/24 pour les établissements de 1ère et 2ème catégories."
        ]
      },
      {
        type: "Type J · Structures d'accueil pour personnes âgées et handicapées (Médico-social)",
        scope: "EHPAD, Résidences autonomie, Maisons d'Accueil Spécialisées (MAS), Foyers d'Accueil Médicalisé (FAM), IME avec internat.",
        rules: [
          "Locaux à sommeil hébergeant des résidents dépendants ne pouvant évacuer seuls en cas d'alerte.",
          "Cloisonnement traditionnel ou compartimentage coupe-feu garantissant au moins 30 minutes à 1 heure de résistance.",
          "Présence permanente de personnel qualifié 24h/24 capable de mettre en œuvre immédiatement le plan d'évacuation et les transferts horizontaux.",
          "Éclairage de sécurité (BAES - Blocs Autonomes d'Éclairage de Sécurité) et balisage lumineux des cheminements d'évacuation.",
          "Exercices d'évacuation obligatoires semestriels (au moins 2 par an), dont au moins un exercice simulant les conditions de nuit avec effectif réduit."
        ]
      }
    ],
    commissionSecurite: {
      role: "La Commission consultative départementale de sécurité et d'accessibilité (CCDSA) ou commission communale vérifie le respect scrupuleux des règles de sécurité contre les risques d'incendie et de panique. Elle émet un avis (favorable ou défavorable) transmis à l'autorité de police (le Maire ou le Préfet), qui prend l'arrêté autorisant l'ouverture ou ordonnant des travaux/fermeture.",
      composition: [
        { role: "Représentant du Préfet (Sous-préfet)", function: "Président de la commission" },
        { role: "Sapeur-Pompier préventionniste (SDIS)", function: "Rapporteur technique, réalise la visite d'inspection et teste les installations" },
        { role: "Maire de la commune (ou adjoint délégué)", function: "Détenteur du pouvoir de police générale sur la commune" },
        { role: "Représentant de la DDT (Direction Départementale des Territoires)", function: "Contrôle de conformité de l'accessibilité PMR et de l'urbanisme" },
        { role: "Officier de Police ou de Gendarmerie", function: "Sécurité publique et ordre" }
      ],
      deroulement: [
        "1. Accueil protocolaire : présentation par le directeur, le responsable technique et le coordonnateur SSI.",
        "2. Examen approfondi des pièces administratives : Registre de sécurité incendie, rapports de vérification périodique sans réserve, attestations de formation du personnel.",
        "3. Visite technique in situ : essai réel du désenfumage, déclenchement d'alarmes, vérification de la fermeture automatique des portes coupe-feu, fonctionnement des BAES, débit des colonnes sèches et RIA.",
        "4. Délibération à huis clos des membres de la commission.",
        "5. Notification du Procès-Verbal (PV) : lecture de l'avis et des prescriptions obligatoires à exécuter."
      ],
      avisConsequences: {
        favorable: "Autorisation d'exploitation poursuivie. Les prescriptions mineures éventuelles doivent être levées avec justificatifs transmis au secrétariat de la commission.",
        defavorable: "Risque maximal pour l'établissement. Mise en demeure par le Maire avec délai impératif pour exécuter les travaux de mise en conformité. En cas de péril imminent ou carence de la direction, le Maire ou le Préfet peut prononcer la fermeture administrative immédiate de l'établissement. La responsabilité pénale du directeur est directement engagée en cas de poursuite d'activité sans levée des réserves."
      }
    },
    documentsReglementaires: [
      {
        doc: "Registre de sécurité incendie",
        frequence: "Tenue continue, mise à jour immédiate",
        contenu: "Document légal côté et paraphé consignant toutes les vérifications techniques, formations incendie, exercices d'évacuation, consignes, dates des travaux et passages des commissions."
      },
      {
        doc: "Rapport Q18 (Contrôle électrique périodique)",
        frequence: "Annuel (par organisme agréé : Apave, Socotec, Dekra, etc.)",
        contenu: "Vérification exhaustive de la conformité des installations électriques basse et haute tension. Document exigé par la commission de sécurité et les assureurs."
      },
      {
        doc: "Certificat Q19 (Thermographie infrarouge)",
        frequence: "Annuel (opérateur certifié CNPP)",
        contenu: "Contrôle thermographique des armoires et tableaux électriques sous charge pour détecter les échauffements anormaux, faux contacts et risques d'arc avant départ de feu."
      },
      {
        doc: "Contrôle des Systèmes de Sécurité Incendie (SSI)",
        frequence: "Annuelle + contrat de maintenance préventive",
        contenu: "Vérification du tableau centralisateur (CMSI), des détecteurs automatiques, des déclencheurs manuels, des clapets coupe-feu et des alimentations de sécurité (AES)."
      },
      {
        doc: "Désenfumage & Portes coupe-feu",
        frequence: "Annuelle",
        contenu: "Essai des volets de désenfumage, moteurs d'extraction mécanique, exutoires de fumée en toiture et asservissements magnétiques des portes coupe-feu."
      },
      {
        doc: "Moyens de secours (Extincteurs, RIA, Colonnes sèches)",
        frequence: "Annuelle (extincteurs/RIA) + décennale (pression hydrostatique des colonnes)",
        contenu: "Contrôle de charge des extincteurs appropriés aux risques (eau pulvérisée, CO2), épreuve hydraulique des colonnes sèches, débit et pression minimale des RIA."
      },
      {
        doc: "Ascenseurs et monte-charges",
        frequence: "Contrôle technique quinquennal (tous les 5 ans) + entretien toutes les 6 semaines",
        contenu: "Rapport de contrôle par organisme indépendant et carnet d'entretien du constructeur/mainteneur. Dispositifs de secours et téléalarme 24h/24."
      },
      {
        doc: "Carnet sanitaire de l'eau & Recherche de légionnelles",
        frequence: "Surveillance mensuelle des températures + analyses semestrielles/annuelles de légionnelle",
        contenu: "Surveillance de Legionella pneumophila dans les réseaux d'Eau Chaude Sanitaire (ECS). Température de distribution maintenue au-dessus de 50°C aux points d'usage et > 55°C en boucle."
      },
      {
        doc: "Installations de gaz & Chaufferie",
        frequence: "Annuelle",
        contenu: "Vérification de l'étanchéité des canalisations, dispositifs de coupure d'urgence extérieure, ventilation des locaux de chauffe et rendement des chaudières."
      }
    ]
  };

  /* --- 9. VISITE DE CONFORMITÉ ARS / CONSEIL DÉPARTEMENTAL (CASF ART. D. 313-11) --- */
  const CONFORMITY_VISIT_GUIDE = {
    overview: "La visite de conformité est le contrôle administratif préalable et obligatoire conditionnant la mise en service effective de tout établissement ou service social ou médico-social (ESSMS) nouvellement autorisé, ou ayant réalisé une extension substantielle, une restructuration lourde ou un déménagement (articles L. 313-6 et D. 313-11 à D. 313-14 du Code de l'action sociale et des familles).",
    legalBasis: "Article D. 313-11 du CASF : 'L'établissement ou le service ne peut accueillir d'usagers tant qu'il n'a pas été procédé à la visite de conformité (...) et que l'autorisation d'ouverture n'a pas été notifiée.'",
    objectifs: [
      "Vérifier la stricte concordance entre les réalisations architecturales/matérielles et le projet autorisé lors de l'appel à projets.",
      "S'assurer que la sécurité des personnes accueillies, l'hygiène et les normes d'accessibilité sont intégralement respectées.",
      "Vérifier que les effectifs recrutés correspondent en nombre et en qualification aux engagements du projet d'établissement et du CPOM.",
      "Contrôler la complétude des outils de la loi 2002-2 (livret d'accueil, charte, contrat de séjour, règlement de fonctionnement, DLU/DUI)."
    ],
    deroulement: [
      {
        etape: "1. Demande de visite par le gestionnaire",
        details: "Au moins 2 mois avant la date projetée d'ouverture, le directeur adresse au DG de l'ARS et/ou au Président du Conseil Départemental le dossier de demande de visite de conformité avec les pièces d'urbanisme et de sécurité."
      },
      {
        etape: "2. Visite conjointe sur site",
        details: "Une délégation conjointe d'inspecteurs de l'ARS et de contrôleurs du Conseil Départemental parcourt l'intégralité des locaux : chambres, sanitaires, cuisines, pharmacie, espaces d'activité, bureaux soignants et issues de secours."
      },
      {
        etape: "3. Procès-Verbal de récolement & Constats",
        details: "La commission établit un procès-verbal de récolement listant les conformités observées et, le cas échéant, les réserves suspensives ou prescriptions à réaliser avant toute admission."
      },
      {
        etape: "4. Notification de l'Arrêté d'Ouverture",
        details: "Si la visite est concluante et les réserves levées, l'autorité conjointe (ARS / Département) prend l'arrêté autorisant l'ouverture officielle. Sans cet arrêté, toute admission de résident est illégale et engage la responsabilité pénale du directeur."
      }
    ],
    documentsRequis: [
      "Arrêté initial d'autorisation médico-sociale ou sanitaire",
      "Procès-verbal favorable de la Commission de Sécurité incendie (ERP)",
      "Attestation d'accessibilité aux personnes handicapées (PMR)",
      "Organigramme nominatif et copie des diplômes des professionnels recrutés",
      "Règlement de fonctionnement intérieur et Livret d'accueil validés",
      "Projet d'établissement et Projet de soins formalisés",
      "Contrats d'entretien et de maintenance des installations techniques et dispositifs médicaux",
      "Convention de pharmacie / PUI pour l'approvisionnement médicamenteux"
    ]
  };

  /* --- 10. MATÉRIOVIGILANCE : SURVEILLANCE & SIGNALEMENT DES DISPOSITIFS MÉDICAUX --- */
  const MATERIOVIGILANCE_GUIDE = {
    overview: "La matériovigilance a pour objet la surveillance des incidents ou des risques d'incidents résultant de l'utilisation des dispositifs médicaux (DM) après leur mise sur le marché (Code de la santé publique, articles L. 5212-2, R. 5212-1 et suivants). Elle s'applique à tous les DM : lits médicalisés, lève-personnes, matelas anti-escarres, pousse-seringues, défibrillateurs, sondes, fauteuils roulants et implants.",
    obligationsLegales: [
      "Désignation obligatoire d'un Correspondant Local de Matériovigilance (souvent pharmacien gérant de PUI, ingénieur biomédical ou cadre de santé) déclaré auprès de l'ANSM.",
      "Signalement obligatoire sans délai de tout incident ou risque d'incident grave ayant entraîné ou susceptible d'entraîner la mort ou une dégradation grave de l'état de santé d'un patient, d'un résident ou d'un soignant.",
      "Déclaration centralisée via le portail national des signalements d'événements sanitaires indésirables : signalement-sante.gouv.fr."
    ],
    procedureEnCasDIncident: [
      {
        action: "1. Prise en charge immédiate de la victime",
        detail: "Dispenser les soins d'urgence au patient/résident ou professionnel accidenté. Alerter le médecin coordonnateur ou le SAMU si nécessaire."
      },
      {
        action: "2. Mesure conservatoire de quarantaine",
        detail: "Isoler immédiatement le dispositif médical en cause. NE PAS le nettoyer, NE PAS le réparer, NE PAS modifier ses réglages. Conserver l'ensemble des consommables associés (tubulures, seringues, emballages, numéro de lot) dans un local sécurisé pour expertise contradictoire."
      },
      {
        action: "3. Traçabilité dans le dossier & GMAO",
        detail: "Noter dans le dossier patient/résident la référence précise de l'appareil, le numéro de série/lot et l'heure exacte de l'incident. Consigner l'incident dans la GMAO (Gestion de Maintenance Assistée par Ordinateur)."
      },
      {
        action: "4. Signalement officiel sous 48h",
        detail: "Le correspondant local de matériovigilance transmet la déclaration sur signalement-sante.gouv.fr à destination de l'ANSM, informe le fabricant du DM et notifie la direction de l'établissement."
      },
      {
        action: "5. Enquête interne & REX",
        detail: "Analyser les causes profondes (défaut matériel, usure, défaut de maintenance préventive, erreur humaine par défaut de formation au maniement du matériel) et mettre en place les actions correctives."
      }
    ]
  };

  /* --- 11. SYSTÈME SIRENA (PLATEFORME ARS DE SIGNALEMENT & SUIVI) --- */
  const SIRENA_SYSTEM_GUIDE = {
    overview: "SIRENA (Système d'Information de Recueil et d'Enregistrement des Notifications des ARS) est le système d'information national sécurisé utilisé au quotidien par les Agences Régionales de Santé pour le recueil, l'enregistrement, l'instruction, la traçabilité et le pilotage de l'ensemble des réclamations, signalements d'événements indésirables et alertes sanitaires survenus dans les établissements de santé et médico-sociaux.",
    missions: [
      "Centraliser tous les flux d'alertes sanitaires : Événements Indésirables Graves associés aux Soins (EIGS), signalements de maltraitance, infections associées aux soins (e-SIN), réclamations d'usagers ou de familles, conflits sociaux majeurs et défaillances techniques.",
      "Attribuer un numéro de dossier unique pour chaque signalement et assurer le suivi contradictoire entre l'ARS et la direction de l'établissement.",
      "Aider les inspecteurs de l'ARS à qualifier la gravité de l'événement et à décider des suites appropriées : demande d'explications écrites, inspection sur pièces, inspection inopinée sur site ou saisine du procureur (art. 40 CPP)."
    ],
    circuitSignalement: [
      {
        acteur: "Établissement (Directeur / Cadre)",
        role: "Télédéclaration sur le portail national des vigilances sanitaires (signalement-sante.gouv.fr) du Volet 1 de l'EIGS ou de la fiche de signalement d'événement grave sous 48 heures."
      },
      {
        acteur: "CVAGS de l'ARS (Cellule de Veille sanitaire)",
        role: "Réception dans SIRENA, évaluation immédiate du niveau de gravité, enregistrement de l'alerte et affectation au pôle inspection/régulation territorial."
      },
      {
        acteur: "Instruction ARS",
        role: "Examen des éléments fournis par l'établissement : plan d'actions correctives, analyse des causes racines (CREX/RMM) et transmission du Volet 2 sous 3 mois."
      },
      {
        acteur: "Clôture ou Suites coercitives",
        role: "Si les mesures sont jugées satisfaisantes, le dossier SIRENA est clôturé. En cas de carence grave ou récurrence anormale, déclenchement d'une mission d'inspection ou injonction sous astreinte."
      }
    ]
  };

  /* --- 12. NAPIR & MESURES PORTANT ATTEINTE AU DROIT D'ALLER ET VENIR --- */
  const NAPIR_LIBERTY_GUIDE = {
    overview: "Le droit d'aller et venir est une liberté fondamentale à valeur constitutionnelle, réaffirmée pour les usagers des établissements de santé et médico-sociaux par la loi du 2 janvier 2002 (art. L. 311-3 du CASF), la Charte des droits et libertés de la personne accueillie, et renforcée par la loi du 8 avril 2024 portant mesures pour bâtir la société du bien vieillir (art. 11 sur le droit de visite et la liberté de déplacement). Toute mesure restreignant cette liberté (appelée dans certaines institutions NAPIR : Note/Notification d'Atteinte à la Personne et d'Interdiction de Rayonnement, ou protocole de restriction d'aller et venir) constitue une atteinte grave qui doit demeurer strictement exceptionnelle, médicalement justifiée et proportionnée.",
    dispositifsConcernes: [
      "Contention physique passive : barrières de lit bilatérales, ceintures de maintien au fauteuil ou au lit, tablettes de fauteuil verrouillées.",
      "Restriction spatiale & isolement : portes d'unités protégées à code d'accès électronique (UVP, PASA, UHR), fermeture à clé de la chambre, interdiction de sortie du service.",
      "Surveillance électronique : bracelets anti-fugue, détecteurs de passage, balises GPS ou vidéosurveillance des circulations."
    ],
    principesCardinaux: [
      {
        principe: "1. Subsidiarité absolue",
        regle: "La restriction ne peut être envisagée qu'en dernier recours, après échec documenté de toutes les alternatives non contraignantes (désamorçage verbal, réassurance, présence soignante, aménagement ergonomique, matelas au sol, abaissement du lit)."
      },
      {
        principe: "2. Prescription médicale obligatoire & individualisée",
        regle: "Seul un médecin peut prescrire une mesure restrictive de liberté. La prescription doit mentionner l'indication clinique précise, le matériel exact utilisé, les horaires et la durée maximale (réévaluation obligatoire au moins toutes les 24h à 48h)."
      },
      {
        principe: "3. Concertation pluriprofessionnelle & Consentement",
        regle: "La décision doit être débattue en équipe pluridisciplinaire (médecin coordonnateur, cadre, IDE, psychologue, AS). La personne accueillie doit être informée et son consentement recherché ; son représentant légal (tuteur/curateur) ou sa personne de confiance doit être systématiquement prévenu."
      },
      {
        principe: "4. Traçabilité rigoureuse & Surveillance continue",
        regle: "Ouverture obligatoire d'une fiche de suivi de la contention/restriction dans le DUI : contrôle de la tolérance cutanée, hydratation, soulagement régulier, surveillance des constantes et levées programmées de la contention."
      }
    ],
    risquesJuridiquesEtPenaux: "Une contention ou un enfermement non justifié, sans prescription médicale valide ou maintenu au-delà du strict nécessaire expose le directeur et les soignants à des poursuites pénales pour séquestration arbitraire (art. 224-1 du Code pénal), violences volontaires ou homicide involontaire en cas de strangulation/chute mortelle avec barrière.",
    checkListCadre: [
      "Vérifier que chaque barrière de lit ou ceinture fait l'objet d'une prescription médicale nominative en cours de validité dans le dossier de soins.",
      "Contrôler que la fiche de surveillance horaire est effectivement remplie par les équipes soignantes de jour comme de nuit.",
      "S'assurer que les codes d'accès des portes d'unités protégées sont affichés pour les usagers qui disposent de leurs facultés cognitives.",
      "Organiser une réévaluation collégiale hebdomadaire pour tenter la levée de la mesure dès que possible."
    ]
  };

  /* --- 13. RESPONSABILITÉ PÉNALE DU DIRECTEUR D'ÉTABLISSEMENT DE SANTÉ & MÉDICO-SOCIAL --- */
  const DIRECTOR_PENAL_RESPONSIBILITY_GUIDE = {
    overview: "La fonction de chef d'établissement (sanitaire public, privé ESPIC ou commercial, médico-social public ou associatif) confère un pouvoir d'organisation, de gestion et de commandement qui s'accompagne d'une responsabilité pénale personnelle de premier plan. Contrairement à la responsabilité civile ou administrative (couverte par l'assurance ou prise en charge par la personne morale), la responsabilité pénale sanctionne une faute personnelle et expose le dirigeant à des amendes pénales et des peines d'emprisonnement non assurables.",
    fondements: [
      {
        principe: "Cumul possible Personne Morale / Personne Physique (Art. 121-2 Code pénal)",
        detail: "La responsabilité pénale des personnes morales (l'hôpital, l'association gestionnaire, la société commerciale) n'exclut pas celle des personnes physiques auteurs ou complices des mêmes faits. Le directeur peut être poursuivi à titre personnel aux côtés de son établissement."
      },
      {
        principe: "Faute non intentionnelle & Loi Fauchon du 10 juillet 2000 (Art. 121-3 Code pénal)",
        detail: "La plupart des infractions en santé sont non intentionnelles (imprudence, négligence). La loi distingue l'auteur direct (le soignant qui commet l'acte) et l'auteur indirect (le directeur, qui a créé la situation ayant permis la réalisation du dommage ou qui n'a pas pris les mesures pour l'éviter). Pour condamner le directeur en auteur indirect, la justice doit prouver soit une violation manifestement délibérée d'une obligation particulière de prudence ou de sécurité prévue par la loi, soit une faute caractérisée exposant autrui à un risque d'une particulière gravité qu'il ne pouvait ignorer."
      }
    ],
    principalesInfractions: [
      {
        nom: "Homicide involontaire (Art. 221-6 CP) & Blessures involontaires (Art. 222-19 CP)",
        sanction: "Jusqu'à 3 ans d'emprisonnement et 45 000 € d'amende (portés à 5 ans et 75 000 € en cas de manquement délibéré)",
        exemplesJurisprudence: [
          "Fugue mortelle d'un résident désorienté en hiver par une issue de secours dont l'alarme était défectueuse ou désactivée.",
          "Chute mortelle d'un patient par défenestration en l'absence d'entrebâilleurs réglementaires sur les fenêtres des étages.",
          "Erreur d'administration médicamenteuse létale consécutive à un sous-effectif critique chronique alerté par écrit sans mesure palliative prise par la direction.",
          "Intoxication alimentaire collective (TIAC) liée au non-respect des règles HACCP et rupture de la chaîne du froid.",
          "Asphyxie par incendie dans un établissement n'ayant pas réalisé les vérifications de désenfumage ou n'ayant pas formé le personnel."
        ]
      },
      {
        nom: "Mise en danger délibérée de la personne d'autrui (Art. 223-1 CP)",
        sanction: "1 an d'emprisonnement et 15 000 € d'amende (même en l'absence de tout accident effectif)",
        exemplesJurisprudence: [
          "Poursuite de l'exploitation d'un ERP sous avis défavorable de la commission de sécurité sans réaliser les travaux prescrits en matière d'évacuation incendie.",
          "Maintien en service d'installations électriques vétustes présentant des risques avérés d'électrocution ou de départ de feu (rapports Q18 restés sans suite).",
          "Défaut d'entretien des tours aéroréfrigérantes ou du réseau d'eau chaude générant une prolifération massive de légionnelles."
        ]
      },
      {
        nom: "Non-assistance à personne en péril (Art. 223-6 alinéa 2 CP)",
        sanction: "5 ans d'emprisonnement et 75 000 € d'amende",
        exemplesJurisprudence: [
          "Refus injustifié d'admission en urgence d'une personne en détresse vitale se présentant à l'entrée de l'établissement.",
          "Absence de déclenchement des secours médicaux extérieurs (SAMU) face à une dégradation brutale de l'état d'un résident."
        ]
      },
      {
        nom: "Non-dénonciation de maltraitances sur personnes vulnérables (Art. 434-3 CP)",
        sanction: "3 ans d'emprisonnement et 45 000 € d'amende",
        exemplesJurisprudence: [
          "Le directeur qui a connaissance de sévices, violences physiques, humiliations ou privations infligées à un résident ou patient vulnérable (mineur, personne âgée ou handicapée) a l'obligation légale absolue d'en informer sans délai les autorités judiciaires (Procureur de la République) ou administratives (ARS/Département).",
          "Dérogation expresse au secret professionnel : l'article 226-14 du Code pénal délie expressément le directeur et les professionnels du secret pour dénoncer ces sévices."
        ]
      },
      {
        nom: "Infractions aux règles de santé et de sécurité au travail (Code du travail)",
        sanction: "Amendes pénales jusqu'à 10 000 € par salarié concerné et sanctions d'emprisonnement en cas de récidive",
        exemplesJurisprudence: [
          "Défaut d'élaboration ou de mise à jour annuelle du Document Unique d'Évaluation des Risques Professionnels (DUERP).",
          "Accident du travail grave d'un soignant lors de la manipulation d'un lève-personne non entretenu ou faute de formation à la manutention (PRAP).",
          "Absence d'équipements de protection individuelle (EPI) lors de manipulations de produits cytotoxiques ou désinfectants dangereux."
        ]
      }
    ],
    delegationPouvoir: {
      principe: "La délégation de pouvoir est le mécanisme juridique par lequel le chef d'établissement transfère à un subordonné (directeur adjoint, cadre supérieur, directeur technique) la compétence, l'autorité et les moyens nécessaires pour faire respecter une réglementation déterminée, transférant ainsi la responsabilité pénale afférente sur le délégataire.",
      conditionsValidite: [
        {
          critere: "C · Compétence",
          exigence: "Le délégataire doit posséder les connaissances techniques, juridiques et professionnelles requises pour la mission (diplômes, formations spécifiques en sécurité incendie, gestion des risques, etc.)."
        },
        {
          critere: "A · Autorité",
          exigence: "Le délégataire doit disposer d'un véritable pouvoir de commandement et de décision, sans avoir à solliciter systématiquement l'accord du directeur. Il doit pouvoir donner des ordres et disposer du pouvoir de sanctionner les manquements."
        },
        {
          critere: "M · Moyens",
          exigence: "Le délégataire doit disposer de moyens financiers autonomes (budget délégué suffisant pour engager des travaux urgents de mise en conformité) et de moyens humains et matériels adéquats."
        }
      ],
      limites: [
        "La délégation générale et globale est nulle : le directeur ne peut pas se décharger de l'intégralité de sa fonction.",
        "Le directeur reste toujours responsable de la surveillance de ses délégataires et de l'organisation générale de l'établissement.",
        "Pas de sous-délégation sans autorisation expresse de l'acte initial de délégation."
      ]
    },
    guideReflexeGardeAVue: [
      "1. Prendre contact immédiatement avec l'avocat de l'établissement ou son avocat personnel spécialisé en droit pénal de la santé.",
      "2. Exercer son droit au silence : ne faire aucune déclaration à chaud sans avoir consulté l'avocat et pris connaissance des faits précis reprochés.",
      "3. Demander systématiquement un examen médical et l'assistance de l'avocat dès la première minute de la garde à vue.",
      "4. En cas de perquisition : exiger la présentation de la commission rogatoire ou de l'autorisation du juge, faire consigner les observations et conserver copie de l'inventaire des scellés.",
      "5. Ne jamais altérer, modifier ou détruire un document, registre ou dossier médical après un incident (risque d'entrave à la justice et de détention provisoire)."
    ]
  };

  /* --- 7. GLOSSAIRE EXHAUSTIF DES SIGLES DE LA SANTÉ & MÉDICO-SOCIAL --- */
  const GLOSSARY_TERMS = [

    { sigle: "BAES", full: "Bloc Autonome d'Éclairage de Sécurité", cat: "Qualité & Soins", def: "Dispositif d'éclairage de secours obligatoire dans les ERP assurant le balisage des issues et cheminements d'évacuation en cas de coupure du courant général." },
    { sigle: "CS", full: "Commission de Sécurité (contre les risques d'incendie et de panique)", cat: "Instances & Tutelles", def: "Organisme officiel pluridisciplinaire (SDIS, Préfecture, Mairie, DDT) contrôlant la conformité incendie des ERP et délivrant un avis conforme (favorable ou défavorable)." },
    { sigle: "ERP", full: "Établissement Recevant du Public", cat: "Qualité & Soins", def: "Bâtiment dans lequel des personnes extérieures sont admises. Classé en 5 catégories et types d'activités (Type U pour les soins, Type J pour le médico-social) soumis à une stricte réglementation incendie." },
    { sigle: "MV", full: "Matériovigilance", cat: "Qualité & Soins", def: "Système de surveillance et de déclaration obligatoire auprès de l'ANSM des incidents ou risques d'incidents résultant de l'utilisation de dispositifs médicaux (DM)." },
    { sigle: "NAPIR", full: "Mesure portant atteinte au droit d'aller et venir (Note d'Atteinte à la Personne et d'Interdiction de Rayonnement)", cat: "RH & Droit", def: "Protocole d'encadrement strict et d'évaluation des mesures privatives ou restrictives de liberté (contention physique, isolement, unités fermées, bracelets anti-fugue) dans le respect de la loi 2002-2 et de la loi Bien Vieillir 2024." },
    { sigle: "Q18", full: "Rapport de vérification périodique des installations électriques", cat: "Qualité & Soins", def: "Rapport annuel obligatoire établi par un organisme agréé vérifiant la conformité et la sécurité des installations électriques dans un ERP, exigé par les assureurs et commissions." },
    { sigle: "Q19", full: "Certificat de contrôle thermographique infrarouge", cat: "Qualité & Soins", def: "Contrôle préventif annuel des armoires électriques par caméra thermique pour détecter les échauffements anormaux et court-circuits avant tout départ d'incendie." },
    { sigle: "RIA", full: "Robinet d'Incendie Armé", cat: "Qualité & Soins", def: "Équipement de première intervention incendie alimenté en eau sous pression permanente, vérifié annuellement pour permettre au personnel d'attaquer un feu naissant." },
    { sigle: "SIRENA", full: "Système d'Information de Recueil et d'Enregistrement des Notifications des ARS", cat: "Instances & Tutelles", def: "Plateforme informatique sécurisée des Agences Régionales de Santé centralisant l'enregistrement, l'instruction et le suivi de l'ensemble des réclamations, alertes et EIGS." },
    { sigle: "SSI", full: "Système de Sécurité Incendie", cat: "Qualité & Soins", def: "Ensemble des matériels assurant la détection automatique ou manuelle d'un incendie, la mise en sécurité de l'ERP (compartimentage, désenfumage, déverrouillage des issues) et l'évacuation (catégorie A obligatoire en type U et J)." },
    { sigle: "VC", full: "Visite de Conformité (CASF D. 313-11)", cat: "Instances & Tutelles", def: "Contrôle sur site obligatoire effectué conjointement par l'ARS et/ou le Conseil Départemental avant la première admission d'usagers dans tout ESSMS nouvellement autorisé ou après restructuration lourde." },

    { sigle: "AAH", full: "Allocation aux Adultes Handicapés", cat: "Médico-social", def: "Prestation financière versée par la CAF/MSA assurant un minimum de ressources aux personnes en situation de handicap, attribuée sur décision de la CDAPH au sein de la MDPH." },
    { sigle: "AES", full: "Accompagnant Éducatif et Social (ou Accident d'Exposition au Sang)", cat: "RH & Droit", def: "Professionnel soignant diplômé d'État accompagnant au quotidien les personnes vulnérables (ex-AMP/AVS) ; ou dans le contexte de sécurité des soins : Accident d'Exposition au Sang nécessitant une prise en charge urgente." },
    { sigle: "AFGSU", full: "Attestation de Formation aux Gestes et Soins d'Urgence", cat: "Qualité & Soins", def: "Formation réglementaire obligatoire pour les professionnels de santé (niveaux 1 et 2), renouvelable tous les 4 ans pour garantir la réactivité face aux urgences vitales." },
    { sigle: "AGGIR", full: "Autonomie Gérontologie Groupes Iso-Ressources", cat: "Médico-social", def: "Grille nationale d'évaluation de la perte d'autonomie des personnes âgées, mesurant 10 variables discriminantes et 7 variables illustratives pour déterminer le GIR (de 1 à 6)." },
    { sigle: "AJPA", full: "Allocation Journalière du Proche Aidant", cat: "RH & Droit", def: "Indemnisation financière versée par la CAF permettant aux salariés ou fonctionnaires de suspendre temporairement leur activité pour s'occuper d'un proche en situation de dépendance ou de handicap." },
    { sigle: "AJPP", full: "Allocation Journalière de Présence Parentale", cat: "RH & Droit", def: "Prestation versée au parent qui suspend ou réduit son activité professionnelle pour rester auprès d'un enfant malade, accidenté ou handicapé dont l'état exige une présence soutenue." },
    { sigle: "ALD", full: "Affection de Longue Durée", cat: "Sanitaire", def: "Maladie grave et/ou chronique (ALD 30, liste fixée par décret) ouvrant droit à une prise en charge à 100% par l'Assurance Maladie des soins et traitements liés à cette pathologie." },
    { sigle: "AMP", full: "Aide Médico-Psychologique", cat: "RH & Droit", def: "Ancien diplôme d'État d'accompagnant du secteur médico-social, intégré depuis 2016 dans le diplôme d'Accompagnant Éducatif et Social (DEAES)." },
    { sigle: "ANAP", full: "Agence Nationale d'Appui à la Performance des établissements de santé et médico-sociaux", cat: "Instances & Tutelles", def: "Agence publique d'expertise apportant conseils, grilles d'audit, méthodes d'organisation et outils de gestion aux directions d'établissements sanitaires et médico-sociaux." },
    { sigle: "ANS", full: "Agence du Numérique en Santé", cat: "Instances & Tutelles", def: "Opérateur public chargé de définir et déployer la politique publique du numérique en santé (cadre d'interopérabilité, référentiels de sécurité, MSSanté, INS, programme Ségur)." },
    { sigle: "ANSM", full: "Agence Nationale de Sécurité du Médicament et des produits de santé", cat: "Instances & Tutelles", def: "Établissement public garantissant la sécurité, l'évaluation, l'accès équitable et le bon usage des médicaments, dispositifs médicaux et produits biologiques en France." },
    { sigle: "APA", full: "Allocation Personnalisée d'Autonomie", cat: "Médico-social", def: "Prestation sociale universelle attribuée par le Conseil Départemental aux personnes âgées de 60 ans et plus en perte d'autonomie (GIR 1 à 4), à domicile ou en établissement (EHPAD)." },
    { sigle: "ARS", full: "Agence Régionale de Santé", cat: "Instances & Tutelles", def: "Établissement public de l'État sous tutelle ministérielle, chargé d'organiser l'offre de soins, la prévention, la veille sanitaire, la régulation et le contrôle des établissements de santé et médico-sociaux dans chaque région." },
    { sigle: "AS", full: "Aide-Soignant(e)", cat: "RH & Droit", def: "Professionnel de santé diplômé d'État travaillant sous la responsabilité de l'infirmier pour dispenser les soins d'hygiène, de confort et préserver l'autonomie du patient/résident." },
    { sigle: "ASH", full: "Agent des Services Hospitaliers", cat: "RH & Droit", def: "Professionnel chargé de l'hygiène, du bionettoyage des locaux, de la distribution des repas et de l'aide matérielle au confort des personnes accueillies." },
    { sigle: "CA", full: "Congés Annuels (ou Conseil d'Administration)", cat: "RH & Droit", def: "Congés payés légaux annuels (25 jours ouvrés) acquis par les professionnels ; ou organe délibérant de gouvernance d'un établissement public ou associatif." },
    { sigle: "CAF", full: "Caisse d'Allocations Familiales", cat: "Instances & Tutelles", def: "Branche Famille de la Sécurité sociale versant les prestations familiales, aides au logement, PreParE, AJPA, AAH et aides d'action sociale." },
    { sigle: "CAFDES", full: "Certificat d'Aptitude aux Fonctions de Directeur d'Établissement ou de Service d'intervention sociale", cat: "Instances & Tutelles", def: "Diplôme de niveau 7 (Master) délivré par l'EHESP, formant les directeurs d'ESSMS (EHPAD, MAS, FAM, IME)." },
    { sigle: "CARSAT", full: "Caisse d'Assurance Retraite et de la Santé au Travail", cat: "Instances & Tutelles", def: "Organisme régional de Sécurité sociale gérant la retraite du régime général et assurant la prévention et tarification des risques professionnels (AT/MP)." },
    { sigle: "CASF", full: "Code de l'Action Sociale et des Familles", cat: "RH & Droit", def: "Recueil législatif et réglementaire fondamental régissant le fonctionnement, les autorisations et les droits des usagers dans les établissements médico-sociaux (ESSMS)." },
    { sigle: "CATTP", full: "Centre d'Accueil Thérapeutique à Temps Partiel", cat: "Sanitaire", def: "Structure sanitaire ambulatoire rattachée à un secteur de psychiatrie, proposant des soins collectifs et des activités adaptées pour maintenir l'insertion sociale." },
    { sigle: "CCN51", full: "Convention Collective Nationale du 31 octobre 1951 (FEHAP)", cat: "RH & Droit", def: "Convention collective applicable aux établissements privés à but non lucratif du secteur sanitaire, social et médico-social (adhérents FEHAP)." },
    { sigle: "CCN66", full: "Convention Collective Nationale du 15 mars 1966 (Nexem)", cat: "RH & Droit", def: "Convention collective régissant le secteur associatif médico-social accompagnant les personnes en situation de handicap, enfants et adultes en difficulté sociale." },
    { sigle: "CD", full: "Conseil Départemental", cat: "Instances & Tutelles", def: "Collectivité territoriale chef de file de l'action sociale (aide sociale à l'enfance, APA, PCH, tutelle des EHPAD conjointement avec l'ARS, financement du handicap)." },
    { sigle: "CDAPH", full: "Commission des Droits et de l'Autonomie des Personnes Handicapées", cat: "Médico-social", def: "Instance décisionnelle de la MDPH qui statue sur l'attribution des aides (AAH, PCH, carte mobilité) et les orientations en établissements médico-sociaux (MAS, FAM, ESAT, IME)." },
    { sigle: "CDS", full: "Centre De Santé", cat: "Sanitaire", def: "Structure sanitaire de proximité assurant des soins ambulatoires de premier recours en tiers payant intégral, gérée par des collectivités, mutuelles ou associations." },
    { sigle: "CDU", full: "Commission Des Usagers", cat: "Qualité & Soins", def: "Instance hospitalière obligatoire chargée de veiller au respect des droits des usagers, de faciliter leurs démarches de réclamation et de participer à l'amélioration de la qualité." },
    { sigle: "CET", full: "Compte Épargne-Temps", cat: "RH & Droit", def: "Dispositif permettant aux salariés et fonctionnaires d'accumuler des droits à congés rémunérés ou de bénéficier d'une rémunération en contrepartie de périodes de repos non prises." },
    { sigle: "CFP", full: "Congé de Formation Professionnelle (ou Compte Formation)", cat: "RH & Droit", def: "Congé permettant à un professionnel de suivre une formation longue de perfectionnement ou de reconversion avec maintien partiel de sa rémunération." },
    { sigle: "CH / CHU", full: "Centre Hospitalier / Centre Hospitalier Universitaire", cat: "Sanitaire", def: "Établissement public de santé dispensant des soins de proximité ou de recours, assurant en CHU une triple mission de soins, d'enseignement médical et de recherche clinique." },
    { sigle: "CITIS", full: "Congé pour Invalidité Temporaire Imputée au Service", cat: "RH & Droit", def: "Régime d'indemnisation de la Fonction Publique Hospitalière garantissant le maintien à 100% du plein traitement et des frais médicaux consécutifs à un accident de service ou maladie pro." },
    { sigle: "CLD", full: "Congé de Longue Durée", cat: "RH & Droit", def: "Congé accordé aux fonctionnaires atteints de l'une des 5 pathologies lourdes prévues par la loi (cancer, maladie mentale, tuberculose, polio, sida) : 3 ans à plein traitement, 2 ans à demi-traitement." },
    { sigle: "CLM", full: "Congé de Longue Maladie", cat: "RH & Droit", def: "Congé statutaire de la FPH accordé pour affection grave nécessitant un traitement prolongé : 1 an à plein traitement, 2 ans à demi-traitement sur une durée totale de 3 ans." },
    { sigle: "CMO", full: "Congé de Maladie Ordinaire", cat: "RH & Droit", def: "Congé maladie de droit commun dans la fonction publique hospitalière : 3 mois à plein traitement, 9 mois à demi-traitement sur 12 mois glissants, après 1 jour de carence." },
    { sigle: "CMP", full: "Centre Médico-Psychologique", cat: "Sanitaire", def: "Pivot territorial de la psychiatrie de secteur, dispensant des consultations gratuites pluridisciplinaires (psychiatres, psychologues, infirmiers) sans hébergement." },
    { sigle: "CNAV", full: "Caisse Nationale d'Assurance Vieillesse", cat: "Instances & Tutelles", def: "Établissement public gérant la branche Retraite du régime général de la Sécurité sociale pour les salariés du secteur privé." },
    { sigle: "CNSA", full: "Caisse Nationale de Solidarité pour l'Autonomie", cat: "Instances & Tutelles", def: "Pilote de la 5e branche de la Sécurité sociale (branche Autonomie), finançant les aides aux personnes âgées et en situation de handicap et régulant les budgets des ESMS." },
    { sigle: "CPAM", full: "Caisse Primaire d'Assurance Maladie", cat: "Instances & Tutelles", def: "Organisme local de la Sécurité sociale assurant la gestion des droits aux soins (remboursements, IJSS, ALD, AT/MP) des assurés du régime général." },
    { sigle: "CPOM", full: "Contrat Pluriannuel d'Objectifs et de Moyens", cat: "Qualité & Soins", def: "Contrat stratégique conclu pour 5 ans entre un gestionnaire d'établissement et ses autorités de tarification (ARS, Département) fixant les objectifs d'activité, qualité et allocations budgétaires." },
    { sigle: "CPTS", full: "Communauté Professionnelle Territoriale de Santé", cat: "Sanitaire", def: "Organisation coordonnée des professionnels de santé d'un territoire (médecins, pharmaciens, infirmiers libéraux, hôpitaux) pour améliorer l'accès aux soins et la prévention." },
    { sigle: "CREX", full: "Comité de Retour d'EXpérience", cat: "Qualité & Soins", def: "Instance pluridisciplinaire interne d'un établissement analysant collectivement et sans esprit punitif les causes profondes d'un événement indésirable survenu pour éviter sa récidive." },
    { sigle: "CSAL", full: "Comité Social d'Administration Locale", cat: "RH & Droit", def: "Instance représentative du personnel dans les établissements publics de santé (remplaçant les comités techniques d'établissement), consultée sur les organisations et le fonctionnement." },
    { sigle: "CSE", full: "Comité Social et Économique", cat: "RH & Droit", def: "Instance représentative unique du personnel dans le secteur privé, exerçant les attributions économiques, sociales et de préservation de la santé au travail." },
    { sigle: "CVS", full: "Conseil de la Vie Sociale", cat: "Médico-social", def: "Instance démocratique obligatoire en ESSMS où siègent résidents, familles et salariés pour donner leur avis sur le fonctionnement, les repas, les activités et les projets de l'établissement." },
    { sigle: "D3S", full: "Directeur d'Établissement Sanitaire, Social et Médico-Social", cat: "RH & Droit", def: "Corps de direction de la Fonction Publique Hospitalière (catégorie A+) formé à l'EHESP, dirigeant des EHPAD publics, des MAS, des foyers ou des centres hospitaliers de proximité." },
    { sigle: "DAC", full: "Dispositif d'Appui à la Coordination", cat: "Sanitaire", def: "Guichet unique territorial venant en appui aux professionnels de santé et sociaux pour coordonner les parcours de santé complexes sans distinction d'âge ou de pathologie." },
    { sigle: "DGCS", full: "Direction Générale de la Cohésion Sociale", cat: "Instances & Tutelles", def: "Direction ministérielle concevant et pilotant les politiques publiques relatives aux personnes vulnérables, au handicap, au grand âge et à l'action sociale." },
    { sigle: "DGOS", full: "Direction Générale de l'Offre de Soins", cat: "Instances & Tutelles", def: "Direction ministérielle chargée du pilotage, de la régulation et de l'organisation de l'offre de soins hospitalière et ambulatoire en France." },
    { sigle: "DH", full: "Directeur d'Hôpital", cat: "RH & Droit", def: "Haut fonctionnaire de la Fonction Publique Hospitalière (catégorie A+) dirigeant un Centre Hospitalier ou un CHU après formation à l'EHESP." },
    { sigle: "DIM", full: "Département d'Information Médicale", cat: "Sanitaire", def: "Service hospitalier piloté par un médecin DIM chargé du recueil, du codage médico-économique des séjours (PMSI) et de la valorisation de l'activité tarifée à l'activité (T2A)." },
    { sigle: "DMP", full: "Dossier Médical Partagé", cat: "Qualité & Soins", def: "Carnet de santé numérique sécurisé intégré à 'Mon espace santé', accessible par le patient et les professionnels autorisés pour partager antécédents, traitements et comptes-rendus." },
    { sigle: "DPI", full: "Dossier Patient Informatisé", cat: "Qualité & Soins", def: "Système d'information hospitalier centralisant l'ensemble des données médicales, soignantes et administratives du patient hospitalisé." },
    { sigle: "DREES", full: "Direction de la Recherche, des Études, de l'Évaluation et des Statistiques", cat: "Instances & Tutelles", def: "Service statistique public produisant les données de référence sur la santé, les comptes de la Sécurité sociale, les effectifs soignants et la démographie médicale." },
    { sigle: "DSI", full: "Direction des Soins Infirmiers (ou Système d'Information)", cat: "RH & Droit", def: "Direction stratégique des activités soignantes, de rééducation et médico-techniques au sein d'un hôpital ; ou Direction des Systèmes d'Information." },
    { sigle: "DUD", full: "Dossier Unique du Demandeur", cat: "Médico-social", def: "Dossier standardisé de demande d'admission en EHPAD, comprenant un volet administratif renseigné par l'usager et un volet médical sous pli confidentiel (ViaTrajectoire)." },
    { sigle: "DUI", full: "Dossier Usager Informatisé", cat: "Qualité & Soins", def: "Logiciel métier médico-social garantissant le suivi personnalisé, les transmissions soignantes, le projet de vie et la sécurité des données des personnes accompagnées (Ségur ESSMS)." },
    { sigle: "DUERP", full: "Document Unique d'Évaluation des Risques Professionnels", cat: "RH & Droit", def: "Document obligatoire et légal de l'employeur recensant tous les risques physiques, chimiques, biologiques et psychosociaux dans l'établissement, assorti d'un plan d'actions (PAPRIPACT)." },
    { sigle: "EHPAD", full: "Établissement d'Hébergement pour Personnes Âgées Dépendantes", cat: "Médico-social", def: "Structure médico-sociale médicalisée accueillant des personnes âgées de 60 ans et plus en perte d'autonomie physique ou cognitive nécessitant une aide quotidienne et des soins 24h/24." },
    { sigle: "EHESP", full: "École des Hautes Études en Santé Publique", cat: "Instances & Tutelles", def: "Grande école publique située à Rennes assurant la formation statutaire des directeurs d'hôpitaux (DH), d'établissements médico-sociaux (D3S) et directeurs de soins." },
    { sigle: "EIGS", full: "Événement Indésirable Grave associé aux Soins", cat: "Qualité & Soins", def: "Tout événement inattendu survenu lors d'un acte de soin ou d'accompagnement entraînant le décès, la mise en jeu du pronostic vital ou un déficit fonctionnel permanent, soumis à déclaration obligatoire à l'ARS." },
    { sigle: "EPRD", full: "État des Prévisions de Recettes et de Dépenses", cat: "Instances & Tutelles", def: "Budget prévisionnel pluriannuel des établissements de santé et médico-sociaux sous CPOM, structuré en comptes de résultat prévisionnels et tableaux d'investissements." },
    { sigle: "ERRD", full: "État Réalisé des Recettes et des Dépenses", cat: "Instances & Tutelles", def: "Document budgétaire de clôture financière constatant les recettes et dépenses réelles de l'exercice écoulé dans les établissements sous cadre EPRD." },
    { sigle: "ESAT", full: "Établissement et Service d'Accompagnement par le Travail", cat: "Médico-social", def: "Structure médico-sociale permettant aux adultes en situation de handicap d'exercer une activité professionnelle adaptée assortie d'un soutien médico-social et éducatif." },
    { sigle: "ETP", full: "Équivalent Temps Plein", cat: "RH & Droit", def: "Unité de mesure standardisée de la charge de travail représentant le temps de travail d'un salarié à temps complet sur une période donnée (35h hebdo)." },
    { sigle: "ETPT", full: "Équivalent Temps Plein Travaillé", cat: "RH & Droit", def: "Mesure de la ressource humaine réelle mobilisée, proratisée sur l'année en tenant compte des dates d'embauche, des départs et des quotités contractuelles réelles." },
    { sigle: "F3SCT", full: "Formation Spécialisée en Santé, Sécurité et Conditions de Travail", cat: "RH & Droit", def: "Commission spécialisée du CSE (privé) ou du CSAL (public) compétente pour analyser les risques professionnels, accidents du travail et projets de réorganisation de service." },
    { sigle: "FAM", full: "Foyer d'Accueil Médicalisé", cat: "Médico-social", def: "Établissement médico-social accueillant des adultes lourdement handicapés inaptes à tout travail, nécessitant l'aide d'une tierce personne et une surveillance médicale régulière (financement conjoint ARS / CD)." },
    { sigle: "FEI", full: "Fiche d'Événement Indésirable", cat: "Qualité & Soins", def: "Formulaire interne (papier ou numérique) permettant à tout soignant de déclarer un dysfonctionnement, une chute, une erreur de dispensation ou une situation anormale constatée." },
    { sigle: "FPH", full: "Fonction Publique Hospitalière", cat: "RH & Droit", def: "Versant hospitalier de la fonction publique regroupant les agents titulaires et contractuels exerçant dans les établissements publics de santé et médico-sociaux." },
    { sigle: "GCS", full: "Groupement de Coopération Sanitaire", cat: "Sanitaire", def: "Structure juridique permettant à des établissements de santé publics et privés de mutualiser des activités médicales, plateaux techniques ou fonctions logistiques." },
    { sigle: "GHT", full: "Groupement Hospitalier de Territoire", cat: "Sanitaire", def: "Groupement obligatoire liant les hôpitaux publics d'un territoire autour d'un établissement support pour coordonner le projet médical, la pharmacie, les achats et le système d'information." },
    { sigle: "GIR", full: "Groupe Iso-Ressources", cat: "Médico-social", def: "Niveau de perte d'autonomie issu de la grille AGGIR, classé de 1 (dépendance totale) à 6 (autonomie complète) ; les GIR 1 à 4 ouvrent droit à l'APA." },
    { sigle: "GMP", full: "GIR Moyen Pondéré", cat: "Médico-social", def: "Indicateur représentatif du niveau moyen de dépendance des résidents d'un EHPAD, servant de clé de calcul pour l'allocation du forfait dépendance versé par le Département." },
    { sigle: "HAD", full: "Hospitalisation À Domicile", cat: "Sanitaire", def: "Établissement de santé à part entière permettant d'assurer au domicile du patient ou en EHPAD des soins médicaux et infirmiers complexes, évitant ou raccourcissant une hospitalisation." },
    { sigle: "HAS", full: "Haute Autorité de Santé", cat: "Instances & Tutelles", def: "Autorité publique indépendante chargée d'élaborer les recommandations de bonnes pratiques, de certifier les hôpitaux/cliniques et de définir le référentiel d'évaluation des ESSMS." },
    { sigle: "HDJ", full: "Hôpital De Jour", cat: "Sanitaire", def: "Modalité de prise en charge ambulatoire en établissement de santé sans hébergement de nuit, pour des bilans, traitements chimiothérapiques, chirurgie ou réadaptation." },
    { sigle: "IDCC", full: "Identifiant De la Convention Collective", cat: "RH & Droit", def: "Code unique à 4 chiffres attribué par le Ministère du Travail identifiant chaque convention collective (ex: IDCC 0029 pour la CCN51, IDCC 0413 pour la CCN66)." },
    { sigle: "IDE", full: "Infirmier(ère) Diplômé(e) d'État", cat: "RH & Droit", def: "Professionnel de santé exerçant sous décret de compétences pour évaluer l'état de santé, administrer les traitements prescrits et coordonner les soins du patient." },
    { sigle: "IDEC", full: "Infirmier(ère) Diplômé(e) d'État Coordinateur(trice)", cat: "RH & Droit", def: "Cadre de proximité en EHPAD ou SSIAD coordonnant l'équipe soignante, organisant les plannings et assurant l'interface avec les familles et médecins traitants." },
    { sigle: "IFAS", full: "Institut de Formation d'Aides-Soignants", cat: "Instances & Tutelles", def: "Établissement agréé dispensant la formation initiale conduisant au Diplôme d'État d'Aide-Soignant (DEAS)." },
    { sigle: "IFSI", full: "Institut de Formation en Soins Infirmiers", cat: "Instances & Tutelles", def: "Institut rattaché à un hôpital et conventionné avec l'université, formant les futurs infirmiers en 3 ans (grade Licence)." },
    { sigle: "IME", full: "Institut Médico-Éducatif", cat: "Médico-social", def: "Établissement médico-social accueillant des enfants et adolescents en situation de déficience intellectuelle ou troubles du neuro-développement, associant scolarisation et rééducations." },
    { sigle: "INS", full: "Identité Nationale de Santé", cat: "Qualité & Soins", def: "Identifiant numérique unique et sécurisé (matricule NIR + traits d'identité vérifiés) obligatoire pour référencer toute donnée de santé en France." },
    { sigle: "IRP", full: "Instances Représentatives du Personnel", cat: "RH & Droit", def: "Ensemble des organes élus de dialogue social représentant les intérêts des salariés et soignants (CSE, CSAL, commissions spécialisées)." },
    { sigle: "LFSS", full: "Loi de Financement de la Sécurité Sociale", cat: "Instances & Tutelles", def: "Loi votée chaque automne par le Parlement déterminant les conditions générales de l'équilibre financier de la Sécurité sociale et fixant l'ONDAM." },
    { sigle: "MAS", full: "Maison d'Accueil Spécialisée", cat: "Médico-social", def: "Établissement médico-social hébergeant des adultes avec handicap lourd nécessitant une aide constante pour les actes de la vie quotidienne et une surveillance médicale continue (financé par l'Assurance Maladie)." },
    { sigle: "MCO", full: "Médecine, Chirurgie, Obstétrique", cat: "Sanitaire", def: "Pôle d'activités hospitalières de soins de courte durée ou aigus en hospitalisation complète ou ambulatoire." },
    { sigle: "MDPH", full: "Maison Départementale des Personnes Handicapées", cat: "Médico-social", def: "Guichet unique d'accueil, d'information et d'évaluation des droits des personnes en situation de handicap dans chaque département, piloté par la CDAPH." },
    { sigle: "MSP", full: "Maison de Santé Pluriprofessionnelle", cat: "Sanitaire", def: "Structure d'exercice libéral coordonné réunissant des médecins généralistes et auxiliaires médicaux autour d'un projet de santé commun pour la population locale." },
    { sigle: "MSSanté", full: "Messagerie Sécurisée de Santé", cat: "Qualité & Soins", def: "Espace de confiance réglementé par l'ANS permettant aux professionnels de santé d'échanger des données nominatives de patients en toute confidentialité." },
    { sigle: "ONDAM", full: "Objectif National de Dépenses d'Assurance Maladie", cat: "Instances & Tutelles", def: "Montant annuel prévisionnel voté par le Parlement dans la LFSS plafonnant les dépenses de santé remboursées par l'Assurance Maladie (soins de ville, hôpital, médico-social)." },
    { sigle: "PAPRIPACT", full: "Programme Annuel de Prévention des Risques Professionnels et d'Amélioration des Conditions de Travail", cat: "RH & Droit", def: "Document d'application opérationnelle du DUERP fixant la liste détaillée des mesures de prévention, leur budget et leurs échéances de réalisation." },
    { sigle: "PASA", full: "Pôle d'Activités et de Soins Adaptés", cat: "Médico-social", def: "Dispositif au sein d'un EHPAD accueillant dans la journée des résidents souffrant de la maladie d'Alzheimer avec troubles du comportement modérés pour des activités thérapeutiques." },
    { sigle: "PCH", full: "Prestation de Compensation du Handicap", cat: "Médico-social", def: "Aide financière personnalisée versée par le Département destinée à couvrir les surcoûts liés au handicap (aide humaine, aménagement du logement ou véhicule, aides techniques)." },
    { sigle: "PGFP", full: "Plan Global de Financement Pluriannuel", cat: "Instances & Tutelles", def: "Document financier prospectif sur 5 ans accompagnant l'EPRD pour évaluer la capacité d'autofinancement et la soutenabilité des investissements d'un établissement." },
    { sigle: "PATHOS", full: "Modèle d'évaluation des soins requis en gériatrie", cat: "Médico-social", def: "Outil médicalisé quantifiant la charge en soins et la lourdeur des pathologies des résidents d'EHPAD, déterminant le PMP (Pathos Moyen Pondéré) et le forfait soins." },
    { sigle: "PMP", full: "Pathos Moyen Pondéré", cat: "Médico-social", def: "Indicateur moyen des besoins en soins infirmiers et médicaux d'un EHPAD issu de la coupe Pathos, déterminant la dotation globale soins versée par l'ARS." },
    { sigle: "PRIAC", full: "Programme Régional Interdépartemental d'Accompagnement des handicaps et de la perte d'autonomie", cat: "Instances & Tutelles", def: "Document stratégique élaboré par l'ARS fixant les créations de places et les priorités de financement médico-sociales pour 5 ans." },
    { sigle: "PRS", full: "Projet Régional de Santé", cat: "Instances & Tutelles", def: "Feuille de route stratégique décennale de l'ARS arrêtant les priorités de santé publique, le schéma régional d'organisation des soins et les implantations autorisées." },
    { sigle: "PUI", full: "Pharmacie à Usage Intérieur", cat: "Sanitaire", def: "Pharmacie hospitalière interne autorisée au sein d'un établissement de santé ou médico-social pour dispenser médicaments, stupéfiants et dispositifs médicaux stériles." },
    { sigle: "REX", full: "Retour d'EXpérience", cat: "Qualité & Soins", def: "Méthode d'analyse collective formalisée suivant un incident pour comprendre les facteurs organisationnels et humains ayant favorisé l'événement et définir des actions correctives." },
    { sigle: "RMM", full: "Revue de Morbi-Mortalité", cat: "Qualité & Soins", def: "Réunion collégiale médicale et soignante analysant rétrospectivement un cas de décès inattendu ou de complication grave survenu lors d'un parcours de soins." },
    { sigle: "RTT", full: "Réduction du Temps de Travail", cat: "RH & Droit", def: "Jours de repos accordés aux professionnels en contrepartie d'une durée de travail hebdomadaire excédant la durée légale des 35 heures (ex: 38h30 générant des JRTT)." },
    { sigle: "RUP", full: "Registre Unique du Personnel", cat: "RH & Droit", def: "Registre obligatoire tenu par tout employeur consignant par ordre d'arrivée les mentions indispensables de tous les salariés (contrats, stagiaires, dates d'entrée et sortie)." },
    { sigle: "SAAD", full: "Service d'Aide et d'Accompagnement à Domicile", cat: "Médico-social", def: "Service social assurant au domicile des personnes dépendantes des prestations d'aide aux actes quotidiens (lever, toilette, courses, repas), intégré aux SAD." },
    { sigle: "SAD", full: "Service Autonomie à Domicile", cat: "Médico-social", def: "Nouvelle structure médico-sociale issue de la réforme LFSS 2022 fusionnant SSIAD et SAAD pour proposer un accompagnement conjoint en soins infirmiers et aide humaine." },
    { sigle: "SAMSAH", full: "Service d'Accompagnement Médico-Social pour Adultes Handicapés", cat: "Médico-social", def: "Service médico-social intervenant au domicile d'adultes handicapés pour assurer des prestations de soins et une aide à l'insertion sociale et professionnelle." },
    { sigle: "SAVS", full: "Service d'Accompagnement à la Vie Sociale", cat: "Médico-social", def: "Service médico-social proposant un accompagnement personnalisé favorisant le maintien ou l'apprentissage de l'autonomie en milieu ordinaire pour adultes handicapés." },
    { sigle: "SESSAD", full: "Service d'Éducation Spéciale et de Soins À Domicile", cat: "Médico-social", def: "Équipe mobile médico-sociale intervenant sur les lieux de vie de l'enfant (domicile, école) pour dispenser soins, rééducations et soutien à la scolarisation." },
    { sigle: "SMR", full: "Soins Médicaux et de Réadaptation (ex-SSR)", cat: "Sanitaire", def: "Activité de soins hospitalière ayant pour objet de prévenir ou réduire les conséquences fonctionnelles de déficiences chez des patients à la suite d'un épisode aigu." },
    { sigle: "SPDA", full: "Service Public Départemental de l'Autonomie", cat: "Instances & Tutelles", def: "Dispositif territorial guichet unique issu de la loi Bien Vieillir 2024 unifiant l'accueil et l'orientation des aînés et personnes en situation de handicap." },
    { sigle: "SSIAD", full: "Service de Soins Infirmiers À Domicile", cat: "Médico-social", def: "Service assurant sur prescription médicale des soins d'hygiène et soins infirmiers au domicile des personnes âgées ou handicapées (désormais regroupé dans les SAD)." },
    { sigle: "SSR", full: "Soins de Suite et de Réadaptation", cat: "Sanitaire", def: "Ancienne appellation réglementaire désormais remplacée par les Soins Médicaux et de Réadaptation (SMR)." },
    { sigle: "TPT", full: "Temps Partiel Thérapeutique", cat: "RH & Droit", def: "Aménagement temporaire du temps de travail sur prescription médicale favorisant la reprise d'activité progressive du professionnel après ou pendant une affection de santé." },
    { sigle: "UCC", full: "Unité Cognitivo-Comportementale", cat: "Sanitaire", def: "Unité hospitalière de SMR accueillant des patients atteints de la maladie d'Alzheimer ou apparentée présentant des troubles du comportement perturbateurs pour réajuster la prise en charge." },
    { sigle: "UHR", full: "Unité d'Hébergement Renforcée", cat: "Médico-social", def: "Unité de vie protégée au sein d'un EHPAD (12 à 14 places) accueillant jour et nuit des résidents présentant des troubles sévères du comportement avec encadrement renforcé." },
    { sigle: "URSSAF", full: "Union de Recouvrement des cotisations de Sécurité Sociale et d'Allocations Familiales", cat: "Instances & Tutelles", def: "Organisme collectant les cotisations et contributions sociales salariales et patronales finançant les différentes branches de la Sécurité sociale." },
    { sigle: "USLD", full: "Unité de Soins de Longue Durée", cat: "Sanitaire", def: "Structure sanitaire hospitalière accueillant des personnes âgées très dépendantes dont l'état clinique requiert une surveillance médicale et soignante continue et rapprochée." }
  ];

  const NAV = [
    { id: "accueil", label: "Accueil", icon: "home", group: "Espace de travail" },
    { id: "abonnement", label: "Abonnement & Accès", icon: "star", group: "Espace de travail" },
    { id: "flashcards", label: "Flashcards", icon: "layers", group: "Espace de travail" },
    { id: "compte", label: "Mon compte", icon: "users", group: "Espace de travail" },

    { id: "etablissements", label: "Établissements", icon: "building", group: "Panorama & Métiers" },
    { id: "metiers", label: "Métiers de direction", icon: "briefcase", group: "Panorama & Métiers" },
    { id: "metiers-support", label: "Métiers support", icon: "people", group: "Panorama & Métiers" },
    { id: "changement-direction", label: "Changement de direction", icon: "rotate", group: "Panorama & Métiers", badge: "Nouveau" },

    { id: "qualite", label: "Qualité & Événements (EI)", icon: "shield", group: "Qualité & Sécurité" },
    { id: "rex", label: "Retours d'expérience (REX)", icon: "lightbulb", group: "Qualité & Sécurité" },
    { id: "audit", label: "Audits qualité & méthodes", icon: "target", group: "Qualité & Sécurité" },
    { id: "inspection-ars", label: "Inspection ARS", icon: "target", group: "Qualité & Sécurité", badge: "Nouveau" },

    { id: "logiciels", label: "Logiciels métiers", icon: "layers", group: "Pilotage & Gestion" },
    { id: "documents", label: "Documents de pilotage", icon: "file", group: "Pilotage & Gestion" },
    { id: "reunions", label: "Réunions & instances", icon: "calendar", group: "Pilotage & Gestion" },
    { id: "rh", label: "Questions RH & Équipe", icon: "users", group: "Pilotage & Gestion", badge: "Enrichi" },
    { id: "droit-sante", label: "Droit de la santé", icon: "shield", group: "Pilotage & Gestion" },
    { id: "responsabilite-penale", label: "Responsabilité pénale", icon: "shield", group: "Pilotage & Gestion", badge: "Directeur" },
    { id: "glossaire", label: "Glossaire des sigles", icon: "book", group: "Pilotage & Gestion", badge: "130 sigles" },

    { id: "secu", label: "Sécurité Sociale & Liens", icon: "shield", group: "Stratégie" },
    { id: "politique", label: "Politique de santé & Lois", icon: "clipboard", group: "Stratégie" },
    { id: "acteurs", label: "Acteurs institutionnels", icon: "network", group: "Stratégie" },
    { id: "carte", label: "Carte des interactions", icon: "map", group: "Stratégie" },
    { id: "reseau", label: "Réseau", icon: "users", group: "Réseau" },
    { id: "inscription-annuaire", label: "Inscription au réseau", icon: "userplus", group: "Réseau" },
    { id: "timeline", label: "Fil d'actualités", icon: "message", group: "Réseau" }
  ];

  // Expose the catalogue to app.js without ES modules so the app also opens from file://.
  
  /* --- FIL D'ACTUALITÉS & ÉVÉNEMENTS ALUMNI (TIMELINE) --- */
  const TIMELINE_POSTS = [
    {
      id: "post-1",
      author: {
        name: "Alexandre D.",
        role: "Adjoint de direction · MAS polyhandicap (GHU)",
        avatar: "AD",
        linkedin: "https://www.linkedin.com/in/alexandre-d-mes"
      },
      type: "job_offer",
      title: "Recrutement Alternant·e Master MES — Direction Adjointe & Qualité (H/F)",
      organization: "Maison d'Accueil Spécialisée Les Tournesols (48 places polyhandicap)",
      contract: "Alternance (1 ou 2 ans) · Rentrée 2026/2027",
      location: "Paris 14e (75) · Proximité transports",
      content: "Nous ouvrons un poste d'alternant·e pour accompagner notre équipe de direction dans la préparation de l'évaluation externe HAS 2027 et le déploiement du nouveau DUI. Vous participerez aux CODIR, à l'animation des CREX et au suivi budgétaire de l'EPRD. Superbe opportunité de montée en compétences terrain avec accompagnement bienveillant !",
      contact: "alexandre.mes@alumni-sante.fr",
      date: "Il y a 2 heures",
      likes: 16,
      commentsCount: 3,
      isLiked: false
    },
    {
      id: "post-2",
      author: {
        name: "Camille M.",
        role: "Responsable Qualité & Gestion des Risques · EHPAD",
        avatar: "CM",
        linkedin: "https://www.linkedin.com/in/camille-m-qualite"
      },
      type: "event",
      title: "Colloque Régional : Réussir l'Évaluation HAS & Impliquer les Équipes Soignantes",
      organization: "EHPAD Les Cèdres & Réseau Qualité Grand Âge",
      eventDate: "Jeudi 18 décembre 2026 · 14h00 - 17h30",
      location: "Lyon (Salle de conférence EHPAD Les Cèdres) & Visioconférence Teams",
      content: "Retours d'expérience concrets suite à notre visite d'évaluation externe HAS menée en octobre : présentation de notre méthode patient traceur, grille de sensibilisation des ASH/AS et dialogue constructif avec les évaluateurs. Échanges ouverts à toutes les directions et cadres de santé !",
      contact: "camille.m@alumni-sante.fr",
      date: "Hier à 16h30",
      likes: 34,
      commentsCount: 6,
      isLiked: true,
      rsvp: {
        personal: 12,
        delegate_intern: 7,
        delegate_staff: 9
      }
    },
    {
      id: "post-3",
      author: {
        name: "Sarah K.",
        role: "Directrice Adjointe · Pôle Enfance & Jeunesse",
        avatar: "SK",
        linkedin: "https://www.linkedin.com/in/sarah-k-enfance"
      },
      type: "job_offer",
      title: "Offre d'Emploi : Chef·fe de Service Éducatif (F/H) — CDI Cadre",
      organization: "Association Régionale Handicap Enfance (IME / SESSAD)",
      contract: "CDI Cadre · Convention collective CCN 66",
      location: "Lille Métropole (59)",
      content: "Management d'une équipe pluridisciplinaire de 18 professionnels (éducateurs spécialisés, psychologue, psychomotricien). Pilotage des projets personnalisés, lien avec les familles et la MDPH, et animation de la démarche d'autodétermination.",
      contact: "recrutement@arhe-nord.fr",
      date: "Il y a 3 jours",
      likes: 11,
      commentsCount: 2,
      isLiked: false
    },
    {
      id: "post-4",
      author: {
        name: "Julien T.",
        role: "Directeur d'Établissement · CH & ESMS rattachés",
        avatar: "JT",
        linkedin: "https://www.linkedin.com/in/julien-t-direction"
      },
      type: "event",
      title: "Job Dating & Forum Métiers du Soin, Éducatif & Management Hospitalier",
      organization: "Groupement Hospitalier de Territoire (GHT)",
      eventDate: "Mardi 27 janvier 2027 · 09h30 - 18h00",
      location: "Palais des Congrès de Marseille (Stand A24)",
      content: "Venez rencontrer les équipes de direction, les directeurs des soins et les RRH de notre territoire. Plus de 45 postes à pourvoir (cadres de santé, IDEC, éducateurs, gestionnaires de paie, adjoints de direction). Venez en personne ou déléguez vos alternants et salariés pour représenter vos établissements !",
      contact: "direction.ght@sante-paca.fr",
      date: "Il y a 5 jours",
      likes: 27,
      commentsCount: 8,
      isLiked: false,
      rsvp: {
        personal: 19,
        delegate_intern: 14,
        delegate_staff: 15
      }
    }
  ];

  /* --- NOTIFICATIONS RÉSEAU --- */
  const SAMPLE_NOTIFICATIONS = [
    {
      id: "notif-1",
      title: "Délégation d'alternant",
      text: "Alexandre D. (MAS Les Tournesols) a indiqué qu'il envoie 2 alternants Master MES à votre Rencontre HAS.",
      date: "Il y a 12 minutes",
      icon: "users",
      unread: true
    },
    {
      id: "notif-2",
      title: "Confirmation de participation",
      text: "Camille M. (EHPAD Les Cèdres) a confirmé sa venue en personne à votre Job Dating Métiers du Soin.",
      date: "Il y a 1 heure",
      icon: "check",
      unread: true
    },
    {
      id: "notif-3",
      title: "Nouvelle offre d'alternance",
      text: "Le GHU Paris a publié une offre : Alternant·e Direction Adjointe & Qualité.",
      date: "Il y a 3 heures",
      icon: "briefcase",
      unread: true
    },
    {
      id: "notif-4",
      title: "Délégation de salariés",
      text: "Sarah K. a inscrit 3 salariés représentants pour participer au forum inter-établissements.",
      date: "Hier à 14h20",
      icon: "building",
      unread: false
    }
  ];

  window.MOSAQUE_DATA = { SOURCES, ESTABLISHMENTS, JOBS, MEETINGS, DOCUMENTS, ACTORS, FAQ, CONVENTIONS, SOFTWARES, MAP_NODES, MAP_EDGES, RESEARCH_AREAS, NAV, QUALITY_TOOLS, ADVERSE_EVENTS, SUPPORT_JOBS, REX_GUIDE, HEALTH_POLICY, SAMPLE_PEERS, AUDIT_GUIDE, SECURITY_SOCIALE, PRICING_DATA, TIMELINE_POSTS, SAMPLE_NOTIFICATIONS, RH_LEAVE_TYPES, RH_THERAPEUTIC_PART_TIME, RH_PLANNING_CHANGE, RH_INTERNS_APPRENTICES, ARS_INSPECTION_GUIDE, MANAGEMENT_TRANSITION_GUIDE, GLOSSARY_TERMS, ERP_SECURITY_GUIDE, CONFORMITY_VISIT_GUIDE, MATERIOVIGILANCE_GUIDE, SIRENA_SYSTEM_GUIDE, NAPIR_LIBERTY_GUIDE, DIRECTOR_PENAL_RESPONSIBILITY_GUIDE };
})();
