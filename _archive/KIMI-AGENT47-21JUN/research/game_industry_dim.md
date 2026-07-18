# Game Industry Mechanics Research for CSOAI Town Economy

**Research Date**: 2025  
**Purpose**: Identify reverse-engineerable game industry/economy mechanics for 47-agent sovereign AI town simulation  
**Searches Conducted**: 15+ independent queries across game mechanics, open-source implementations, and academic frameworks

---

## Table of Contents

1. [Cities: Skylines (Industry & Supply Chains)](#1-cities-skylines)
2. [Factorio (Production Chain Simulation)](#2-factorio)
3. [EVE Online (Player-Driven Economy)](#3-eve-online)
4. [World of Warcraft Auction House](#4-world-of-warcraft)
5. [Minecraft Villager Trading](#5-minecraft-villager-trading)
6. [Open Source City Builders](#6-open-source-city-builders)
7. [Open Source Factorio Clones](#7-open-source-factorio-clones)
8. [Industry Simulation (Open Source)](#8-industry-simulation-open-source)
9. [Transport Tycoon / OpenTTD](#9-openttd)
10. [Anno Series (Production Chains)](#10-anno-series)
11. [Dwarf Fortress (Economy & Jobs)](#11-dwarf-fortress)
12. [RimWorld (Colony Simulation)](#12-rimworld)
13. [Victoria 3 (Economic Simulation)](#13-victoria-3)
14. [Open Source Economy Simulation Libraries](#14-open-source-economy-libraries)
15. [Agent-Based Modeling for Supply Chains](#15-agent-based-modeling)
16. [Summary Matrix](#16-summary-matrix)
17. [Integration Recommendations for CSOAI](#17-integration-recommendations)

---

## 1. Cities: Skylines

### 1.1 Core Mechanic: Four-Tier Supply Chain

Cities: Skylines implements a complete supply chain with four distinct stages [^1296^]:

| Stage | Building Type | Function |
|-------|--------------|----------|
| **Primary Production** | Specialized Industry (Forestry, Farming, Ore, Oil) | Extracts raw materials from natural resources |
| **Secondary Processing** | Specialized Industry Processors | Converts raw materials into processed materials |
| **Generic Industry** | Generic factories | Converts processed materials into "goods" |
| **Sales** | Commercial zones | Sells goods to households |

**Key Mechanics:**
- Raw materials: Agricultural materials, forestry materials, ore, oil
- Processed materials: Planed Timber, Paper, Animal Products, Flour, Metal, Glass, Petroleum, Plastics
- Each unit of cargo passes through exactly 4 buildings in its lifetime [^1296^]
- Internal storage formula: `Storage = 8 + 2 * weekly_consumption_rate`
- Transport via trucks (8 tons per truck), with configurable mass transit options

### 1.2 Industries DLC Deep Mechanics

The Industries DLC adds player-controlled supply chains with precise production rates [^1296^]:

- **Zone leveling**: Zones level up as jobs are filled and materials produced, unlocking new buildings
- **Production rate formula**: Output in tons/week varies by building tier
- **Unique factories**: Combine 2 processed materials into finished goods (one per map)
- **Worker barracks**: Increase production rate; Maintenance buildings: increase storage
- **Profit calculation**: `Profit = Output_Value - Upkeep/Week` (water/electricity not included)

Example production chain (Forestry):
```
Small Tree Plantation (4.8t/week) -> Sawmill (-3.2t raw -> +3.2t Planed Timber) -> Unique Factory -> Goods
```

### 1.3 Cities: Skylines II Enhanced Economy

CS2 expands with more granular economic simulation [^1297^]:
- **Specialization bonus**: Companies producing the same resource get efficiency bonuses
- **Resource weight**: Heavy resources (stone, steel) incur higher transport costs
- **Resource price**: Determines how many units households can buy; availability affects transportation costs
- **Resource space**: Affects profitability; space-intensive industries prefer low land-value areas
- **Market access**: Geographic distance between producer and consumer affects final price

### Reverse-Engineering Assessment

| Aspect | Assessment |
|--------|-----------|
| **Reverse-engineering difficulty** | Medium. Supply chain logic is well-documented by community. Core mechanics (production rates, storage, transport) are deterministic and formulaic |
| **Open source clone available?** | Partial. LinCity-NG implements similar city-building economics; Micropolis (original SimCity source) available |
| **CSOAI mapping** | Each specialized industry zone maps to an "industry hive" in CSOAI town. The 4-tier chain (extract->process->manufacture->sell) directly models agent specialization hierarchies |
| **Integration recommendation** | **High Priority**. The 4-stage pipeline (Primary->Secondary->Generic->Commercial) maps perfectly to CSOAI agent roles. Implement production rate formulas, internal storage buffers, and transport logistics between hives |

---

## 2. Factorio

### 2.1 Core Mechanic: Belt-Driven Production Network

Factorio is the gold standard for production chain simulation with precise deterministic mechanics [^1418^][^1421^]:

**Belt Transport System:**
- Each straight belt piece holds exactly **8 items** (density)
- Belt speeds: Basic 1.875, Fast 3.75, Express 5.625, Turbo 7.5 tiles/second
- Throughput = Speed * Density
- Lane balancing mechanics prevent throughput loss

**Inserter Mechanics:**
- Inserters are the "arms" that move items between containers and belts
- Throughput varies by inserter type: Burner (0.6/s), Basic (0.94/s), Long-handed (1.18/s), Fast (2.5/s), Bulk/Stack (4.5+/s)
- Stack size bonus (research) multiplies throughput
- Pickup timing depends on belt speed, item position, belt orientation, turn geometry [^1425^]

**Assembler Mechanics:**
- Recipe Item Rate = (Recipe Item Count / Recipe Craft Time) * Craft Speed Multiplier
- Machine ratios derived from matching input/output rates
- Example: Rail production requires 1 Iron Stick assembler feeding 2 Rail assemblers [^1418^]

**Core Production Concepts:**
- **Main Bus**: Centralized belt highways carrying core resources (iron, copper, steel, circuits)
- **Science packs**: 7-tier research progression requiring increasingly complex production chains
- **Throughput analysis**: Bottleneck identification by tracing where items stop moving

### 2.2 Advanced Production Networks

- **Coal liquefaction**: Multi-step conversion chain with precise ratios (40:30:3 for best petroleum gas yield)
- **Oil processing**: Crude oil -> Heavy oil -> Light oil -> Petroleum gas, with cracking ratios
- **Moduled production**: Productivity modules (increase output per input) + Speed modules (faster production) + Beacons (transmit module effects)
- **Train logistics**: Wagon-based bulk transport with circuit network scheduling

### Reverse-Engineering Assessment

| Aspect | Assessment |
|--------|-----------|
| **Reverse-engineering difficulty** | Low-Medium. All mechanics are deterministic with documented formulas. Community has extensively reverse-engineered ratios and throughputs |
| **Open source clone available?** | **Yes - Mindustry** (GPL v3). Open-source Factorio-like with conveyor belts, production chains, and resource management [^1419^] |
| **CSOAI mapping** | Factorio's belt networks = information/resource flows between CSOAI agents. Assemblers = agent work benches. Inserters = agent delivery actions. The entire model maps to agent-mediated production networks |
| **Integration recommendation** | **Very High Priority**. Implement Factorio-style throughput calculations for inter-agent resource transfers. Use Mindustry's open-source conveyor/item system as reference implementation. The ratio-based production system is ideal for balancing agent workloads |

---

## 3. EVE Online

### 3.1 Core Mechanic: Laissez-Faire Player-Driven Economy

EVE Online operates one of the most sophisticated player-driven economies in gaming [^1298^][^1300^][^1301^]:

**Three Pillars:**
1. **Player-driven item creation**: All ships, modules, ammo are manufactured by players from mined/refined materials
2. **Open market-based economy**: CCP Games follows "laissez-faire" philosophy with minimal interference
3. **Player-driven money creation**: ISK (currency) enters through NPC missions; player activity drives circulation

**Economic Classifications [^1298^]:**
- **Player-Made Goods**: Ships, modules, rigs, boosters - reflect skill, risk, market interaction
- **Utility Goods**: PLEX, Skill Books, MCT - tradable but carry little player-added value, arbitrage opportunity
- **Singletons**: Unique/rare items with no standardized pricing

**Supply Chain Depth:**
A real corporation in EVE manages operations including [^1301^]:
- Production facilities (multiple)
- Distribution/warehousing
- Transportation units (local and long-haul)
- Combat pilots for escort
- Retail markets and bulk contracts
- **ERP system** tracking inputs, outputs, procurement decisions (build vs. buy)

**Example Order Fulfillment Pipeline:**
```
Customer orders 10 Widgets
-> Check stock -> If available, submit delivery order
-> If not in stock: Build vs. Buy decision tree
  -> Check market prices for components vs. finished goods
  -> If cheaper to buy: Submit procurement order
  -> If build: Check mineral/blueprint availability
    -> If need minerals: Submit procurement + transportation
    -> Submit production order
    -> Upon completion: Transportation -> Delivery
```

### 3.2 Market Mechanics

- **Buy/Sell Orders**: Players post buy orders (willing to pay X) and sell orders (willing to sell for Y)
- **Regional Markets**: Prices vary by region based on supply/demand; arbitrage opportunities exist
- **Average Price Display**: Game shows regional average prices to reduce scams
- **Value Chain Philosophy**: Every feature connects to the economic web - "from exploration and harvesting of raw materials, to industrial research and production, to hauling and trade" [^1298^]

### Reverse-Engineering Assessment

| Aspect | Assessment |
|--------|-----------|
| **Reverse-engineering difficulty** | High. The economy is emergent from player behavior, not hardcoded rules. However, the underlying manufacturing blueprints, material requirements, and market mechanics are well-documented |
| **Open source clone available?** | No direct open-source clone. However, EVE's economic principles are extensively documented academically |
| **CSOAI mapping** | EVE's "build vs. buy" decision tree maps directly to CSOAI agent procurement logic. The concept of agents specializing in extraction, manufacturing, transport, and retail maps to CSOAI's industry hives. ERP-style tracking is exactly what CSOAI agents need |
| **Integration recommendation** | **High Priority**. Implement the build-vs-buy decision algorithm. Create agent roles mirroring EVE's economic specializations (extractor, manufacturer, hauler, retailer). Use order-fulfillment pipeline as template for agent task coordination |

---

## 4. World of Warcraft Auction House

### 4.1 Core Mechanic: LIFO Commodity Market with Regional Pricing

WoW's Auction House represents a sophisticated virtual commodities market [^1371^][^1372^]:

**Market Structure:**
- **Region-wide commodities**: Crafting materials, consumables (shared across entire region)
- **Realm-specific gear**: Equipment, unique items (per-server markets)
- **LIFO posting**: Last In, First Out - newest listings sell first (critical for pricing strategy)
- **5% auction house cut** on all sales + deposit fees

**Price Discovery System:**
- **DBMarket**: Realm average price over 14 days
- **DBRegionMarketAvg**: Average across all realms in region
- **DBRegionSaleAvg**: Actual recent sale prices (not just listed)
- **DBMinBuyout**: Lowest current listing price

**Arbitrage Mechanics:**
- **Materials arbitrage**: Buy when DBMinBuyout < 70% DBRegionMarketAvg, relist at mean
- **Cross-faction arbitrage**: Transfer goods between factions where price discrepancies exist
- **Vendor shuffles**: Buy vendor items, relist at market premium
- **Processing flips**: Mill/prospect/disenchant raw materials, sell processed goods

**TSM (TradeSkillMaster) Operations [^1378^]:**
- Auctioning operations: Automated rules for quantity, price ranges, post caps
- Pricing formulas: `max(DBMarket * 0.95, Crafting)` ensures profit floor
- Sniper: Real-time scanning for underpriced items
- Shopping operations: Auto-buy materials below threshold price

### Reverse-Engineering Assessment

| Aspect | Assessment |
|--------|-----------|
| **Reverse-engineering difficulty** | Low. Market mechanics are well-understood. TSM addon provides complete pricing formula framework that is entirely open |
| **Open source clone available?** | TSM addon code is open. Multiple AH data APIs available. Auctionator/Auctioneer are open-source addons |
| **CSOAI mapping** | The AH is a **decentralized price discovery mechanism**. CSOAI agents can implement similar "internal market" for resource pricing. The arbitrage model (buy low/sell high based on moving averages) maps to agent trading behavior |
| **Integration recommendation** | **High Priority**. Implement internal price discovery with moving average price tracking. Use TSM-style pricing operations for agent trading decisions. The arbitrage detection algorithm (DBMinBuyout vs DBRegionMarketAvg) can be adapted for inter-agent resource trading |

---

## 5. Minecraft Villager Trading

### 5.1 Core Mechanic: Profession-Based Tiered Economy

Minecraft implements a localized profession-based economy [^1294^][^1295^]:

**Profession System:**
- 13 distinct professions: Armorer, Butcher, Cartographer, Cleric, Farmer, Fisherman, Fletcher, Leatherworker, Librarian, Mason, Shepherd, Toolsmith, Weaponsmith
- Each profession assigned via **job site block** (e.g., Blast Furnace = Armorer, Composter = Farmer)
- Professions are player-configurable by placing/removing job site blocks

**Tier Progression:**
| Level | Badge | XP Required | Trades Unlocked |
|-------|-------|-------------|-----------------|
| Novice | Stone | 0 | 2 initial trades |
| Apprentice | Iron | 10 | +2 trades |
| Journeyman | Gold | 70 | +2 trades |
| Expert | Emerald | 150 | +2 trades |
| Master | Diamond | 250 | +2 trades |

**Supply & Demand Mechanics:**
- Each trade has **limited stock** (max uses before disabled)
- Villagers restock **twice per day** when working at job site
- **Demand tracking**: Trades used heavily get price increases; unused trades get price reductions
- **Price multiplier**: Some items (0.2) more sensitive to demand than others (0.05)
- Hero of the Village effect: Temporary price discounts

**Trade Structure:**
- Each trade: Input A [+ Input B] -> Output
- Example (Farmer): 20 Wheat -> 1 Emerald; 1 Emerald -> 6 Bread
- Trades are **bi-directional** (villagers both buy and sell)

### Reverse-Engineering Assessment

| Aspect | Assessment |
|--------|-----------|
| **Reverse-engineering difficulty** | Very Low. Mechanics are fully documented in wiki, deterministic, and simple |
| **Open source clone available?** | Minecraft code is obfuscated but trading logic is extensively reverse-engineered by community. Multiple server implementations (Spigot/Paper) have reimplemented the system |
| **CSOAI mapping** | **Direct 1:1 mapping possible**. Each CSOAI agent = villager with profession. Job site blocks = work benches. Tier progression = agent skill development. Supply/demand price adjustment = dynamic resource pricing. The restocking mechanic maps to agent resource regeneration |
| **Integration recommendation** | **Very High Priority - Immediate Implementation**. This is the simplest and most directly applicable system. Implement: (1) Profession assignment via workbench binding, (2) Tier progression with XP, (3) Trade offers with stock limits, (4) Demand-based price adjustment, (5) Bi-directional trading. Use as foundational trading layer |

---

## 6. Open Source City Builders

### 6.1 Micropolis (Original SimCity Source)

- **Source**: EA released original SimCity source code under GPLv3 for OLPC project
- **Repository**: github.com/SimHacker/micropolis [^1360^]
- **Language**: Java, C++, Python, Tcl
- **Status**: Last release 2013; stable but not actively developed
- **Value**: Contains original SC2K-style simulation engine with zone-based RCI (Residential/Commercial/Industrial) demand simulation, power/water networks, traffic simulation
- **Reverse-engineering**: Full source available; well-commented C++ core

### 6.2 LinCity-NG

- **Repository**: github.com/lincity-ng/lincity-ng [^1359^]
- **License**: GPLv2+
- **Language**: C++ with SDL2/OpenGL
- **Features**: Isometric city builder based on SimCity 3000
- **Economic Model**: Sustainable economy simulation with resource management
- **Win Conditions**: Build sustainable economy OR evacuate citizens with spaceships
- **Status**: Actively maintained (releases through 2026)

### 6.3 OpenCity

- **Language**: C++, OpenGL/SDL, OGRE rendering
- **License**: GPL
- **Status**: Last release 2015; limited activity
- **Value**: 3D city building, not a direct SimCity clone

### Reverse-Engineering Assessment

| Aspect | Assessment |
|--------|-----------|
| **Reverse-engineering difficulty** | Very Low. Full source code available for all three |
| **Best option for CSOAI** | **LinCity-NG** for active development and modern codebase; **Micropolis** for historical accuracy and original SC mechanics |
| **CSOAI mapping** | RCI demand simulation can model how different industry types satisfy population needs. Power/water network simulation maps to CSOAI infrastructure. Zone-based specialization maps to hive specialization |
| **Integration recommendation** | **Medium Priority**. Extract RCI demand formulas and zone interaction mechanics from Micropolis source. Use LinCity-NG as reference for modern C++ implementation of city simulation. The demand/development loop directly models how industry hives respond to population needs |

---

## 7. Open Source Factorio Clones

### 7.1 Mindustry (GPL v3)

- **Repository**: github.com/Anuken/Mindustry [^1419^]
- **License**: GNU GPL v3
- **Platforms**: Windows, macOS, Linux, Android, iOS
- **Core Mechanics** [^1414^]:
  - Conveyor belt supply chains
  - Production buildings for advanced materials
  - Liquid transport systems
  - Power grid management
  - Unit production and automated base management
  - Tower defense integration (production serves combat)
- **Value**: Complete open-source implementation of Factorio-style production chains with conveyor mechanics, item routing, and multi-resource manufacturing
- **Modding**: Full mod support; no restrictions on client modifications

### Reverse-Engineering Assessment

| Aspect | Assessment |
|--------|-----------|
| **Reverse-engineering difficulty** | Very Low. Full source available, well-documented Java codebase |
| **Open source clone available?** | **Yes - This IS the open-source implementation** |
| **CSOAI mapping** | Mindustry's conveyor/item system can be directly studied for implementing inter-agent resource transfers. The production building system (input materials -> processing -> output) maps to agent work flows. Power grid and liquid transport map to CSOAI infrastructure systems |
| **Integration recommendation** | **High Priority**. Study Mindustry's source code for: (1) Conveyor belt item routing algorithms, (2) Production building I/O management, (3) Resource buffer/inventory systems, (4) Power network distribution. Port relevant logic to CSOAI agent communication protocol |

---

## 8. Industry Simulation (Open Source)

### 8.1 FIRS for OpenTTD (GPL v2)

The FIRS (First Industry Replacement Set) NewGRF is a comprehensive industry simulation mod for OpenTTD [^1412^][^1413^][^1416^]:

- **68 cargos**, **83 industries**, **6 economy types**
- **Steeltown economy**: Highly-connected steel production chain with 2 routes to Carbon Steel (Blast Furnace and Electric Arc Furnace)
- **Production mechanics**:
  - Primary industries (mines, farms) always produce; can be boosted by delivering supplies
  - Secondary industries produce output when ANY accepted cargo is delivered
  - **Combinatory production**: Delivering more than one cargo type within a month increases output ratios
  - Scrap Yard production depends on town population
- **Cargo types**: Raw materials (ore, coal, wood), processed materials (steel, chemicals), finished goods (vehicles, goods, food)
- **Source code**: github.com/andythenorth/firs [^1412^]

### 8.2 OpenTTD Base Industry Mechanics

OpenTTD's base industry system provides [^1376^]:
- **Cargo aging**: Each cargo unit tracks age; delivery value decreases over time
- **Station rating**: Based on service quality; affects cargo distribution
- **Catchment area**: Industries only interact with stations within coverage radius
- **Cargo flow**: Primary -> Secondary -> Tertiary with payment at each transfer
- **FIRS extends**: Adds complex multi-input production chains with realistic industrial processes

### Reverse-Engineering Assessment

| Aspect | Assessment |
|--------|-----------|
| **Reverse-engineering difficulty** | Low. OpenTTD and FIRS are fully open source. NML (NewGRF Meta Language) is well-documented |
| **Open source clone available?** | **Yes - Full source on GitHub**. OpenTTD itself is open source; FIRS is GPL v2 |
| **CSOAI mapping** | FIRS's 68 cargo types and 83 industries provide a **complete template for CSOAI resource taxonomy**. The combinatory production mechanic (multiple inputs boost output) maps to CSOAI agents collaborating on production. The supply delivery boost mechanic models how infrastructure investment increases productivity |
| **Integration recommendation** | **High Priority**. Use FIRS cargo taxonomy as basis for CSOAI resource types. Implement combinatory production (collaborative manufacturing boosts output). Study NML production callback code for production rate calculation formulas |

---

## 9. Transport Tycoon / OpenTTD

### 9.1 Core Mechanic: Logistics and Transport Simulation

OpenTTD is the definitive open-source logistics simulation [^1376^][^1379^]:

**Cargo System:**
- Each cargo type has specific **producers** and **acceptors**
- Cargo **ages** from moment of production; value decreases with time
- Cargo **dissipates** at stations if left too long
- Delivery payment = f(distance, time, cargo type)

**Station Rating System:**
- Production agents distribute cargo based on: service throughput, local reputation (rating)
- Higher station rating = more cargo allocated to that station
- Rating affected by: vehicle speed, station age, cargo waiting time

**Cargo Distribution (Cargodist):**
- Cargo has **predefined destinations** when generated
- Creates natural supply/demand networks
- Links between source and destination must exist for cargo to flow

**FIRS NewGRF Advanced Logistics:**
- **68 cargo types** with realistic production chains
- **Feeder systems**: Small vehicles collect from primary industries, deliver to transfer stations
- **Long-haul transport**: Trains/ships move bulk cargo between regions
- **Multi-modal logistics**: Road (flexible), Rail (high volume), Ship (bulk), Air (premium/time-sensitive)

### Reverse-Engineering Assessment

| Aspect | Assessment |
|--------|-----------|
| **Reverse-engineering difficulty** | Very Low. Complete open source (GPL v2). All mechanics documented |
| **Open source clone available?** | **Yes - OpenTTD IS open source** (github.com/OpenTTD/OpenTTD) |
| **CSOAI mapping** | Transport networks = CSOAI agent communication infrastructure. Station ratings = agent reputation system. Cargo aging = resource freshness/perishability. The logistics of moving goods from producer to consumer is the core CSOAI town simulation problem |
| **Integration recommendation** | **Very High Priority**. Study OpenTTD's pathfinding (YAPF), cargo routing, and station rating algorithms. The Cargodist system provides a model for destination-aware resource routing between CSOAI agents. Implement station-rating-style reputation for agent service quality |

---

## 10. Anno Series

### 10.1 Core Mechanic: Complex Multi-Step Manufacturing Chains

The Anno series (especially Anno 1800) implements deeply interconnected production chains [^1306^]:

**Chain Structure:**
- Chains range from 2 buildings (simple) to 15+ buildings (complex DLC chains)
- Each population tier demands different goods
- Production ratios must be balanced: e.g., 1 Sand Sifting Factory supplies 2 Glassblowers (15s vs 30s cycle)

**Example Chains:**
```
Basic: Wheat Farm -> Mill -> Bakery (feeds Workers)
Intermediate: Iron Mine -> Coal Mine -> Steelworks -> Weapons Factory
Advanced: 13-step Elevator chain (Engineers+), 15-step Toy chain (Investors)
```

**Anno 117 Logistics Complexity [^1304^]:**
- Travel time affects production ratios (2:1 tooltip ratio may need 2.2:1 in practice)
- Warehouse loading ramp bottlenecks
- Governor Decrees can buff specific building types, breaking ratios
- Over-production or buffer warehouses needed to handle queue delays

**Population Tier Requirements:**
| Tier | Needs | Production Complexity |
|------|-------|----------------------|
| Farmers | Fish, Work Clothes | Low |
| Workers | Fish, Work Clothes, Sausages, Bread, Soap, Beer | Medium |
| Artisans | +Canned Food, Sewing Machines, Fur Coats, Rum | High |
| Engineers | +Glasses, Advanced Weapons, Steam Motors, Light Bulbs | Very High |
| Investors | +Champagne, Jewellery, Gramophones, Steam Carriages | Extreme |

### Reverse-Engineering Assessment

| Aspect | Assessment |
|--------|-----------|
| **Reverse-engineering difficulty** | Medium. Exact production formulas are partially reverse-engineered by community. Ratios are well-documented but internal mechanics (demand calculation, happiness effects) are opaque |
| **Open source clone available?** | No direct clone. SteamWorld Build is similar but not open source. Community calculators exist (e.g., anno.city) |
| **CSOAI mapping** | Anno's population-tier-goods-requirement system maps directly to CSOAI agent needs hierarchies. The multi-step production chains model how agents collaborate across specializations. The ratio-balancing problem is exactly the CSOAI resource allocation challenge |
| **Integration recommendation** | **High Priority**. Use Anno's population-tier-needs system as model for CSOAI agent consumption requirements. Implement production chain templates (building A needs output from buildings B and C at specific ratios). The travel-time-affected production ratio is directly relevant for distributed agent networks |

---

## 11. Dwarf Fortress

### 11.1 Core Mechanic: Workshop-Based Labor Economy

Dwarf Fortress implements a detailed workshop-driven production system [^1328^][^1329^]:

**Production Chain Flowchart:**
- Every process has: **Inputs** (left), **Means/Job** (workshop + tool + labor skill), **Outputs** (right)
- Example: Walls + Pick + Mining labor -> Stone/Ore/Gems/Coal
- Example: Trees + Battle axe + Wood cutting labor -> Wood

**Labor System:**
- Old system: Narrow labor assignments (miner, gem setter) set manually per dwarf
- New system (Steam release): Automatic labor assignment with skill-based prioritization
- **Workshop masters**: Assign a master dwarf to a workshop for dedicated work and skill building
- **Work details**: Fine-grained control over who does what tasks

**Workshop Mechanics:**
- Workshops are physical buildings where jobs are queued
- Each workshop type has specific recipes (e.g., Forge for metal items, Mason for stone)
- Job queue: Players add tasks, dwarves with matching labor enabled pick them up
- **Skill affects quality**: Higher skill = better quality outputs
- **Guilds and apprentices**: Planned system for skill transfer [^1329^]

**Economic Flow:**
```
Raw Materials (mining, woodcutting, farming)
  -> Processing (smelting, milling, weaving) at Workshops
    -> Finished Goods (weapons, furniture, clothing)
      -> Stockpiles (storage by category)
        -> Trading with caravans (export for profit)
```

### Reverse-Engineering Assessment

| Aspect | Assessment |
|--------|-----------|
| **Reverse-engineering difficulty** | Medium-High. DF is closed source but extensively documented by community. Core mechanics (workshop jobs, labor assignment) are well-understood |
| **Open source clone available?** | No direct open-source clone. Similar mechanics in RimWorld (partially open). Dwarf Fortress itself is not open source |
| **CSOAI mapping** | DF's workshop = CSOAI agent work bench. Labor assignment = agent task allocation. The automatic labor system (assign tasks to most skilled available agent) maps to CSOAI task routing. Skill-based quality maps to agent expertise levels |
| **Integration recommendation** | **Medium Priority**. Study the workshop job queue model for CSOAI agent task management. Implement skill-based automatic labor assignment (route tasks to most qualified available agent). The master workshop concept maps to CSOAI lead agents in each hive |

---

## 12. RimWorld

### 12.1 Core Mechanic: Work Priority and Bill System

RimWorld implements a detailed work priority system for colony management [^1332^]:

**Work Tab System:**
- Manual priorities mode: Assign priority 1-4 for each colonist and work type
- All work of one priority level completed before next level
- Task order (left to right) determines precedence within same priority
- Some colonists restricted from certain tasks (e.g., nobles can only research and firefight)

**Bill System:**
- **Bills** are production orders placed at work benches
- Each bill specifies: what to craft, how many, ingredient restrictions, skill requirements
- Colonists pick up bills based on work priorities and skill levels
- Bills can be: Do X times, Do until you have X, Do forever
- Ingredient radius: Limit how far colonists will search for inputs

**Key Mechanics:**
- **Work types**: Firefight, Patient, Bed rest, Basic worker, Warden, Handle (animals), Cook, Hunt, Construct, Grow, Mine, Plant cut, Smith, Tailor, Art, Craft, Haul, Clean, Research
- **Skill system**: Each work type has associated skill (0-20 scale)
- **Passion system**: Colonists have passions (none, interested, burning) affecting XP gain
- **Incapable restrictions**: Traits can prevent certain work types

### Reverse-Engineering Assessment

| Aspect | Assessment |
|--------|-----------|
| **Reverse-engineering difficulty** | Low-Medium. Core concepts are well-documented. Exact algorithms for task selection are partially reverse-engineered |
| **Open source clone available?** | No. RimWorld is closed source but has extensive modding API |
| **CSOAI mapping** | RimWorld's work priority system is a **direct template for CSOAI agent task allocation**. The bill system maps to agent production orders. Skill+passion maps to agent competency and interest vectors. Work restriction (who can do what) maps to agent capability profiles |
| **Integration recommendation** | **Very High Priority**. Implement the work priority matrix (assign numeric priorities to work types per agent). Use the bill system model for production ordering at agent workbenches. The "Do until you have X" pattern is perfect for CSOAI inventory management. The skill-based task routing ensures optimal agent-task matching |

---

## 13. Victoria 3

### 13.1 Core Mechanic: Market-Based National Economy

Victoria 3 implements a sophisticated market-driven economic simulation [^1352^][^1353^][^1355^]:

**Core Economic Flow:**
```
Sources (money creation) -> Market -> Sinks (money destruction)
```

**7 Money Sources [^1352^]:**
1. Revenue from Gold Mines (Grev)
2. Revenue from Selling Goods (Srev) - majority of money
3. Revenue from Trade after Tariffs (Trev)
4. Minting (M) - money printing
5. Tariff Income (Tgov)
6. Dependents Income (Clabor)
7. Bonus Investment Pool Contributions (Ibonus)

**Market Mechanics:**
- Transactions abstracted through national market (not direct producer->consumer)
- **Local price formula**: Oversupply = price drops; Undersupply = price rises
- Price capped at 75% above or below base price
- **Market Access**: Geographic distance affects local prices; producers/consumers in same state avoid transport cost loss
- Buildings sell all goods and pops purchase all goods regardless of order matching

**Production System:**
- Buildings produce goods -> sold to market -> pops buy from market
- **Production methods**: Switchable technologies (e.g., Iron Tools -> Steel Tools)
- Input goods + labor -> Output goods + byproducts
- Profit/loss determines wage levels and employment

**Key Economic Behaviors:**
- Oversupply: Good for buyers (lower costs), bad for producers (no profit -> firing workers -> radicals)
- Undersupply: Good for producers (high profits), bad for buyers (low standard of living)
- **Automatic rebalancing**: Fired workers reduce production, bringing supply back toward equilibrium

### Reverse-Engineering Assessment

| Aspect | Assessment |
|--------|-----------|
| **Reverse-engineering difficulty** | High. Paradox games are closed source. Economic mechanics are partially reverse-engineered by community. The market price algorithm is complex |
| **Open source clone available?** | No direct clone. Mechanics documented on wiki and academic analysis |
| **CSOAI mapping** | Vicky3's market abstraction is the **perfect model for CSOAI's internal economy**. Instead of direct agent-to-agent transactions, use a "town market" where agents post supply/demand and prices adjust. The oversupply/undersupply feedback loop models how CSOAI should self-correct. Production methods map to agent technology upgrades |
| **Integration recommendation** | **High Priority**. Implement Vicky3-style market clearing: agents post supply/demand orders, prices adjust to clear market, local prices vary by "distance" (communication cost). Use the oversupply->wage reduction->employment reduction->production reduction feedback loop as the primary economic balancing mechanism. The 75% price cap prevents extreme market failures |

---

## 14. Open Source Economy Simulation Libraries

### 14.1 Mesa (Python Agent-Based Modeling)

- **Repository**: github.com/projectmesa/mesa
- **License**: Apache 2.0
- **Purpose**: Agent-based modeling framework in Python
- **Features**:
  - Agent, Model, Grid, Schedule base classes
  - Built-in data collection (DataCollector)
  - Visualization server
  - Batch runner for parameter sweeps
  - Extensive example models (including supply chain examples)
- **Supply Chain Applications**: Multiple academic papers use Mesa for supply chain ABM [^1373^][^1377^]

### 14.2 Economic Simulation Library (ESL)

- **Repository**: github.com/INET-Complexity/ESL
- **Purpose**: "Extensive collection of tools to develop, test, analyse and calibrate economic and financial agent-based models"
- **Language**: C++17 with Python bindings
- **Features**:
  - Parallel computation support
  - Large-scale distributed computing deployment
  - Designed for rapid iteration during model development
  - Dependencies: GSL, Adept, Boost.Python, optional MPI
- **Use Case**: Large-scale economic ABMs with thousands of agents [^1427^]

### 14.3 Supplychainpy

- **Repository**: github.com/KevinFasusi/supplychainpy
- **License**: BSD-3-Clause
- **Features**:
  - Inventory analysis for uncertain demand
  - ABC/XYZ classification
  - Economic order quantity (EOQ) calculation
  - Monte Carlo simulation
  - Demand forecasting (exponential smoothing, Holt's trend)
  - Reporting dashboard with Flask [^1358^]

### 14.4 Amazon miniSCOT

- **Repository**: github.com/amzn/supply-chain-simulation-environment
- **Purpose**: "Simulation tool that lets users play with supply chain architecture and algorithms at any level of fidelity"
- **Features**:
  - Pre-built modules for supply chain components
  - Snap-together supply chain construction
  - Python codebase for easy component development [^1356^]

### 14.5 AI-Driven Supply Chain Simulator

- **Repository**: github.com/AquarlisPrime/AI-Driven-Forecast-Resilience-Simulator-for-Supply-Chain
- **Features**:
  - Prophet/LightGBM demand forecasting
  - NetworkX digital twin visualization
  - Disruption scenario engine
  - Cost/emissions/risk calculators
  - Streamlit interface [^1349^][^1350^]

### Reverse-Engineering Assessment

| Aspect | Assessment |
|--------|-----------|
| **Best for CSOAI** | **Mesa** for immediate prototyping; **ESL** for production-scale simulation |
| **CSOAI mapping** | These libraries provide the **computational framework** for CSOAI's economic simulation. Mesa's Agent/Model architecture is a direct match. Supplychainpy's inventory analysis can optimize agent stock levels. miniSCOT's modular approach maps to CSOAI's hive composition |
| **Integration recommendation** | **Very High Priority - Foundation Layer**. Build CSOAI economy on Mesa framework. Use Mesa's Agent class for individual CSOAI agents, Model class for town simulation container, DataCollector for metrics. Port supplychainpy's EOQ and Monte Carlo functions for inventory optimization |

---

## 15. Agent-Based Modeling for Supply Chains

### 15.1 Academic Frameworks

Extensive academic literature documents ABM for supply chain simulation [^1326^][^1327^]:

**JADE (Java Agent Development Framework):**
- FIPA-compliant middleware for enterprise ABM
- Decentralized peer-to-peer agent networks
- Native communication mechanisms for supply chain dynamics
- Best for: Enterprise-grade, standardized agent communication

**NetLogo:**
- Accessible, intuitive programming environment
- Excellent for emergent phenomena and complex adaptive systems
- Simplified syntax for rapid prototyping
- Best for: Education, quick prototyping, visualization
- Supply chain example: Multi-echelon inventory with buyer-seller agent interactions [^1423^]

**AnyLogic:**
- Combines discrete event simulation + agent-based + system dynamics
- Visual modeling environment
- Extensive logistics/supply chain component libraries
- Used by: Boeing, IBM, NASA, Caterpillar [^1330^]

**Cougaar (Cognitive Agent Architecture):**
- Open-source Java multi-agent architecture
- Developed for DARPA Advanced Logistics Program
- Used by US Army for logistics decision support
- Survives large-scale distributed deployments [^1326^]

### 15.2 Key ABM Supply Chain Patterns

From academic literature [^1326^]:

**4-Level Multi-Agent Supply Chain:**
- Retailer -> Wholesaler -> Distributor -> Manufacturer
- Each agent has decision-making model for inventory
- Information sharing reduces bullwhip effect

**Agent Types:**
- Customer agents: Generate demand, place orders
- Supplier agents: Process orders, manage inventory
- Plant agents: Manufacturing production
- Warehouse agents: Storage and fulfillment
- Controller agents: Orchestration and monitoring

**Bullwhip Effect Mitigation:**
- Information sharing between echelons reduces inventory variance
- Lead time reduction through better coordination
- Demand forecasting at each level prevents overreaction

### Reverse-Engineering Assessment

| Aspect | Assessment |
|--------|-----------|
| **Best for CSOAI** | **Mesa (Python)** for integration; study Cougaar for architecture patterns |
| **CSOAI mapping** | The 4-level supply chain (retailer->wholesaler->distributor->manufacturer) maps to CSOAI's industry hive hierarchy. Each agent type (customer, supplier, plant, warehouse) has a direct CSOAI agent role equivalent. The bullwhip effect and its mitigation is directly relevant to CSOAI resource stability |
| **Integration recommendation** | **High Priority - Architecture Layer**. Use the multi-echelon agent hierarchy as CSOAI's organizational structure. Implement information-sharing protocols between agents to reduce bullwhip effects. Study Cougaar's distributed agent architecture for scaling to 47+ agents. Mesa provides the implementation framework |

---

## 16. Summary Matrix

| # | Game/System | Core Mechanic | Reverse-Eng Difficulty | Open Source? | CSOAI Priority |
|---|------------|---------------|----------------------|--------------|----------------|
| 1 | Cities: Skylines | 4-tier supply chain (extract->process->manufacture->sell) | Medium | Partial (LinCity-NG, Micropolis) | **High** |
| 2 | Factorio | Belt-driven deterministic production ratios | Low-Medium | **Yes (Mindustry)** | **Very High** |
| 3 | EVE Online | Player-driven laissez-faire economy with build-vs-buy ERP | High | No | **High** |
| 4 | WoW Auction House | LIFO commodity market with regional price discovery | Low | Yes (TSM addon) | **High** |
| 5 | Minecraft Villager | Profession-based tiered trading with supply/demand pricing | Very Low | Partial | **Very High** |
| 6 | Open City Builders | RCI demand simulation, zone development | Very Low | **Yes (Micropolis, LinCity-NG)** | Medium |
| 7 | Mindustry | Conveyor production chains, resource routing | Very Low | **Yes (GPL v3)** | **High** |
| 8 | FIRS/OpenTTD | 68 cargo/83 industry combinatory production | Low | **Yes (GPL v2)** | **High** |
| 9 | OpenTTD | Logistics, cargo aging, station ratings | Very Low | **Yes (GPL v2)** | **Very High** |
| 10 | Anno Series | Multi-step manufacturing with population-tier needs | Medium | No | **High** |
| 11 | Dwarf Fortress | Workshop-based labor assignment with skill quality | Medium-High | No | Medium |
| 12 | RimWorld | Work priority matrix with bill-based production | Low-Medium | No | **Very High** |
| 13 | Victoria 3 | Market-clearing economy with oversupply feedback | High | No | **High** |
| 14 | Mesa + Supplychainpy | Agent-based modeling + inventory optimization | Very Low | **Yes (Apache/BSD)** | **Very High** |
| 15 | ABM Frameworks | Multi-echelon supply chain agent hierarchies | Low | **Yes (JADE, Mesa)** | **High** |

---

## 17. Integration Recommendations for CSOAI

### 17.1 Immediate Implementation (Sprint 1-2)

**1. Foundation: Mesa Framework + Minecraft Villager Trading**
- Build CSOAI economy on Mesa's Agent/Model architecture
- Implement profession assignment (like villager job site blocks)
- Create bi-directional trade offers with stock limits
- Add tier progression (Novice->Master) with XP system
- Implement demand-based price adjustment

**2. Production: Factorio-Style Ratios + Mindustry Reference**
- Study Mindustry source for conveyor/item routing
- Implement production rate formulas for agent workbenches
- Create ratio-balancing system for multi-agent production chains
- Add throughput calculation for inter-agent transfers

### 17.2 Core Systems (Sprint 3-4)

**3. Task Allocation: RimWorld Work Priority + Dwarf Fortress Labor**
- Implement work priority matrix per agent
- Create bill-based production ordering system
- Add skill-based automatic task routing (like DF's auto-labor)
- Master workshop concept for lead agents in each hive

**4. Market: Victoria 3 Market Clearing + WoW AH Price Discovery**
- Create "town market" abstraction for all agent transactions
- Implement oversupply/undersupply price feedback loop
- Add moving average price tracking (DBMarket/DBRegion equivalents)
- Implement arbitrage detection for agents

### 17.3 Advanced Systems (Sprint 5+)

**5. Logistics: OpenTTD Transport Networks + Cities Skylines Supply Chain**
- Implement cargo aging and freshness tracking
- Add station rating (reputation) system for agents
- Create multi-modal transport between hives (direct, hub, broadcast)
- Implement the full 4-tier supply chain (extract->process->manufacture->retail)

**6. Specialization: EVE Online ERP + Anno Production Chains**
- Implement build-vs-buy decision algorithm
- Create agent specialization roles (extractor, processor, manufacturer, retailer)
- Add population-tier needs system (basic->luxury goods hierarchy)
- Implement production method switching based on input availability

### 17.4 Reference Implementations to Study

| Priority | Repository/Resource | What to Extract |
|----------|-------------------|----------------|
| 1 | github.com/projectmesa/mesa | Agent framework, data collection, visualization |
| 2 | github.com/Anuken/Mindustry | Conveyor routing, production building I/O, item system |
| 3 | github.com/amzn/supply-chain-simulation-environment | Supply chain module composition patterns |
| 4 | github.com/KevinFasusi/supplychainpy | Inventory analysis, EOQ, Monte Carlo simulation |
| 5 | github.com/lincity-ng/lincity-ng | City simulation economic loops |
| 6 | github.com/SimHacker/micropolis | Original RCI demand formulas |
| 7 | github.com/andythenorth/firs | Cargo taxonomy, production callback code |
| 8 | github.com/OpenTTD/OpenTTD | Pathfinding, cargo routing, station rating |

### 17.5 Architecture Sketch

```
CSOAI Town Economy Architecture

+---------------------------------------------------+
|  Town Market (Victoria 3-style clearing)          |
|  - Price adjustment (oversupply/undersupply)      |
|  - Moving average price tracking                  |
|  - Arbitrage detection                            |
+---------------------------------------------------+
                      |
    +-----------------+-----------------+
    |                 |                 |
+---v---+      +------v------+   +-----v----+
| Retail |      | Processing  |   | Extract  |
| Hives  |      | Hives       |   | Hives    |
| (sell  |      | (manufacture)|   | (gather  |
| goods) |      | goods)      |   | raw)     |
+--------+      +-------------+   +----------+
    |                 |                 |
    +-----------------+-----------------+
                      |
+---------------------------------------------------+
|  Agent Framework (Mesa)                           |
|  - Profession assignment (MC Villager)            |
|  - Work priority matrix (RimWorld)                |
|  - Skill-based task routing (Dwarf Fortress)      |
|  - Production bills with ratios (Factorio)        |
+---------------------------------------------------+
                      |
+---------------------------------------------------+
|  Transport Layer (OpenTTD-inspired)                |
|  - Cargo routing between hives                     |
|  - Reputation-based delivery quality               |
|  - Throughput calculation and bottleneck detection |
+---------------------------------------------------+
```

---

## Sources

[^1296^] Cities: Skylines Wiki - Supply Chain (skylines.paradoxwikis.com/Supply_chain)
[^1297^] Cities: Skylines II - Economy & Production (paradoxinteractive.com/games/cities-skylines-ii/features/economy-production)
[^1298^] EVE Online - Global PLEX Market and Friction-Free Trade (eveonline.com/news)
[^1299^] Minecraft Wiki - Trading (minecraft.wiki/w/Trading)
[^1300^] EVE Online: The Worlds of Wealth and War (dl.digra.org)
[^1301^] HN Comment - EVE Online Corporation ERP System (news.ycombinator.com/item?id=4114791)
[^1302^] Participant Observation: The Economy of EVE Online (voices.uchicago.edu)
[^1304^] Anno 117 Production Chains Solved (iheart.com/podcast)
[^1305^] SteamWorld Build - Anno Alternative (anno.city)
[^1306^] Anno 1800 Wiki - Production Chains (anno1800.fandom.com)
[^1326^] Agent Based Modeling Framework for Supply Chain Risk Management (DTIC PDF)
[^1327^] Agent-Based Modeling in Supply Chain (smythos.com)
[^1328^] Dwarf Fortress Wiki - Economics (dwarffortresswiki.org)
[^1329^] Dwarf Fortress Steam Version - Workshop Assignment Update (store.steampowered.com)
[^1330^] AnyLogic Supply Chain Model (anylogic.com/blog)
[^1331^] Factorio Cheat Sheet (factoriocheatsheet.com)
[^1332^] RimWorld Wiki - Work (rimworldwiki.com)
[^1349^] AI-Priven Supply Chain Simulator (dev.to)
[^1350^] Supply Chain Simulation & Forecasting Platform (github.com)
[^1351^] LinCity-NG Mirror (gitcode.com)
[^1352^] Exploring the Economic Engine of Victoria 3 (riverlimburg.substack.com)
[^1353^] Deep Dive: Modeling the Global Economy in Victoria 3 (gamedeveloper.com)
[^1355^] Victoria 3 Wiki - Market (vic3.paradoxwikis.com)
[^1356^] Amazon miniSCOT (github.com/amzn/supply-chain-simulation-environment)
[^1358^] Supplychainpy (github.com/KevinFasusi/supplychainpy)
[^1359^] LinCity-NG GitHub (github.com/lincity-ng/lincity-ng)
[^1360^] Micropolis - Libre Game Wiki (libregamewiki.org)
[^1361^] LinCity Wikipedia (en.wikipedia.org/wiki/Lincity)
[^1371^] WoW Auction House Guide (epiccarry.com)
[^1372^] Auctionator vs TSM vs Auctioneer (medium.com)
[^1373^] Intro to Agent Based Modeling (towardsdatascience.com)
[^1374^] TradeSkillMaster 4.14 Beta (wowhead.com)
[^1375^] Mindustry - Open Source Factorio-like (gamingonlinux.com)
[^1376^] OpenTTD Wiki - Cargo (wiki.openttd.org)
[^1377^] Simulating Historical Communication Networks with Mesa (programminghistorian.org)
[^1378^] TSM Goldmaking Guide (thelazygoldmaker.com)
[^1379^] OpenTTD Game Mechanics Discussion (news.ycombinator.com)
[^1411^] SimCity 4 Tips PDF (dfwfuturecity.org)
[^1412^] FIRS Changelog - Steeltown (grf.farm)
[^1413^] FIRS 5.1.0 Changelog (grf.farm)
[^1414^] Mindustry on Steam (store.steampeam.com)
[^1416^] FIRS Gameplay Documentation (bundles.openttdcoop.org)
[^1417^] OpenTTD FIRS Wiki (wiki.openttd.org)
[^1418^] Factorio Cheat Sheet - Production Ratios (factoriocheatsheet.com)
[^1419^] Mindustry Wikipedia (en.wikipedia.org/wiki/Mindustry)
[^1421^] Factorio Wiki - Belt Transport System (wiki.factorio.com)
[^1422^] Python Packages for Economics (ie.pubpub.org)
[^1423^] Using NetLogo for Supply Chain ABM (aeeejournal.org)
[^1425^] Factorio Wiki - Inserters (wiki.factorio.com)
[^1427^] Economic Simulation Library ESL (github.com/INET-Complexity/ESL)

---

*Research compiled for CSOAI.org - 47-Agent Sovereign AI Town Simulation*
*Focus: Production chains, resource management, trade, logistics for self-sustaining AI agent economy*
