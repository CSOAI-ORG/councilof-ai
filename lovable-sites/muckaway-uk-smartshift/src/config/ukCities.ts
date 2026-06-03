// UK Cities configuration for SEO location pages with full schema data

export interface CityService {
  name: string;
  description: string;
  startingPrice: number;
}

export interface CityFAQ {
  question: string;
  answer: string;
}

export interface CityCoordinates {
  latitude: number;
  longitude: number;
}

export interface CityLocalInfo {
  overview: string;
  keyAreas?: string[];
}

export interface CityRating {
  average: number;
  count: number;
}

export interface CityData {
  name: string;
  slug: string;
  region: string;
  population: number;
  description: string;
  services: CityService[];
  localInfo?: CityLocalInfo;
  coordinates: CityCoordinates;
  postcodePrefix: string;
  rating: CityRating;
  faqs: CityFAQ[];
}

const defaultServices: CityService[] = [
  {
    name: 'Muck Away',
    description: 'Professional spoil and excavation waste removal with full compliance documentation.',
    startingPrice: 30,
  },
  {
    name: 'Grab Hire',
    description: 'Grab lorry hire for quick loading and removal of loose materials.',
    startingPrice: 250,
  },
  {
    name: 'Skip Alternative',
    description: 'Same-day collection without the need for permits or street space.',
    startingPrice: 150,
  },
];

const generateCityFAQs = (cityName: string, region: string): CityFAQ[] => [
  {
    question: `How much does muck away cost in ${cityName}?`,
    answer: `Muck away prices in ${cityName} start from £30 per tonne for clean inert soil. Prices vary based on waste type, volume, and site access. Get an instant AI-powered quote for accurate pricing.`
  },
  {
    question: `Do you provide same-day muck away in ${cityName}?`,
    answer: `Yes, we offer same-day muck away services across ${cityName} and the ${region} area. Book before 10am for same-day collection, subject to availability.`
  },
  {
    question: `What types of waste do you collect in ${cityName}?`,
    answer: `We collect all construction and excavation waste in ${cityName} including topsoil, subsoil, clay, hardcore, concrete, brick rubble, and mixed spoil. Our AI classifier identifies the correct waste type automatically.`
  },
  {
    question: `Are your muck away drivers licensed in ${cityName}?`,
    answer: `Yes, all our carriers operating in ${cityName} are fully licensed and registered with the Environment Agency. We provide complete waste transfer documentation for every collection.`
  },
  {
    question: `What size grab lorries do you have for ${cityName}?`,
    answer: `We operate 6-wheel and 8-wheel grab lorries in ${cityName}, capable of collecting 8-20 tonnes per load. Our vehicles can reach up to 6 meters from the road.`
  },
  {
    question: `Do I need a permit for muck away in ${cityName}?`,
    answer: `Unlike skips, our grab lorry service in ${cityName} doesn't require a street permit as we load directly from your site. This saves time and council fees.`
  }
];

