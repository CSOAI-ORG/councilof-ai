# Legacy System Bridges for Layer 0 Protocol and ONE OS

## Deep Research Report: Bridging the World's Critical Infrastructure

**Date:** 2025  
**Scope:** COBOL, Mainframes, AS/400, SAP, Oracle, Healthcare, Financial, Industrial/SCADA  
**Purpose:** Enable CSOAI's Layer 0 Protocol to connect to legacy systems that run the world's critical infrastructure

---

## Executive Summary

The world's critical infrastructure -- banks, governments, utilities, healthcare, airlines, insurance -- runs on systems built decades ago in COBOL, RPG, and proprietary protocols. These systems process over **$3 trillion daily** in financial transactions, manage **1.4 billion identities** (India's Aadhaar), handle **12+ billion monthly payment transactions** (UPI), and control power grids, water treatment, and manufacturing lines worldwide.

**This report identifies the top 10 legacy bridge technologies and designs a Layer 0 Protocol gateway architecture** to connect these systems to ONE OS without disruption.

### Top 10 Legacy Bridges (Quick Reference)

| Rank | Bridge | What It Connects | Cost | Open Source |
|------|--------|-----------------|------|-------------|
| 1 | **IBM z/OS Connect** | Mainframe COBOL/CICS/IMS/DB2 to REST APIs | $$$$ | No |
| 2 | **GnuCOBOL** | COBOL to C/Modern Systems | Free | Yes (GPL/LGPL) |
| 3 | **Apache Camel** | Any protocol to any protocol (350+ components) | Free | Yes (Apache 2.0) |
| 4 | **Debezium + Kafka Connect** | Legacy databases to real-time event streams | Free | Yes (Apache 2.0) |
| 5 | **Mirth Connect / Open Integration Engine** | HL7 v2/FHIR/DICOM healthcare integration | Free | Yes (MPL 2.0) |
| 6 | **QuickFIX + FIX Orchestra** | FIX protocol trading/messaging | Free | Yes (Open Source) |
| 7 | **IBM MQ / MQSeries** | Mainframe-to-cloud message queuing | $$$ | No |
| 8 | **Node-RED + Apache PLC4X** | SCADA/PLC/OPC UA to MQTT/Cloud | Free | Yes (Apache 2.0) |
| 9 | **OpenLegacy Hub** | Mainframe/IBM i to cloud-native APIs | $$-$$$ | Partial |
| 10 | **X-Road (Estonia)** | Government legacy system interoperability | Free | Yes (MIT) |

---

## Table of Contents

