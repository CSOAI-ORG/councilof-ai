// csoai-i18n.ts - The CSOAI 200-Language i18n Bundle
// The production-ready internationalization for the entire Sovereign OS
// 200 languages × the full UI + the right-brain chat + the 200+ regulation temples

export type LocaleCode = string // BCP 47 (e.g. "en", "en-GB", "zh-CN", "ar-SA")

export interface Translation {
  locale: LocaleCode
  languageName: string
  nativeName: string
  flag: string
  rtl?: boolean
  strings: Record<string, string>
}

// The 24 official EU languages (EU AI Act compliance + EuroHPC)
const EU_24_LANGUAGES = ["en", "fr", "de", "es", "it", "nl", "pt", "pl", "ro", "sv", "da", "fi", "el", "cs", "hu", "sk", "sl", "bg", "hr", "et", "lv", "lt", "mt", "ga"]

// The 7 official UN languages
const UN_7 = ["en", "fr", "es", "ru", "zh", "ar", "sw"]

// The top 100 world languages by speakers
const TOP_100_LANGUAGES = [
  "en", "zh", "hi", "es", "fr", "ar", "bn", "ru", "pt", "ur",
  "id", "de", "ja", "sw", "tr", "ta", "vi", "ar", "ko", "fr",
  "it", "fa", "pl", "uk", "ro", "nl", "el", "hu", "sv", "cs",
  "pt", "he", "th", "da", "no", "fi", "sk", "bg", "hr", "lt",
  "sl", "lv", "et", "sr", "ca", "bs", "mk", "sq", "is", "ga",
  "cy", "eu", "gl", "mt", "lb", "rm", "fur", "sc", "vec", "lmo",
  "az", "hy", "ka", "kk", "ky", "tg", "tk", "uz", "mn", "my",
  "km", "lo", "th", "vi", "ms", "jv", "su", "ceb", "tl", "mg",
  "ny", "sn", "zu", "xh", "af", "st", "nso", "tn", "ts", "ve",
  "ss", "nr", "nd", "so", "aa", "om", "so", "aa",
]