export const UK_CITIES: CityData[] = [
  {
    name: 'London',
    slug: 'london',
    region: 'Greater London',
    population: 8982000,
    description: 'Fast, compliant muck away services across all London boroughs. AI-powered waste classification for construction sites.',
    services: defaultServices,
    coordinates: { latitude: 51.5074, longitude: -0.1278 },
    postcodePrefix: 'E, EC, N, NW, SE, SW, W, WC',
    rating: { average: 4.9, count: 847 },
    faqs: generateCityFAQs('London', 'Greater London'),
    localInfo: {
      overview: 'London is the UK\'s largest construction market with thousands of active sites. Our network of EA-registered carriers provides same-day muck away services across all 32 boroughs.',
      keyAreas: ['Central London', 'East London', 'West London', 'North London', 'South London', 'Canary Wharf', 'City of London', 'Stratford', 'Croydon', 'Bromley'],
    },
  },
  {
    name: 'Birmingham',
    slug: 'birmingham',
    region: 'West Midlands',
    population: 1141816,
    description: 'Leading muck away provider in Birmingham and the West Midlands. Quick quotes, faster collection.',
    services: defaultServices,
    coordinates: { latitude: 52.4862, longitude: -1.8904 },
    postcodePrefix: 'B',
    rating: { average: 4.8, count: 523 },
    faqs: generateCityFAQs('Birmingham', 'West Midlands'),
    localInfo: {
      overview: 'Birmingham\'s ongoing regeneration creates significant demand for muck away services. We serve the city centre and surrounding areas with fully compliant waste removal.',
      keyAreas: ['City Centre', 'Digbeth', 'Edgbaston', 'Erdington', 'Solihull', 'Sutton Coldfield', 'Moseley', 'Kings Heath', 'Harborne'],
    },
  },
  {
    name: 'Manchester',
    slug: 'manchester',
    region: 'Greater Manchester',
    population: 553230,
    description: 'Reliable muck away services across Greater Manchester. From small residential jobs to major construction projects.',
    services: defaultServices,
    coordinates: { latitude: 53.4808, longitude: -2.2426 },
    postcodePrefix: 'M',
    rating: { average: 4.9, count: 412 },
    faqs: generateCityFAQs('Manchester', 'Greater Manchester'),
    localInfo: {
      overview: 'Manchester\'s construction boom means high demand for professional spoil removal. Our carriers operate across the entire Greater Manchester area.',
      keyAreas: ['City Centre', 'Salford', 'Trafford', 'Stockport', 'Oldham', 'Bolton', 'Bury', 'Rochdale', 'Wigan', 'Tameside'],
    },
  },
  {
    name: 'Leeds',
    slug: 'leeds',
    region: 'West Yorkshire',
    population: 793139,
    description: 'Professional muck away and grab hire services in Leeds and West Yorkshire.',
    services: defaultServices,
    coordinates: { latitude: 53.8008, longitude: -1.5491 },
    postcodePrefix: 'LS',
    rating: { average: 4.8, count: 298 },
    faqs: generateCityFAQs('Leeds', 'West Yorkshire'),
    localInfo: {
      overview: 'Leeds is one of the UK\'s fastest-growing cities with major infrastructure projects. We provide compliant waste removal across the region.',
      keyAreas: ['City Centre', 'Headingley', 'Chapel Allerton', 'Roundhay', 'Morley', 'Pudsey', 'Horsforth', 'Wetherby', 'Otley'],
    },
  },
  {
    name: 'Glasgow',
    slug: 'glasgow',
    region: 'Scotland',
    population: 633120,
    description: 'Scotland\'s leading muck away service. SEPA compliant with full waste transfer documentation.',
    services: defaultServices,
    coordinates: { latitude: 55.8642, longitude: -4.2518 },
    postcodePrefix: 'G',
    rating: { average: 4.7, count: 267 },
    faqs: generateCityFAQs('Glasgow', 'Scotland'),
    localInfo: {
      overview: 'Glasgow\'s construction sector continues to grow. We provide SEPA-compliant muck away services across the city and surrounding areas.',
      keyAreas: ['City Centre', 'West End', 'Southside', 'East End', 'North Glasgow', 'Partick', 'Govan', 'Dennistoun'],
    },
  },
  {
    name: 'Liverpool',
    slug: 'liverpool',
    region: 'Merseyside',
    population: 498042,
    description: 'Fast, affordable muck away services across Liverpool and Merseyside.',
    services: defaultServices,
    coordinates: { latitude: 53.4084, longitude: -2.9916 },
    postcodePrefix: 'L',
    rating: { average: 4.8, count: 234 },
    faqs: generateCityFAQs('Liverpool', 'Merseyside'),
    localInfo: {
      overview: 'Liverpool\'s waterfront and city centre regeneration creates ongoing demand for professional spoil removal services.',
      keyAreas: ['City Centre', 'Liverpool Waters', 'Toxteth', 'Anfield', 'Everton', 'Wirral', 'Bootle', 'Crosby'],
    },
  },
  {
    name: 'Bristol',
    slug: 'bristol',
    region: 'South West',
    population: 463405,
    description: 'Eco-friendly muck away services in Bristol. High recycling rates, full compliance.',
    services: defaultServices,
    coordinates: { latitude: 51.4545, longitude: -2.5879 },
    postcodePrefix: 'BS',
    rating: { average: 4.9, count: 312 },
    faqs: generateCityFAQs('Bristol', 'South West'),
    localInfo: {
      overview: 'Bristol\'s commitment to sustainability aligns with our eco-friendly approach. We prioritize recycling and minimize landfill use.',
      keyAreas: ['City Centre', 'Clifton', 'Bedminster', 'Fishponds', 'Stokes Croft', 'Temple Meads', 'Redland', 'Southville'],
    },
  },
  {
    name: 'Sheffield',
    slug: 'sheffield',
    region: 'South Yorkshire',
    population: 584853,
    description: 'Reliable muck away provider for Sheffield and South Yorkshire construction sites.',
    services: defaultServices,
    coordinates: { latitude: 53.3811, longitude: -1.4701 },
    postcodePrefix: 'S',
    rating: { average: 4.7, count: 198 },
    faqs: generateCityFAQs('Sheffield', 'South Yorkshire'),
    localInfo: {
      overview: 'Sheffield\'s ongoing regeneration includes major infrastructure projects. We serve the city and surrounding South Yorkshire areas.',
      keyAreas: ['City Centre', 'Ecclesall', 'Crookes', 'Hillsborough', 'Meadowhall', 'Dore', 'Broomhill', 'Nether Edge'],
    },
  },
  {
    name: 'Edinburgh',
    slug: 'edinburgh',
    region: 'Scotland',
    population: 524930,
    description: 'SEPA-compliant muck away services in Edinburgh. Serving the capital and Lothians.',
    services: defaultServices,
    coordinates: { latitude: 55.9533, longitude: -3.1883 },
    postcodePrefix: 'EH',
    rating: { average: 4.8, count: 245 },
    faqs: generateCityFAQs('Edinburgh', 'Scotland'),
    localInfo: {
      overview: 'Edinburgh\'s unique heritage buildings require careful waste management. We provide specialist services for sensitive sites.',
      keyAreas: ['City Centre', 'Leith', 'Morningside', 'Stockbridge', 'Portobello', 'South Edinburgh', 'New Town', 'Old Town'],
    },
  },
  {
    name: 'Newcastle',
    slug: 'newcastle',
    region: 'Tyne and Wear',
    population: 302820,
    description: 'Professional muck away and grab hire across Newcastle and the North East.',
    services: defaultServices,
    coordinates: { latitude: 54.9783, longitude: -1.6178 },
    postcodePrefix: 'NE',
    rating: { average: 4.8, count: 178 },
    faqs: generateCityFAQs('Newcastle', 'Tyne and Wear'),
    localInfo: {
      overview: 'Newcastle\'s vibrant construction sector benefits from our efficient muck away services covering Tyneside and beyond.',
      keyAreas: ['City Centre', 'Jesmond', 'Gosforth', 'Gateshead', 'North Shields', 'Sunderland', 'Heaton', 'Fenham'],
    },
  },
  {
    name: 'Nottingham',
    slug: 'nottingham',
    region: 'East Midlands',
    population: 321500,
    description: 'Fast muck away services in Nottingham and Nottinghamshire.',
    services: defaultServices,
    coordinates: { latitude: 52.9548, longitude: -1.1581 },
    postcodePrefix: 'NG',
    rating: { average: 4.7, count: 167 },
    faqs: generateCityFAQs('Nottingham', 'East Midlands'),
    localInfo: {
      overview: 'Nottingham\'s growing construction sector relies on efficient waste removal. We cover the city and greater Nottinghamshire.',
      keyAreas: ['City Centre', 'West Bridgford', 'Beeston', 'Arnold', 'Carlton', 'Hucknall'],
    },
  },
  {
    name: 'Southampton',
    slug: 'southampton',
    region: 'Hampshire',
    population: 252796,
    description: 'Coastal construction specialists. Muck away services across Southampton.',
    services: defaultServices,
    coordinates: { latitude: 50.9097, longitude: -1.4044 },
    postcodePrefix: 'SO',
    rating: { average: 4.8, count: 156 },
    faqs: generateCityFAQs('Southampton', 'Hampshire'),
    localInfo: {
      overview: 'Southampton\'s port and marine construction creates unique waste disposal needs. We specialize in coastal site services.',
      keyAreas: ['City Centre', 'Shirley', 'Portswood', 'Bitterne', 'Woolston', 'Ocean Village'],
    },
  },
  {
    name: 'Portsmouth',
    slug: 'portsmouth',
    region: 'Hampshire',
    population: 238800,
    description: 'Island and mainland muck away services in Portsmouth.',
    services: defaultServices,
    coordinates: { latitude: 50.8198, longitude: -1.0880 },
    postcodePrefix: 'PO',
    rating: { average: 4.7, count: 134 },
    faqs: generateCityFAQs('Portsmouth', 'Hampshire'),
    localInfo: {
      overview: 'Portsmouth\'s unique island geography requires specialist logistics. We provide efficient muck away across Portsea Island and Havant.',
      keyAreas: ['City Centre', 'Southsea', 'Fratton', 'Cosham', 'Havant', 'Portchester'],
    },
  },
  {
    name: 'Leicester',
    slug: 'leicester',
    region: 'East Midlands',
    population: 354224,
    description: 'Central England muck away hub. Fast quotes, faster collection.',
    services: defaultServices,
    coordinates: { latitude: 52.6369, longitude: -1.1398 },
    postcodePrefix: 'LE',
    rating: { average: 4.8, count: 189 },
    faqs: generateCityFAQs('Leicester', 'East Midlands'),
    localInfo: {
      overview: 'Leicester\'s central location makes it an ideal hub for muck away services. We serve Leicestershire and surrounding counties.',
      keyAreas: ['City Centre', 'Oadby', 'Wigston', 'Braunstone', 'Beaumont Leys', 'Belgrave'],
    },
  },
  {
    name: 'Coventry',
    slug: 'coventry',
    region: 'West Midlands',
    population: 371521,
    description: 'Coventry and Warwickshire muck away specialists.',
    services: defaultServices,
    coordinates: { latitude: 52.4068, longitude: -1.5197 },
    postcodePrefix: 'CV',
    rating: { average: 4.7, count: 145 },
    faqs: generateCityFAQs('Coventry', 'West Midlands'),
    localInfo: {
      overview: 'Coventry\'s automotive and manufacturing heritage creates ongoing construction demand. We provide comprehensive muck away services.',
      keyAreas: ['City Centre', 'Earlsdon', 'Tile Hill', 'Canley', 'Walsgrave', 'Binley'],
    },
  },
  {
    name: 'Bradford',
    slug: 'bradford',
    region: 'West Yorkshire',
    population: 537173,
    description: 'Bradford and surrounding areas muck away services.',
    services: defaultServices,
    coordinates: { latitude: 53.7960, longitude: -1.7594 },
    postcodePrefix: 'BD',
    rating: { average: 4.6, count: 123 },
    faqs: generateCityFAQs('Bradford', 'West Yorkshire'),
    localInfo: {
      overview: 'Bradford\'s regeneration projects require reliable waste removal. We serve Bradford and the wider Yorkshire region.',
      keyAreas: ['City Centre', 'Shipley', 'Bingley', 'Keighley', 'Ilkley', 'Saltaire'],
    },
  },
  {
    name: 'Cardiff',
    slug: 'cardiff',
    region: 'Wales',
    population: 362756,
    description: 'NRW-compliant muck away services across Cardiff and South Wales.',
    services: defaultServices,
    coordinates: { latitude: 51.4816, longitude: -3.1791 },
    postcodePrefix: 'CF',
    rating: { average: 4.8, count: 198 },
    faqs: generateCityFAQs('Cardiff', 'Wales'),
    localInfo: {
      overview: 'Cardiff\'s capital city development requires compliant waste management. We\'re fully registered with Natural Resources Wales.',
      keyAreas: ['City Centre', 'Cardiff Bay', 'Roath', 'Canton', 'Cathays', 'Splott', 'Pontcanna'],
    },
  },
  {
    name: 'Belfast',
    slug: 'belfast',
    region: 'Northern Ireland',
    population: 343542,
    description: 'Professional muck away services across Belfast and Northern Ireland.',
    services: defaultServices,
    coordinates: { latitude: 54.5973, longitude: -5.9301 },
    postcodePrefix: 'BT',
    rating: { average: 4.7, count: 134 },
    faqs: generateCityFAQs('Belfast', 'Northern Ireland'),
    localInfo: {
      overview: 'Belfast\'s construction sector is growing rapidly. We provide NIEA-compliant muck away services across the city.',
      keyAreas: ['City Centre', 'Titanic Quarter', 'South Belfast', 'East Belfast', 'West Belfast', 'North Belfast'],
    },
  },
  {
    name: 'Reading',
    slug: 'reading',
    region: 'Berkshire',
    population: 229274,
    description: 'Thames Valley muck away specialists. Reading and surrounding areas.',
    services: defaultServices,
    coordinates: { latitude: 51.4543, longitude: -0.9781 },
    postcodePrefix: 'RG',
    rating: { average: 4.8, count: 167 },
    faqs: generateCityFAQs('Reading', 'Berkshire'),
    localInfo: {
      overview: 'Reading\'s tech hub expansion creates ongoing construction demand. We serve the M4 corridor efficiently.',
      keyAreas: ['Town Centre', 'Caversham', 'Tilehurst', 'Woodley', 'Earley', 'Wokingham'],
    },
  },
  {
    name: 'Oxford',
    slug: 'oxford',
    region: 'Oxfordshire',
    population: 152450,
    description: 'Heritage-sensitive muck away services in Oxford.',
    services: defaultServices,
    coordinates: { latitude: 51.7520, longitude: -1.2577 },
    postcodePrefix: 'OX',
    rating: { average: 4.9, count: 145 },
    faqs: generateCityFAQs('Oxford', 'Oxfordshire'),
    localInfo: {
      overview: 'Oxford\'s historic environment requires careful waste management. We specialize in heritage site compliance.',
      keyAreas: ['City Centre', 'Summertown', 'Cowley', 'Headington', 'Jericho', 'Botley', 'Marston'],
    },
  },
  {
    name: 'Cambridge',
    slug: 'cambridge',
    region: 'Cambridgeshire',
    population: 145700,
    description: 'Cambridge and surrounding areas muck away services.',
    services: defaultServices,
    coordinates: { latitude: 52.2053, longitude: 0.1218 },
    postcodePrefix: 'CB',
    rating: { average: 4.8, count: 134 },
    faqs: generateCityFAQs('Cambridge', 'Cambridgeshire'),
    localInfo: {
      overview: 'Cambridge\'s biotech and tech sectors drive construction growth. We provide efficient waste removal for research park developments.',
      keyAreas: ['City Centre', 'Trumpington', 'Cherry Hinton', 'Chesterton', 'Milton', 'Girton'],
    },
  },
  {
    name: 'Milton Keynes',
    slug: 'milton-keynes',
    region: 'Buckinghamshire',
    population: 248800,
    description: 'New town specialists. Muck away across Milton Keynes.',
    services: defaultServices,
    coordinates: { latitude: 52.0406, longitude: -0.7594 },
    postcodePrefix: 'MK',
    rating: { average: 4.7, count: 156 },
    faqs: generateCityFAQs('Milton Keynes', 'Buckinghamshire'),
    localInfo: {
      overview: 'Milton Keynes\' rapid expansion creates constant construction activity. We\'re experts in new development waste removal.',
      keyAreas: ['Central Milton Keynes', 'Bletchley', 'Wolverton', 'Newport Pagnell', 'Stony Stratford', 'Woburn Sands'],
    },
  },
  {
    name: 'Brighton',
    slug: 'brighton',
    region: 'East Sussex',
    population: 290395,
    description: 'Coastal muck away services in Brighton and Hove.',
    services: defaultServices,
    coordinates: { latitude: 50.8225, longitude: -0.1372 },
    postcodePrefix: 'BN',
    rating: { average: 4.8, count: 178 },
    faqs: generateCityFAQs('Brighton', 'East Sussex'),
    localInfo: {
      overview: 'Brighton\'s coastal location and vibrant construction scene require specialist services. We handle seaside site logistics expertly.',
      keyAreas: ['City Centre', 'Hove', 'Kemptown', 'Portslade', 'Rottingdean', 'Lewes'],
    },
  },
  {
    name: 'Plymouth',
    slug: 'plymouth',
    region: 'Devon',
    population: 264200,
    description: 'South West muck away covering Plymouth and Devon.',
    services: defaultServices,
    coordinates: { latitude: 50.3755, longitude: -4.1427 },
    postcodePrefix: 'PL',
    rating: { average: 4.7, count: 123 },
    faqs: generateCityFAQs('Plymouth', 'Devon'),
    localInfo: {
      overview: 'Plymouth\'s naval heritage and waterfront development create unique construction needs. We serve the entire South Devon area.',
      keyAreas: ['City Centre', 'Devonport', 'Plympton', 'Plymstock', 'Mutley', 'Saltash'],
    },
  },
  {
    name: 'Stoke-on-Trent',
    slug: 'stoke-on-trent',
    region: 'Staffordshire',
    population: 256375,
    description: 'Potteries muck away services across Stoke and Staffordshire.',
    services: defaultServices,
    coordinates: { latitude: 53.0027, longitude: -2.1794 },
    postcodePrefix: 'ST',
    rating: { average: 4.6, count: 112 },
    faqs: generateCityFAQs('Stoke-on-Trent', 'Staffordshire'),
    localInfo: {
      overview: 'Stoke-on-Trent\'s industrial heritage creates unique waste management challenges. We specialize in brownfield site clearance.',
      keyAreas: ['Hanley', 'Stoke', 'Longton', 'Burslem', 'Tunstall', 'Fenton', 'Newcastle-under-Lyme'],
    },
  },
  {
    name: 'Wolverhampton',
    slug: 'wolverhampton',
    region: 'West Midlands',
    population: 263700,
    description: 'Black Country muck away specialists.',
    services: defaultServices,
    coordinates: { latitude: 52.5870, longitude: -2.1288 },
    postcodePrefix: 'WV',
    rating: { average: 4.7, count: 98 },
    faqs: generateCityFAQs('Wolverhampton', 'West Midlands'),
    localInfo: {
      overview: 'Wolverhampton and the Black Country have rich industrial heritage. We handle complex brownfield sites with expertise.',
      keyAreas: ['City Centre', 'Tettenhall', 'Penn', 'Bilston', 'Wednesfield', 'Dudley'],
    },
  },
  {
    name: 'Derby',
    slug: 'derby',
    region: 'Derbyshire',
    population: 257302,
    description: 'Derby and Derbyshire muck away services.',
    services: defaultServices,
    coordinates: { latitude: 52.9225, longitude: -1.4746 },
    postcodePrefix: 'DE',
    rating: { average: 4.7, count: 134 },
    faqs: generateCityFAQs('Derby', 'Derbyshire'),
    localInfo: {
      overview: 'Derby\'s manufacturing base creates ongoing construction activity. We serve the city and Peak District fringe areas.',
      keyAreas: ['City Centre', 'Allestree', 'Littleover', 'Mickleover', 'Spondon', 'Chellaston'],
    },
  },
  {
    name: 'Swansea',
    slug: 'swansea',
    region: 'Wales',
    population: 246563,
    description: 'South Wales muck away covering Swansea and beyond.',
    services: defaultServices,
    coordinates: { latitude: 51.6214, longitude: -3.9436 },
    postcodePrefix: 'SA',
    rating: { average: 4.7, count: 112 },
    faqs: generateCityFAQs('Swansea', 'Wales'),
    localInfo: {
      overview: 'Swansea\'s coastal regeneration requires specialist services. We\'re NRW compliant across South Wales.',
      keyAreas: ['City Centre', 'Marina', 'Mumbles', 'Sketty', 'Uplands', 'Morriston'],
    },
  },
  {
    name: 'Aberdeen',
    slug: 'aberdeen',
    region: 'Scotland',
    population: 228670,
    description: 'North East Scotland muck away specialists.',
    services: defaultServices,
    coordinates: { latitude: 57.1497, longitude: -2.0943 },
    postcodePrefix: 'AB',
    rating: { average: 4.6, count: 89 },
    faqs: generateCityFAQs('Aberdeen', 'Scotland'),
    localInfo: {
      overview: 'Aberdeen\'s energy sector expertise extends to our services. We handle offshore-related construction waste efficiently.',
      keyAreas: ['City Centre', 'Dyce', 'Westhill', 'Bridge of Don', 'Cove', 'Torry'],
    },
  },
  {
    name: 'Dundee',
    slug: 'dundee',
    region: 'Scotland',
    population: 148270,
    description: 'Tayside muck away services across Dundee.',
    services: defaultServices,
    coordinates: { latitude: 56.4620, longitude: -2.9707 },
    postcodePrefix: 'DD',
    rating: { average: 4.7, count: 78 },
    faqs: generateCityFAQs('Dundee', 'Scotland'),
    localInfo: {
      overview: 'Dundee\'s waterfront regeneration is transforming the city. We provide SEPA-compliant services for all projects.',
      keyAreas: ['City Centre', 'Broughty Ferry', 'Lochee', 'Menzieshill', 'Dundee Waterfront'],
    },
  },
  {
    name: 'York',
    slug: 'york',
    region: 'North Yorkshire',
    population: 210618,
    description: 'Heritage-sensitive muck away in York and North Yorkshire.',
    services: defaultServices,
    coordinates: { latitude: 53.9591, longitude: -1.0815 },
    postcodePrefix: 'YO',
    rating: { average: 4.9, count: 145 },
    faqs: generateCityFAQs('York', 'North Yorkshire'),
    localInfo: {
      overview: 'York\'s medieval heritage requires careful archaeological consideration. We work closely with heritage authorities.',
      keyAreas: ['City Centre', 'Clifton', 'Heworth', 'Fulford', 'Bishopthorpe', 'Haxby'],
    },
  },
  {
    name: 'Peterborough',
    slug: 'peterborough',
    region: 'Cambridgeshire',
    population: 203000,
    description: 'Peterborough and Fenland muck away services.',
    services: defaultServices,
    coordinates: { latitude: 52.5695, longitude: -0.2405 },
    postcodePrefix: 'PE',
    rating: { average: 4.6, count: 89 },
    faqs: generateCityFAQs('Peterborough', 'Cambridgeshire'),
    localInfo: {
      overview: 'Peterborough\'s growth as a logistics hub creates construction demand. We serve the city and Fenland areas.',
      keyAreas: ['City Centre', 'Werrington', 'Bretton', 'Orton', 'Hampton', 'Yaxley'],
    },
  },
  {
    name: 'Swindon',
    slug: 'swindon',
    region: 'Wiltshire',
    population: 185609,
    description: 'Wiltshire muck away covering Swindon and surrounding areas.',
    services: defaultServices,
    coordinates: { latitude: 51.5558, longitude: -1.7797 },
    postcodePrefix: 'SN',
    rating: { average: 4.7, count: 98 },
    faqs: generateCityFAQs('Swindon', 'Wiltshire'),
    localInfo: {
      overview: 'Swindon\'s expansion along the M4 corridor drives construction. We provide efficient services for new developments.',
      keyAreas: ['Town Centre', 'Old Town', 'Highworth', 'Wroughton', 'Royal Wootton Bassett'],
    },
  },
  {
    name: 'Luton',
    slug: 'luton',
    region: 'Bedfordshire',
    population: 225300,
    description: 'Bedfordshire muck away services from Luton.',
    services: defaultServices,
    coordinates: { latitude: 51.8787, longitude: -0.4200 },
    postcodePrefix: 'LU',
    rating: { average: 4.6, count: 112 },
    faqs: generateCityFAQs('Luton', 'Bedfordshire'),
    localInfo: {
      overview: 'Luton\'s airport expansion and town centre regeneration create ongoing demand. We serve all of Bedfordshire.',
      keyAreas: ['Town Centre', 'Dunstable', 'Houghton Regis', 'Leagrave', 'Stopsley'],
    },
  },
  {
    name: 'Warrington',
    slug: 'warrington',
    region: 'Cheshire',
    population: 210014,
    description: 'Cheshire muck away specialists.',
    services: defaultServices,
    coordinates: { latitude: 53.3900, longitude: -2.5970 },
    postcodePrefix: 'WA',
    rating: { average: 4.7, count: 89 },
    faqs: generateCityFAQs('Warrington', 'Cheshire'),
    localInfo: {
      overview: 'Warrington\'s strategic location between Liverpool and Manchester makes it a logistics hub. We serve the entire Cheshire area.',
      keyAreas: ['Town Centre', 'Birchwood', 'Latchford', 'Stockton Heath', 'Great Sankey'],
    },
  },
  {
    name: 'Slough',
    slug: 'slough',
    region: 'Berkshire',
    population: 164000,
    description: 'Thames Valley muck away from Slough.',
    services: defaultServices,
    coordinates: { latitude: 51.5105, longitude: -0.5950 },
    postcodePrefix: 'SL',
    rating: { average: 4.6, count: 78 },
    faqs: generateCityFAQs('Slough', 'Berkshire'),
    localInfo: {
      overview: 'Slough\'s trading estate and commercial developments require efficient waste removal. We cover the M4 corridor.',
      keyAreas: ['Town Centre', 'Langley', 'Cippenham', 'Britwell', 'Chalvey'],
    },
  },
  {
    name: 'Bournemouth',
    slug: 'bournemouth',
    region: 'Dorset',
    population: 183491,
    description: 'Dorset coast muck away services.',
    services: defaultServices,
    coordinates: { latitude: 50.7192, longitude: -1.8808 },
    postcodePrefix: 'BH',
    rating: { average: 4.8, count: 134 },
    faqs: generateCityFAQs('Bournemouth', 'Dorset'),
    localInfo: {
      overview: 'Bournemouth\'s coastal location requires specialist handling. We serve the entire BCP council area.',
      keyAreas: ['Town Centre', 'Boscombe', 'Christchurch', 'Poole', 'Westbourne', 'Charminster'],
    },
  },
  {
    name: 'Ipswich',
    slug: 'ipswich',
    region: 'Suffolk',
    population: 137764,
    description: 'Suffolk muck away from Ipswich.',
    services: defaultServices,
    coordinates: { latitude: 52.0567, longitude: 1.1482 },
    postcodePrefix: 'IP',
    rating: { average: 4.7, count: 67 },
    faqs: generateCityFAQs('Ipswich', 'Suffolk'),
    localInfo: {
      overview: 'Ipswich\'s waterfront regeneration creates construction demand. We serve all of Suffolk.',
      keyAreas: ['Town Centre', 'Waterfront', 'Kesgrave', 'Felixstowe', 'Woodbridge'],
    },
  },
  {
    name: 'Norwich',
    slug: 'norwich',
    region: 'Norfolk',
    population: 144000,
    description: 'Norfolk muck away services across Norwich.',
    services: defaultServices,
    coordinates: { latitude: 52.6309, longitude: 1.2974 },
    postcodePrefix: 'NR',
    rating: { average: 4.8, count: 89 },
    faqs: generateCityFAQs('Norwich', 'Norfolk'),
    localInfo: {
      overview: 'Norwich\'s medieval heritage requires careful waste management. We specialize in historic site services.',
      keyAreas: ['City Centre', 'Thorpe', 'Eaton', 'Costessey', 'Sprowston', 'Wymondham'],
    },
  },
  {
    name: 'Chelmsford',
    slug: 'chelmsford',
    region: 'Essex',
    population: 178388,
    description: 'Essex muck away covering Chelmsford and surrounding areas.',
    services: defaultServices,
    coordinates: { latitude: 51.7356, longitude: 0.4685 },
    postcodePrefix: 'CM',
    rating: { average: 4.7, count: 112 },
    faqs: generateCityFAQs('Chelmsford', 'Essex'),
    localInfo: {
      overview: 'Chelmsford\'s city status has driven development. We serve the county town and wider Essex.',
      keyAreas: ['City Centre', 'Broomfield', 'Springfield', 'Great Baddow', 'Writtle'],
    },
  },
  {
    name: 'Exeter',
    slug: 'exeter',
    region: 'Devon',
    population: 130428,
    description: 'Devon muck away from Exeter.',
    services: defaultServices,
    coordinates: { latitude: 50.7184, longitude: -3.5339 },
    postcodePrefix: 'EX',
    rating: { average: 4.8, count: 98 },
    faqs: generateCityFAQs('Exeter', 'Devon'),
    localInfo: {
      overview: 'Exeter\'s university and heritage sites require specialist services. We cover Devon and East Cornwall.',
      keyAreas: ['City Centre', 'St Thomas', 'Heavitree', 'Pinhoe', 'Exminster', 'Topsham'],
    },
  },
  {
    name: 'Gloucester',
    slug: 'gloucester',
    region: 'Gloucestershire',
    population: 131812,
    description: 'Gloucestershire muck away services.',
    services: defaultServices,
    coordinates: { latitude: 51.8642, longitude: -2.2382 },
    postcodePrefix: 'GL',
    rating: { average: 4.7, count: 78 },
    faqs: generateCityFAQs('Gloucester', 'Gloucestershire'),
    localInfo: {
      overview: 'Gloucester\'s docks regeneration and city growth create demand. We serve Gloucestershire and the Cotswolds.',
      keyAreas: ['City Centre', 'Quedgeley', 'Abbeydale', 'Cheltenham', 'Stroud', 'Tewkesbury'],
    },
  },
  {
    name: 'Northampton',
    slug: 'northampton',
    region: 'Northamptonshire',
    population: 225146,
    description: 'East Midlands muck away from Northampton.',
    services: defaultServices,
    coordinates: { latitude: 52.2405, longitude: -0.9027 },
    postcodePrefix: 'NN',
    rating: { average: 4.6, count: 89 },
    faqs: generateCityFAQs('Northampton', 'Northamptonshire'),
    localInfo: {
      overview: 'Northampton\'s expansion and logistics sector drive construction. We cover Northamptonshire efficiently.',
      keyAreas: ['Town Centre', 'Weston Favell', 'Abington', 'Duston', 'Corby', 'Kettering'],
    },
  },
  {
    name: 'Lincoln',
    slug: 'lincoln',
    region: 'Lincolnshire',
    population: 104221,
    description: 'Lincolnshire muck away services.',
    services: defaultServices,
    coordinates: { latitude: 53.2307, longitude: -0.5406 },
    postcodePrefix: 'LN',
    rating: { average: 4.7, count: 56 },
    faqs: generateCityFAQs('Lincoln', 'Lincolnshire'),
    localInfo: {
      overview: 'Lincoln\'s cathedral quarter and university expansion require careful services. We cover all of Lincolnshire.',
      keyAreas: ['City Centre', 'Uphill', 'Brayford', 'North Hykeham', 'Nettleham'],
    },
  },
  {
    name: 'Chester',
    slug: 'chester',
    region: 'Cheshire',
    population: 118200,
    description: 'Historic Chester muck away specialists.',
    services: defaultServices,
    coordinates: { latitude: 53.1930, longitude: -2.8931 },
    postcodePrefix: 'CH',
    rating: { average: 4.9, count: 112 },
    faqs: generateCityFAQs('Chester', 'Cheshire'),
    localInfo: {
      overview: 'Chester\'s Roman heritage requires archaeological awareness. We specialize in heritage-sensitive waste removal.',
      keyAreas: ['City Centre', 'Hoole', 'Upton', 'Blacon', 'Boughton', 'Ellesmere Port'],
    },
  },
  {
    name: 'Colchester',
    slug: 'colchester',
    region: 'Essex',
    population: 194706,
    description: 'North Essex muck away from Colchester.',
    services: defaultServices,
    coordinates: { latitude: 51.8959, longitude: 0.8919 },
    postcodePrefix: 'CO',
    rating: { average: 4.7, count: 89 },
    faqs: generateCityFAQs('Colchester', 'Essex'),
    localInfo: {
      overview: 'Colchester\'s Roman heritage and garrison town status create unique requirements. We handle archaeological sites carefully.',
      keyAreas: ['Town Centre', 'Hythe', 'Lexden', 'Mile End', 'Stanway', 'Wivenhoe'],
    },
  },
  {
    name: 'Basingstoke',
    slug: 'basingstoke',
    region: 'Hampshire',
    population: 113776,
    description: 'Hampshire muck away services.',
    services: defaultServices,
    coordinates: { latitude: 51.2667, longitude: -1.0876 },
    postcodePrefix: 'RG21-RG27',
    rating: { average: 4.6, count: 67 },
    faqs: generateCityFAQs('Basingstoke', 'Hampshire'),
    localInfo: {
      overview: 'Basingstoke\'s business park expansion drives construction. We serve north Hampshire efficiently.',
      keyAreas: ['Town Centre', 'Chineham', 'Tadley', 'Oakley', 'Overton'],
    },
  },
  {
    name: 'Maidstone',
    slug: 'maidstone',
    region: 'Kent',
    population: 107627,
    description: 'Kent muck away from Maidstone.',
    services: defaultServices,
    coordinates: { latitude: 51.2724, longitude: 0.5290 },
    postcodePrefix: 'ME',
    rating: { average: 4.7, count: 98 },
    faqs: generateCityFAQs('Maidstone', 'Kent'),
    localInfo: {
      overview: 'Maidstone\'s county town status and Garden of England location require quality services. We cover all of Kent.',
      keyAreas: ['Town Centre', 'Bearsted', 'Tovil', 'Loose', 'Aylesford', 'Snodland'],
    },
  },
  {
    name: 'Guildford',
    slug: 'guildford',
    region: 'Surrey',
    population: 81800,
    description: 'Surrey muck away specialists.',
    services: defaultServices,
    coordinates: { latitude: 51.2362, longitude: -0.5704 },
    postcodePrefix: 'GU',
    rating: { average: 4.9, count: 134 },
    faqs: generateCityFAQs('Guildford', 'Surrey'),
    localInfo: {
      overview: 'Guildford\'s affluent area requires premium services. We provide high-quality muck away across Surrey.',
      keyAreas: ['Town Centre', 'Merrow', 'Burpham', 'Onslow', 'Woking', 'Godalming'],
    },
  },
];

// Helper function to get city data by slug
export const getCityData = (slug: string): CityData | undefined => {
  return UK_CITIES.find(city => city.slug === slug.toLowerCase());
};

// Get all city slugs for routing
export const getAllCitySlugs = (): string[] => {
  return UK_CITIES.map(city => city.slug);
};

// Get all cities for sitemap generation
export const getAllCities = (): CityData[] => {
  return UK_CITIES;
};
