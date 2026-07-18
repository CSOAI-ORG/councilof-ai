/**
 * sovereign-i18n.js — Regional language support (6 locales)
 * CSOAI Ltd (UK 16939677) · MIT License
 *
 * Usage:
 *   <script src="sovereign-i18n.js"></script>
 *   <h1 data-i18n="hero.title">Sovereign AI Compliance OS</h1>
 *   <button data-i18n="cta.try_free">Try free</button>
 *
 *   <script>SovereignI18N.setLocale('fr');</script>
 *   <script>SovereignI18N.autoDetect();</script>
 */

(function (window) {
  'use strict';

  const STORAGE_KEY = 'sov.locale';
  const DEFAULT_LOCALE = 'en';

  // 6 locales × ~50 keys = 300 translations
  const I18N = {
    en: {
      'hero.title': 'Sovereign AI Compliance OS',
      'hero.subtitle': '22 sovereign MCPs · 12 Generals · 33 Hives · 5D Hive · AB Uno',
      'hero.tagline': 'Defend. Detect. Deny. Deceive. Defeat. — Never Offend.',
      'hero.cta_primary': 'Try free',
      'hero.cta_secondary': 'Watch demo',
      'nav.home': 'Home',
      'nav.pricing': 'Pricing',
      'nav.docs': 'Documentation',
      'nav.compliance': 'Compliance',
      'nav.dashboard': 'Dashboard',
      'nav.signin': 'Sign in',
      'nav.signup': 'Sign up',
      'cta.try_free': 'Try free',
      'cta.buy_pro': 'Buy pro',
      'cta.contact_sales': 'Contact sales',
      'cta.run_audit': 'Run audit',
      'cta.view_passport': 'View passport',
      'cta.download': 'Download',
      'cta.deploy': 'Deploy',
      'section.compliance.title': '12 Sovereign Frameworks',
      'section.compliance.subtitle': 'EU AI Act · DORA · GDPR · NIS2 · ISO 42001 · JSP 936 · NIST RMF · HIPAA · SOC 2 · ISO 27001 · PCI-DSS · UK AI Bill',
      'section.audittrail.title': 'Audit Trail',
      'section.audittrail.subtitle': 'Regulator-grade · Ed25519-signed · Hash-chained · Bitcoin-anchored',
      'section.bft.title': 'BFT Council',
      'section.bft.subtitle': '3 / 5 / 7 voters · Smaller councils vote better (EAT-12)',
      'section.carefloor.title': 'Care Floor (16 Probes)',
      'section.carefloor.subtitle': 'Maternal Covenant — every state validated',
      'section.sigil.title': 'Sigil Chain',
      'section.sigil.subtitle': 'Every hop Ed25519-signed',
      'section.hives.title': '33 Hives',
      'section.hives.subtitle': '5 continents · 12 Generals · 8 BIG BRAIM',
      'section.generals.title': '12 Generals',
      'section.generals.subtitle': 'Each = 1 GCP VM · Each = own QOwm',
      'section.eu_ai_act.title': 'EU AI Act (Aug 2 2026)',
      'section.eu_ai_act.subtitle': '8 articles · Article 50 transparency · 36 days away',
      'section.jsp_936.title': 'JSP 936 (NATO)',
      'section.jsp_936.subtitle': '5 pillars · IWC formula · Defensive doctrine',
      'section.iso_42001.title': 'ISO 42001 AIMS',
      'section.iso_42001.subtitle': '7 clauses · Mature / established / developing / initial',
      'pricing.title': 'Pricing',
      'pricing.subtitle': '25-33% of competitors · 5-10x more features',
      'pricing.free.name': 'Free',
      'pricing.free.price': '$0',
      'pricing.free.tagline': 'Try all sovereign features',
      'pricing.pro.name': 'Pro',
      'pricing.pro.price': '$99',
      'pricing.pro.tagline': 'Unlimited audits + passport',
      'pricing.governance.name': 'Governance',
      'pricing.governance.price': '$2,499',
      'pricing.governance.tagline': 'Full audit trail + 7-voter BFT',
      'pricing.enterprise.name': 'Enterprise',
      'pricing.enterprise.price': '$9,999+',
      'pricing.enterprise.tagline': 'On-prem · GovCloud · Air-gap',
      'doctrine.line1': 'Defend. Detect. Deny. Deceive. Defeat. — Never Offend.',
      'doctrine.line2': 'The dragon runs itself. No Ollama needed. Sovereign by construction.',
      'doctrine.line3': '12 Generals × 5 Dimensions × AB Uno = the sovereign substrate.',
      'footer.copyright': 'CSOAI Ltd (UK 16939677) · MIT License · Sovereign by construction',
      'footer.privacy': 'Privacy',
      'footer.terms': 'Terms',
      'footer.security': 'Security',
      'footer.docs': 'Documentation',
    },
    fr: {
      'hero.title': 'Système IA Souverain de Conformité',
      'hero.subtitle': '22 MCPs souverains · 12 Généraux · 33 Ruches · Ruche 5D · AB Uno',
      'hero.tagline': 'Défendre. Détecter. Refuser. Tromper. Vaincre. — Ne jamais offensser.',
      'hero.cta_primary': 'Essayer gratuitement',
      'hero.cta_secondary': 'Voir la démo',
      'nav.home': 'Accueil',
      'nav.pricing': 'Tarifs',
      'nav.docs': 'Documentation',
      'nav.compliance': 'Conformité',
      'nav.dashboard': 'Tableau de bord',
      'nav.signin': 'Se connecter',
      'nav.signup': "S'inscrire",
      'cta.try_free': 'Essayer gratuitement',
      'cta.buy_pro': 'Acheter Pro',
      'cta.contact_sales': 'Contacter les ventes',
      'cta.run_audit': 'Lancer audit',
      'cta.view_passport': 'Voir le passeport',
      'cta.download': 'Télécharger',
      'cta.deploy': 'Déployer',
      'section.compliance.title': '12 Cadres Souverains',
      'section.compliance.subtitle': 'Règlement IA UE · DORA · RGPD · NIS2 · ISO 42001 · JSP 936 · NIST RMF · HIPAA · SOC 2 · ISO 27001 · PCI-DSS · UK AI Bill',
      'section.audittrail.title': "Piste d'Audit",
      'section.audittrail.subtitle': 'Niveau régulateur · Ed25519 signé · Hash-chainé · Ancré Bitcoin',
      'section.bft.title': 'Conseil BFT',
      'section.bft.subtitle': '3 / 5 / 7 votants · Les petits conseils votent mieux (EAT-12)',
      'section.carefloor.title': 'Plancher de Soin (16 Sondes)',
      'section.carefloor.subtitle': 'Alliance Maternelle — chaque état validé',
      'section.sigil.title': 'Chaîne de Sigillations',
      'section.sigil.subtitle': 'Chaque saut Ed25519 signé',
      'section.hives.title': '33 Ruches',
      'section.hives.subtitle': '5 continents · 12 Généraux · 8 BIG BRAIM',
      'section.generals.title': '12 Généraux',
      'section.generals.subtitle': 'Chacun = 1 VM GCP · Chacun = son propre QOwm',
      'section.eu_ai_act.title': "Règlement IA de l'UE (2 août 2026)",
      'section.eu_ai_act.subtitle': '8 articles · Article 50 transparence · 36 jours restants',
      'section.jsp_936.title': 'JSP 936 (OTAN)',
      'section.jsp_936.subtitle': '5 piliers · Formule IWC · Doctrine défensive',
      'section.iso_42001.title': 'ISO 42001 AIMS',
      'section.iso_42001.subtitle': '7 clauses · Mature / établi / en développement / initial',
      'pricing.title': 'Tarifs',
      'pricing.subtitle': '25-33% des concurrents · 5-10x plus de fonctionnalités',
      'pricing.free.name': 'Gratuit',
      'pricing.free.price': '0€',
      'pricing.free.tagline': 'Essayez toutes les fonctionnalités souveraines',
      'pricing.pro.name': 'Pro',
      'pricing.pro.price': '99€',
      'pricing.pro.tagline': 'Audits illimités + passeport',
      'pricing.governance.name': 'Gouvernance',
      'pricing.governance.price': '2 499€',
      'pricing.governance.tagline': 'Piste audit complète + BFT 7 votants',
      'pricing.enterprise.name': 'Entreprise',
      'pricing.enterprise.price': '9 999€+',
      'pricing.enterprise.tagline': 'Sur site · GovCloud · Air-gap',
      'doctrine.line1': 'Défendre. Détecter. Refuser. Tromper. Vaincre. — Ne jamais offensser.',
      'doctrine.line2': "Le dragon se gère seul. Pas besoin d'Ollama. Souverain par construction.",
      'doctrine.line3': '12 Généraux × 5 Dimensions × AB Uno = le substrat souverain.',
      'footer.copyright': 'CSOAI Ltd (UK 16939677) · Licence MIT · Souverain par construction',
      'footer.privacy': 'Confidentialité',
      'footer.terms': 'Conditions',
      'footer.security': 'Sécurité',
      'footer.docs': 'Documentation',
    },
    de: {
      'hero.title': 'Souveräne KI-Compliance-Betriebssystem',
      'hero.subtitle': '22 souveräne MCPs · 12 Generäle · 33 Bienenstöcke · 5D Hive · AB Uno',
      'hero.tagline': 'Verteidigen. Erkennen. Verweigern. Täuschen. Besiegen. — Niemals angreifen.',
      'hero.cta_primary': 'Kostenlos testen',
      'hero.cta_secondary': 'Demo ansehen',
      'nav.home': 'Start',
      'nav.pricing': 'Preise',
      'nav.docs': 'Dokumentation',
      'nav.compliance': 'Compliance',
      'nav.dashboard': 'Dashboard',
      'nav.signin': 'Anmelden',
      'nav.signup': 'Registrieren',
      'cta.try_free': 'Kostenlos testen',
      'cta.buy_pro': 'Pro kaufen',
      'cta.contact_sales': 'Vertrieb kontaktieren',
      'cta.run_audit': 'Audit starten',
      'cta.view_passport': 'Pass ansehen',
      'cta.download': 'Herunterladen',
      'cta.deploy': 'Bereitstellen',
      'section.compliance.title': '12 Souveräne Rahmenwerke',
      'section.compliance.subtitle': 'EU-KI-Gesetz · DORA · DSGVO · NIS2 · ISO 42001 · JSP 936 · NIST RMF · HIPAA · SOC 2 · ISO 27001 · PCI-DSS · UK AI Bill',
      'section.audittrail.title': 'Audit-Trail',
      'section.audittrail.subtitle': 'Aufsichtsbehördenqualität · Ed25519 signiert · Hash-verkettet · Bitcoin-verankert',
      'section.bft.title': 'BFT-Rat',
      'section.bft.subtitle': '3 / 5 / 7 Wähler · Kleinere Räte wählen besser (EAT-12)',
      'section.carefloor.title': 'Care-Boden (16 Sonden)',
      'section.carefloor.subtitle': 'Mütterlicher Bund — jeder Zustand validiert',
      'section.sigil.title': 'Siegels-Kette',
      'section.sigil.subtitle': 'Jeder Sprung Ed25519 signiert',
      'section.hives.title': '33 Bienenstöcke',
      'section.hives.subtitle': '5 Kontinente · 12 Generäle · 8 BIG BRAIM',
      'section.generals.title': '12 Generäle',
      'section.generals.subtitle': 'Jeder = 1 GCP-VM · Jeder = eigenes QOwm',
      'section.eu_ai_act.title': 'EU-KI-Gesetz (2. August 2026)',
      'section.eu_ai_act.subtitle': '8 Artikel · Artikel 50 Transparenz · 36 Tage verbleibend',
      'section.jsp_936.title': 'JSP 936 (NATO)',
      'section.jsp_936.subtitle': '5 Säulen · IWC-Formel · Verteidigungsdoktrin',
      'section.iso_42001.title': 'ISO 42001 AIMS',
      'section.iso_42001.subtitle': '7 Klauseln · Reif / etabliert / in Entwicklung / initial',
      'pricing.title': 'Preise',
      'pricing.subtitle': '25-33% der Konkurrenten · 5-10x mehr Funktionen',
      'pricing.free.name': 'Kostenlos',
      'pricing.free.price': '0€',
      'pricing.free.tagline': 'Alle souveränen Funktionen testen',
      'pricing.pro.name': 'Pro',
      'pricing.pro.price': '99€',
      'pricing.pro.tagline': 'Unbegrenzte Audits + Pass',
      'pricing.governance.name': 'Gouvernance',
      'pricing.governance.price': '2.499€',
      'pricing.governance.tagline': 'Vollständiger Audit-Trail + BFT 7 Wähler',
      'pricing.enterprise.name': 'Enterprise',
      'pricing.enterprise.price': '9.999€+',
      'pricing.enterprise.tagline': 'On-Prem · GovCloud · Air-Gap',
      'doctrine.line1': 'Verteidigen. Erkennen. Verweigern. Täuschen. Besiegen. — Niemals angreifen.',
      'doctrine.line2': 'Der Drache führt sich selbst. Kein Ollama nötig. Souverän durch Konstruktion.',
      'doctrine.line3': '12 Generäle × 5 Dimensionen × AB Uno = das souveräne Substrat.',
      'footer.copyright': 'CSOAI Ltd (UK 16939677) · MIT-Lizenz · Souverän durch Konstruktion',
      'footer.privacy': 'Datenschutz',
      'footer.terms': 'Bedingungen',
      'footer.security': 'Sicherheit',
      'footer.docs': 'Dokumentation',
    },
    es: {
      'hero.title': 'SO de Cumplimiento de IA Soberano',
      'hero.subtitle': '22 MCPs soberanos · 12 Generales · 33 Colmenas · Colmena 5D · AB Uno',
      'hero.tagline': 'Defender. Detectar. Denegar. Engañar. Derrotar. — Nunca ofender.',
      'hero.cta_primary': 'Probar gratis',
      'hero.cta_secondary': 'Ver demo',
      'nav.home': 'Inicio',
      'nav.pricing': 'Precios',
      'nav.docs': 'Documentación',
      'nav.compliance': 'Cumplimiento',
      'nav.dashboard': 'Panel',
      'nav.signin': 'Iniciar sesión',
      'nav.signup': 'Registrarse',
      'cta.try_free': 'Probar gratis',
      'cta.buy_pro': 'Comprar Pro',
      'cta.contact_sales': 'Contactar ventas',
      'cta.run_audit': 'Ejecutar auditoría',
      'cta.view_passport': 'Ver pasaporte',
      'cta.download': 'Descargar',
      'cta.deploy': 'Desplegar',
      'section.compliance.title': '12 Marcos Soberanos',
      'section.compliance.subtitle': 'Ley IA UE · DORA · RGPD · NIS2 · ISO 42001 · JSP 936 · NIST RMF · HIPAA · SOC 2 · ISO 27001 · PCI-DSS · UK AI Bill',
      'section.audittrail.title': 'Pista de Auditoría',
      'section.audittrail.subtitle': 'Nivel regulador · Ed25519 firmado · Hash-encadenado · Anclado a Bitcoin',
      'section.bft.title': 'Consejo BFT',
      'section.bft.subtitle': '3 / 5 / 7 votantes · Los consejos pequeños votan mejor (EAT-12)',
      'section.carefloor.title': 'Suelo de Cuidado (16 Sondas)',
      'section.carefloor.subtitle': 'Pacto Materno — cada estado validado',
      'section.sigil.title': 'Cadena de Sellos',
      'section.sigil.subtitle': 'Cada salto Ed25519 firmado',
      'section.hives.title': '33 Colmenas',
      'section.hives.subtitle': '5 continentes · 12 Generales · 8 BIG BRAIM',
      'section.generals.title': '12 Generales',
      'section.generals.subtitle': 'Cada uno = 1 VM GCP · Cada uno = su propio QOwm',
      'section.eu_ai_act.title': 'Ley IA de la UE (2 Ago 2026)',
      'section.eu_ai_act.subtitle': '8 artículos · Artículo 50 transparencia · 36 días restantes',
      'section.jsp_936.title': 'JSP 936 (OTAN)',
      'section.jsp_936.subtitle': '5 pilares · Fórmula IWC · Doctrina defensiva',
      'section.iso_42001.title': 'ISO 42001 AIMS',
      'section.iso_42001.subtitle': '7 cláusulas · Maduro / establecido / en desarrollo / inicial',
      'pricing.title': 'Precios',
      'pricing.subtitle': '25-33% de los competidores · 5-10x más funciones',
      'pricing.free.name': 'Gratis',
      'pricing.free.price': '0€',
      'pricing.free.tagline': 'Prueba todas las funciones soberanas',
      'pricing.pro.name': 'Pro',
      'pricing.pro.price': '99€',
      'pricing.pro.tagline': 'Auditorías ilimitadas + pasaporte',
      'pricing.governance.name': 'Gobernanza',
      'pricing.governance.price': '2.499€',
      'pricing.governance.tagline': 'Pista auditoría completa + BFT 7 votantes',
      'pricing.enterprise.name': 'Empresa',
      'pricing.enterprise.price': '9.999€+',
      'pricing.enterprise.tagline': 'On-Prem · GovCloud · Air-Gap',
      'doctrine.line1': 'Defender. Detectar. Denegar. Engañar. Derrotar. — Nunca ofender.',
      'doctrine.line2': 'El dragón se gobierna solo. No se necesita Ollama. Soberano por construcción.',
      'doctrine.line3': '12 Generales × 5 Dimensiones × AB Uno = el sustrato soberano.',
      'footer.copyright': 'CSOAI Ltd (UK 16939677) · Licencia MIT · Soberano por construcción',
      'footer.privacy': 'Privacidad',
      'footer.terms': 'Términos',
      'footer.security': 'Seguridad',
      'footer.docs': 'Documentación',
    },
    ja: {
      'hero.title': '主権AIコンプライアンスOS',
      'hero.subtitle': '22主権MCP · 12将軍 · 33ハイブ · 5Dハイブ · AB Uno',
      'hero.tagline': '防御・検知・拒否・欺瞞・撃破 — 決して攻撃せず。',
      'hero.cta_primary': '無料トライアル',
      'hero.cta_secondary': 'デモを見る',
      'nav.home': 'ホーム',
      'nav.pricing': '価格',
      'nav.docs': 'ドキュメント',
      'nav.compliance': 'コンプライアンス',
      'nav.dashboard': 'ダッシュボード',
      'nav.signin': 'サインイン',
      'nav.signup': '登録',
      'cta.try_free': '無料トライアル',
      'cta.buy_pro': 'Proを購入',
      'cta.contact_sales': '営業に連絡',
      'cta.run_audit': '監査実行',
      'cta.view_passport': 'パスポート表示',
      'cta.download': 'ダウンロード',
      'cta.deploy': 'デプロイ',
      'section.compliance.title': '12主権フレームワーク',
      'section.compliance.subtitle': 'EU AI法 · DORA · GDPR · NIS2 · ISO 42001 · JSP 936 · NIST RMF · HIPAA · SOC 2 · ISO 27001 · PCI-DSS · UK AI Bill',
      'section.audittrail.title': '監査証跡',
      'section.audittrail.subtitle': '規制当局品質 · Ed25519署名 · ハッシュ連鎖 · Bitcoinアンカー',
      'section.bft.title': 'BFT評議会',
      'section.bft.subtitle': '3 / 5 / 7 投票者 · 小さい評議会がより良く投票 (EAT-12)',
      'section.carefloor.title': 'ケアフロア (16プローブ)',
      'section.carefloor.subtitle': '母性契約 — すべての状態検証済み',
      'section.sigil.title': '印璽チェーン',
      'section.sigil.subtitle': 'すべてのホップ Ed25519署名',
      'section.hives.title': '33ハイブ',
      'section.hives.subtitle': '5大陸 · 12将軍 · 8 BIG BRAIM',
      'section.generals.title': '12将軍',
      'section.generals.subtitle': 'それぞれ = 1 GCP VM · それぞれ = 自前のQOwm',
      'section.eu_ai_act.title': 'EU AI法 (2026年8月2日)',
      'section.eu_ai_act.subtitle': '8条 · 第50条透明性 · 残36日',
      'section.jsp_936.title': 'JSP 936 (NATO)',
      'section.jsp_936.subtitle': '5柱 · IWC公式 · 防御教義',
      'section.iso_42001.title': 'ISO 42001 AIMS',
      'section.iso_42001.subtitle': '7条項 · 成熟/確立/発展中/初期',
      'pricing.title': '価格',
      'pricing.subtitle': '競合の25-33% · 5-10倍多くの機能',
      'pricing.free.name': '無料',
      'pricing.free.price': '¥0',
      'pricing.free.tagline': '全主権機能を試す',
      'pricing.pro.name': 'Pro',
      'pricing.pro.price': '¥99',
      'pricing.pro.tagline': '無制限監査 + パスポート',
      'pricing.governance.name': 'ガバナンス',
      'pricing.governance.price': '¥2,499',
      'pricing.governance.tagline': '完全監査証跡 + BFT 7投票者',
      'pricing.enterprise.name': 'エンタープライズ',
      'pricing.enterprise.price': '¥9,999+',
      'pricing.enterprise.tagline': 'オンプレム · GovCloud · エアギャップ',
      'doctrine.line1': '防御・検知・拒否・欺瞞・撃破 — 決して攻撃せず。',
      'doctrine.line2': 'ドラゴンは自走する。Ollama不要。構築により主権。',
      'doctrine.line3': '12将軍 × 5次元 × AB Uno = 主権基質。',
      'footer.copyright': 'CSOAI Ltd (UK 16939677) · MITライセンス · 構築により主権',
      'footer.privacy': 'プライバシー',
      'footer.terms': '利用規約',
      'footer.security': 'セキュリティ',
      'footer.docs': 'ドキュメント',
    },
    zh: {
      'hero.title': '主权AI合规操作系统',
      'hero.subtitle': '22个主权MCP · 12位将军 · 33个蜂巢 · 5D蜂巢 · AB Uno',
      'hero.tagline': '防御·检测·拒绝·欺骗·击败 — 永不冒犯。',
      'hero.cta_primary': '免费试用',
      'hero.cta_secondary': '观看演示',
      'nav.home': '首页',
      'nav.pricing': '价格',
      'nav.docs': '文档',
      'nav.compliance': '合规',
      'nav.dashboard': '仪表板',
      'nav.signin': '登录',
      'nav.signup': '注册',
      'cta.try_free': '免费试用',
      'cta.buy_pro': '购买专业版',
      'cta.contact_sales': '联系销售',
      'cta.run_audit': '运行审计',
      'cta.view_passport': '查看护照',
      'cta.download': '下载',
      'cta.deploy': '部署',
      'section.compliance.title': '12个主权框架',
      'section.compliance.subtitle': '欧盟AI法 · DORA · GDPR · NIS2 · ISO 42001 · JSP 936 · NIST RMF · HIPAA · SOC 2 · ISO 27001 · PCI-DSS · 英国AI法案',
      'section.audittrail.title': '审计追踪',
      'section.audittrail.subtitle': '监管机构质量 · Ed25519签名 · 哈希链 · 比特币锚定',
      'section.bft.title': 'BFT理事会',
      'section.bft.subtitle': '3/5/7投票者 · 小型理事会投票更好(EAT-12)',
      'section.carefloor.title': '关爱底线(16个探针)',
      'section.carefloor.subtitle': '母性契约 — 每个状态已验证',
      'section.sigil.title': '印记链',
      'section.sigil.subtitle': '每次跳跃Ed25519签名',
      'section.hives.title': '33个蜂巢',
      'section.hives.subtitle': '5大洲 · 12位将军 · 8 BIG BRAIM',
      'section.generals.title': '12位将军',
      'section.generals.subtitle': '每位 = 1 GCP VM · 每位 = 自己的QOwm',
      'section.eu_ai_act.title': '欧盟AI法(2026年8月2日)',
      'section.eu_ai_act.subtitle': '8条 · 第50条透明度 · 剩余36天',
      'section.jsp_936.title': 'JSP 936 (北约)',
      'section.jsp_936.subtitle': '5柱 · IWC公式 · 防御教义',
      'section.iso_42001.title': 'ISO 42001 AIMS',
      'section.iso_42001.subtitle': '7条款 · 成熟/建立/发展中/初始',
      'pricing.title': '价格',
      'pricing.subtitle': '竞争对手的25-33% · 多5-10倍功能',
      'pricing.free.name': '免费',
      'pricing.free.price': '¥0',
      'pricing.free.tagline': '试用所有主权功能',
      'pricing.pro.name': '专业版',
      'pricing.pro.price': '¥99',
      'pricing.pro.tagline': '无限审计 + 护照',
      'pricing.governance.name': '治理',
      'pricing.governance.price': '¥2,499',
      'pricing.governance.tagline': '完整审计追踪 + BFT 7投票者',
      'pricing.enterprise.name': '企业版',
      'pricing.enterprise.price': '¥9,999+',
      'pricing.enterprise.tagline': '本地部署 · GovCloud · 气隙隔离',
      'doctrine.line1': '防御·检测·拒绝·欺骗·击败 — 永不冒犯。',
      'doctrine.line2': '龙自己运行。无需Ollama。主权由构造决定。',
      'doctrine.line3': '12将军 × 5维度 × AB Uno = 主权基质。',
      'footer.copyright': 'CSOAI Ltd (UK 16939677) · MIT许可证 · 主权由构造决定',
      'footer.privacy': '隐私',
      'footer.terms': '条款',
      'footer.security': '安全',
      'footer.docs': '文档',
    },
  };

  let currentLocale = DEFAULT_LOCALE;
  let listeners = [];

  function setLocale(locale, persist = true) {
    if (!I18N[locale]) {
      console.warn(`SovereignI18N: Unknown locale "${locale}"`);
      return;
    }
    currentLocale = locale;
    document.documentElement.lang = locale;
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, locale); } catch (e) {}
    }
    apply();
    notifyListeners();
    // Sigil every locale change
    const sigil = `sov-locale-${locale}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    try { sessionStorage.setItem('sov.last_sigil', sigil); } catch (e) {}
  }

  function getLocale() { return currentLocale; }

  function t(key) {
    return I18N[currentLocale]?.[key] || I18N[DEFAULT_LOCALE]?.[key] || key;
  }

  function apply() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach((el) => {
      const key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });
    // Update meta tags
    const metaTitle = document.querySelector('meta[property="i18n:title"]');
    if (metaTitle) metaTitle.content = t('hero.title');
  }

  function autoDetect() {
    const saved = (() => { try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; } })();
    if (saved && I18N[saved]) {
      setLocale(saved);
      return;
    }
    const browser = (navigator.language || 'en').toLowerCase().slice(0, 2);
    if (I18N[browser]) {
      setLocale(browser);
    } else {
      setLocale(DEFAULT_LOCALE);
    }
  }

  function onChange(fn) {
    listeners.push(fn);
    return () => { listeners = listeners.filter(l => l !== fn); };
  }

  function notifyListeners() {
    listeners.forEach(fn => {
      try { fn(currentLocale); } catch (e) {}
    });
  }

  function getAvailableLocales() {
    return Object.keys(I18N);
  }

  function getLocaleInfo(locale) {
    const info = {
      en: { name: 'English',  flag: '🇬🇧', region: 'UK' },
      fr: { name: 'Français', flag: '🇫🇷', region: 'France' },
      de: { name: 'Deutsch',  flag: '🇩🇪', region: 'Germany' },
      es: { name: 'Español',  flag: '🇪🇸', region: 'Spain' },
      ja: { name: '日本語',    flag: '🇯🇵', region: 'Japan' },
      zh: { name: '中文',      flag: '🇨🇳', region: 'China' },
    };
    return info[locale] || null;
  }

  // Auto-apply on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      autoDetect();
      apply();
    });
  } else {
    autoDetect();
    apply();
  }

  window.SovereignI18N = {
    setLocale, getLocale, t, apply,
    autoDetect, onChange,
    getAvailableLocales, getLocaleInfo,
  };
})(typeof window !== 'undefined' ? window : this);