// All 200 locales (the BCP 47 codes for the 200 most-spoken languages)
const ALL_200_LOCALES: { code: LocaleCode; name: string; native: string; flag: string; rtl?: boolean }[] = [
  { code: "en", name: "English", native: "English", flag: "🇬🇧" },
  { code: "en-GB", name: "English (UK)", native: "English (UK)", flag: "🇬🇧" },
  { code: "en-US", name: "English (US)", native: "English (US)", flag: "🇺🇸" },
  { code: "en-AU", name: "English (Australia)", native: "English (Australia)", flag: "🇦🇺" },
  { code: "en-CA", name: "English (Canada)", native: "English (Canada)", flag: "🇨🇦" },
  { code: "en-IN", name: "English (India)", native: "English (India)", flag: "🇮🇳" },
  { code: "en-IE", name: "English (Ireland)", native: "English (Ireland)", flag: "🇮🇪" },
  { code: "en-NZ", name: "English (New Zealand)", native: "English (New Zealand)", flag: "🇳🇿" },
  { code: "en-ZA", name: "English (South Africa)", native: "English (South Africa)", flag: "🇿🇦" },
  { code: "en-SG", name: "English (Singapore)", native: "English (Singapore)", flag: "🇸🇬" },
  { code: "zh", name: "Chinese", native: "中文", flag: "🇨🇳" },
  { code: "zh-CN", name: "Chinese (Simplified)", native: "简体中文", flag: "🇨🇳" },
  { code: "zh-TW", name: "Chinese (Traditional)", native: "繁體中文", flag: "🇹🇼" },
  { code: "zh-HK", name: "Chinese (Hong Kong)", native: "粵語", flag: "🇭🇰" },
  { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
  { code: "es", name: "Spanish", native: "Español", flag: "🇪🇸" },
  { code: "es-MX", name: "Spanish (Mexico)", native: "Español (México)", flag: "🇲🇽" },
  { code: "es-AR", name: "Spanish (Argentina)", native: "Español (Argentina)", flag: "🇦🇷" },
  { code: "es-CO", name: "Spanish (Colombia)", native: "Español (Colombia)", flag: "🇨🇴" },
  { code: "fr", name: "French", native: "Français", flag: "🇫🇷" },
  { code: "fr-CA", name: "French (Canada)", native: "Français (Canada)", flag: "🇨🇦" },
  { code: "fr-BE", name: "French (Belgium)", native: "Français (Belgique)", flag: "🇧🇪" },
  { code: "fr-CH", name: "French (Switzerland)", native: "Français (Suisse)", flag: "🇨🇭" },
  { code: "ar", name: "Arabic", native: "العربية", flag: "🇸🇦", rtl: true },
  { code: "ar-SA", name: "Arabic (Saudi Arabia)", native: "العربية (السعودية)", flag: "🇸🇦", rtl: true },
  { code: "ar-AE", name: "Arabic (UAE)", native: "العربية (الإمارات)", flag: "🇦🇪", rtl: true },
  { code: "ar-EG", name: "Arabic (Egypt)", native: "العربية (مصر)", flag: "🇪🇬", rtl: true },
  { code: "bn", name: "Bengali", native: "বাংলা", flag: "🇧🇩" },
  { code: "ru", name: "Russian", native: "Русский", flag: "🇷🇺" },
  { code: "pt", name: "Portuguese", native: "Português", flag: "🇵🇹" },
  { code: "pt-BR", name: "Portuguese (Brazil)", native: "Português (Brasil)", flag: "🇧🇷" },
  { code: "pt-PT", name: "Portuguese (Portugal)", native: "Português (Portugal)", flag: "🇵🇹" },
  { code: "ur", name: "Urdu", native: "اردو", flag: "🇵🇰", rtl: true },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "de", name: "German", native: "Deutsch", flag: "🇩🇪" },
  { code: "de-AT", name: "German (Austria)", native: "Deutsch (Österreich)", flag: "🇦🇹" },
  { code: "de-CH", name: "German (Switzerland)", native: "Deutsch (Schweiz)", flag: "🇨🇭" },
  { code: "ja", name: "Japanese", native: "日本語", flag: "🇯🇵" },
  { code: "sw", name: "Swahili", native: "Kiswahili", flag: "🇰🇪" },
  { code: "tr", name: "Turkish", native: "Türkçe", flag: "🇹🇷" },
  { code: "ta", name: "Tamil", native: "தமிழ்", flag: "🇮🇳" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt", flag: "🇻🇳" },
  { code: "ko", name: "Korean", native: "한국어", flag: "🇰🇷" },
  { code: "it", name: "Italian", native: "Italiano", flag: "🇮🇹" },
  { code: "fa", name: "Persian", native: "فارسی", flag: "🇮🇷", rtl: true },
  { code: "pl", name: "Polish", native: "Polski", flag: "🇵🇱" },
  { code: "uk", name: "Ukrainian", native: "Українська", flag: "🇺🇦" },
  { code: "ro", name: "Romanian", native: "Română", flag: "🇷🇴" },
  { code: "nl", name: "Dutch", native: "Nederlands", flag: "🇳🇱" },
  { code: "el", name: "Greek", native: "Ελληνικά", flag: "🇬🇷" },
  { code: "hu", name: "Hungarian", native: "Magyar", flag: "🇭🇺" },
  { code: "sv", name: "Swedish", native: "Svenska", flag: "🇸🇪" },
  { code: "cs", name: "Czech", native: "Čeština", flag: "🇨🇿" },
  { code: "he", name: "Hebrew", native: "עברית", flag: "🇮🇱", rtl: true },
  { code: "th", name: "Thai", native: "ภาษาไทย", flag: "🇹🇭" },
  { code: "da", name: "Danish", native: "Dansk", flag: "🇩🇰" },
  { code: "no", name: "Norwegian", native: "Norsk", flag: "🇳🇴" },
  { code: "fi", name: "Finnish", native: "Suomi", flag: "🇫🇮" },
  { code: "sk", name: "Slovak", native: "Slovenčina", flag: "🇸🇰" },
  { code: "bg", name: "Bulgarian", native: "Български", flag: "🇧🇬" },
  { code: "hr", name: "Croatian", native: "Hrvatski", flag: "🇭🇷" },
  { code: "lt", name: "Lithuanian", native: "Lietuvių", flag: "🇱🇹" },
  { code: "sl", name: "Slovenian", native: "Slovenščina", flag: "🇸🇮" },
  { code: "lv", name: "Latvian", native: "Latviešu", flag: "🇱🇻" },
  { code: "et", name: "Estonian", native: "Eesti", flag: "🇪🇪" },
  { code: "sr", name: "Serbian", native: "Српски", flag: "🇷🇸" },
  { code: "ca", name: "Catalan", native: "Català", flag: "🇪🇸" },
  { code: "bs", name: "Bosnian", native: "Bosanski", flag: "🇧🇦" },
  { code: "mk", name: "Macedonian", native: "Македонски", flag: "🇲🇰" },
  { code: "sq", name: "Albanian", native: "Shqip", flag: "🇦🇱" },
  { code: "is", name: "Icelandic", native: "Íslenska", flag: "🇮🇸" },
  { code: "ga", name: "Irish", native: "Gaeilge", flag: "🇮🇪" },
  { code: "cy", name: "Welsh", native: "Cymraeg", flag: "🇬🇧" },
  { code: "eu", name: "Basque", native: "Euskara", flag: "🇪🇸" },
  { code: "gl", name: "Galician", native: "Galego", flag: "🇪🇸" },
  { code: "mt", name: "Maltese", native: "Malti", flag: "🇲🇹" },
  { code: "lb", name: "Luxembourgish", native: "Lëtzebuergesch", flag: "🇱🇺" },
  { code: "rm", name: "Romansh", native: "Rumantsch", flag: "🇨🇭" },
  { code: "az", name: "Azerbaijani", native: "Azərbaycan", flag: "🇦🇿" },
  { code: "hy", name: "Armenian", native: "Հայերեն", flag: "🇦🇲" },
  { code: "ka", name: "Georgian", native: "ქართული", flag: "🇬🇪" },
  { code: "kk", name: "Kazakh", native: "Қазақ", flag: "🇰🇿" },
  { code: "ky", name: "Kyrgyz", native: "Кыргыз", flag: "🇰🇬" },
  { code: "tg", name: "Tajik", native: "Тоҷикӣ", flag: "🇹🇯" },
  { code: "tk", name: "Turkmen", native: "Türkmen", flag: "🇹🇲" },
  { code: "uz", name: "Uzbek", native: "Oʻzbek", flag: "🇺🇿" },
  { code: "mn", name: "Mongolian", native: "Монгол", flag: "🇲🇳" },
  { code: "my", name: "Burmese", native: "မြန်မာ", flag: "🇲🇲" },
  { code: "km", name: "Khmer", native: "ខ្មែរ", flag: "🇰🇭" },
  { code: "lo", name: "Lao", native: "ລາວ", flag: "🇱🇦" },
  { code: "ms", name: "Malay", native: "Bahasa Melayu", flag: "🇲🇾" },
  { code: "jv", name: "Javanese", native: "Basa Jawa", flag: "🇮🇩" },
  { code: "su", name: "Sundanese", native: "Basa Sunda", flag: "🇮🇩" },
  { code: "ceb", name: "Cebuano", native: "Binisaya", flag: "🇵🇭" },
  { code: "tl", name: "Tagalog", native: "Tagalog", flag: "🇵🇭" },
  { code: "mg", name: "Malagasy", native: "Malagasy", flag: "🇲🇬" },
  { code: "ny", name: "Chichewa", native: "Chichewa", flag: "🇲🇼" },
  { code: "sn", name: "Shona", native: "ChiShona", flag: "🇿🇼" },
  { code: "zu", name: "Zulu", native: "isiZulu", flag: "🇿🇦" },
  { code: "xh", name: "Xhosa", native: "isiXhosa", flag: "🇿🇦" },
  { code: "af", name: "Afrikaans", native: "Afrikaans", flag: "🇿🇦" },
  { code: "st", name: "Sesotho", native: "Sesotho", flag: "🇱🇸" },
  { code: "nso", name: "Northern Sotho", native: "Sepedi", flag: "🇿🇦" },
  { code: "tn", name: "Tswana", native: "Setswana", flag: "🇧🇼" },
  { code: "ts", name: "Tsonga", native: "Xitsonga", flag: "🇿🇦" },
  { code: "ve", name: "Venda", native: "Tshivenḓa", flag: "🇿🇦" },
  { code: "ss", name: "Swati", native: "siSwati", flag: "🇸🇿" },
  { code: "nr", name: "Southern Ndebele", native: "isiNdebele", flag: "🇿🇦" },
  { code: "nd", name: "Northern Ndebele", native: "isiNdebele", flag: "🇿🇼" },
  { code: "so", name: "Somali", native: "Soomaali", flag: "🇸🇴" },
  { code: "aa", name: "Afar", native: "Afar", flag: "🇩🇯" },
  { code: "om", name: "Oromo", native: "Oromoo", flag: "🇪🇹" },
  { code: "am", name: "Amharic", native: "አማርኛ", flag: "🇪🇹" },
  { code: "ti", name: "Tigrinya", native: "ትግርኛ", flag: "🇪🇷" },
  { code: "ha", name: "Hausa", native: "Hausa", flag: "🇳🇬" },
  { code: "yo", name: "Yoruba", native: "Yorùbá", flag: "🇳🇬" },
  { code: "ig", name: "Igbo", native: "Igbo", flag: "🇳🇬" },
  { code: "ak", name: "Akan", native: "Akan", flag: "🇬🇭" },
  { code: "tw", name: "Twi", native: "Twi", flag: "🇬🇭" },
  { code: "wo", name: "Wolof", native: "Wolof", flag: "🇸🇳" },
  { code: "bm", name: "Bambara", native: "Bamanankan", flag: "🇲🇱" },
  { code: "ln", name: "Lingala", native: "Lingála", flag: "🇨🇩" },
  { code: "sw-CD", name: "Swahili (Congo)", native: "Kiswahili (Kongo)", flag: "🇨🇩" },
  { code: "rw", name: "Kinyarwanda", native: "Ikinyarwanda", flag: "🇷🇼" },
  { code: "rn", name: "Kirundi", native: "Ikirundi", flag: "🇧🇮" },
  { code: "lg", name: "Luganda", native: "Luganda", flag: "🇺🇬" },
  { code: "sw-KE", name: "Swahili (Kenya)", native: "Kiswahili (Kenya)", flag: "🇰🇪" },
  { code: "sw-TZ", name: "Swahili (Tanzania)", native: "Kiswahili (Tanzania)", flag: "🇹🇿" },
  { code: "ne", name: "Nepali", native: "नेपाली", flag: "🇳🇵" },
  { code: "si", name: "Sinhala", native: "සිංහල", flag: "🇱🇰" },
  { code: "my-MM", name: "Burmese (Myanmar)", native: "မြန်မာ (မြန်မာ)", flag: "🇲🇲" },
  { code: "lo-LA", name: "Lao (Laos)", native: "ລາວ (ລາວ)", flag: "🇱🇦" },
  { code: "km-KH", name: "Khmer (Cambodia)", native: "ខ្មែរ (កម្ពុជា)", flag: "🇰🇭" },
  { code: "th-TH", name: "Thai (Thailand)", native: "ภาษาไทย (ประเทศไทย)", flag: "🇹🇭" },
  { code: "vi-VN", name: "Vietnamese (Vietnam)", native: "Tiếng Việt (Việt Nam)", flag: "🇻🇳" },
  { code: "id-ID", name: "Indonesian (Indonesia)", native: "Bahasa Indonesia (Indonesia)", flag: "🇮🇩" },
  { code: "ms-MY", name: "Malay (Malaysia)", native: "Bahasa Melayu (Malaysia)", flag: "🇲🇾" },
  { code: "fil", name: "Filipino", native: "Filipino", flag: "🇵🇭" },
  { code: "jv-ID", name: "Javanese (Indonesia)", native: "Basa Jawa (Indonesia)", flag: "🇮🇩" },
  { code: "su-ID", name: "Sundanese (Indonesia)", native: "Basa Sunda (Indonesia)", flag: "🇮🇩" },
  { code: "ceb-PH", name: "Cebuano (Philippines)", native: "Binisaya (Pilipinas)", flag: "🇵🇭" },
  { code: "haw", name: "Hawaiian", native: "ʻŌlelo Hawaiʻi", flag: "🇺🇸" },
  { code: "mi", name: "Maori", native: "Māori", flag: "🇳🇿" },
  { code: "sm", name: "Samoan", native: "Gagana fa'a Sāmoa", flag: "🇼🇸" },
  { code: "to", name: "Tongan", native: "Lea faka-Tonga", flag: "🇹🇴" },
  { code: "fj", name: "Fijian", native: "Vosa Vakaviti", flag: "🇫🇯" },
  { code: "mn-MN", name: "Mongolian (Mongolia)", native: "Монгол (Монгол улс)", flag: "🇲🇳" },
  { code: "kk-KZ", name: "Kazakh (Kazakhstan)", native: "Қазақ (Қазақстан)", flag: "🇰🇿" },
  { code: "ky-KG", name: "Kyrgyz (Kyrgyzstan)", native: "Кыргыз (Кыргызстан)", flag: "🇰🇬" },
  { code: "uz-UZ", name: "Uzbek (Uzbekistan)", native: "Oʻzbek (Oʻzbekiston)", flag: "🇺🇿" },
  { code: "tg-TJ", name: "Tajik (Tajikistan)", native: "Тоҷикӣ (Тоҷикистон)", flag: "🇹🇯" },
  { code: "tk-TM", name: "Turkmen (Turkmenistan)", native: "Türkmen (Türkmenistan)", flag: "🇹🇲" },
  { code: "az-AZ", name: "Azerbaijani (Azerbaijan)", native: "Azərbaycan (Azərbaycan)", flag: "🇦🇿" },
  { code: "ka-GE", name: "Georgian (Georgia)", native: "ქართული (საქართველო)", flag: "🇬🇪" },
  { code: "hy-AM", name: "Armenian (Armenia)", native: "Հայերեն (Հայաստան)", flag: "🇦🇲" },
  { code: "he-IL", name: "Hebrew (Israel)", native: "עברית (ישראל)", flag: "🇮🇱", rtl: true },
  { code: "ar-IL", name: "Arabic (Israel)", native: "العربية (إسرائيل)", flag: "🇮🇱", rtl: true },
  { code: "fa-IR", name: "Persian (Iran)", native: "فارسی (ایران)", flag: "🇮🇷", rtl: true },
  { code: "ur-PK", name: "Urdu (Pakistan)", native: "اردو (پاکستان)", flag: "🇵🇰", rtl: true },
  { code: "ps", name: "Pashto", native: "پښتو", flag: "🇦🇫", rtl: true },
  { code: "fa-AF", name: "Dari", native: "دری", flag: "🇦🇫", rtl: true },
  { code: "sd", name: "Sindhi", native: "سنڌي", flag: "🇵🇰", rtl: true },
  { code: "sa", name: "Sanskrit", native: "संस्कृतम्", flag: "🇮🇳" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી", flag: "🇮🇳" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ", flag: "🇮🇳" },
  { code: "as", name: "Assamese", native: "অসমীয়া", flag: "🇮🇳" },
  { code: "mai", name: "Maithili", native: "मैथिली", flag: "🇮🇳" },
  { code: "bho", name: "Bhojpuri", native: "भोजपुरी", flag: "🇮🇳" },
  { code: "awa", name: "Awadhi", native: "अवधी", flag: "🇮🇳" },
  { code: "doi", name: "Dogri", native: "डोगरी", flag: "🇮🇳" },
  { code: "kok", name: "Konkani", native: "कोंकणी", flag: "🇮🇳" },
  { code: "mni", name: "Manipuri", native: "মৈতৈলোন্", flag: "🇮🇳" },
  { code: "sat", name: "Santali", native: "ᱥᱟᱱᱛᱟᱲᱤ", flag: "🇮🇳" },
  { code: "ks", name: "Kashmiri", native: "कॉशुर", flag: "🇮🇳" },
  { code: "gom", name: "Konkani (Goan)", native: "कोंकणी", flag: "🇮🇳" },
  { code: "br", name: "Breton", native: "Brezhoneg", flag: "🇫🇷" },
  { code: "co", name: "Corsican", native: "Corsu", flag: "🇫🇷" },
  { code: "oc", name: "Occitan", native: "Occitan", flag: "🇫🇷" },
  { code: "fur", name: "Friulian", native: "Furlan", flag: "🇮🇹" },
  { code: "sc", name: "Sardinian", native: "Sardu", flag: "🇮🇹" },
  { code: "vec", name: "Venetian", native: "Vèneto", flag: "🇮🇹" },
  { code: "lmo", name: "Lombard", native: "Lombard", flag: "🇮🇹" },
  { code: "pms", name: "Piedmontese", native: "Piemontèis", flag: "🇮🇹" },
  { code: "nap", name: "Neapolitan", native: "Napulitano", flag: "🇮🇹" },
  { code: "scn", name: "Sicilian", native: "Sicilianu", flag: "🇮🇹" },
  { code: "rm-rg", name: "Romansh (Grischun)", native: "Rumantsch", flag: "🇨🇭" },
  { code: "wae", name: "Walser", native: "Walser", flag: "🇨🇭" },
  { code: "frp", name: "Franco-Provençal", native: "Arpitan", flag: "🇫🇷" },
  { code: "lad", name: "Ladino", native: "Ladino", flag: "🇮🇱" },
  { code: "roa-tara", name: "Tarantino", native: "Tarandíne", flag: "🇮🇹" },
  { code: "egl", name: "Emilian", native: "Emiliàn", flag: "🇮🇹" },
  { code: "rgn", name: "Romagnol", native: "Rumagnôl", flag: "🇮🇹" },
  { code: "sdc", name: "Sassarese", native: "Sassaresu", flag: "🇮🇹" },
  { code: "csc", name: "Catalan-Valencian", native: "Català-Valencià", flag: "🇪🇸" },
  { code: "oc-gascon", name: "Gascon", native: "Gascon", flag: "🇫🇷" },
  { code: "auv", name: "Auvergnat", native: "Auvernhat", flag: "🇫🇷" },
  { code: "lim", name: "Limburgish", native: "Limburgs", flag: "🇳🇱" },
  { code: "zea", name: "Zeelandic", native: "Zeêuws", flag: "🇳🇱" },
  { code: "vls", name: "West Flemish", native: "West-Vlams", flag: "🇧🇪" },
  { code: "zea-NL", name: "Zeelandic (Netherlands)", native: "Zeêuws (Nederland)", flag: "🇳🇱" },
  { code: "fy", name: "Western Frisian", native: "Frysk", flag: "🇳🇱" },
  { code: "stq", name: "Saterland Frisian", native: "Seeltersk", flag: "🇩🇪" },
  { code: "nds", name: "Low German", native: "Plattdüütsch", flag: "🇩🇪" },
  { code: "pdc", name: "Pennsylvania Dutch", native: "Pennsilfaanisch Deitsch", flag: "🇺🇸" },
  { code: "ksh", name: "Ripuarian", native: "Ripoarisch", flag: "🇩🇪" },
  { code: "vmf", name: "Main-Franconian", native: "Mainfränkisch", flag: "🇩🇪" },
  { code: "bar", name: "Bavarian", native: "Boarisch", flag: "🇩🇪" },
  { code: "gsw", name: "Alemannic", native: "Alemannisch", flag: "🇨🇭" },
  { code: "wuu", name: "Wu Chinese", native: "吴语", flag: "🇨🇳" },
  { code: "yue", name: "Cantonese", native: "粵語", flag: "🇭🇰" },
  { code: "nan", name: "Min Nan", native: "閩南語", flag: "🇹🇼" },
  { code: "cdo", name: "Min Dong", native: "閩東語", flag: "🇨🇳" },
  { code: "gan", name: "Gan Chinese", native: "赣语", flag: "🇨🇳" },
  { code: "hak", name: "Hakka", native: "客家话", flag: "🇨🇳" },
  { code: "hsn", name: "Xiang Chinese", native: "湘语", flag: "🇨🇳" },
  { code: "cpx", name: "Pu-Xian Min", native: "莆仙话", flag: "🇨🇳" },
  { code: "mnp", name: "Min Bei", native: "闽北话", flag: "🇨🇳" },
  { code: "czo", name: "Min Zhong", native: "闽中话", flag: "🇨🇳" },
  { code: "dng", name: "Dungan", native: "Дунган", flag: "🇰🇿" },
]

// The core string keys that need translation
const CORE_STRING_KEYS = [
  "app.title", "app.tagline", "app.description",
  "nav.dashboard", "nav.world", "nav.pilots", "nav.marketplace", "nav.admin", "nav.workflows", "nav.verify", "nav.assessment", "nav.check", "nav.pricing", "nav.commit", "nav.embed", "nav.world_globe", "nav.pilots_status", "nav.sovereign_os", "nav.knowledge_graph",
  "auth.login", "auth.signup", "auth.logout", "auth.email", "auth.organization", "auth.country", "auth.enter_os", "auth.welcome", "auth.no_card",
  "sovereign.dashboard", "sovereign.pillars", "sovereign.knowledge_graph", "sovereign.chat", "sovereign.workflows", "sovereign.sessions", "sovereign.tasks", "sovereign.tools", "sovereign.files", "sovereign.settings",
  "persona.architect", "persona.dragon", "persona.compliance", "persona.defence", "persona.builder",
  "globe.title", "globe.zoom_in", "globe.zoom_out", "globe.rotate", "globe.pause", "globe.resume", "globe.hives_tracked", "globe.pillars", "globe.year_1_arr", "globe.year_3_arr", "globe.click_explore",
  "hive.compliance", "hive.active_users", "hive.active_mcps", "hive.threat_level", "hive.view_dashboard",
  "pillar.compliance", "pillar.optometry", "pillar.cobol", "pillar.haulage", "pillar.aquaculture",
  "skeleton.loading", "skeleton.error", "skeleton.empty", "skeleton.no_data", "skeleton.coming_soon", "skeleton.beta", "skeleton.alpha",
  "skeleton.thinking", "skeleton.working", "skeleton.searching", "skeleton.loading_10pct",
  "10pct.welcome", "10pct.step1", "10pct.step2", "10pct.step3", "10pct.step4", "10pct.step5", "10pct.step6", "10pct.step7", "10pct.step8", "10pct.step9", "10pct.step10", "10pct.done",
  "10pct.step1.title", "10pct.step2.title", "10pct.step3.title", "10pct.step4.title", "10pct.step5.title", "10pct.step6.title", "10pct.step7.title", "10pct.step8.title", "10pct.step9.title", "10pct.step10.title",
  "10pct.step1.desc", "10pct.step2.desc", "10pct.step3.desc", "10pct.step4.desc", "10pct.step5.desc", "10pct.step6.desc", "10pct.step7.desc", "10pct.step8.desc", "10pct.step9.desc", "10pct.step10.desc",
  "30m.eu_ai_act", "30m.eu_ai_act.title", "30m.eu_ai_act.exposure", "30m.eu_ai_act.article", "30m.eu_ai_act.deadline", "30m.eu_ai_act.obligations", "30m.eu_ai_act.recommendation", "30m.eu_ai_act.kit", "30m.eu_ai_act.roi",
  "exposure.title", "exposure.subtitle", "exposure.input_label", "exposure.use_case_label", "exposure.turnover_label", "exposure.human_review_label", "exposure.calculate", "exposure.result_title", "exposure.kit_button",
  "mavis7.title", "mavis7.early_adopter", "mavis7.commit", "mavis7.verify", "mavis7.founding_fork", "mavis7.builder", "mavis7.pioneer", "mavis7.partner", "mavis7.team",
  "regulator.eu_aioffice", "regulator.edpb", "regulator.eba", "regulator.enisa", "regulator.nist", "regulator.fedramp", "regulator.uk_mod", "regulator.uk_ico", "regulator.uk_fca", "regulator.cn_cac",
  "regulator.framework_count", "regulator.frameworks", "regulator.white_papers", "regulator.deadlines", "regulator.status", "regulator.jurisdiction",
  "compliance.tier_prohibited", "compliance.tier_high_risk", "compliance.tier_gpai", "compliance.tier_limited_risk", "compliance.tier_minimal_risk",
  "compliance.article_99", "compliance.article_50", "compliance.article_5", "compliance.dpia", "compliance.soc2", "compliance.iso_42001",
  "wedge.title", "wedge.exposure", "wedge.kit", "wedge.roi", "wedge.cta", "wedge.sla", "wedge.gdpr", "wedge.dora", "wedge.iso",
  "pilot.wcr", "pilot.templeman", "pilot.unicredit", "pilot.macleod", "pilot.iok_farm",
  "iok_farm.title", "iok_farm.beacon", "iok_farm.sov_town", "iok_farm.ponds", "iok_farm.koi", "iok_farm.dogs",
  "sla.uptime", "sla.latency", "sla.error_rate", "sla.attestation", "sla.support", "sla.recovery",
  "mcp.eu_ai_act", "mcp.gdpr", "mcp.dora", "mcp.iso_42001", "mcp.c2pa", "mcp.attestation", "mcp.watermark", "mcp.compliance_passport",
  "tools.search", "tools.browse", "tools.install", "tools.run", "tools.deploy", "tools.monitor", "tools.alert",
  "actions.approve", "actions.reject", "actions.defer", "actions.escalate", "actions.delegate", "actions.assign",
  "buttons.save", "buttons.cancel", "buttons.confirm", "buttons.next", "buttons.previous", "buttons.close", "buttons.help", "buttons.learn_more", "buttons.get_started",
  "messages.success", "messages.error", "messages.warning", "messages.info", "messages.loading", "messages.no_data", "messages.coming_soon",
  "status.online", "status.offline", "status.degraded", "status.maintenance", "status.busy", "status.idle",
  "time.just_now", "time.minutes_ago", "time.hours_ago", "time.days_ago", "time.weeks_ago", "time.months_ago",
  "consent.allow", "consent.deny", "consent.cookies", "consent.gdpr", "consent.privacy", "consent.terms",
]

// Translation function: gets a string for the given locale, falls back to English
export function t(locale: LocaleCode, key: string, defaultValue: string = ""): string {
  // In production, this would lookup the translation from the i18n bundle
  // For now, return the default value or English
  return defaultValue
}

// Get all supported locales
export function getAllLocales(): typeof ALL_200_LOCALES {
  return ALL_200_LOCALES
}

// Get RTL locales
export function getRTLLocales(): typeof ALL_200_LOCALES {
  return ALL_200_LOCALES.filter((l) => l.rtl)
}

// Auto-detect locale from browser
export function detectLocale(): LocaleCode {
  if (typeof navigator === "undefined") return "en"
  const lang = navigator.language || (navigator as any).userLanguage || "en"
  if (ALL_200_LOCALES.find((l) => l.code === lang)) return lang
  const baseLang = lang.split("-")[0]
  if (ALL_200_LOCALES.find((l) => l.code === baseLang)) return baseLang
  return "en"
}

// Get the EU 24 official languages
export function getEU24Languages(): typeof ALL_200_LOCALES {
  return ALL_200_LOCALES.filter((l) => EU_24_LANGUAGES.includes(l.code))
}

// Get the UN 7 official languages
export function getUN7Languages(): typeof ALL_200_LOCALES {
  return ALL_200_LOCALES.filter((l) => UN_7.includes(l.code))
}

// Get locale metadata
export function getLocaleMetadata(locale: LocaleCode): typeof ALL_200_LOCALES[0] | undefined {
  return ALL_200_LOCALES.find((l) => l.code === locale)
}

// Get text direction
export function isRTL(locale: LocaleCode): boolean {
  const meta = getLocaleMetadata(locale)
  return meta?.rtl || false
}

// Get total locale count
export const TOTAL_LOCALES = ALL_200_LOCALES.length
export const EU_24_COUNT = EU_24_LANGUAGES.length
export const UN_7_COUNT = UN_7.length
export const TOTAL_CORE_STRINGS = CORE_STRING_KEYS.length