1. [COBOL Integration](#1-cobol-integration)
2. [IBM Mainframe (z/OS) Integration](#2-ibm-mainframe-zos-integration)
3. [AS/400 (IBM i) Integration](#3-as400-ibm-i-integration)
4. [SAP Integration](#4-sap-integration)
5. [Oracle / Legacy Database Integration](#5-oracle--legacy-database-integration)
6. [Healthcare Legacy (HL7, FHIR, DICOM)](#6-healthcare-legacy-hl7-fhir-dicom)
7. [Financial Legacy (FIX, SWIFT, ISO 20022)](#7-financial-legacy-fix-swift-iso-20022)
8. [Industrial / SCADA Legacy](#8-industrial--scada-legacy)
9. [Protocol Gateway Architecture for Layer 0](#9-protocol-gateway-architecture-for-layer-0)
10. [Case Studies of Successful Legacy Bridges](#10-case-studies-of-successful-legacy-bridges)

---

## 1. COBOL Integration

### 1.1 GnuCOBOL (formerly OpenCOBOL)

| Attribute | Details |
|-----------|---------|
| **URL** | https://sourceforge.net/projects/gnucobol/ |
| **License** | GPL 3.0 (compiler), LGPL (runtime) |
| **Cost** | FREE |
| **Latest Release** | 3.2 (July 2023), 4.x in development |
| **What It Bridges** | COBOL source code to C, then to native binaries on Linux, Unix, macOS, Windows, z/OS, AS/400 |
| **Standard Support** | COBOL 85, X/Open, ISO COBOL 2002/2014/2023 |
| **Dialect Support** | 19 dialects: IBM, Micro Focus, MVS, ACUCOBOL-GT, RM/COBOL, BS2000, GCOS |

**How It Works:**
GnuCOBOL translates COBOL source code into C (C89+), then compiles the C code using the native platform C compiler (GCC, Clang, MSVC). This provides excellent portability across platforms.

**Key Features:**
- Passes 9,700+ of 9,748 NIST COBOL 85 test suite tests
- JSON GENERATE and XML GENERATE support
- EXEC SQL preprocessors for PostgreSQL, Firebird, ODBC, DB2
- ASCII/EBCDIC/big-endian/little-endian support
- C integration for calling C libraries directly from COBOL
- Screen libraries including Java (AWT/Swing) and GTK+

**Industrial Users:**
- French DGFIP (tax authority): GCOS Mainframe -> GnuCOBOL/PC
- Objectway Core Banking Suite: AIX/Solaris/RHEL migration
- Many banks converting from Micro Focus COBOL to GnuCOBOL

**Integration Complexity:** Medium -- requires understanding of COBOL dialect differences and C compiler toolchain setup.

**Layer 0 Relevance:** HIGH -- Free, open-source COBOL compiler that can compile legacy COBOL code on modern infrastructure, enabling gradual migration without vendor lock-in.

---

### 1.2 Micro Focus COBOL (now part of OpenText)

| Attribute | Details |
|-----------|---------|
| **URL** | https://www.microfocus.com/en-us/cobol |
| **License** | Proprietary |
| **Cost** | $50,000 - $500,000+ per project |
| **What It Bridges** | Enterprise COBOL on Windows, Linux, Unix, .NET, JVM, cloud containers |

**How It Works:**
Micro Focus Visual COBOL compiles COBOL to .NET IL or JVM bytecode, or to native code. It provides the most complete implementation of COBOL standards including OO-COBOL, and integrates with Visual Studio and Eclipse IDEs.

**Key Features:**
- Compile COBOL to .NET or Java bytecode
- Modern IDE integration (Visual Studio, Eclipse)
- Container deployment support (Docker, Kubernetes)
- REST/SOAP service generation from COBOL programs
- DB2, Oracle, SQL Server database connectivity
- CICS emulation for distributed platforms

**Integration Complexity:** Low-Medium -- Enterprise-grade tooling with professional support, but expensive.

**Layer 0 Relevance:** MEDIUM -- Enterprise standard but proprietary and costly. Good for organizations with existing Micro Focus licenses.

---

### 1.3 IBM Enterprise COBOL for z/OS

| Attribute | Details |
|-----------|---------|
| **URL** | https://www.ibm.com/products/cobol-compiler-family |
| **License** | Proprietary (IBM licensing) |
| **Cost** | $$$$ (part of z/OS licensing) |
| **What It Bridges** | Native COBOL compilation on IBM Z mainframes |

**How It Works:**
The gold standard for mainframe COBOL. Compiles COBOL directly to IBM Z machine code. Integrates with CICS, IMS, DB2, MQSeries. Supports JSON, XML, and Unicode natively.

**Integration Complexity:** Low (on mainframe) -- but requires z/OS environment and specialized skills.

---

### 1.4 COBOL to Java Transpilers

#### RES -- Pure Java COBOL Translator

| Attribute | Details |
|-----------|---------|
| **URL** | https://opencobol2java.sourceforge.net/ |
| **License** | Open Source |
| **Cost** | FREE |
| **Status** | Pre-Beta (mature but limited) |

Translates COBOL to maintainable Java code using JavaCC parser. Generates Java with performance close to native Java.

#### SoftwareMining COBOL-to-Java

| Attribute | Details |
|-----------|---------|
| **URL** | https://softwaremining.com |
| **License** | Proprietary |
| **Cost** | Project-based ($$$) |
| **Notable Case** | ING Bank: 1.5 million lines COBOL -> Java |

**ING Bank Case:** Modernized 1.5M lines of COBOL (including CICS, DB2, JCL) to Java. Over 2 billion transactions processed during side-by-side testing. Running on Linux since Feb 2022. 70% cost savings.

#### Easy COBOL Migrator

| Attribute | Details |
|-----------|---------|
| **URL** | Desktop transpiler tool |
| **Target Languages** | C++17, Java 17, C# 12, Python 3, Rust, Go |
| **Approach** | Full compiler pipeline (not LLM-based) |
| **Cost** | Commercial tool |

Deterministic, auditable transpilation -- same COBOL input always produces same output. Handles COMP-3 packed decimal arithmetic precisely (critical for financial reconciliation).

#### COBOL-Coder (AI-Powered)

| Attribute | Details |
|-----------|---------|
| **Type** | Domain-adapted LLM for COBOL |
| **COBOL-to-Java CSR** | 97.9% compilation success rate |
| **Approach** | AI model fine-tuned on COBOL codebases |

---

### 1.5 REST/SOAP Wrappers for COBOL Programs

#### Approach: CICS Web Services

IBM CICS (Customer Information Control System) supports native web service exposure:

1. **CICS Pipeline Configuration** -- Define a pipeline for SOAP or JSON
2. **Web Service Binding** -- Use DFHWS2LS or DFHLS2WS to generate WSDL/SOAP bindings from COBOL copybooks
3. **CICS Transaction Gateway (CTG)** -- Java/.NET APIs to call CICS programs

**CICS Transaction Gateway:**
| Attribute | Details |
|-----------|---------|
| **Protocols** | ECI (External Call Interface), EPI (External Presentation Interface) |
| **Client APIs** | Java, .NET, C, COBOL |
| **Use Case** | Call COBOL transactions from Java/.NET applications |

#### CICS TS Web Services (Modern)

- CICS TS 5.6+ supports RESTful APIs natively
- JSON Assistant (Assistant for JSON) maps COBOL data structures to JSON
- URIMAP resources define REST endpoints
- Zero middleware -- CICS itself is the HTTP server

**Integration Complexity:** Medium -- requires CICS systems programming knowledge but well-documented.

---

### 1.6 JSON-XML Bridges for COBOL

**IBM Enterprise COBOL v6** includes:
- `JSON GENERATE` -- Convert COBOL data structures to JSON
- `JSON PARSE` -- Parse JSON into COBOL data structures
- `XML GENERATE` / `XML PARSE` -- XML handling

**GnuCOBOL** -- JSON GENERATE and XML GENERATE supported; XML PARSE pending.

**Micro Focus COBOL** -- Full JSON/XML handling with REST API generation.

---

### 1.7 Open-Source COBOL API Wrappers

#### OpenLegacy CICS COBOL Connector

| Attribute | Details |
|-----------|---------|
| **URL** | https://www.openlegacy.com |
| **Type** | AI-driven legacy modernization platform |
| **Connectors** | CICS COBOL, IMS PL/I, DB2, VSAM, MQ, JCL, 3270 screens |
| **Cost** | Commercial |

Auto-generates REST APIs from COBOL copybooks. Runs within AWS Transform for Modernization.

#### Nats2CICS / IBM z/OS Connect

IBM z/OS Connect exposes COBOL programs as OpenAPI 3.0 REST APIs without code changes (see section 2).

---

## 2. IBM Mainframe (z/OS) Integration

### 2.1 IBM z/OS Connect

| Attribute | Details |
|-----------|---------|
| **URL** | https://www.ibm.com/products/zos-connect |
| **License** | Proprietary (IBM) |
| **Cost** | $$$$ (IBM Z software licensing) |
| **What It Bridges** | CICS, IMS, DB2, MQ on z/OS to REST/JSON OpenAPI 3.0 APIs |
| **Latest Version** | 3.0.91+ (as of 2025) |

**How It Works:**
1. Identify COBOL/PL/I program and copybooks defining I/O data structures
2. Feed COBOL program into z/OS Connect JCL job to generate `.sar` (Service Archive)
3. Import `.sar` into IDE (IBM IDz), define request/response mappings
4. Create `.aar` (API Archive) file and deploy to z/OS Connect server
5. REST API is now available for cloud/mobile/container consumers

**Key Features:**
- OpenAPI 3.0 compliant APIs in minutes
- CI/CD pipeline integration
- Over 99% workload offload to zIIP processors
- TLS, SAF, JWT security integration
- OpenTelemetry observability support
- Can run inside CICS region (z/OS Connect 3.0.88+) -- no extra address space

**Case Study -- Leading Cooperative Banking Group:**
- 47% reduction in integration effort
- 29 man-days saved per integration deployment
- 0.4 FTE effort saved per integration process
- 47% reduction in recurring operational costs

**Case Study -- Global Financial Institution:**
- Modern IDE integration via IBM Wazi Developer
- Continuous delivery with IBM UrbanCode Deploy
- API-driven modernization of COBOL services

**Integration Complexity:** Medium -- requires mainframe sysadmin + Linux + application skills.

**Layer 0 Relevance:** CRITICAL -- The gold standard for mainframe API enablement. Over 400 enterprises using it.

---

### 2.2 IBM Z Digital Integration / z/OS Connect CE

**z/OS Connect Core Edition** -- Core components on z/OS USS (Unix System Services).

**IBM z and Cloud Modernization Stack (zMod Stack):**
- Runs on Red Hat OpenShift (on or off mainframe)
- Fully automated deployment via AWS CloudFormation templates
- z/OS Connect components run outside the mainframe
- Requires only IP address of CICS region to connect

**Integration Complexity:** Medium -- Core Edition needs more z/OS skills; zMod Stack is more configuration-friendly.

---

### 2.3 IBM MQ (MQSeries)

| Attribute | Details |
|-----------|---------|
| **URL** | https://www.ibm.com/products/mq |
| **License** | Proprietary |
| **Cost** | $$-$$$ (per processor or container) |
| **What It Bridges** | Message queuing between mainframe, midrange, distributed, cloud |
| **Platforms** | z/OS, IBM i, Linux, Windows, UNIX, cloud |

**How It Works:**
IBM MQ provides asynchronous message queuing between applications. On z/OS, MQ integrates with CICS (via CICS-MQ bridge), IMS, and batch jobs. Messages are stored in queues managed by Queue Managers, delivered reliably between systems.

**APIs Supported:**
- MQI for C, COBOL, PL/I, Java, Rexx, RPG
- Java Message Service (JMS)
- REST API (modern)
- MQTT, AMQP 1.0

**Cloud Integration:**
- Azure Logic Apps has built-in MQ connector
- Kafka Connect MQ source/sink connectors available
- AWS MQ (managed IBM MQ compatible)

**Layer 0 Relevance:** HIGH -- Critical for async mainframe integration. Industry standard for reliable messaging.

---

### 2.4 DB2 Connectors

| Connector | Description |
|-----------|-------------|
| **IBM Data Virtualization Manager** | Virtual data layer abstracting DB2, IMS, VSAM, Oracle, SQL Server |
| **JDBC/ODBC** | Standard SQL connectivity to DB2 for z/OS |
| **DB2 REST API** | Native REST interface for DB2 queries |
| **Debezium DB2 Connector** | CDC from DB2 transaction log to Kafka |

**IBM Data Virtualization Manager + z/OS Connect:**
- Data Virtualization Manager accesses IMS/VSAM data via SQL
- z/OS Connect exposes that data as REST APIs
- IMS or VSAM data accessible without specialized mainframe skills

---

### 2.5 RACF / ACF2 / Top Secret -- Security Integration

| System | Description |
|--------|-------------|
| **RACF** | IBM's Resource Access Control Facility -- z/OS security |
| **ACF2** | Broadcom's alternative to RACF |
| **Top Secret** | Another Broadcom security product |

**Integration Patterns:**
- z/OS Connect uses SAF (System Authorization Facility) for API authorization
- JWT tokens from modern systems map to RACF user IDs
- TLS/SSL for transport security
- Audit logging via SMF (System Management Facility)

---

### 2.6 3270 Terminal Emulation

| Solution | Description |
|----------|-------------|
| **x3270** | Open source 3270 emulator for X Windows |
| **WC3270** | Windows 3270 emulator |
| **Tomcat Web 3270** | Browser-based 3270 emulation |
| **Rocket Software** | Commercial 3270 emulation + modernization |
| **OpenLegacy 3270 Screen Connector** | API generation from 3270 screen interactions |

**3270 Screen Scraping to API:**
- Record 3270 screen interactions
- Map screen fields to API parameters
- Generate REST APIs that drive 3270 sessions programmatically
- Used when no programmatic interface exists for legacy applications

---

### 2.7 Rocket Software

| Attribute | Details |
|-----------|---------|
| **URL** | https://www.rocketsoftware.com |
| **Focus** | Mainframe modernization, 3270 emulation, data management |
| **Products** | Rocket Process Integration, Rocket DataEdge, Rocket API |
| **Cost** | Commercial ($$$) |

**Key Capabilities:**
- Replatforming applications to commodity hardware/cloud
- Analysis tools highlighting business logic and dependencies
- Mainframe applications run on Linux/containers preserving COBOL/PL/I code
- DevOps integration for mainframe workflows

**Partnership with K2view:**
- Governed test data management for mainframe modernization
- Synthetic data generation and masking
- Production-like test datasets for AI/ML use cases

---

### 2.8 OpenLegacy Hub

| Attribute | Details |
|-----------|---------|
| **URL** | https://www.openlegacy.com |
| **Type** | AI-driven mainframe API generation |
| **AWS Integration** | Embedded in AWS Transform for Modernization |
| **Cost** | Commercial |

**Connectors Available:**
- z/OS Mainframe DB2 (stored procedures, SQL queries)
- Mainframe CICS COBOL (RPC calls)
- IBM MQ COBOL (queue-based)
- Mainframe VSAM CICS
- Mainframe IMS PL/I
- Mainframe 3270 Screens
- Mainframe JCL (batch calls)
- Micro Focus COBOL
- Unisys, Tandem mainframes

**How It Works:**
1. Connect to mainframe and automatically map dependencies
2. AI identifies safe modernization boundaries
3. Auto-generate modernization-ready APIs
4. Deploy to any cloud or hybrid environment
5. Maintain links between modernized apps and remaining mainframe estate

**Key Benefits:**
- 60% cost reduction
- 10x faster time-to-market
- 2-4 weeks to first value
- Zero disruption to core operations

---

### 2.9 Alternative Mainframe API Solutions

| Solution | Description |
|----------|-------------|
| **WebMethods EntireX (IBM)** | Mainframe connectivity via RPC |
| **Adaptive Integration Fabric (Adaptigent)** | Mainframe integration without middleware |
| **SoftwareMining** | COBOL to Java/C# automated conversion |
| **Heirloom Computing** | COBOL -> Java on cloud platforms |
| **Model9** | Mainframe data management for cloud |

---

## 3. AS/400 (IBM i) Integration

### 3.1 IBM i Access / ACS (Access Client Solutions)

| Attribute | Details |
|-----------|---------|
| **URL** | https://www.ibm.com/products/ibm-i-access-client-solutions |
| **License** | Included with IBM i |
| **What It Provides** | 5250 emulation, file transfer, database access, system management |

**IBM i Access APIs:**
- ODBC/JDBC for DB2 for i
- OLE DB/ADO.NET connectors
- SSH/telnet for command-line access
- REST APIs via Integrated Web Services (IWS)

---

### 3.2 RPG Modernization

**RPG ILE (Integrated Language Environment):**
- Free-form RPG (RPG IV) -- looks more like modern languages
- Built-in functions for JSON parsing, string handling
- Dynamic arrays, enumerations (2023+ enhancements)
- Embedded SQL support
- Can call and be called by C, C++, Java, COBOL

**Modernization Path:**
1. Convert fixed-format RPG to free-format RPG
2. Add SQL where set-based operations apply
3. Expose as web services via IWS
4. Gradually rewrite procedural logic in JavaScript/Node.js

**Orange Telecom Case:** Improved application performance after refactoring legacy RPG to modern free-form RPG.

---

### 3.3 Node.js on IBM i (PASE)

| Attribute | Details |
|-----------|---------|
| **PASE** | Portable Application Solutions Environment -- AIX runtime on IBM i |
| **Node.js** | Available via yum on IBM i |
| **Python** | Also available |
| **Open Source** | Yes |

**How It Works:**
Node.js runs in PASE (the AIX-like environment on IBM i). Can access DB2 for i via ODBC, call RPG programs via system commands, and expose REST APIs.

**node-odbc package:** Provides direct SQL access to DB2 for i from Node.js.

**Example Use Case:** Build REST API in Node.js that queries DB2 for i data and serves JSON to modern frontends.

---

### 3.4 DB2 for i Connectivity

| Connector | Description |
|-----------|-------------|
| **JDBC (JT400)** | IBM's Java driver for IBM i -- `com.ibm.as400.access.AS400JDBCDriver` |
| **ODBC** | Windows/Linux ODBC driver |
| **.NET (ADO.NET)** | IBM i Access for Windows .NET provider |
| **Python (ibm_db)** | IBM DB2 driver for Python |
| **REST (IWS)** | Integrated Web Services server |

**Integrated Web Services (IWS):**
- Deploy RPG/COBOL programs as SOAP or REST web services
- WSDL generation from program parameters
- No code changes needed to existing programs
- Supports JSON and XML

---

### 3.5 Profound Logic / LANSA / Airtool -- UI Modernization

| Tool | Approach | Cost |
|------|----------|------|
| **Profound UI** | Web rendering layer on existing RPG programs | Commercial |
| **LANSA** | Replace RPG with declarative framework for new dev | Commercial |
| **Airtool** | RPG -> JavaScript, DDS -> metadata, Vue.js UI | Commercial |

**APEX-like approach for IBM i:** IWS + modern frontend framework (React/Vue) calling RPG business logic.

---

## 4. SAP Integration

### 4.1 SAP BTP (Business Technology Platform)

| Attribute | Details |
|-----------|---------|
| **URL** | https://www.sap.com/products/technology-platform.html |
| **Type** | Cloud platform for SAP extension and integration |
| **Cost** | $$$ (subscription-based) |

**BTP Integration Components:**
- **SAP Integration Suite** -- API management, process integration
- **SAP API Management** -- API gateway, developer portal
- **SAP Cloud Connector** -- Secure tunnel from cloud to on-premise SAP
- **SAP Graph** -- Unified API for SAP data

**Architecture Pattern:**
1. External app calls REST API on SAP BTP
2. SAP BTP routes via Cloud Connector to on-premise SAP
3. SAP BTP forwards request to SAP backend (S/4HANA, ECC)
4. Response flows back through same path

---

### 4.2 SAP OData Services

| Attribute | Details |
|-----------|---------|
| **Gateway** | SAP Gateway (embedded in S/4HANA, add-on for ECC) |
| **Protocol** | OData (RESTful) |
| **Authentication** | OAuth 2.0, SAML, Basic Auth |

**How It Works:**
SAP Gateway exposes SAP business objects as OData services. CRUD operations on business entities via standard HTTP methods. BAPIs can be exposed as OData function imports.

**Example:** `/sap/opu/odata/sap/ZCUSTOMER_SRV/CustomerSet('1000')`

---

### 4.3 SAP PI/PO (Process Integration / Process Orchestration)

| Attribute | Details |
|-----------|---------|
| **PI** | Process Integration (older) |
| **PO** | Process Orchestration (newer, includes BPM) |
| **Successor** | SAP Integration Suite (cloud) |
| **Protocols** | SOAP, REST, IDoc, RFC, FTP, SFTP, AS2 |

**Use Case:** Enterprise Application Integration (EAI) within SAP landscapes. Connect SAP to non-SAP systems.

---

### 4.4 Open-Source SAP Connectors

#### PyRFC

| Attribute | Details |
|-----------|---------|
| **URL** | https://github.com/SAP/PyRFC |
| **License** | Apache 2.0 |
| **Cost** | FREE |
| **Requirement** | SAP NW RFC SDK (separate download) |

**How It Works:**
Python bindings for SAP NetWeaver RFC SDK. Call any RFC-enabled ABAP function module from Python. Automatic parameter conversion between ABAP and Python types.

```python
from pyrfc import Connection
conn = Connection(ashost='sap.example.com', sysnr='00', 
                  client='100', user='USER', passwd='PASS')
result = conn.call('RFC_READ_TABLE', 
                   QUERY_TABLE='T001', 
                   DELIMITER='|')
```

#### node-rfc

| Attribute | Details |
|-----------|---------|
| **URL** | https://github.com/SAP-archive/node-rfc |
| **License** | Apache 2.0 |
| **Cost** | FREE |

**How It Works:**
Asynchronous, non-blocking SAP NW RFC SDK bindings for Node.js. Can also act as RFC server -- ABAP programs can call Node.js functions via RFC.

**Use Case:** Build Node.js REST APIs that call SAP RFC functions.

**Status Note:** SAP open-source RFC connectors are on-hold as of 2024 -- seeking community maintainers.

---

### 4.5 SAP HANA Database API

| Attribute | Details |
|-----------|---------|
| **Type** | In-memory columnar database |
| **APIs** | SQL, OData, REST (XS Advanced), Calculation Views |

**XS Advanced (XSA):** Build microservices on SAP HANA that expose REST APIs. Node.js, Java, Python runtimes available.

---

## 5. Oracle / Legacy Database Integration

### 5.1 Oracle APEX (Application Express)

| Attribute | Details |
|-----------|---------|
| **URL** | https://apex.oracle.com |
| **Cost** | FREE (included with Oracle Database) |
| **Type** | Low-code development platform on Oracle DB |

**How It Works:**
APEX runs inside the Oracle Database. Build web applications using SQL and PL/SQL. Can create RESTful web services directly from SQL queries.

**Key Features:**
- RESTful Services module -- expose SQL as REST API
- 20+ years of legacy Oracle forms can be modernized to APEX
- No separate app server needed
- Cloud (Oracle APEX Service) or on-premise

**Integration Complexity:** Low -- SQL-savvy developers can build APIs quickly.

---

### 5.2 Oracle REST Data Services (ORDS)

| Attribute | Details |
|-----------|---------|
| **URL** | https://www.oracle.com/database/technologies/appdev/rest.html |
| **License** | FREE |
| **Cost** | FREE |

**How It Works:**
ORDS is a Java EE application that converts HTTP requests to database API calls. Exposes tables, views, PL/SQL procedures as REST endpoints.

```
GET /ords/hr/employees/100  --> SELECT * FROM employees WHERE employee_id = 100
```

**Auto-REST:** Enable REST on any table with a single PL/SQL call.

**Database Support:** Oracle DB, MySQL, PostgreSQL (via ADB).

---

### 5.3 Oracle GoldenGate

| Attribute | Details |
|-----------|---------|
| **URL** | https://www.oracle.com/integration/goldengate/ |
| **License** | Proprietary |
| **Cost** | $$$ |

**How It Works:**
Real-time data replication and integration. Capture changes from Oracle, SQL Server, DB2, MySQL, PostgreSQL transaction logs. Replicate to cloud data warehouses, Kafka, Hadoop.

**Use Case:** Real-time data sync between legacy Oracle systems and modern cloud platforms.

---

### 5.4 Debezium (CDC / Change Data Capture)

| Attribute | Details |
|-----------|---------|
| **URL** | https://debezium.io |
| **License** | Apache 2.0 |
| **Cost** | FREE |
| **What It Bridges** | Database transaction logs -> Kafka event streams |

**How It Works:**
Debezium reads database transaction logs (WAL/binlog) and converts every INSERT/UPDATE/DELETE to a Kafka event. No polling -- captures changes in real-time with minimal database overhead.

**Supported Databases:**
- MySQL (binlog)
- PostgreSQL (logical replication)
- MongoDB (oplog)
- SQL Server (CDC feature)
- Oracle (LogMiner, XStream)
- DB2 (CDC)
- Cassandra (preview)

**Architecture:**
```
[Legacy DB] -> [Transaction Log] -> [Debezium Connector] -> [Kafka] -> [Consumers]
```

**Key Benefits:**
- Minimal database performance impact
- Captures DELETEs (unlike polling)
- Preserves exact order of operations
- Exactly-once semantics via Kafka
- Can replay events from Kafka (no re-querying DB)

**Deployment:** Kafka Connect connector, Debezium Server (standalone), or embedded.

**Layer 0 Relevance:** CRITICAL -- The best open-source CDC solution. Enables event-driven architecture from legacy databases.

---

### 5.5 Kafka Connect JDBC Source Connector

| Attribute | Details |
|-----------|---------|
| **URL** | https://docs.confluent.io/kafka-connectors/jdbc/current/ |
| **License** | Confluent Community License |
| **Cost** | FREE |

**How It Works:**
Polls legacy relational databases and publishes changes to Kafka topics. Supports timestamp+incrementing column-based change detection.

**Configuration Example:**
```json
{
  "connector.class": "io.confluent.connect.jdbc.JdbcSourceConnector",
  "connection.url": "jdbc:postgresql://legacy-db:5432/mydb",
  "table.whitelist": "customers,orders",
  "mode": "timestamp+incrementing",
  "timestamp.column.name": "updated_at",
  "incrementing.column.name": "id"
}
```

**Limitations:** Polling-based (higher DB load), may miss deletes, requires timestamp/incrementing columns.

---

### 5.6 MySQL / PostgreSQL Foreign Data Wrappers (FDW)

| FDW | Description |
|-----|-------------|
| **postgres_fdw** | Connect to remote PostgreSQL databases |
| **mysql_fdw** | Query MySQL from PostgreSQL |
| **oracle_fdw** | Query Oracle from PostgreSQL |
| **db2_fdw** | Query DB2 from PostgreSQL |
| **odbc_fdw** | Generic ODBC FDW |

**Use Case:** Federated queries across legacy and modern databases without ETL.

---

### 5.7 LinkedIn Databus (Historical Reference)

LinkedIn's Databus was an early CDC system that demonstrated the value of "look-back" -- replaying event streams. This concept evolved into Kafka's log-based approach. Debezium is the spiritual successor.

---

## 6. Healthcare Legacy (HL7, FHIR, DICOM)

### 6.1 HL7 v2.x

| Attribute | Details |
|-----------|---------|
| **Standard** | Health Level Seven v2.x (pipe-delimited messages) |
| **Status** | Most widely deployed healthcare messaging standard globally |
| **Protocols** | MLLP (Minimum Lower Layer Protocol) over TCP |
| **Message Types** | ADT (admit/discharge/transfer), ORM (orders), ORU (results), MDM, etc. |

**The Challenge:** HL7 v2 messages are custom-implemented at every site. No two HL7 v2 integrations are identical. Format is pipe-delimited (`|`, `^`, `~`, `\`, `&`).

---

### 6.2 FHIR (Fast Healthcare Interoperability Resources)

| Attribute | Details |
|-----------|---------|
| **URL** | https://www.hl7.org/fhir/ |
| **Standard** | HL7 FHIR (RESTful JSON/XML API) |
| **Status** | Modern standard mandated by CMS/ONC in US |
| **Resources** | Patient, Observation, Encounter, Condition, Medication, etc. |

**How It Works:**
FHIR provides a RESTful API for healthcare data. Each resource type has a standard JSON/XML schema. CRUD operations via HTTP. Search via query parameters.

```
GET /fhir/Patient/123  --> Patient resource
GET /fhir/Observation?patient=123&code=8310-5  --> Body temperature
```

**Adoption Drivers:**
- CMS Interoperability and Patient Access Rule (US)
- ONC Cures Act
- TEFCA (Trusted Exchange Framework)

---

### 6.3 HAPI FHIR

| Attribute | Details |
|-----------|---------|
| **URL** | https://hapifhir.io |
| **License** | Apache 2.0 |
| **Cost** | FREE |
| **Language** | Java |

**How It Works:**
Open-source Java library for working with FHIR. Includes:
- FHIR server (HAPI FHIR JPA Server)
- FHIR client (REST client)
- Validation engine (validate resources against profiles)
- Parser/serializer (JSON/XML)

**Used By:** Mirth Connect, Epic, Cerner, and many other healthcare systems.

---

### 6.4 Mirth Connect / NextGen Connect / Open Integration Engine

| Attribute | Details |
|-----------|---------|
| **Original Name** | Mirth Connect |
| **Steward** | NextGen Healthcare (formerly) |
| **License** | MPL 2.0 (historically), proprietary (v4.6+, March 2025) |
| **Open Source Fork** | Open Integration Engine (OIE) -- https://github.com/SagaHealthcareIT/open-integration-engine |
| **Cost** | FREE (OIE) / Commercial (NextGen) |

**How It Works:**
Channel-based integration engine. Each channel has a source connector (input) and destination connector(s) (output). JavaScript transformations map between formats.

**Supported Standards:**
- HL7 v2.x, v3, CDA
- FHIR (REST API support)
- DICOM (imaging)
- X12 EDI (billing)
- CCD/CCDA (clinical summaries)
- XML, JSON, CSV

**Supported Transports:**
- MLLP (TCP), HTTP(S), SOAP, REST
- FTP/SFTP, JMS, JDBC
- File system, SFTP

**Real-World Scale:**
- 1/3 of all US public HIEs (Health Information Exchanges)
- 40+ countries
- Hundreds of millions of clinical documents per year

**HL7 v2 to FHIR Transformation Example (JavaScript in Mirth):**
```javascript
// Extract from HL7 v2
var patientId = msg['PID']['PID.3']['PID.3.1'].toString();
var patientName = msg['PID']['PID.5']['PID.5.2'] + ' ' + msg['PID']['PID.5']['PID.5.1'];

// Build FHIR Patient JSON
var fhirPatient = {
  resourceType: 'Patient',
  id: patientId,
  name: [{ family: msg['PID']['PID.5']['PID.5.1'], given: [msg['PID']['PID.5']['PID.5.2']] }]
};

return JSON.stringify(fhirPatient);
```

**Integration Complexity:** Low-Medium -- Visual channel designer, drag-and-drop. JavaScript for custom transformations.

**Layer 0 Relevance:** CRITICAL -- The most widely deployed healthcare integration engine. Essential for HL7/FHIR bridging.

---

### 6.5 DICOM

| Attribute | Details |
|-----------|---------|
| **Standard** | Digital Imaging and Communications in Medicine |
| **Use** | Medical imaging (X-ray, CT, MRI, ultrasound) |
| **Protocol** | DICOM DIMSE (C-STORE, C-FIND, C-GET, C-MOVE) + DICOMweb |

**DICOMweb (Modern REST API):**
- WADO-RS (Web Access to DICOM Objects)
- QIDO-RS (Query based on ID for DICOM Objects)
- STOW-RS (Store Over the Web)

**Open Source:**
- **DCM4CHE** -- Java DICOM toolkit
- **Orthanc** -- Lightweight DICOM server with REST API
- **pydicom** -- Python DICOM library

---

### 6.6 OpenEMR

| Attribute | Details |
|-----------|---------|
| **URL** | https://www.open-emr.org |
| **License** | GPL 3.0 |
| **Cost** | FREE |
| **Type** | Open-source electronic medical records system |

**Features:**
- HL7/FHIR API support
- Practice management
- Patient portal
- 15,000+ installations worldwide

---

### 6.7 OpenMRS

| Attribute | Details |
|-----------|---------|
| **URL** | https://openmrs.org |
| **License** | MPL 2.0 with healthcare disclaimer |
| **Cost** | FREE |
| **Type** | Open-source medical record system platform |

**Focus:** Designed for developing countries. Highly extensible via modules. FHIR module available.

---

## 7. Financial Legacy (FIX, SWIFT, ISO 20022)

### 7.1 FIX Protocol

| Attribute | Details |
|-----------|---------|
| **URL** | https://www.fixtrading.org |
| **Standard** | Financial Information eXchange |
| **Use** | Real-time electronic securities transactions |
| **Versions** | FIX 4.0 through FIX 5.0SP2/FIXT1.1, FIXLatest |
| **Markets** | Equities, fixed income, FX, derivatives |

**Message Structure:**
```
8=FIX.4.4|9=123|35=D|49=BUYER|56=SELLER|34=1|52=20240101-10:30:00|
11=ORDER123|55=AAPL|54=1|38=100|40=1|10=231|
```
- Tag=value pairs separated by SOH (ASCII 1)
- Header (version, message type, sequence), Body (order data), Trailer (checksum)

---

### 7.2 QuickFIX / QuickFIX/J / QuickFIX/Go

| Attribute | Details |
|-----------|---------|
| **URL** | https://quickfixengine.org |
| **GitHub** | https://github.com/quickfix-j/quickfixj |
| **License** | Open Source (varies by implementation) |
| **Cost** | FREE |
| **Implementations** | C++ (QuickFIX), Java (QuickFIX/J), .NET (QuickFIX/N), Go (QuickFIX/Go), Python, Ruby |

**How It Works:**
Full-featured messaging engine implementing FIX protocol. Provides:
- Session management (logon/logoff, sequence number recovery)
- Message validation
- Persistence (file, database, in-memory)
- SSL/TLS encryption

**QuickFIX vs QuickFIX/J:**
| Aspect | QuickFIX (C++) | QuickFIX/J (Java) |
|--------|---------------|-------------------|
| Language | C++ | Java |
| Performance | Lower latency (microseconds) | Higher latency (milliseconds) |
| Memory | Manual management | GC-managed |
| Use Case | High-frequency trading | Standard institutional trading |
| Deployment | Native binary | JVM |

**Integration Complexity:** Medium -- Requires FIX protocol knowledge. Configuration-driven (XML config files).

**Layer 0 Relevance:** HIGH -- The standard open-source FIX engine. Industry standard for trading system integration.

---

### 7.3 FIX Orchestra

| Attribute | Details |
|-----------|---------|
| **URL** | https://fixtrading.org/standards/orchestra/ |
| **License** | Creative Commons / Apache 2.0 (specs) |
| **Cost** | FREE |
| **Status** | Technical Standard v1.0 (2021), v1.1 RC in progress |

**How It Works:**
Machine-readable XML format for defining FIX protocol rules of engagement. Replaces PDF/Word documents exchanged between trading partners.

**Capabilities:**
- Define messages, fields, validation rules
- Specify workflows (state machines)
- Counterparty-specific customizations
- Auto-generate QuickFIX data dictionaries
- Auto-generate test cases
- Normalization of inbound FIX variants

**Example Tools:**
- **Log2Orchestra** -- Generate Orchestra from FIX message logs
- **Playlist** -- Select messages/fields to create Orchestra subset
- **Orchimate** -- Search tool for machine-readable specifications

**Layer 0 Relevance:** HIGH -- Enables "plug and play" FIX onboarding. Essential for automated trading infrastructure.

---

### 7.4 SWIFT Messaging

| Attribute | Details |
|-----------|---------|
| **URL** | https://www.swift.com |
| **Type** | Financial messaging network |
| **Messages** | MT (message types), MX (ISO 20022 XML) |
| **Use** | Interbank communication, payments, securities |

**SWIFT Message Types:**
- MT103 -- Customer Payment
- MT202 -- Financial Institution Transfer
- MT540- MT549 -- Securities Trade
- MT700 -- Documentary Credit

**SWIFT API:**
- SWIFT gpi (Global Payments Innovation) -- real-time payment tracking
- SWIFT Open API -- API access to SWIFT services
- Migration to ISO 20022 for cross-border payments (November 2025)

**Integration:** SWIFT network requires SWIFT membership. Gateways like IBM MQ or Apache Camel can bridge SWIFT messages to internal systems.

---

### 7.5 ISO 20022

| Attribute | Details |
|-----------|---------|
| **Standard** | Universal financial industry message scheme |
| **Format** | XML (MX messages) |
| **Adoption** | ECB TARGET2, Fedwire, SWIFT cross-border payments |
| **Deadline** | Full migration by November 2025 (SWIFT) |

**Key Messages:**
- pacs.008 -- FIToFICustomerCreditTransfer (payment)
- pain.001 -- CustomerCreditTransferInitiation
- camt.053 -- BankToCustomerStatement

**Integration:** Apache Camel supports ISO 20022 message transformation. Mappings between MT and MX formats available.

---

### 7.6 Apache Camel for Financial Integration

| Attribute | Details |
|-----------|---------|
| **URL** | https://camel.apache.org |
| **License** | Apache 2.0 |
| **Cost** | FREE |
| **Components** | 350+ (FIX, SWIFT, ISO 20022, REST, SOAP, Kafka, etc.) |

**How It Works:**
Lightweight integration framework implementing Enterprise Integration Patterns (EIPs). Define routes in Java, XML, or YAML DSL. Components handle protocol adaptation.

**Financial Components:**
- `fix:` -- FIX protocol (via QuickFIX/J engine)
- `swift:` -- SWIFT message processing
- `sip:` -- SIP protocol
- `rest:` / `soap:` -- Web services
- `kafka:` -- Event streaming

**Example Route (FIX to REST):**
```java
from("fix://myFixEndpoint")
    .unmarshal().fix()
    .transform().simple("{\"symbol\":\"${body.symbol}\",\"qty\":${body.qty}}")
    .to("rest://post:api/orders");
```

**Layer 0 Relevance:** CRITICAL -- The most flexible open-source integration framework. Swiss army knife for protocol bridging.

---

### 7.7 WSO2 Integration Platform

| Attribute | Details |
|-----------|---------|
| **URL** | https://wso2.com |
| **License** | Apache 2.0 |
| **Cost** | FREE (open source) / $$ (subscription) |
| **Components** | API Manager, Integrator, Identity Server |

**Key Features:**
- Full API lifecycle management
- 200+ BFSI customers
- 200+ government customers
- MCP (Model Context Protocol) server support for AI agents
- Universal gateway: REST, GraphQL, gRPC, WebSockets, MCP

**MCP Server for Legacy:**
WSO2 can generate MCP servers in front of legacy systems (SAP, AS/400, mainframe). AI agents can then call legacy functions safely without rewriting.

---

### 7.8 MuleSoft Anypoint Platform

| Attribute | Details |
|-----------|---------|
| **URL** | https://www.mulesoft.com |
| **Owner** | Salesforce |
| **License** | Proprietary |
| **Cost** | $$$$ |

**Key Features:**
- Visual integration design
- 300+ connectors (SAP, Oracle, Salesforce, etc.)
- API management
- CloudHub deployment

**vs WSO2:** MuleSoft is more polished but proprietary and expensive. WSO2 is open-source with equivalent capabilities.

---

## 8. Industrial / SCADA Legacy

### 8.1 OPC UA

| Attribute | Details |
|-----------|---------|
| **Standard** | IEC 62541 |
| **What It Is** | Open Platform Communications Unified Architecture |
| **Use** | Industrial automation interoperability |
| **Protocol** | Client-server (TCP), Pub/Sub (UDP/multicast) |
| **Security** | TLS, X.509 certificates, user tokens |

**Key Features:**
- Information modeling (objects, variables, methods)
- Discovery (find servers on network)
- Alarms & conditions
- Historical data access
- Built-in security (unlike classic OPC)

---

### 8.2 Modbus

| Attribute | Details |
|-----------|---------|
| **Standard** | Modbus Organization |
| **Variants** | Modbus RTU (serial), Modbus TCP (Ethernet), Modbus ASCII |
| **Use** | Industrial device communication (PLCs, sensors, meters) |
| **Data Model** | Coils (bits), Discrete Inputs, Holding Registers, Input Registers |

**Address Model:**
- 0xxxx -- Coils (read/write bits)
- 1xxxx -- Discrete Inputs (read-only bits)
- 3xxxx -- Input Registers (read-only words)
- 4xxxx -- Holding Registers (read/write words)

---

### 8.3 MQTT for Industrial IoT

| Attribute | Details |
|-----------|---------|
| **Standard** | ISO/IEC 20922 |
| **Protocol** | Publish-subscribe over TCP |
| **Broker** | Mosquitto, HiveMQ, EMQ X, AWS IoT Core, Azure IoT Hub |
| **QoS** | 0 (at most once), 1 (at least once), 2 (exactly once) |

**Sparkplug B:**
MQTT payload specification for industrial SCADA. Standardized topic namespace, birth certificates, metric definitions. Enables "plug and play" SCADA over MQTT.

---

### 8.4 Apache PLC4X

| Attribute | Details |
|-----------|---------|
| **URL** | https://plc4x.apache.org |
| **License** | Apache 2.0 |
| **Cost** | FREE |
| **Status** | Apache Top-Level Project |

**How It Works:**
Universal protocol adapter for PLCs. Provides a shared API across different PLC protocols. Read, write, and subscribe to PLC data without vendor-specific drivers.

**Supported Protocols:**
- Siemens S7 (Step7 and TIA)
- Beckhoff ADS
- Modbus (RTU/TCP)
- EtherNet/IP
- KNXNet/IP
- Emerson DeltaV
- Profinet (planned)
- BACnet (planned)
- OPC UA (planned)

**Integrations:**
- Apache Camel -- PLC data in Camel routes
- Apache Kafka -- Stream PLC data
- Apache IoTDB -- Time-series database
- Apache StreamPipes -- Stream processing
- Apache NiFi -- Data flow management
- Apache Hop -- Data orchestration
- Eclipse Ditto -- Digital twins

**Security -- Passive Mode Drivers:**
Guaranteed side-effect-free reads -- no risk of accidentally writing to production equipment.

**Layer 0 Relevance:** HIGH -- The best open-source solution for PLC connectivity. Essential for industrial system integration.

---

### 8.5 Node-RED for Industrial Gateway

| Attribute | Details |
|-----------|---------|
| **URL** | https://nodered.org |
| **License** | Apache 2.0 |
| **Cost** | FREE |
| **Type** | Visual flow-based programming |

**How It Works:**
Drag-and-drop nodes for data acquisition, processing, and forwarding. Deploy on industrial gateways (ARM-based), VMs, or containers.

**Industrial Protocol Nodes:**
- `node-red-contrib-modbus` -- Modbus RTU/TCP
- `node-red-contrib-opcua` -- OPC UA client/server
- Built-in MQTT nodes
- `node-red-contrib-s7` -- Siemens S7
- `node-red-contrib-ethernet-ip` -- EtherNet/IP

**Architecture Pattern:**
```
[PLCs/Sensors] --Modbus/OPC UA/S7--> [Node-RED Gateway] --MQTT--> [Cloud/Kafka]
                                              |
                                       [Edge Processing]
                                       (filtering, alerting,
                                        unit conversion)
```

**Advantages:**
- Visual programming -- controls engineers can build integrations
- Event-driven architecture
- Deploy on ARM industrial gateways
- Hundreds of community-contributed nodes
- JSON-native data transformation

**Deployment Options:**
- Industrial ARM gateway (BL110, Robustel EG5120)
- Docker container
- Kubernetes
- IBM i PASE environment

**Layer 0 Relevance:** HIGH -- The de facto standard for industrial edge computing. Bridges OT protocols to IT/cloud.

---

### 8.6 Eclipse Ditto

| Attribute | Details |
|-----------|---------|
| **URL** | https://www.eclipse.org/ditto/ |
| **License** | EPL 2.0 |
| **Cost** | FREE |
| **Type** | Digital twin framework for IoT |

**How It Works:**
Create digital twins for physical devices (PLCs, sensors, machines). Twins expose state as JSON via REST API. Changes propagate bidirectionally between physical device and digital twin.

**Integration:** Works with Apache PLC4X, Node-RED, and other IoT gateways.

---

## 9. Protocol Gateway Architecture for Layer 0

### 9.1 Architecture Overview

The Layer 0 Protocol Gateway is designed as a **multi-layered, protocol-agnostic integration fabric** that connects legacy systems to ONE OS. It follows a **hub-and-spoke model** with protocol adapters, message brokers, and API gateways.

```
                    +-------------------------------+
                    |         ONE OS Core          |
                    |  (Agent Mesh, Consensus,      |
                    |   Smart Contracts, Storage)   |
                    +-------------------------------+
                                ^
                                |
                    +-----------+-----------+
                    |   ONE OS API Layer    |
                    |  (gRPC/REST/WebSocket) |
                    +-----------------------+
                                ^
                                |
        +-----------------------+-----------------------+
        |           Layer 0 Protocol Gateway           |
        |                                               |
        |  +-----------+  +-----------+  +---------+  |
        |  |  Legacy   |  |  Message  |  |  Event  |  |
        |  |  Adapter  |  |   Queue   |  |  Store  |  |
        |  |  Layer    |  |   Layer   |  |         |  |
        |  +-----------+  +-----------+  +---------+  |
        +-----------------------+-----------------------+
                    |           |           |
        +-----------+  +--------+--------+  +----------+
        | COBOL/    |  | HL7/FHIR/      |  | OPC UA/  |
        | Mainframe |  | DICOM          |  | Modbus/  |
        | Adapter   |  | Healthcare     |  | PLC      |
        +-----------+  | Adapter        |  | Adapter  |
        | SAP       |  +----------------+  +----------+
        | Adapter   |  | FIX/SWIFT/     |  | Oracle/  |
        +-----------+  | ISO 20022      |  | DB2/     |
        | IBM i/    |  | Financial      |  | Legacy   |
        | RPG       |  | Adapter        |  | DB       |
        +-----------+  +----------------+  +----------+
```

### 9.2 Component Architecture

#### 9.2.1 Message Queue Layer (Async Communication)

| Technology | Role | Cost |
|------------|------|------|
| **Apache Kafka** | Event streaming backbone | FREE |
| **NATS** | Lightweight messaging (alternative) | FREE |
| **Apache Pulsar** | Cloud-native streaming (alternative) | FREE |

**Kafka Topics by Legacy Domain:**
```
legacy.cobol.transactions     <-- Mainframe transaction events
legacy.hl7.adt                 <-- Patient admit/discharge/transfer
legacy.hl7.oru                 <-- Lab results
legacy.fix.orders              <-- Trading orders
legacy.fix.executions          <-- Trade executions
legacy.modbus.readings         <-- Industrial sensor data
legacy.sap.sales_orders        <-- SAP order events
legacy.oracle.cdc              <-- Database change events
```

**Kafka as Event Backbone:**
- Debezium connectors stream DB changes to Kafka
- PLC4X streams industrial data to Kafka
- Mirth Connect streams HL7 to Kafka
- Camel routes bridge FIX to Kafka
- ONE OS agents consume from Kafka topics

#### 9.2.2 Protocol Adapters

| Adapter | Input Protocol | Output Format | Technology |
|---------|---------------|---------------|------------|
| **COBOL Adapter** | CICS COMMAREA, copybook | JSON/Protobuf | IBM z/OS Connect + GnuCOBOL |
| **Mainframe MQ Adapter** | IBM MQ messages | Kafka events | Kafka Connect MQ Source |
| **HL7 Adapter** | HL7 v2 (MLLP) | FHIR JSON | Mirth Connect / OIE |
| **DICOM Adapter** | DICOM DIMSE | DICOMweb JSON | Orthanc / DCM4CHE |
| **FIX Adapter** | FIX sessions | JSON/Protobuf | QuickFIX/J + Camel |
| **SWIFT Adapter** | SWIFT MT/MX | ISO 20022 XML | Camel + custom parsers |
| **Modbus Adapter** | Modbus RTU/TCP | JSON/MQTT | PLC4X + Node-RED |
| **OPC UA Adapter** | OPC UA client/server | JSON/MQTT | Node-RED + OPC UA |
| **SAP Adapter** | RFC/BAPI/IDoc | JSON/OData | PyRFC/node-rfc + Camel |
| **IBM i Adapter** | RPG/COBOL programs | JSON REST | IWS + Node.js |
| **Oracle Adapter** | PL/SQL, tables | REST/JSON | ORDS + Debezium |
| **DB2 Adapter** | SQL, VSAM, IMS | REST/JSON | Data Virtualization + z/OS Connect |

#### 9.2.3 API Gateway Pattern

| Gateway | Purpose | Cost |
|---------|---------|------|
| **WSO2 API Manager** | Open-source API lifecycle management | FREE |
| **Kong** | Cloud-native API gateway | FREE (Enterprise $) |
| **Apache APISIX** | Dynamic API gateway | FREE |
| **Tyk** | Open-source API management | FREE (Cloud $) |

**Gateway Functions:**
- Request/response transformation (legacy format -> ONE OS format)
- Authentication (legacy auth -> JWT/OAuth2)
- Rate limiting and throttling
- Protocol conversion (SOAP -> REST, HL7 -> FHIR)
- Request routing to legacy adapters
- Audit logging and monitoring

#### 9.2.4 Event Sourcing from Legacy Databases

```
+-------------------+     +------------------+     +-----------------+
|  Legacy Database  | --> | Debezium/Kafka   | --> |  Event Store    |
|  (Oracle/DB2/     |     | Connect CDC      |     |  (Kafka/        |
|   SQL Server/      |     |                  |     |   EventStoreDB) |
|   PostgreSQL)      |     | - Transaction    |     |                 |
|                    |     |   log capture    |     | - Immutable     |
| - Application      |     | - Event          |     |   event log     |
|   writes data      |     |   serialization  |     | - Replayable    |
| - Change written   |     | - Schema         |     | - Time-travel   |
|   to WAL/binlog    |     |   registry       |     |   queries       |
+-------------------+     +------------------+     +-----------------+
```

**Benefits:**
- ONE OS sees all legacy data changes as events
- No polling overhead on legacy systems
- Full audit trail
- Can rebuild read models by replaying events

#### 9.2.5 Bidirectional Sync

```
+----------------+         +-------------------+         +----------------+
|   Legacy       | <------>|  Layer 0 Sync     | <------>|   ONE OS       |
|   System       |         |  Engine           |         |   State        |
|                |         |                   |         |                |
| - COBOL/CICS   |         | - Conflict        |         | - Blockchain   |
| - DB2 tables   |         |   resolution      |         | - Smart        |
| - RPG programs |         | - Transformation  |         |   contracts    |
| - SAP BAPIs    |         | - Event routing   |         | - Agent state  |
+----------------+         +-------------------+         +----------------+
         ^                           ^                           |
         |                           |                           v
         +---------------------------+------------------> +----------------+
                                                          |   ONE OS       |
                                                          |   Agents       |
                                                          +----------------+
```

**Sync Modes:**
- **Read-only sync:** Legacy -> ONE OS (safest, recommended initial mode)
- **Event-driven sync:** Legacy publishes events, ONE OS subscribes
- **Command-driven sync:** ONE OS sends commands to legacy via adapter
- **Full bidirectional:** Two-way sync with conflict resolution

#### 9.2.6 Transformation Pipeline

| Stage | Technology | Purpose |
|-------|-----------|---------|
| **Ingestion** | Debezium / PLC4X / Mirth / QuickFIX | Read from legacy |
| **Parsing** | Custom parsers, HAPI FHIR, FIX engine | Parse legacy format |
| **Validation** | JSON Schema, Protobuf, Avro | Validate structure |
| **Transformation** | Apache Camel, JOLT, JavaScript | Convert to canonical model |
| **Enrichment** | Cache, external APIs | Add context |
| **Routing** | Kafka, NATS | Route to destination |
| **Serialization** | JSON, Protobuf, Avro | Final format |

**Canonical Data Model:**
All legacy data transforms to a unified internal model before reaching ONE OS:

```json
{
  "layer0_event": {
    "source_system": "mainframe.cics.account",
    "source_protocol": "cics_commarea",
    "source_format": "cobol_copybook",
    "timestamp": "2025-01-15T10:30:00.000Z",
    "event_type": "account.balance_updated",
    "payload": { ... },
    "metadata": {
      "legacy_tx_id": "TX123456",
      "legacy_user": "USER001",
      "source_region": "us-east"
    },
    "provenance": {
      "adapter_version": "1.2.3",
      "transform_chain": ["cobol_parser", "json_mapper", "validator"]
    }
  }
}
```

#### 9.2.7 Security Bridge

| Legacy Auth | Modern Auth | Bridge |
|-------------|-------------|--------|
| RACF/ACF2 (z/OS) | JWT/OAuth2 | z/OS Connect SAF adapter |
| SAP SSO/SAML | OpenID Connect | SAP Cloud Identity |
| DB2 user/pass | mTLS + JWT | Vault-based credential injection |
| HL7 MLLP (no auth) | OAuth2 + TLS | Mirth Connect security layer |
| FIX session auth | JWT + API keys | QuickFIX session manager |
| 3270 terminal auth | OAuth2 | OpenLegacy security adapter |

**Zero-Trust Pattern:**
- Every adapter authenticates to the gateway
- Gateway issues short-lived tokens
- mTLS between all components
- Audit all access to legacy systems
- No direct legacy access from ONE OS agents

### 9.3 Deployment Architecture

```
                    +-----------------------------+
                    |      Kubernetes Cluster     |
                    |    (Layer 0 Gateway Pods)   |
                    |                             |
                    |  +-----------------------+  |
                    |  | Adapter Pods          |  |
                    |  | - cobol-adapter       |  |
                    |  | - hl7-adapter         |  |
                    |  | - fix-adapter         |  |
                    |  | - modbus-adapter      |  |
                    |  | - sap-adapter         |  |
                    |  +-----------------------+  |
                    |  +-----------------------+  |
                    |  | Gateway Pods          |  |
                    |  | - wso2-apim           |  |
                    |  | - kafka-brokers       |  |
                    |  | - camel-routes        |  |
                    |  +-----------------------+  |
                    |  +-----------------------+  |
                    |  | ONE OS Agent Pods     |  |
                    |  | - consensus           |  |
                    |  | - smart-contracts     |  |
                    |  | - storage             |  |
                    |  +-----------------------+  |
                    +-----------------------------+
                              |
           +------------------+------------------+
           |                  |                  |
    +------+------+   +------+------+   +-------+-------+
    |  Mainframe  |   |   IBM i     |   |  Industrial   |
    |  (z/OS)     |   |  (AS/400)   |   |  PLCs/SCADA   |
    |  CICS/DB2   |   |  RPG/DB2    |   |  OPC UA/      |
    |  COBOL/MQ   |   |  COBOL      |   |  Modbus       |
    +-------------+   +-------------+   +---------------+
```

---

## 10. Case Studies of Successful Legacy Bridges

### 10.1 Estonia X-Road -- Digital State Interoperability

| Attribute | Details |
|-----------|---------|
| **Country** | Estonia |
| **Launched** | 2001 |
| **Technology** | X-Road data exchange platform |
| **License** | MIT (open source) |
| **Scale** | 929 institutions, 1,887 information systems, 3,000+ digital services |
| **Savings** | 2,589 working years saved annually |
| **Adopted By** | 20+ countries (Finland, Iceland, Ukraine, Brazil, Japan, Namibia, etc.) |

**How It Works:**
X-Road is a decentralized, secure data exchange layer. Each organization runs a Security Server that manages encryption, authentication, and logging. Central servers handle configuration and federation.

**Key Principles:**
- **Decentralized:** No central data repository -- each agency owns its data
- **Once-only:** Citizens provide data once, systems reuse it
- **Audit trail:** Every data access is logged and visible to citizens
- **Federated:** Cross-border data exchange (Estonia-Finland live since 2018)

**Security:**
- Multi-layer encryption
- Mutual TLS authentication
- Digital signatures and timestamps
- X.509 certificate-based identity

**Layer 0 Lesson:** X-Road proves that legacy government systems can be bridged securely without centralization. The federated, audit-trail-every-access model aligns perfectly with blockchain-inspired trust architectures.

---

### 10.2 India Stack -- Digital Public Infrastructure

| Attribute | Details |
|-----------|---------|
| **Country** | India |
| **Launched** | 2009 (Aadhaar), 2016 (UPI) |
| **Scale** | 1.4 billion Aadhaar enrollments, 12+ billion UPI transactions/month |
| **Components** | Aadhaar, UPI, DigiLocker, e-KYC, DBT, ABDM |

**Five Layers:**
1. **Identity Layer (Aadhaar)** -- Biometric identity for 1.4 billion
2. **Payments Layer (UPI)** -- Instant, zero-cost bank transfers
3. **Data Layer (DigiLocker, Account Aggregator)** -- Document storage, consent-based data sharing
4. **Health Layer (ABDM)** -- Electronic health records
5. **Commerce Layer (ONDC)** -- Open e-commerce protocol

**API-First Architecture:**
Every layer exposes APIs. Private companies build on top:
- Google Pay, PhonePe -- UPI apps
- 300+ banks connected via UPI
- DigiLocker -- 150 million+ users
- DBT saved $23 billion by eliminating leakage

**Legacy Bridge:**
India Stack sits on top of legacy banking systems. Banks maintain their core banking systems (many still COBOL-based) but expose APIs through UPI. The NPCI (National Payments Corporation of India) operates the switching infrastructure.

**Layer 0 Lesson:** API layers on top of legacy systems can transform entire economies. India's approach of "don't replace legacy, wrap it in APIs" is the blueprint for Layer 0.

---

### 10.3 Singapore APEX -- Government API Exchange

| Attribute | Details |
|-----------|---------|
| **Agency** | GovTech Singapore |
| **System** | APEX (API Exchange) |
| **Purpose** | Secure inter-agency data sharing |

**How It Works:**
APEX bridges systems hosted in different network zones (internet, intranet, on-premise, cloud). Agencies publish APIs to a central catalog. Other agencies discover and consume APIs with pre-configured access controls.

**Key Features:**
- Self-service API consumption (no per-request approval needed)
- API catalog for discovery and reuse
- Central security governance
- Bimodal IT support (stable core + agile innovation)
- APEX Cloud upgrade (full API lifecycle management)

**Authentication:** SingPass + MyInfo trust layers for citizen identity.

**Layer 0 Lesson:** Government API exchanges with strong identity and consent layers enable legacy modernization without replacing systems. The "API catalog + self-service" model reduces integration time dramatically.

---

### 10.4 ING Bank -- COBOL to Java Migration

| Attribute | Details |
|-----------|---------|
| **Bank** | ING Bank (top 10 European bank) |
| **Scope** | 1.5 million lines of COBOL |
| **Components** | CICS, DB2, JCL batch, MQ |
| **Target** | Java on Linux |
| **Tool** | SoftwareMining automated translation |
| **Testing** | 2 billion transactions in side-by-side testing |
| **Duration** | 18 months |
| **Status** | Live since Feb 2022 |
| **Savings** | 70% cost reduction |

**Approach:**
- ING managed translation and testing in-house
- All code and data remained within ING infrastructure
- MQ messaging allowed hybrid operation during migration
- Batch processing (JCL) converted to Unix shell scripts
- SoftwareMining libraries handled EBCDIC/packed-decimal conversions

**Key Success Factors:**
1. Exhaustive testing (2B+ transactions)
2. Parallel running during transition
3. In-house team with COBOL knowledge
4. Automated conversion preserving business logic

---

### 10.5 US Federal Bank -- Mainframe to RESTful Java

| Attribute | Details |
|-----------|---------|
| **Client** | Large US federal bank |
| **Scope** | 50+ COBOL applications |
| **Transactions** | 2 million+ core banking annually |
| **Peak Load** | 12,000 transactions/second |
| **Target** | RESTful Java on OpenShift |

**Approach:**
- Rewrite 50,000+ lines of COBOL into Java
- Build RESTful services alongside mainframe (no big-bang)
- IMS performance maintained at 12,000 TPS
- Automated testing in CI/CD pipeline
- Amazon RDS read replicas for query offloading

**Results:**
- 85% of loan processing transitioned to RESTful apps
- 80 million USD transactions/month via new APIs
- 3x performance improvement on mainframe
- API calls handle 12,000 TPS

---

### 10.6 UK Gov Verify -- Digital Identity Bridge

| Attribute | Details |
|-----------|---------|
| **System** | GOV.UK Verify |
| **Purpose** | Federated digital identity for UK government services |
| **Protocol** | SAML 2.0 |

**How It Works:**
1. User authenticates with certified identity provider
2. Verify Hub brokers the authentication
3. Government service receives verified identity attributes
4. Local matching service links verified identity to internal records

**Six-Stage Onboarding:**
1. Proposal -- determine if Verify is appropriate
2. Needs assessment -- risk assessment, data quality review
3. Planning -- milestones, approvals, communications
4. Build -- SAML integration, matching service
5. Testing -- compliance tests, end-to-end validation
6. Go-live -- beta, then production

**Legacy Bridge:** Verify doesn't replace government back-ends. It adds an identity layer. Each service maintains its own database but uses Verify for authentication. The matching service adapter provides a black-box SAML interface.

---

### 10.7 Kmart Australia -- Mainframe to AWS

| Attribute | Details |
|-----------|---------|
| **Retailer** | Kmart Australia |
| **Scope** | Mainframe merchandise system |
| **Target** | AWS |
| **Timeline** | Record time, entirely remote |
| **Savings** | $30-40 million over 5 years |

---

### 10.8 The New York Times -- Mainframe to AWS

| Attribute | Details |
|-----------|---------|
| **System** | Billing and delivery workload |
| **Target** | AWS |
| **Savings** | 70% cost reduction |
| **Benefit** | Agile development lifecycle restored |

---

### 10.9 Ukrainian Trembita (based on X-Road)

| Attribute | Details |
|-----------|---------|
| **System** | Trembita |
| **Based On** | Estonian X-Road principles |
| **Launched** | March 2021 |
| **Scale** | 80+ government registers connected |
| **Context** | Built during ongoing conflict |

---

### 10.10 Leading Cooperative Bank -- z/OS Connect API Enablement

| Attribute | Details |
|-----------|---------|
| **Tool** | IBM z/OS Connect |
| **Result** | 47% reduction in integration effort |
| **Savings** | 29 man-days per integration, 0.4 FTE per process |

---

## Appendix A: Cost Comparison Matrix

| Technology | License | Setup Cost | Annual Cost | Complexity | Best For |
|------------|---------|-----------|-------------|------------|----------|
| GnuCOBOL | GPL/LGPL | Free | Free | Medium | COBOL compilation without vendor lock-in |
| Micro Focus COBOL | Proprietary | $50K-$500K | $10K-$50K | Low | Enterprise COBOL with full support |
| IBM z/OS Connect | Proprietary | $100K+ | $50K+ | Medium | Mainframe API enablement |
| Apache Camel | Apache 2.0 | Free | Free | Medium | General protocol bridging |
| Debezium | Apache 2.0 | Free | Free | Medium | Database CDC |
| Mirth Connect / OIE | MPL 2.0 | Free | Free | Low | Healthcare HL7/FHIR |
| QuickFIX | Open Source | Free | Free | Medium | Trading FIX protocol |
| Node-RED | Apache 2.0 | Free | Free | Low | Industrial IoT/SCADA |
| Apache PLC4X | Apache 2.0 | Free | Free | Medium | PLC connectivity |
| OpenLegacy | Commercial | $50K+ | $20K+ | Medium | Mainframe/IBM i API generation |
| WSO2 | Apache 2.0 | Free | Free-$50K | Medium | API management |
| X-Road | MIT | Free | Free-$100K | High | Government interoperability |
| Kafka | Apache 2.0 | Free | Free-$50K | Medium | Event streaming backbone |

## Appendix B: Integration Complexity Ratings

| Complexity | Description | Examples |
|------------|-------------|----------|
| **Low** | Visual tools, pre-built connectors | Mirth Connect, Node-RED, ORDS |
| **Medium** | Configuration-driven, some coding | Apache Camel, z/OS Connect, Debezium |
| **High** | Custom development, deep domain knowledge | X-Road federation, FIX protocol, CICS bridging |
| **Very High** | Full migration, business logic preservation | COBOL-to-Java transpilation, mainframe replatforming |

## Appendix C: Recommended Layer 0 Technology Stack

| Layer | Recommended Technology | Rationale |
|-------|----------------------|-----------|
| **Event Streaming** | Apache Kafka | Industry standard, battle-tested |
| **CDC** | Debezium | Best open-source CDC |
| **Integration Framework** | Apache Camel | Most components, proven |
| **API Gateway** | WSO2 API Manager | Fully open-source, MCP support |
| **Healthcare** | Mirth Connect (OIE fork) | Most deployed HL7 engine |
| **Trading** | QuickFIX/J + Orchestra | Industry standard FIX |
| **Industrial** | Node-RED + PLC4X | Best OT/IT bridge |
| **Mainframe API** | z/OS Connect + OpenLegacy | Dual approach (native + AI-gen) |
| **COBOL Compilation** | GnuCOBOL | Free, open-source, portable |
| **Government Interop** | X-Road | Proven at national scale |
| **SCM/Config** | Kubernetes + Helm | Cloud-native deployment |
| **Observability** | OpenTelemetry + Prometheus | Industry standards |

---

## Appendix D: ONE OS Layer 0 Protocol Interface Specification (Draft)

```protobuf
// Layer 0 Protocol Message Envelope
message LegacyEvent {
  string event_id = 1;              // UUID v4
  string source_system = 2;         // e.g., "mainframe.cics.accounts"
  string source_protocol = 3;       // e.g., "cics_commarea", "hl7_v2", "fix_4.4"
  string event_type = 4;            // e.g., "account.balance_updated"
  google.protobuf.Timestamp timestamp = 5;
  bytes payload = 6;                // Canonical JSON or Protobuf
  map<string, string> metadata = 7; // Source-specific metadata
  map<string, string> provenance = 8; // Transformation chain
  SecurityContext security = 9;     // Auth/audit context
}

message SecurityContext {
  string legacy_user_id = 1;
  string modern_principal = 2;      // JWT subject
  string auth_method = 3;           // "racf", "sap_sso", "oauth2", etc.
  repeated string roles = 4;
  string session_id = 5;
}

// Legacy Adapter Interface
service LegacyAdapter {
  rpc IngestStream(stream LegacyEvent) returns (IngestAck);
  rpc QueryLegacy(QueryRequest) returns (QueryResponse);
  rpc ExecuteCommand(CommandRequest) returns (CommandResponse);
  rpc SubscribeEvents(SubscribeRequest) returns (stream LegacyEvent);
}

message IngestAck {
  string event_id = 1;
  Status status = 2;
  string error_message = 3;
}

enum Status {
  ACCEPTED = 0;
  REJECTED = 1;
  RETRYABLE_ERROR = 2;
  TRANSFORM_ERROR = 3;
}
```

---

## Appendix E: Security Architecture

```
+-------------------+     +------------------+     +----------------+
|   External        |     |  Layer 0         |     |   Legacy       |
|   Client / Agent  | --> |  Security        | --> |   System       |
|                   |     |  Gateway         |     |                |
| - mTLS cert       |     |                  |     | - RACF/SAP/    |
| - JWT token       |     | - AuthN/AuthZ    |     |   DB2 auth     |
| - API key         |     | - Rate limiting  |     | - Legacy       |
|                   |     | - WAF            |     |   protocols    |
|                   |     | - Audit logging  |     |                |
|                   |     | - Token vault    |     |                |
+-------------------+     +------------------+     +----------------+
         |                         |                         |
         |                         |                         |
    [OAuth2/                     [Vault]              [Legacy
     OIDC/mTLS]                                         credential
                                                        store]
```

**Security Principles:**
1. **No direct legacy access** -- all requests go through Layer 0 gateway
2. **Least privilege** -- adapters have minimal required permissions
3. **Token-based auth** -- JWT between ONE OS and Layer 0, legacy auth isolated in adapters
4. **Audit everything** -- every legacy access logged immutably
5. **mTLS everywhere** -- all inter-service communication encrypted
6. **Credential vault** -- Legacy passwords stored in HashiCorp Vault, never in config

---

*Report compiled from extensive research across vendor documentation, open-source repositories, academic papers, government reports, and industry case studies. All URLs and pricing verified as of 2025.*

*For CSOAI Layer 0 Protocol implementation -- this report provides the foundation for connecting ONE OS to the world's critical legacy infrastructure.*
