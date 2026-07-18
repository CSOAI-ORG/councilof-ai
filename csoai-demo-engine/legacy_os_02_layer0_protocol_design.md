# CSOAI Layer 0 Protocol: Legacy Bridge Architecture

## Comprehensive Specification for Bridging Legacy Systems to ONE OS

**Version:** 1.0.0
**Status:** Architecture Specification
**Classification:** Protocol Research & Design
**Date:** 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Layer 0 Legacy Bridge Architecture](#2-layer-0-legacy-bridge-architecture)
3. [Protocol Adapters -- Specific Implementations](#3-protocol-adapters)
4. [Reference Architectures & Patterns](#4-reference-architectures)
5. [Open-Source Integration Platforms](#5-open-source-integration-platforms)
6. [Specific Legacy Bridge Tools](#6-specific-legacy-bridge-tools)
7. [CSOAI Layer 0 Legacy Bridge Specification](#7-layer-0-legacy-bridge-spec)
8. [Top 10 Integration Tools](#8-top-10-integration-tools)
9. [Implementation Roadmap](#9-implementation-roadmap)

---

## 1. Executive Summary

CSOAI's Layer 0 Protocol serves as the universal interoperability layer connecting decades of legacy systems -- from COBOL mainframes and AS/400 systems to SAP ERP, healthcare HL7 interfaces, financial SWIFT networks, and industrial Modbus/OPC UA devices -- to the modern ONE OS ecosystem. This specification defines a comprehensive bridge architecture that enables seamless bi-directional communication between legacy protocols and modern API-first architectures.

### Key Design Principles

| Principle | Description |
|-----------|-------------|
| **Non-Intrusive** | Legacy systems remain unchanged; adapters bridge externally |
| **Protocol Agnostic** | Unified envelope format normalizes all legacy protocols |
| **Async-First** | Message queues decouple legacy speed from modern throughput |
| **Event-Driven** | CDC captures legacy changes as real-time event streams |
| **Secure by Default** | Modern auth (OAuth/JWT/Sigil) overlays legacy auth systems |
| **Observable** | Full telemetry on every adapter, transformation, and message flow |

### Supported Legacy Ecosystems

| Domain | Legacy Systems | Primary Protocols |
|--------|---------------|-------------------|
| **Mainframe** | IBM z/OS, Unisys, Bull | COBOL/CICS, IMS, VSAM |
| **Midrange** | IBM i/AS/400, DEC VAX | RPG, DDS, JT400 |
| **Enterprise ERP** | SAP ECC, Oracle EBS, PeopleSoft | RFC/IDoc, JDBC, Tuxedo |
| **Healthcare** | Epic, Cerner, Meditech | HL7 v2, HL7 v3, DICOM |
| **Financial** | Bloomberg, Refinitiv, SWIFT | FIX, SWIFT MT/MX, ISO 20022 |
| **Industrial** | Siemens S7, Allen-Bradley, SCADA | Modbus, OPC UA, EtherNet/IP |
| **EDI/B2B** | AS/400 EDI, Gentran, Sterling | X12, EDIFACT, TRADACOMS |
| **Messaging** | IBM MQ, TIBCO Rendezvous, MSMQ | JMS, EMS, proprietary |

---

## 2. Layer 0 Legacy Bridge Architecture

### 2.1 Architectural Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CSOAI ONE OS                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │  Unity   │  │  Nexus   │  │  Cortex  │  │   Kernel API     │   │
│  │  Layer   │  │  Layer   │  │  Layer   │  │   Gateway        │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘   │
└───────┼────────────┼────────────┼────────────────┼───────────────┘
        │            │            │                │
        ▼            ▼            ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    LAYER 0 PROTOCOL BRIDGE                           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              API Gateway Layer (Kong/Envoy)                   │  │
│  │     REST │ gRPC │ GraphQL │ WebSocket │ MQTT │ Sigil         │  │
│  └───────────────────────┬──────────────────────────────────────┘  │
│                          ▼                                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │           Message Queue Layer (Kafka/NATS)                    │  │
│  │     Unified Event Bus │ Dead Letter │ Replay │ Priority       │  │
│  └───────────────────────┬──────────────────────────────────────┘  │
│                          ▼                                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │           Transformation Layer (Camel/NiFi)                   │  │
│  │     EBCDIC↔UTF-8 │ Copybook↔JSON │ XML↔JSON │ Flat File      │  │
│  └───────────────────────┬──────────────────────────────────────┘  │
│                          ▼                                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │            Adapter Layer (Protocol-Specific)                  │  │
│  │  COBOL │ HL7 │ FIX │ SWIFT │ EDI │ Modbus │ OPC UA │ MQ │ DB │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                          ▼                                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │            Security Layer (Auth Translation)                  │  │
│  │     RACF/LDAP → OAuth │ Kerberos → JWT │ Custom → Sigil     │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       LEGACY SYSTEMS                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │ IBM z/  │ │IBM i/   │ │  SAP    │ │Healthcare│ │Financial│      │
│  │   OS    │ │ AS/400  │ │  ECC    │ │ Systems │ │ Networks│      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │  OPC    │ │ Modbus  │ │   DB2   │ │  IMS/   │ │  EDI    │      │
│  │   UA    │ │  TCP    │ │         │ │ VSAM    │ │ X12     │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Adapter Layer

The Adapter Layer provides protocol-specific connectors for each legacy system type. Each adapter implements a common interface but encapsulates protocol-specific communication logic.

```
┌─────────────────────────────────────────────────────────────────┐
│                     ADAPTER LAYER                                │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│  Mainframe   │   ERP/CRM    │  Healthcare  │  Financial         │
│  Adapters    │   Adapters   │  Adapters    │  Adapters          │
├──────────────┼──────────────┼──────────────┼────────────────────┤
│ • COBOL/CICS │ • SAP RFC    │ • HL7 v2     │ • FIX 4.x/5.0      │
│ • IMS/VSAM   │ • SAP IDoc   │ • HL7 v3     │ • FIX Orchestra    │
│ • JCL/JES    │ • Oracle EBS │ • FHIR R4    │ • SWIFT MT/MX      │
│ • CICS TS    │ • Salesforce │ • DICOM      │ • ISO 20022        │
│ • MQSeries   │ • MS Dynamics│ • IHE XDS    │ • SICOVAM          │
├──────────────┼──────────────┼──────────────┼────────────────────┤
│  Midrange    │   EDI/B2B    │  Industrial  │  Database          │
│  Adapters    │   Adapters   │  Adapters    │  Adapters          │
├──────────────┼──────────────┼──────────────┼────────────────────┤
│ • JT400      │ • X12 4010   │ • Modbus TCP │ • DB2/zOS          │
│ • RPG/CL     │ • X12 5010   │ • Modbus RTU │ • DB2/AS400        │
│ • DDS        │ • EDIFACT    │ • OPC UA     │ • IMS DB           │
│ • QShell     │ • TRADACOMS  │ • EtherNet/IP│ • VSAM/QSAM        │
│ • PASE       │ • ebXML      │ • PROFINET   │ • Adabas           │
├──────────────┼──────────────┼──────────────┼────────────────────┤
│  Messaging   │   Terminal   │  File/Stream │  Network           │
│  Adapters    │   Emulation  │  Adapters    │  Adapters          │
├──────────────┼──────────────┼──────────────┼────────────────────┤
│ • IBM MQ     │ • TN3270     │ • SFTP/FTP   │ • TCP Socket       │
│ • TIBCO EMS  │ • TN5250     │ • FTPS       │ • UDP              │
│ • Solace     │ • VT220      │ • AS2/AS3    │ • HTTP 1.0/1.1     │
│ • MSMQ       │ • IBM 3270E  │ • MQ File    │ • SOAP 1.1/1.2     │
│ • AMQP 0-9-1 │ • xterm      │ • Hadoop HDFS│ • gRPC             │
└──────────────┴──────────────┴──────────────┴────────────────────┘
```

#### Adapter Interface Contract

Every adapter implements the following standardized interface:

```python
class LegacyAdapter(ABC):
    """Base interface for all Layer 0 legacy adapters."""
    
    @abstractmethod
    async def connect(self, config: AdapterConfig) -> ConnectionHandle:
        """Establish connection to legacy system."""
        pass
    
    @abstractmethod
    async def read(self, handle: ConnectionHandle, 
                   request: LegacyRequest) -> LegacyResponse:
        """Read data from legacy system."""
        pass
    
    @abstractmethod
    async def write(self, handle: ConnectionHandle,
                    data: LegacyPayload) -> WriteResult:
        """Write data to legacy system."""
        pass
    
    @abstractmethod
    async def subscribe(self, handle: ConnectionHandle,
                        event_filter: EventFilter) -> AsyncIterator[LegacyEvent]:
        """Subscribe to legacy system events (CDC)."""
        pass
    
    @abstractmethod
    async def health_check(self, handle: ConnectionHandle) -> HealthStatus:
        """Return adapter health status."""
        pass
    
    @abstractmethod
    async def disconnect(self, handle: ConnectionHandle) -> None:
        """Gracefully disconnect from legacy system."""
        pass
```

### 2.3 Transformation Layer

The Transformation Layer handles format conversion between legacy and modern data representations.

| Transformation | Legacy Format | Modern Format | Tool/Engine |
|---------------|---------------|---------------|-------------|
| Character Encoding | EBCDIC (CP037/CP1047) | UTF-8 | iconv, custom codecs |
| Character Encoding | ASCII (various) | UTF-8 | iconv, Python codecs |
| COBOL Copybook | COBOL record layout | JSON Schema | cb2xml, LegStar |
| COBOL Copybook | COBOL record layout | XML | cb2xml, Jaxb |
| COBOL Copybook | COBOL record layout | Avro | Apache Avro + custom |
| COBOL Data | Binary COBOL record | JSON | LegStar, CB2JSON |
| HL7 Message | HL7 v2 pipe-delimited | FHIR JSON | HAPI FHIR, Mirth |
| HL7 Message | HL7 v3 XML | FHIR JSON | HAPI FHIR, XSLT |
| EDI Document | X12/EDIFACT segments | JSON | Apache Smooks, EDI parsers |
| Fixed-Width File | Positional flat file | CSV/JSON/Parquet | Apache Camel Bindy |
| SWIFT Message | MT message text | MX (ISO 20022 XML) | WSO2 CBPR+, Prowide |
| SWIFT Message | MT message text | JSON | Custom parsers |
| SAP IDoc | IDoc segments | JSON/XML | SAP JCo, pyrfc |
| XML Document | Generic XML | JSON | Jackson XML, json-lib |
| Binary Protocol | Modbus/OPC UA frames | JSON | Apache PLC4X, Eclipse Milo |
| Database Row | DB2/IMS record | JSON/Avro | Debezium, FDW |

#### Transformation Pipeline

```
Legacy Data → [Parse] → [Normalize] → [Validate] → [Enrich] → [Serialize] → Modern Data
                │           │            │           │             │
                ▼           ▼            ▼           ▼             ▼
            ANTLR      XSD/JSON     Schema      Lookup      JSON/Avro/
            Grammars   Schema       Validation  Tables      Protobuf/
                       Validation   Rules       Reference   GraphQL
                                    Engine      Data        Schema
```

### 2.4 Message Queue Layer

The Message Queue Layer provides asynchronous communication between legacy adapters and modern ONE OS services.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     KAFKA/NATS EVENT BUS                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Legacy ──► l0.cobol.inbound          l0.cobol.outbound ──► Legacy│
│   Producers   l0.hl7.inbound           l0.hl7.outbound     Consumers│
│               l0.fix.inbound           l0.fix.outbound              │
│               l0.swift.inbound         l0.swift.outbound            │
│               l0.edi.inbound           l0.edi.outbound              │
│               l0.modbus.inbound        l0.modbus.outbound           │
│               l0.opcua.inbound         l0.opcua.outbound            │
│               l0.sap.inbound           l0.sap.outbound              │
│               l0.db2.inbound           l0.db2.outbound              │
│               l0.generic.inbound       l0.generic.outbound          │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │              TOPIC NAMING CONVENTION                          │  │
│   │  l0.{protocol}.{direction}.{system-id}.{entity}              │  │
│   │  e.g., l0.hl7.inbound.epic-prod.adt-a01                     │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │               PARTITIONING STRATEGY                           │  │
│   │  • By system-id (isolation per legacy system)                │  │
│   │  • By entity (parallel processing per entity)                │  │
│   │  • By date (time-based retention and replay)                 │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │              MESSAGE ENVELOPE FORMAT                          │  │
│   │  {                                                          │  │
│   │    "metadata": {                                            │  │
│   │      "messageId": "uuid",                                   │  │
│   │      "protocol": "hl7-v2",                                  │  │
│   │      "sourceSystem": "epic-prod",                           │  │
│   │      "adapterId": "hl7-adapter-1",                          │  │
│   │      "timestamp": "2026-01-15T10:30:00Z",                   │  │
│   │      "sequence": 12345,                                     │  │
│   │      "correlationId": "uuid"                                │  │
│   │    },                                                       │  │
│   │    "payload": { ... transformed data ... },                 │  │
│   │    "legacy": {                                              │  │
│   │      "rawChecksum": "sha256:abc...",                        │  │
│   │      "rawSize": 2048,                                       │  │
│   │      "protocolVersion": "2.5",                              │  │
│   │      "sourceEndpoint": "mllp://10.0.1.5:2575"               │  │
│   │    }                                                        │  │
│   │  }                                                          │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.5 API Gateway Layer

The API Gateway Layer exposes legacy functions as modern REST/gRPC/GraphQL APIs.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    API GATEWAY LAYER                                 │
│                     (Kong / Envoy / Traefik)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │   REST API   │  │   gRPC API   │  │     GraphQL Federation   │  │
│  │              │  │              │  │                          │  │
│  │ /api/v1/cobol│  │ COBOLService │  │ type LegacyQuery {       │  │
│  │ /api/v1/hl7  │  │ HL7Service   │  │   cobol(...)             │  │
│  │ /api/v1/fix  │  │ FIXService   │  │   hl7(...)               │  │
│  │ /api/v1/swift│  │ SWIFTService │  │   fix(...)               │  │
│  │ /api/v1/edi  │  │ EDIService   │  │   swift(...)             │  │
│  │ /api/v1/sap  │  │ SAPService   │  │   sap(...)               │  │
│  │ /api/v1/db2  │  │ DB2Service   │  │   db2(...)               │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                 ROUTING TABLE                                   │ │
│  │  GET  /api/v1/cobol/accounts/{id}  →  cobol-adapter:read     │ │
│  │  POST /api/v1/cobol/transfer       →  cobol-adapter:write    │ │
│  │  GET  /api/v1/hl7/patients/{mrn}   →  hl7-adapter:fhir      │ │
│  │  POST /api/v1/hl7/adt              →  hl7-adapter:ingest    │ │
│  │  GET  /api/v1/fix/orders/{id}      →  fix-adapter:query    │ │
│  │  POST /api/v1/fix/orders           →  fix-adapter:submit   │ │
│  │  GET  /api/v1/swift/messages/{ref} →  swift-adapter:query  │ │
│  │  POST /api/v1/swift/payments       →  swift-adapter:submit │ │
│  │  GET  /api/v1/sap/customers/{id}   →  sap-adapter:bapi     │ │
│  │  POST /api/v1/sap/orders           →  sap-adapter:rfc      │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │              PROTOCOL TRANSLATION MATRIX                        │ │
│  │                                                                 │ │
│  │  REST  ←──► gRPC  via gRPC-Gateway (protoc-gen-grpc-gateway)  │ │
│  │  REST  ←──► GraphQL via Apollo Federation / Hasura             │ │
│  │  gRPC  ←──► REST via gRPC-Web / Envoy gRPC bridge             │ │
│  │  All   ←──► Kafka via Kafka REST Proxy / grpc-kafka           │ │
│  │  All   ←──► MQTT via MQTT-over-WebSocket bridge               │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.6 Event Streaming Layer (CDC)

The Event Streaming Layer captures real-time changes from legacy databases using Change Data Capture (CDC).

```
┌─────────────────────────────────────────────────────────────────────┐
│                  EVENT STREAMING LAYER (CDC)                         │
│                     (Debezium + Kafka Connect)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Legacy DB ──► Debezium Connector ──► Kafka Topic ──► ONE OS        │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Source DB   │  │  Connector   │  │      Kafka Topic          │  │
│  │              │  │              │  │                          │  │
│  │ DB2 z/OS     │──►│ DB2 CDC      │──►│ l0.db2.cdc.accounts    │  │
│  │ DB2 LUW      │──►│ DB2 CDC      │──►│ l0.db2.cdc.transactions│  │
│  │ IMS          │──►│ IMS CDC      │──►│ l0.ims.cdc.records     │  │
│  │ VSAM         │──►│ VSAM Scanner │──►│ l0.vsam.cdc.changes    │  │
│  │ Oracle       │──►│ Oracle CDC   │──►│ l0.oracle.cdc.orders   │  │
│  │ SQL Server   │──►│ SQL Server   │──►│ l0.mssql.cdc.events    │  │
│  │ PostgreSQL   │──►│ PostgreSQL   │──►│ l0.pgsql.cdc.changes   │  │
│  │ Adabas       │──►│ Adabas CDC   │──►│ l0.adabas.cdc.records  │  │
│  │ MySQL        │──►│ MySQL CDC    │──►│ l0.mysql.cdc.events    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│                                                                      │
│  CDC Modes:                                                          │
│  • Log-based  (WAL/binlog/transaction log) ← preferred               │
│  • Trigger-based (database triggers)                                 │
│  • Polling-based (timestamp/version columns)                         │
│  • VSAM-specific (file change detection + replay)                     │
│                                                                      │
│  Debezium Event Format:                                              │
│  {                                                                   │
│    "before": { ... old row data ... },                               │
│    "after":  { ... new row data ... },                               │
│    "source": { "version": "2.0", "connector": "db2", ... },          │
│    "op": "c|u|d|r",   (create/update/delete/read)                   │
│    "ts_ms": 1705312800000                                           │
│  }                                                                    │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.7 Security Layer

The Security Layer translates between legacy authentication systems and modern identity protocols.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYER                                    │
│         (Legacy Auth ←──→ Modern Auth Translation)                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Legacy Auth System          Translation Layer      Modern Auth      │
│  ┌──────────────────┐       ┌──────────────┐       ┌─────────────┐  │
│  │ IBM RACF/ACF2    │──────►│ RACF Adapter │──────►│ OAuth 2.0   │  │
│  │ IBM i Profiles   │──────►│ i5/OS Auth   │──────►│ + JWT       │  │
│  │ SAP User Mgmt    │──────►│ SAP UME      │──────►│ + Sigil     │  │
│  │ LDAP/AD          │──────►│ LDAP Adapter │──────►│ + SAML      │  │
│  │ Kerberos/SPNEGO  │──────►│ KRB Adapter  │──────►│ + OIDC      │  │
│  │ X.509 (Mainframe)│──────►│ X.509 Bridge │──────►│ + mTLS      │  │
│  │ Custom/Proprietary│──────►│ Custom Plugin│──────►│ + WebAuthn  │  │
│  └──────────────────┘       └──────────────┘       └─────────────┘  │
│                                                                      │
│  Auth Flow:                                                          │
│                                                                      │
│  1. User authenticates via modern method (OAuth/JWT/Sigil)          │
│  2. Security Layer maps identity to legacy credential               │
│  3. Adapter uses legacy credential to authenticate to target        │
│  4. Legacy credential stored in HashiCorp Vault (encrypted)        │
│  5. Session token bridges both worlds for request duration          │
│                                                                      │
│  Credential Management:                                              │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              HASHICORP VAULT (Secret Store)                  │    │
│  │                                                              │    │
│  │  Path: l0/adapters/{adapter-id}/credentials                  │    │
│  │  ┌───────────────────────────────────────────────────────┐   │    │
│  │  │ {                                                     │   │    │
│  │  │   "username": "legacy_user",                          │   │    │
│  │  │   "password": "<encrypted>",                          │   │    │
│  │  │   "certificate": "<encrypted PEM>",                   │   │    │
│  │  │   "api_key": "<encrypted>",                           │   │    │
│  │  │   "mapped_identity": "oauth_sub_claim",               │   │    │
│  │  │   "rotation_policy": "90d",                           │   │    │
│  │  │   "last_rotated": "2026-01-01T00:00:00Z"             │   │    │
│  │  │ }                                                     │   │    │
│  │  └───────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Protocol Adapters -- Specific Implementations

### 3.1 COBOL → REST Adapter

**Purpose:** Expose COBOL/CICS programs as REST APIs

| Component | Technology |
|-----------|-----------|
| COBOL Compiler | GnuCOBOL (free, open source) |
| CICS Integration | CICS Web Services (JSON/SOAP) |
| JSON Parsing | COBOL JSON PARSE / GENERATE |
| REST Framework | z/OS Connect EE or custom Go proxy |
| Copybook Parsing | cb2xml, LegStar cobol-binding |
| Containerization | Docker + GnuCOBOL runtime |

**Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│              COBOL → REST ADAPTER                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Option A: GnuCOBOL + Go Proxy (Recommended for ONE OS)     │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────────┐  │
│  │  REST    │───►│  Go/     │───►│  GnuCOBOL           │  │
│  │  Client  │◄───│  Python  │◄───│  (compiled .so)     │  │
│  │          │    │  Proxy   │    │  via CGO/ctypes     │  │
│  └──────────┘    └──────────┘    └──────────────────────┘  │
│                                                              │
│  Option B: IBM z/OS Connect EE                              │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │  REST    │───►│ z/OS Connect │───►│ CICS TS          │  │
│  │  Client  │◄───│ EE Gateway   │◄───│ (JSON←→COBOL)    │  │
│  │          │    │              │    │ auto-transform   │  │
│  └──────────┘    └──────────────┘    └──────────────────┘  │
│                                                              │
│  Option C: CICS JSON Web Services                           │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │  HTTP    │───►│ CICS JSON    │───►│ COBOL Program    │  │
│  │  Client  │◄───│ Web Service  │◄───│ (WEB API)        │  │
│  │          │    │ (WSBind)     │    │                  │  │
│  └──────────┘    └──────────────┘    └──────────────────┘  │
│                                                              │
│  Copybook → JSON Schema Pipeline:                            │
│  COBOL Copybook → cb2xml → XML → XSD/JSON Schema Generator │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Implementation Details:**

```
GnuCOBOL Compilation:
  cobc -x -free -O2 -o program source.cob      # standalone
  cobc -m -free -O2 -o module.so source.cob    # shared library

Go CGO Integration:
  // #cgo LDFLAGS: -lcob -L/path/to/gnucobol/lib
  // #include <libcob.h>
  import "C"
  
  func CallCOBOL(input string) string {
      C.cob_init(C.int(0), nil)
      // call COBOL module via C function pointer
      result := C.call_cobol_module(C.CString(input))
      return C.GoString(result)
  }

Data Conversion Pipeline:
  COBOL Binary Record (EBCDIC/ASCII)
    → Parse with Copybook Schema
    → Convert COMP-3/COMP fields to numeric
    → Handle REDEFINES and OCCURS
    → Map to JSON with field names from copybook
    → Return UTF-8 JSON response
```

**Open Source Tools:**
| Tool | Purpose | License |
|------|---------|---------|
| GnuCOBOL | Open source COBOL compiler | GPL/LGPL |
| cb2xml | COBOL copybook to XML converter | LGPL |
| LegStar | COBOL binding framework | LGPL |
| driver8 | Go COBOL REST bridge | Commercial |
| JRecord | Java COBOL file reader | Apache 2.0 |

---

### 3.2 HL7 v2 → FHIR Adapter

**Purpose:** Convert HL7 v2 messages to FHIR R4 resources

| Component | Technology |
|-----------|-----------|
| HL7 v2 Parser | HAPI HL7 v2 (Java), hl7apy (Python), Mirth (JavaScript) |
| FHIR Server | HAPI FHIR JPA Server, Smile CDR |
| Message Router | Mirth Connect (NextGen Connect) |
| Validation | FHIR Validator, HL7v2 Conformance Profile |
| MLLP Transport | HAPI MLLP, custom TCP |

**Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│              HL7 v2 → FHIR ADAPTER                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Legacy System ──► MLLP/TCP ──► Adapter ──► FHIR REST       │
│                                                              │
│  ┌────────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│  │ HL7 v2     │──►│ Mirth    │──►│ FHIR     │──►│ HAPI FHIR │ │
│  │ Feed       │  │ Connect  │  │ Mapper   │  │ Server    │ │
│  │ (ADT, ORM, │  │ Channel  │  │ (JS/Java)│  │ (R4)      │ │
│  │  ORU, etc.)│  │          │  │          │  │           │ │
│  └────────────┘  └──────────┘  └──────────┘  └───────────┘ │
│                                                              │
│  Mapping Examples:                                           │
│  • ADT^A01/A04 → Patient + Encounter                        │
│  • ADT^A03 → Encounter (discharge) + Patient                │
│  • ORM^O01 → ServiceRequest + Patient + Encounter           │
│  • ORU^R01 → DiagnosticReport + Observation(s) + Patient    │
│  • SIU^S12 → Appointment + Patient + Encounter              │
│  • MDM^T01 → DocumentReference + Composition                │
│                                                              │
│  Mirth Connect Transformer (JavaScript):                     │
│  ```javascript                                               │
│  var pid = msg['PID'];                                       │
│  var patient = {                                             │
│    resourceType: 'Patient',                                  │
│    id: pid['PID.3']['PID.3.1'].toString(),                   │
│    name: [{                                                   │
│      family: pid['PID.5']['PID.5.1'].toString(),             │
│      given: [pid['PID.5']['PID.5.2'].toString()]             │
│    }],                                                       │
│    gender: mapGender(pid['PID.8'].toString()),               │
│    birthDate: formatDate(pid['PID.7']['PID.7.1'].toString()) │
│  };                                                          │
│  channelMap.put('fhirPatient', JSON.stringify(patient));     │
│  ```                                                         │
└─────────────────────────────────────────────────────────────┘
```

**HL7 v2 → FHIR Mapping Reference:**

| HL7 v2 Message | FHIR R4 Resources | Key Segments |
|----------------|-------------------|-------------|
| ADT^A01 (Admit) | Patient, Encounter | PID, PV1, NK1, IN1 |
| ADT^A03 (Discharge) | Encounter (completed) | PID, PV1 |
| ADT^A08 (Update) | Patient, Encounter | PID, PV1 |
| ORM^O01 (Order) | ServiceRequest, Patient | PID, OBR, OBX |
| ORU^R01 (Result) | DiagnosticReport, Observation | PID, OBR, OBX |
| MDM^T01 (Document) | DocumentReference, Composition | PID, TXA, OBX |
| SIU^S12 (Schedule) | Appointment, Patient | PID, SCH, AIS |
| PPR^PC1 (Problem) | Condition, Patient | PID, PRB |
| VXU^V04 (Vaccination) | Immunization, Patient | PID, RXA |

---

### 3.3 FIX → REST Adapter

**Purpose:** Bridge Financial Information eXchange protocol to REST APIs

| Component | Technology |
|-----------|-----------|
| FIX Engine | QuickFIX/C++, QuickFIX/J, QuickFIX/Go |
| Message Parser | QuickFIX DataDictionary |
| Orchestration | FIX Orchestra (machine-readable rules) |
| REST Gateway | Custom Go/Java adapter |
| Database | PostgreSQL (message store), Redis (cache) |

**Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│              FIX → REST ADAPTER                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  FIX Counterparty ←──► QuickFIX Engine ←──► REST API        │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ FIX 4.2/4.4/ │  │ QuickFIX/    │  │ REST Gateway     │  │
│  │ 5.0 SP2      │──►│ C++ or J or  │──►│ (Go/Java/Node)   │  │
│  │              │◄──│ Go           │◄──│                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                              │
│  QuickFIX Application Interface:                             │
│  ```python (QuickFIX/Python)                                 │
│  class FIXApplication(fix.Application):                      │
│      def onCreate(self, sessionID): pass                     │
│      def onLogon(self, sessionID):                           │
│          print(f"Session {sessionID} logged on")             │
│      def onLogout(self, sessionID): pass                     │
│      def toAdmin(self, message, sessionID): pass             │
│      def toApp(self, message, sessionID): pass               │
│      def fromAdmin(self, message, sessionID): pass           │
│      def fromApp(self, message, sessionID):                  │
│          # Convert FIX to REST                               │
│          msgType = fix.MsgType()                             │
│          message.getHeader().getField(msgType)               │
│          if msgType.getValue() == fix.MsgType_ExecutionReport:│
│              rest_payload = self.fix_to_rest(message)        │
│              self.rest_client.post('/executions',            │
│                                     rest_payload)            │
│  ```                                                         │
│                                                              │
│  FIX → JSON Mapping:                                         │
│  ExecutionReport (MsgType=8):                                │
│    {                                                         │
│      "messageType": "ExecutionReport",                       │
│      "orderID": "123456",                                    │
│      "clOrdID": "ABC789",                                    │
│      "execID": "EXEC001",                                    │
│      "execType": "F",  // Fill                              │
│      "ordStatus": "2", // Filled                            │
│      "symbol": "AAPL",                                       │
│      "side": "1",  // Buy                                   │
│      "leavesQty": 0,                                         │
│      "cumQty": 100,                                          │
│      "avgPx": 150.25                                         │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
```

---

### 3.4 SWIFT MT → MX (ISO 20022) Adapter

**Purpose:** Convert SWIFT MT messages to ISO 20022 MX format

| Component | Technology |
|-----------|-----------|
| MT Parser | Prowide SWIFT SDK, WSO2 CBPR+ |
| MX Generator | WSO2 MT-MX Translator, custom XSLT |
| CBPR+ Rules | WSO2 Reference Implementation |
| Validation | SWIFT Alliance, Schema validation |

**Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│         SWIFT MT → MX (ISO 20022) ADAPTER                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  SWIFT MT103 ──► Parse ──► Transform ──► MX pacs.008        │
│  SWIFT MT202 ──► Parse ──► Transform ──► MX pacs.009        │
│  SWIFT MT950 ──► Parse ──► Transform ──► MX camt.053        │
│                                                              │
│  WSO2 CBPR+ Reference Implementation:                       │
│  github.com/wso2/reference-implementation-cbpr               │
│                                                              │
│  Features:                                                   │
│  • Bi-directional MT↔MX translation                          │
│  • CBPR+ compliance                                          │
│  • Real-time dashboard (OpenSearch)                          │
│  • Structured JSON logging                                   │
│  • Comprehensive error handling                              │
│  • Extensible architecture with RESTful APIs                 │
│                                                              │
│  MT → MX Message Mapping:                                    │
│  ┌─────────────┬──────────────────────────┐                 │
│  │ MT Message  │ ISO 20022 Message        │                 │
│  ├─────────────┼──────────────────────────┤                 │
│  │ MT103       │ pacs.008 (CT)            │                 │
│  │ MT103+      │ pacs.008 (Remittance)    │                 │
│  │ MT202       │ pacs.009 (COV)           │                 │
│  │ MT202COV    │ pacs.009 (Cover)         │                 │
│  │ MT540-543   │ securities.01x (settle)  │                 │
│  │ MT544-548   │ securities.02x (confirm) │                 │
│  │ MT900/910   │ camt.05x (debit/credit)  │                 │
│  │ MT940/950   │ camt.053 (stmt)          │                 │
│  │ MTn92       │ camt.05x (cancellation)  │                 │
│  └─────────────┴──────────────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

---

### 3.5 EDI X12 → JSON Adapter

**Purpose:** Convert ANSI X12 EDI documents to JSON

| Component | Technology |
|-----------|-----------|
| EDI Parser | edi-json-converter (Python), Apache Smooks |
| Schema Validation | X12 Implementation Guides (5010, 4010) |
| Transaction Sets | 837 (Health), 850 (PO), 810 (Invoice), 856 (ASN) |
| Ack Generation | TA1/997 Functional Acknowledgment |

**Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│              EDI X12 → JSON ADAPTER                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  EDI File ──► Parse ──► Validate ──► Transform ──► JSON     │
│                                                              │
│  edi-json-converter (Python):                                │
│  ```python                                                   │
│  from edi_parser import EdiParser                              │
│  from edi_schema_models import ImplementationGuideSchema       │
│                                                              │
│  schema = load_schema('src/schemas/837.5010.X222.A1.json')   │
│  parser = EdiParser(edi_string=edi_content, schema=schema)   │
│  result = parser.parse()                                     │
│  json_output = result.model_dump_json(indent=2)              │
│  ```                                                         │
│                                                              │
│  Performance: 30,000+ segments/second                        │
│  Supports: TA1 acknowledgment generation, schema validation  │
│                                                              │
│  Common X12 Transaction Sets:                                │
│  ┌─────────────┬──────────────────────────────────────┐     │
│  │ Transaction │ Purpose                              │     │
│  ├─────────────┼──────────────────────────────────────┤     │
│  │ 837 (P/I/D) │ Healthcare Claim (Professional/      │     │
│  │             │ Institutional/Dental)                │     │
│  │ 835         │ Healthcare Payment/Remittance        │     │
│  │ 834         │ Benefit Enrollment/Maintenance       │     │
│  │ 820         │ Payment Order/Remittance Advice      │     │
│  │ 850         │ Purchase Order                       │     │
│  │ 855         │ Purchase Order Acknowledgment        │     │
│  │ 856         │ Advance Ship Notice                  │     │
│  │ 810         │ Invoice                              │     │
│  │ 204         │ Motor Carrier Shipment Info          │     │
│  │ 214         │ Transportation Carrier Shipment      │     │
│  │ 990         │ Response to Load Tender              │     │
│  │ 997         │ Functional Acknowledgment            │     │
│  │ 999         │ Implementation Acknowledgment        │     │
│  └─────────────┴──────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

### 3.6 Modbus/OPC UA → MQTT Adapter

**Purpose:** Bridge industrial protocols to IoT messaging

| Component | Technology |
|-----------|-----------|
| Modbus Client | PyModbus (Python), Apache PLC4X (Java) |
| OPC UA Client | Eclipse Milo (Java), python-opcua, open62541 (C) |
| MQTT Broker | Eclipse Mosquitto, EMQ X, HiveMQ |
| Industrial Gateway | Apache PLC4X, Node-RED |

**Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│         Modbus/OPC UA → MQTT ADAPTER                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  PLCs ──► PLC4X/PyModbus ──► MQTT ──► Kafka ──► ONE OS      │
│                                                              │
│  Apache PLC4X Integration:                                   │
│  • Unified API for all industrial protocols                  │
│  • Java/Go/C/Python language bindings                        │
│  • Passive-mode drivers (read-only, no side effects)         │
│  • Integrations: Kafka, NiFi, Camel, StreamPipes, IoTDB     │
│                                                              │
│  PyModbus (Python) - TCP Client:                             │
│  ```python                                                   │
│  from pymodbus.client import ModbusTcpClient                  │
│  client = ModbusTcpClient('192.168.1.100', port=502)         │
│  client.connect()                                            │
│  result = client.read_holding_registers(100, 2, slave=1)     │
│  print(result.registers)  # [value1, value2]                 │
│  client.close()                                              │
│  ```                                                         │
│                                                              │
│  OPC UA Client (Python):                                     │
│  ```python                                                   │
│  from opcua import Client                                    │
│  client = Client("opc.tcp://localhost:4840/")                │
│  client.connect()                                            │
│  temp = client.get_node("ns=2;i=2")                          │
│  print(temp.get_value())  # Read temperature                 │
│  client.disconnect()                                         │
│  ```                                                         │
│                                                              │
│  MQTT Topic Convention:                                      │
│  l0/plc/{line}/{cell}/{device}/{tag}                         │
│  e.g., l0/plc/line1/robot1/siemens-s7/temperature           │
│                                                              │
│  Protocol Support Matrix:                                    │
│  ┌────────────────┬──────────────┬──────────────────┐       │
│  │ Protocol       │ PLC4X Status │ Python Support   │       │
│  ├────────────────┼──────────────┼──────────────────┤       │
│  │ Siemens S7     │ Stable (Java)│ python-snap7     │       │
│  │ Modbus TCP     │ Stable       │ PyModbus         │       │
│  │ Modbus RTU     │ Stable       │ PyModbus         │       │
│  │ EtherNet/IP    │ Stable       │ cpppo            │       │
│  │ Beckhoff ADS   │ Stable       │ pyads            │       │
│  │ OPC UA         │ In Progress  │ python-opcua     │       │
│  │ PROFINET       │ Planned      │ Limited          │       │
│  │ BACnet         │ Planned      │ BAC0             │       │
│  │ Emerson DeltaV │ In Progress  │ Limited          │       │
│  └────────────────┴──────────────┴──────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

### 3.7 IBM MQ → Kafka Adapter

**Purpose:** Bridge IBM MQ message queues to Apache Kafka

| Component | Technology |
|-----------|-----------|
| Source Connector | Kafka Connect IBM MQ Source Connector (IBM open source) |
| Sink Connector | Kafka Connect IBM MQ Sink Connector |
| MQ Client | IBM MQ Client (com.ibm.mq.allclient) |
| Kafka Connect | Apache Kafka Connect framework |

**Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│              IBM MQ → KAFKA ADAPTER                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  IBM MQ Queue ──► MQ Source Connector ──► Kafka Topic       │
│                                                              │
│  github.com/ibm-messaging/kafka-connect-mq-source            │
│  github.com/ibm-messaging/kafka-connect-mq-sink              │
│                                                              │
│  Connector Configuration:                                    │
│  ```json                                                     │
│  {                                                           │
│    "name": "mq-source",                                      │
│    "config": {                                               │
│      "connector.class":                                       │
│        "com.ibm.eventstreams.connect.mqsource.MQSourceConnector",│
│      "tasks.max": "1",                                       │
│      "topic": "l0.mq.inbound.orders",                        │
│      "mq.queue.manager": "QM1",                              │
│      "mq.connection.name.list": "mqhost(1414)",              │
│      "mq.channel.name": "MYSVRCONN",                         │
│      "mq.queue": "ORDER.QUEUE",                              │
│      "mq.user.name": "${file:/secrets:username}",            │
│      "mq.password": "${file:/secrets:password}",             │
│      "key.converter": "org.apache.kafka.connect.storage.StringConverter", │
│      "value.converter": "org.apache.kafka.connect.json.JsonConverter"    │
│    }                                                         │
│  }                                                           │
│  ```                                                         │
│                                                              │
│  Record Builders:                                            │
│  • DefaultRecordBuilder - pass through as byte[]/String      │
│  • JsonRecordBuilder - parse JSON, infer schema              │
│  • XmlRecordBuilder - parse XML with XSD validation          │
│                                                              │
│  Deployment Modes:                                           │
│  • Standalone - single process, development                  │
│  • Distributed - multi-worker cluster, production            │
│  • Kubernetes (Strimzi) - containerized with operators       │
│  • OpenShift (KafkaConnector CRD) - cloud-native             │
│                                                              │
│  Exactly-Once Delivery:                                      │
│  Available with Kafka 3.3.0+ and MQ Source Connector 2.0+   │
│  Uses Kafka transactions for end-to-end exactly-once         │
└─────────────────────────────────────────────────────────────┘
```

---

### 3.8 DB2 → PostgreSQL Adapter

**Purpose:** Enable data access and replication between DB2 and PostgreSQL

| Component | Technology |
|-----------|-----------|
| Foreign Data Wrapper | db2_fdw (PostgreSQL extension) |
| CDC Replication | Debezium DB2 CDC Connector |
| Schema Migration | AWS Schema Conversion Tool (SCT), pgloader |
| SQL Translation | Babelfish (for T-SQL), custom translator |

**Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│              DB2 → POSTGRESQL ADAPTER                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Option 1: Foreign Data Wrapper (real-time query)            │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ PostgreSQL  │───►│  db2_fdw    │───►│ DB2 z/OS or │     │
│  │ (with FDW)  │◄───│  extension  │◄───│    LUW      │     │
│  │             │    │             │    │             │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                              │
│  Setup:                                                      │
│  CREATE EXTENSION db2_fdw;                                   │
│  CREATE SERVER db2_prod FOREIGN DATA WRAPPER db2_fdw         │
│    OPTIONS (dbname 'PRODDB', host 'db2host', port '50000'); │
│  CREATE USER MAPPING FOR current_user                        │
│    SERVER db2_prod OPTIONS (user 'db2user', password '***');│
│  IMPORT FOREIGN SCHEMA "DB2USER" FROM SERVER db2_prod       │
│    INTO db2_schema;                                          │
│                                                              │
│  Option 2: CDC Replication (event streaming)                 │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────┐     │
│  │ DB2 (WAL/   │───►│ Debezium     │───►│ Kafka Topic │     │
│  │  CDC tables)│    │ DB2 Connector│    │             │     │
│  └─────────────┘    └──────────────┘    └─────────────┘     │
│                                                              │
│  DB2 CDC Setup:                                              │
│  • Enable DB2 DATA CAPTURE CHANGES on tables                │
│  • Create ASN CDC capture/apply schemas                      │
│  • Configure Debezium connector for DB2 ASN                 │
│                                                              │
│  Option 3: Batch ETL (initial load + periodic sync)          │
│  • pgloader: DB2 → PostgreSQL bulk load                     │
│  • AWS DMS: Continuous replication with S3 staging          │
│  • Custom ETL: Apache Spark with JDBC connectors             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### 3.9 SAP RFC → REST Adapter

**Purpose:** Expose SAP RFC/BAPI functions as REST APIs

> **Note:** SAP's open-source RFC connectors (PyRFC, node-rfc) were archived in 2024 due to lack of maintainers. C/C++ NW RFC SDK remains the official supported path.

| Component | Technology |
|-----------|-----------|
| RFC Client | SAP NW RFC SDK (C/C++) + custom bindings |
| BAPI Wrapper | Custom Go/Java adapter over RFC SDK |
| OData Alternative | SAP Gateway OData services (if available) |
| IDoc Processing | SAP Java Connector (JCo) - still maintained |

**Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│              SAP RFC → REST ADAPTER                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Option A: SAP NW RFC SDK (C) + Go Wrapper (Recommended)    │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  REST    │  │  Go Adapter  │  │  SAP NW RFC SDK (C)  │  │
│  │  Client  │──►│  (CGO)       │──►│  + libsapnwrfc.so    │  │
│  │          │◄──│              │◄──│                      │  │
│  └──────────┘  └──────────────┘  └──────────────────────┘  │
│                                                              │
│  Option B: SAP Java Connector (JCo) - Still Maintained      │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  REST    │  │  Java Spring │  │  SAP JCo (com.sap.   │  │
│  │  Client  │──►│  Boot API    │──►│  conn.jco)           │  │
│  │          │◄──│              │◄──│                      │  │
│  └──────────┘  └──────────────┘  └──────────────────────┘  │
│                                                              │
│  Option C: OData via SAP Gateway (Modern Path)              │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  REST/   │  │  SAP         │  │  SAP Gateway         │  │
│  │  OData   │──►│  BTP/        │──►│  (OData Producer)    │  │
│  │  Client  │◄──│  Integration │◄──│                      │  │
│  └──────────┘  └──────────────┘  └──────────────────────┘  │
│                                                              │
│  RFC Connection Parameters:                                  │
│  {                                                           │
│    "ashost": "10.0.0.1",      // Application Server         │
│    "sysnr": "00",              // System Number             │
│    "client": "100",            // Client (Mandant)          │
│    "user": "RFC_USER",                                        │
│    "passwd": "***",                                           │
│    "lang": "EN"                                               │
│  }                                                           │
│                                                              │
│  Common BAPIs to Expose:                                     │
│  • BAPI_USER_GETLIST (User management)                       │
│  • BAPI_MATERIAL_GETLIST (Material master)                   │
│  • BAPI_CUSTOMER_GETLIST (Customer master)                   │
│  • BAPI_SALESORDER_GETLIST (Sales orders)                    │
│  • BAPI_PURCHASEORDER_GETLIST (POs)                          │
│  • BAPI_ACC_DOCUMENT_POST (Financial posting)                │
│  • RFC_READ_TABLE (Generic table read)                       │
│  • RFC_GET_FUNCTION_INTERFACE (Metadata discovery)           │
│                                                              │
│  ⚠️ Deprecation Notice:                                       │
│  SAP PyRFC and node-rfc are archived. Use C SDK directly     │
│  or SAP JCo (Java) which remains maintained.                 │
│  Community efforts may revive Python bindings.               │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Reference Architectures & Patterns

### 4.1 Strangler Fig Pattern

**Purpose:** Gradually replace legacy systems without big-bang rewrites

The Strangler Fig Pattern (coined by Martin Fowler) provides an incremental migration strategy where a new system is built around an existing legacy application, gradually replacing functionality while keeping the old system running.

```
Phase 1: Introduce Facade
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────►│  Facade  │────►│  Legacy  │
│  Apps    │     │ (Router) │     │  System  │
└──────────┘     └──────────┘     └──────────┘

Phase 2: Extract First Capability
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────►│  Facade  │─Yes─►│  New     │
│  Apps    │     │ (Router) │      │  Service │
└──────────┘     │          │─No──►│  Legacy  │
                 └──────────┘      │  System  │
                                    └──────────┘

Phase 3: Incremental Migration
┌──────────┐     ┌──────────┐     ┌─────────────────────┐
│  Client  │────►│  Facade  │────►│  New Services (60%) │
│  Apps    │     │ (Router) │     │  Legacy (40%)       │
└──────────┘     └──────────┘     └─────────────────────┘

Phase 4: Legacy Decommissioned
┌──────────┐                      ┌─────────────────────┐
│  Client  │─────────────────────►│  New System (100%)  │
│  Apps    │                      │                     │
└──────────┘                      └─────────────────────┘
```

**Key Practices:**
- Start with read-only operations (lowest risk)
- Use shadow mode (run both systems, compare outputs)
- Feature flags for gradual traffic shifting (1% → 10% → 50% → 100%)
- Database-first or application-first migration strategies
- Anti-Corruption Layer protects new system from legacy semantics

---

### 4.2 Anti-Corruption Layer (ACL) Pattern

**Purpose:** Prevent legacy technical debt from leaking into new codebase

The Anti-Corruption Layer is a DDD pattern that acts as a translator between legacy and modern systems, isolating the new domain model from legacy data structures and semantics.

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   Legacy System    │    Anti-Corruption Layer   │   New      │
│                    │                            │   System   │
│  ┌────────────┐   │   ┌──────────────────┐    │  ┌──────┐  │
│  │ Legacy     │───┼──►│ Legacy Adapter   │    │  │      │  │
│  │ Database   │   │   │ (understands     │    │  │Clean │  │
│  │ (messy     │◄──┼───│ legacy schema)   │    │  │Domain│  │
│  │  schema)   │   │   └────────┬─────────┘    │  │Model │  │
│  └────────────┘   │            │               │  │      │  │
│                    │   ┌────────▼─────────┐    │  └──────┘  │
│                    │   │ Translator       │    │            │
│  ┌────────────┐   │   │ (maps legacy     │    │            │
│  │ Legacy     │───┼──►│  to new model)   │    │            │
│  │ API        │   │   └────────┬─────────┘    │            │
│  │ (obscure   │◄──┼───│        │               │            │
│  │  naming)   │   │   ┌────────▼─────────┐    │            │
│  └────────────┘   │   │ New API Facade   │    │            │
│                    │   │ (clean REST/     │───┼──►          │
│                    │   │  gRPC interface) │    │             │
│                    │   └──────────────────┘    │             │
└──────────────────────────────────────────────────────────────┘
```

**ACL Components:**
| Component | Responsibility |
|-----------|---------------|
| Legacy Adapter | Understands legacy protocol (COBOL copybook, HL7 segment, etc.) |
| Translator | Maps legacy data model to new domain model |
| Validator | Ensures data integrity across boundary |
| Facade | Presents clean API to new system |
| Event Publisher | Emits domain events for significant changes |

---

### 4.3 API Gateway Pattern

**Purpose:** Unified access point to heterogeneous legacy systems

```
┌──────────────────────────────────────────────────────────────┐
│                    API GATEWAY                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│   │         │  │  Rate   │  │  Auth/  │  │  Route  │      │
│   │ Request │──►│  Limit  │──►│  AuthZ  │──►│  Match  │      │
│   │         │  │         │  │  (JWT)  │  │         │      │
│   └─────────┘  └─────────┘  └─────────┘  └────┬────┘      │
│                                                │            │
│                    ┌───────────────────────────┼────────┐   │
│                    │                           │        │   │
│                    ▼                           ▼        ▼   │
│              ┌──────────┐              ┌──────────┐ ┌─────┐│
│              │  REST    │              │  gRPC    │ │Graph││
│              │  Routes  │              │  Routes  │ │QL   ││
│              └────┬─────┘              └────┬─────┘ └─────┘│
│                   │                         │               │
│         ┌─────────┼─────────┐              │               │
│         ▼         ▼         ▼              ▼               │
│      ┌──────┐ ┌──────┐ ┌──────┐      ┌──────────┐        │
│      │COBOL │ │ HL7  │ │ SAP  │      │ Internal │        │
│      │ Svc  │ │ Svc  │ │ Svc  │      │ gRPC Svcs│        │
│      └──────┘ └──────┘ └──────┘      └──────────┘        │
│                                                              │
│   Features:                                                  │
│   • Request/Response Transformation                          │
│   • Protocol Translation (REST↔gRPC↔GraphQL)                 │
│   • Circuit Breaker (prevent cascade failures)               │
│   • Load Balancing (across adapter instances)                │
│   • Caching (reduce legacy load)                             │
│   • Request Aggregation (combine multiple legacy calls)      │
│   • Observability (distributed tracing)                      │
└──────────────────────────────────────────────────────────────┘
```

---

### 4.4 Event Sourcing Pattern

**Purpose:** Capture legacy changes as immutable event streams

Event Sourcing treats every change to application state as an event that is appended to an immutable log. Combined with CQRS, it enables powerful legacy integration patterns.

```
Legacy System Changes → Event Log → Projections → Read Models
                              │
                              ▼
                    ┌─────────────────┐
                    │  Event Store    │
                    │  (Kafka/        │
                    │   EventStoreDB) │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Material │  │ Material │  │ Material │
        │ View 1   │  │ View 2   │  │ View N   │
        │ (Search) │  │ (Analytics)│  │ (API)   │
        └──────────┘  └──────────┘  └──────────┘

For Legacy Integration:
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  Legacy DB ──► CDC (Debezium) ──► Event Bus ──► ONE OS     │
│                                                              │
│  This approach:                                              │
│  • Captures complete audit trail                            │
│  • Enables time-travel queries                              │
│  • Decouples read/write models                              │
│  • Supports multiple read-optimized projections             │
│  • Allows replay for recovery/reprocessing                  │
│                                                              │
│  Event Types from Legacy:                                    │
│  • Row inserted → EntityCreatedEvent                       │
│  • Row updated  → EntityUpdatedEvent (before + after)      │
│  • Row deleted  → EntityDeletedEvent                       │
│  • Batch job    → BatchCompletedEvent                      │
│  • File arrived → FileReceivedEvent                        │
└─────────────────────────────────────────────────────────────┘
```

---

### 4.5 CQRS Pattern (with Legacy)

**Purpose:** Separate read and write models to optimize legacy performance

```
┌──────────────────────────────────────────────────────────────┐
│                    CQRS WITH LEGACY                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│        Write Path (Commands)                                 │
│        ─────────────────────                                 │
│                                                              │
│   Client ──► API Gateway ──► Command Handler ──► Legacy DB  │
│                                  │                           │
│                                  ▼                           │
│                            Event Bus ──► Read Model Update   │
│                                                              │
│        Read Path (Queries)                                   │
│        ──────────────────                                    │
│                                                              │
│   Client ──► API Gateway ──► Query Handler ──► Read Model   │
│                                                              │
│   Read Models (optimized per use case):                      │
│   • Elasticsearch (full-text search)                         │
│   • Redis (hot cache, key lookups)                           │
│   • ClickHouse/Apache Druid (analytics)                      │
│   • PostgreSQL (relational queries)                          │
│   • Neo4j (graph queries)                                    │
│                                                              │
│   Benefits for Legacy Systems:                               │
│   • Legacy DB only handles writes (reduced load)             │
│   • Read queries served from modern data stores              │
│   • Read models can be denormalized for performance          │
│   • Multiple read models for different access patterns       │
│   • Legacy DB can be replaced independently                  │
└──────────────────────────────────────────────────────────────┘
```

---

### 4.6 Saga Pattern (Distributed Transactions)

**Purpose:** Coordinate transactions across legacy and modern systems

```
┌──────────────────────────────────────────────────────────────┐
│              SAGA PATTERN WITH LEGACY                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Order Saga Example:                                         │
│                                                              │
│  1. Receive Order ──► 2. Reserve Inventory                  │
│         │                    │                                │
│         │                    ▼                                │
│         │              ┌──────────┐                           │
│         │              │ Legacy   │◄── 3a. SUCCESS           │
│         │              │ Inventory│    ──► 4. Process Payment │
│         │              │ System   │                           │
│         │              └──────────┘◄── 3b. FAIL               │
│         │                      │     ──► 3b'. Compensate      │
│         │                      │          (release reserve)   │
│         │                      ▼                               │
│         │              ┌──────────┐                           │
│         └─────────────►│ Saga     │                           │
│              5. Notify │ Coordinator                           │
│                        │ (Orchestrator)                        │
│                        └──────────┘                           │
│                                                              │
│  Saga Coordination Modes:                                    │
│  • Orchestration - Central coordinator manages steps         │
│  • Choreography - Each service emits events, others react    │
│                                                              │
│  Compensation Actions (for legacy systems):                  │
│  • Reverse the transaction (if legacy supports it)           │
│  • Create compensating entry (offsetting transaction)        │
│  • Manual intervention queue (human workflow)                │
│  • Scheduled reconciliation job                              │
│                                                              │
│  Implementation:                                             │
│  • Apache Camel Saga (with LRA - Long Running Actions)       │
│  • Netflix Conductor (workflow orchestration)                │
│  • Temporal (durable execution platform)                     │
│  • Custom saga coordinator with Kafka                        │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Open-Source Integration Platforms

### 5.1 Apache Camel

**The Swiss Army Knife of Integration**

| Attribute | Detail |
|-----------|--------|
| **Components** | 300+ (Kafka, REST, SOAP, FTP, MQ, HL7, etc.) |
| **Patterns** | 65+ Enterprise Integration Patterns (EIP) |
| **Runtime** | Standalone, Spring Boot, Quarkus, Karaf |
| **Language** | Java, Kotlin, XML DSL, YAML DSL |
| **Legacy Support** | Excellent - FTP, SFTP, File, JMS, JDBC, COBOL (via Bindy) |
| **License** | Apache 2.0 |

**Why for ONE OS:** Camel is the backbone of the Transformation Layer. Its extensive component library means almost any legacy protocol has a pre-built connector. The Enterprise Integration Patterns (from Hohpe & Woolf) provide battle-tested solutions for routing, transformation, splitting, aggregation, and error handling.

```java
// Example: Camel route for HL7 to FHIR
from("mllp:0.0.0.0:2575")
    .unmarshal().hl7()
    .convertBodyTo(FHIRBundle.class)
    .to("fhir://create/resource?serverUrl=http://hapi-fhir:8080")
    .to("kafka:l0.hl7.outbound.fhir");
```

---

### 5.2 Apache NiFi

**Data Flow Automation from the NSA**

| Attribute | Detail |
|-----------|--------|
| **Origin** | Developed by NSA, donated to Apache in 2014 |
| **Processors** | 350+ built-in processors |
| **UI** | Web-based drag-and-drop flow designer |
| **Provenance** | Complete data lineage tracking |
| **Security** | SSL, Kerberos, LDAP, multi-tenant |
| **Legacy Support** | Excellent - built-in support for many legacy formats |
| **License** | Apache 2.0 |

**Why for ONE OS:** NiFi excels at visual data flow programming. Its provenance tracking (a feature from its NSA origins) provides complete audit trails of every data movement - critical for regulated industries. The 350+ processors cover FTP, SFTP, Kafka, REST, JDBC, and custom scripting.

---

### 5.3 Airbyte

**Modern ETL/ELT for the Cloud Era**

| Attribute | Detail |
|-----------|--------|
| **Connectors** | 600+ pre-built connectors |
| **Paradigm** | ELT-first (Extract → Load → Transform) |
| **CDK** | Python Connector Development Kit |
| **Deployment** | Docker, Kubernetes, Airbyte Cloud |
| **CDC** | Log-based CDC for PostgreSQL, MySQL |
| **License** | MIT (core), Elastic 2.0 (some connectors) |

**Why for ONE OS:** Airbyte provides the modern data integration backbone. Its 600+ connectors cover most systems, and the Python CDK makes building custom connectors straightforward. The ELT paradigm leverages modern data warehouse compute for transformations.

---

### 5.4 Node-RED

**Visual Flow Programming for IoT and Protocols**

| Attribute | Detail |
|-----------|--------|
| **Runtime** | Node.js |
| **Paradigm** | Visual flow-based programming (drag-and-drop) |
| **Nodes** | 4,000+ community-contributed nodes |
| **Protocols** | MQTT, HTTP, WebSocket, Modbus, OPC UA, TCP, UDP |
| **Industrial** | Native Modbus, OPC UA, S7, MQTT support |
| **License** | Apache 2.0 |

**Why for ONE OS:** Node-RED is ideal for protocol bridging and IoT integration. Its visual programming model makes it accessible to engineers who aren't traditional developers. The industrial protocol nodes (Modbus, OPC UA, S7) make it perfect for shop floor integration.

---

### 5.5 WSO2 Enterprise Integrator

**Fully Open Source ESB**

| Attribute | Detail |
|-----------|--------|
| **Connectors** | 160+ production-ready connectors |
| **Protocols** | REST, SOAP, GraphQL, gRPC, WebSockets, JMS |
| **ESB Model** | Centralized ESB + Micro-Integrator (lightweight) |
| **Ballerina** | Native programming language for integration |
| **AI Features** | AI-assisted development, auto-mapping, test generation |
| **License** | Apache 2.0 (fully open, no restrictions) |

**Why for ONE OS:** WSO2 provides a complete ESB experience with zero licensing fees. Its SWIFT MT-MX translator (CBPR+ reference implementation) is specifically valuable for financial integrations. The Ballerina language is purpose-built for network-aware programming.

---

### 5.6 Talend Open Studio

**Data Integration with Visual Design**

| Attribute | Detail |
|-----------|--------|
| **Components** | 900+ connectors and components |
| **Paradigm** | Visual job designer (Eclipse-based) |
| **Big Data** | Hadoop, Spark, Spark Streaming |
| **Cloud** | AWS, Azure, GCP native connectors |
| **License** | GPL (open source), Commercial (enterprise) |

---

### 5.7 Pentaho Data Integration (Kettle)

**Powerful Open Source ETL**

| Attribute | Detail |
|-----------|--------|
| **Designer** | Spoon (visual job/transformation designer) |
| **Engine** | Kitchen (jobs), Pan (transformations) |
| **Steps** | 200+ transformation steps |
| **Repository** | File-based or database repository |
| **License** | Apache 2.0 (community) |

---

## 6. Specific Legacy Bridge Tools

### 6.1 IBM i/AS/400 Toolkit

| Tool | Language | Purpose |
|------|----------|---------|
| **JTOpen (JT400)** | Java | IBM Toolbox for Java - comprehensive AS/400 API |
| **Python-IToolkit** | Python | Direct IBM i program calls |
| **DB2 Connect** | Various | DB2 connectivity driver |
| **TN5250** | C | Terminal emulation |

```java
// JTOpen Example
AS400 as400 = new AS400("system-name", "user", "password");
ProgramCall pgm = new ProgramCall(as400);
ProgramParameter[] parmList = new ProgramParameter[2];
parmList[0] = new ProgramParameter(10);  // output
parmList[1] = new ProgramParameter(new AS400Text(10).toBytes("INPUT"));
pgm.setProgram("/QSYS.LIB/MYLIB.LIB/MYPGM.PGM", parmList);
if (pgm.run()) {
    String output = (String)new AS400Text(10).toObject(parmList[0].getOutputData());
}
```

### 6.2 SAP RFC Toolkit

| Tool | Language | Status | Purpose |
|------|----------|--------|---------|
| **SAP NW RFC SDK** | C/C++ | Active (SAP) | Official SDK - all language bindings use this |
| **SAP JCo** | Java | Active (SAP) | Java connector, still maintained |
| **PyRFC** | Python | Archived (2024) | Python bindings (seeking maintainers) |
| **node-rfc** | Node.js | Archived (2024) | Node.js bindings (no longer supported) |

### 6.3 Industrial Protocol Toolkit

| Tool | Language | Protocol | Purpose |
|------|----------|----------|---------|
| **PyModbus** | Python | Modbus TCP/RTU/ASCII | Most feature-rich Modbus library |
| **python-snap7** | Python | Siemens S7 | Pure Python S7 protocol (v3.0+) |
| **Apache PLC4X** | Java/Go/C/Python | Multi-protocol | Universal PLC adapter |
| **python-opcua** | Python | OPC UA | OPC UA client/server |
| **Eclipse Milo** | Java | OPC UA | Industrial-grade OPC UA |
| **open62541** | C | OPC UA | Open source OPC UA stack |

### 6.4 Authentication Toolkit

| Tool | Language | Protocol | Purpose |
|------|----------|----------|---------|
| **requests-kerberos** | Python | Kerberos/SPNEGO | HTTP Kerberos auth |
| **requests-ntlm** | Python | NTLM | HTTP NTLM auth (legacy) |
| **ldap3** | Python | LDAP v3 | LDAP directory integration |
| **python-gssapi** | Python | GSSAPI | Generic security services |
| **pyspnego** | Python | SPNEGO | Cross-platform negotiate auth |

### 6.5 Terminal Emulation

| Tool | Type | Protocol | Purpose |
|------|------|----------|---------|
| **TN5250** | Terminal | TN5250 | IBM i terminal emulation |
| **x3270/s3270** | Terminal | TN3270 | IBM z/OS terminal emulation |
| **c3270** | Terminal | TN3270E | Extended 3270 with file transfer |
| **Jagacy** | Java Library | TN3270/TN5250 | Programmatic terminal access |

---

## 7. CSOAI Layer 0 Legacy Bridge Specification

### 7.1 Adapter Registration

Each legacy system registers an adapter with the Layer 0 Protocol Bridge:

```yaml
# Adapter Registration Manifest
apiVersion: l0.cso.ai/v1
kind: LegacyAdapter
metadata:
  name: ibm-zos-cics-adapter
  namespace: production
  labels:
    protocol: cobol-cics
    system-type: mainframe
    environment: production
    criticality: tier-1
spec:
  adapterType: cobol-cics
  version: "1.0.0"
  
  # Connection configuration
  connection:
    host: zos-prod.company.com
    port: 1433
    protocol: tcp
    secure: true
    timeout: 30000
    
  # Authentication
  auth:
    type: racf
    vaultPath: l0/adapters/ibm-zos/credentials
    
  # Transformation rules
  transformation:
    copybookPath: /config/copybooks/ACCOUNT.cpy
    encoding: EBCDIC-CP037
    outputFormat: JSON
    schemaRegistry: http://schema-registry:8081
    
  # Message routing
  routing:
    inboundTopic: l0.cobol.inbound.ibmzos
    outboundTopic: l0.cobol.outbound.ibmzos
    dlqTopic: l0.cobol.dlq.ibmzos
    
  # Performance tuning
  performance:
    connectionPool:
      min: 5
      max: 50
      maxIdleTime: 300
    batchSize: 100
    readTimeout: 30000
    writeTimeout: 60000
    
  # Health and monitoring
  health:
    checkInterval: 30
    failureThreshold: 3
    successThreshold: 2
    
  # Retry configuration
  retry:
    maxAttempts: 5
    backoffType: exponential
    initialDelay: 1000
    maxDelay: 30000
    multiplier: 2.0
    
  # Resource limits
  resources:
    cpu: "2"
    memory: "4Gi"
    storage: "10Gi"
    
  # Scaling
  scaling:
    minReplicas: 2
    maxReplicas: 20
    targetCPUUtilization: 70
    targetMemoryUtilization: 80
```

### 7.2 Unified Message Envelope

All messages flowing through Layer 0 use a standardized envelope:

```json
{
  "$schema": "https://cso.ai/schemas/l0-message/v1",
  "metadata": {
    "messageId": "550e8400-e29b-41d4-a716-446655440000",
    "protocol": "hl7-v2",
    "protocolVersion": "2.5.1",
    "sourceSystem": "epic-prod-east",
    "sourceEndpoint": "mllp://10.0.1.15:2575",
    "adapterId": "hl7-adapter-prod-3",
    "adapterVersion": "1.2.0",
    "timestamp": "2026-01-15T10:30:00.000Z",
    "timezone": "America/New_York",
    "sequence": 12345,
    "correlationId": "660e8400-e29b-41d4-a716-446655440001",
    "parentMessageId": null,
    "priority": 5,
    "ttl": 300000
  },
  "payload": {
    "format": "fhir-r4",
    "schemaVersion": "4.0.1",
    "resourceType": "Bundle",
    "entry": [...]
  },
  "legacy": {
    "rawChecksum": "sha256:a3f5c8d2e1b4...",
    "rawSize": 2048,
    "rawEncoding": "ASCII",
    "sourceFormat": "hl7-v2-pipe",
    "messageType": "ADT^A01",
    "controlId": "MSG12345",
    "processingId": "P",
    "versionId": "2.5.1",
    "receivingApplication": "ONE_OS",
    "receivingFacility": "CSOAI",
    "sendingApplication": "EPIC",
    "sendingFacility": "HOSPITAL_EAST"
  },
  "security": {
    "classification": "PHI",
    "encryptionAtRest": true,
    "encryptionInTransit": true,
    "dataSubject": "patient-12345",
    "consentReference": "consent-abc-789",
    "retentionPolicy": "7-years"
  },
  "processing": {
    "transformations": [
      {
        "type": "encoding-conversion",
        "from": "ASCII",
        "to": "UTF-8",
        "timestamp": "2026-01-15T10:30:00.050Z"
      },
      {
        "type": "protocol-conversion",
        "from": "hl7-v2",
        "to": "fhir-r4",
        "transformer": "mirth-channel-adt",
        "timestamp": "2026-01-15T10:30:00.100Z"
      },
      {
        "type": "validation",
        "validator": "fhir-r4-validator",
        "result": "passed",
        "timestamp": "2026-01-15T10:30:00.150Z"
      }
    ],
    "routingHistory": [
      {
        "hop": 1,
        "component": "hl7-mllp-listener",
        "timestamp": "2026-01-15T10:30:00.000Z"
      },
      {
        "hop": 2,
        "component": "hl7-transformer",
        "timestamp": "2026-01-15T10:30:00.100Z"
      },
      {
        "hop": 3,
        "component": "kafka-publisher",
        "timestamp": "2026-01-15T10:30:00.200Z"
      }
    ]
  }
}
```

### 7.3 Error Handling

Legacy systems fail differently than modern systems. Layer 0 defines a comprehensive error taxonomy:

```
Error Categories:
┌───────────────────┬──────────────────────────────────────────────┐
│ Category          │ Description                                  │
├───────────────────┼──────────────────────────────────────────────┤
│ CONNECTION_ERROR  │ Cannot establish connection to legacy system │
│ TIMEOUT_ERROR     │ Legacy system did not respond in time        │
│ AUTH_ERROR        │ Authentication/authorization failed          │
│ PROTOCOL_ERROR    │ Invalid message format or protocol violation │
│ TRANSFORM_ERROR   │ Data transformation failed                   │
│ BUSINESS_ERROR    │ Legacy system rejected the business request  │
│ RESOURCE_ERROR    │ Legacy system resource exhausted             │
│ SYSTEM_ERROR      │ Internal legacy system error                 │
│ MAINTENANCE_ERROR │ Legacy system in maintenance window          │
└───────────────────┴──────────────────────────────────────────────┘

Error Response Format:
{
  "error": {
    "code": "L0-COBOL-CONNECTION-TIMEOUT",
    "category": "TIMEOUT_ERROR",
    "severity": "WARNING",
    "message": "Connection to CICS region PROD1 timed out after 30s",
    "legacyError": {
      "rawCode": "EIBRCODE_1234",
      "rawMessage": "DFHAC2206 TRANSACTION ABC1 TIMED OUT",
      "systemId": "CICS-PROD1",
      "terminalId": "T00123",
      "taskId": "0004567"
    },
    "context": {
      "adapterId": "cobol-adapter-prod-2",
      "connectionId": "conn-uuid-789",
      "attemptNumber": 3,
      "maxAttempts": 5,
      "elapsedTime": 30123
    },
    "recommendedAction": "RETRY_WITH_BACKOFF",
    "nextRetryAt": "2026-01-15T10:31:30.000Z"
  }
}
```

### 7.4 Retry Logic

Legacy systems require more forgiving retry policies:

```yaml
retryPolicies:
  # Aggressive retry for read-only operations
  readOperation:
    maxAttempts: 5
    backoffType: exponential
    initialDelay: 100ms
    maxDelay: 30s
    multiplier: 2.0
    retryableErrors:
      - CONNECTION_ERROR
      - TIMEOUT_ERROR
      - RESOURCE_ERROR
    
  # Conservative retry for write operations
  writeOperation:
    maxAttempts: 3
    backoffType: fixed
    initialDelay: 5s
    maxDelay: 60s
    multiplier: 1.0
    retryableErrors:
      - CONNECTION_ERROR
      - TIMEOUT_ERROR
    nonRetryableErrors:
      - BUSINESS_ERROR
      - AUTH_ERROR
      
  # Batch operations
  batchOperation:
    maxAttempts: 10
    backoffType: exponential_with_jitter
    initialDelay: 1s
    maxDelay: 5m
    multiplier: 2.0
    jitter: 0.3
    partialFailureHandling: SPLIT_AND_RETRY_FAILED
    
  # Maintenance window awareness
  maintenanceAware:
    checkMaintenanceWindow: true
    maintenanceRetryDelay: 5m
    maxMaintenanceRetries: 100
```

### 7.5 Monitoring and Health Checks

```yaml
healthCheckSpecification:
  adapterHealth:
    interval: 30s
    timeout: 10s
    failureThreshold: 3
    successThreshold: 1
    
    checks:
      - name: connection
        type: tcp_connect
        endpoint: "${spec.connection.host}:${spec.connection.port}"
        
      - name: authentication
        type: credential_validation
        vaultPath: "${spec.auth.vaultPath}"
        
      - name: roundtrip
        type: synthetic_transaction
        testMessage: "${spec.health.testMessage}"
        expectedResponse: "${spec.health.expectedResponse}"
        
      - name: throughput
        type: performance
        minMessagesPerMinute: 100
        maxLatencyP99: 5000ms
        
      - name: error_rate
        type: error_rate
        maxErrorRate: 5.0
        window: 5m
        
  metrics:
    - name: l0_messages_total
      type: counter
      labels: [protocol, direction, status]
      
    - name: l0_message_latency
      type: histogram
      labels: [protocol, operation]
      buckets: [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000]
      
    - name: l0_adapter_connections_active
      type: gauge
      labels: [adapter_id]
      
    - name: l0_adapter_errors_total
      type: counter
      labels: [adapter_id, error_category]
      
    - name: l0_transformation_duration
      type: histogram
      labels: [from_format, to_format]
      
    - name: l0_legacy_response_time
      type: histogram
      labels: [system_id, operation]
```

### 7.6 Security Specification

```yaml
securitySpecification:
  credentialManagement:
    store: hashicorp-vault
    path: l0/adapters/{adapter-id}/credentials
    rotation:
      enabled: true
      interval: 90d
      notificationBefore: 7d
      automatic: false  # manual approval required
      
  authentication:
    modernToLegacy:
      - modernMethod: oauth2
        legacyMethod: racf
        mapping: oauth.subject → racf.userid
        
      - modernMethod: jwt
        legacyMethod: ldap
        mapping: jwt.preferred_username → ldap.uid
        
      - modernMethod: sigil
        legacyMethod: kerberos
        mapping: sigil.principal → kerberos.principal
        
  authorization:
    rbac:
      roles:
        - name: l0-reader
          permissions: [read, subscribe]
        - name: l0-writer
          permissions: [read, write, subscribe]
        - name: l0-admin
          permissions: [read, write, subscribe, manage]
          
  encryption:
    inTransit:
      minimumTLS: "1.2"
      preferredTLS: "1.3"
      cipherSuites:
        - TLS_AES_256_GCM_SHA384
        - TLS_CHACHA20_POLY1305_SHA256
        
    atRest:
      algorithm: AES-256-GCM
      keyRotation: 365d
      
  audit:
    logAllAccess: true
    retention: 7years
    immutable: true
    fields:
      - timestamp
      - principal
      - action
      - resource
      - result
      - legacySystem
      - messageId
```

### 7.7 Performance Specification

```yaml
performanceSpecification:
  latency:
    targets:
      - percentile: P50
        target: 100ms
      - percentile: P95
        target: 500ms
      - percentile: P99
        target: 2000ms
        
  throughput:
    byProtocol:
      cobol-cics: 100 tps
      hl7-v2: 500 msg/s
      fix: 10000 msg/s
      swift: 50 msg/s
      edi: 200 doc/s
      modbus: 1000 reads/s
      opcua: 500 subscriptions
      ibm-mq: 10000 msg/s
      db2: 500 queries/s
      sap-rfc: 50 calls/s
      
  connectionPooling:
    defaults:
      minIdle: 5
      maxActive: 50
      maxWait: 30000
      testOnBorrow: true
      testWhileIdle: true
      validationInterval: 30000
      
  caching:
    strategy: multi-tier
    tiers:
      - name: l1-hot
        type: caffeine
        ttl: 60s
        maxSize: 10000
      - name: l2-warm
        type: redis
        ttl: 3600s
        maxSize: 1000000
      - name: l3-reference
        type: postgresql
        ttl: 86400s
        
    cacheableOperations:
      - pattern: "*/reference-data/*"
        ttl: 1h
      - pattern: "*/customers/*"
        ttl: 5m
      - pattern: "*/accounts/balance"
        ttl: 30s
```

---

## 8. Top 10 Integration Tools for ONE OS

### Ranked by Criticality

| Rank | Tool | Category | Purpose | License |
|------|------|----------|---------|---------|
| **1** | **Apache Camel** | Integration Framework | Universal protocol adapter & transformation engine | Apache 2.0 |
| **2** | **Apache Kafka** | Message Queue | Event streaming backbone, async communication | Apache 2.0 |
| **3** | **Debezium** | CDC Platform | Real-time change data capture from legacy DBs | Apache 2.0 |
| **4** | **Apache NiFi** | Data Flow | Visual data flow automation with provenance | Apache 2.0 |
| **5** | **Mirth Connect** | Healthcare ESB | HL7 v2↔FHIR transformation & routing | MPL |
| **6** | **QuickFIX** | Financial Protocol | FIX protocol engine for trading systems | QuickFIX License |
| **7** | **Apache PLC4X** | Industrial Protocol | Universal PLC adapter (Modbus, S7, OPC UA) | Apache 2.0 |
| **8** | **WSO2 EI** | ESB Platform | Full ESB with SWIFT MT-MX translator | Apache 2.0 |
| **9** | **HashiCorp Vault** | Secret Management | Secure credential storage for legacy systems | MPL |
| **10** | **Node-RED** | IoT Integration | Visual protocol bridging for industrial | Apache 2.0 |

### Honorable Mentions

| Tool | Category | Purpose | License |
|------|----------|---------|---------|
| Airbyte | ETL/ELT | Modern data integration | MIT/Elastic |
| GnuCOBOL | COBOL Compiler | Open source COBOL compilation | GPL/LGPL |
| HAPI FHIR | Healthcare | FHIR server & validation framework | Apache 2.0 |
| db2_fdw | Database FDW | PostgreSQL to DB2 foreign data wrapper | Open Source |
| Kafka Connect MQ Source | MQ Connector | IBM MQ to Kafka bridge | Apache 2.0 |
| python-snap7 | PLC Protocol | Pure Python Siemens S7 | MIT |
| PyModbus | PLC Protocol | Python Modbus client/server | BSD |
| python-opcua | OPC Protocol | Python OPC UA client | LGPL |
| JTOpen | IBM i Toolkit | Java AS/400 API library | IBM OSS |
| ldap3 | Directory | Python LDAP v3 client | LGPL |
| edi-json-converter | EDI Parser | X12 EDI to JSON conversion | Open Source |
| Kong | API Gateway | API management & routing | Apache 2.0 |

---

## 9. Implementation Roadmap

### Phase 1: Foundation (Months 1-3)
- [ ] Deploy Kafka/NATS event bus infrastructure
- [ ] Implement adapter framework (Go/Java base)
- [ ] Deploy HashiCorp Vault for credential management
- [ ] Build API Gateway (Kong/Envoy) with Sigil auth
- [ ] Implement monitoring (Prometheus/Grafana)
- [ ] Deploy 3-5 highest-priority adapters

### Phase 2: Core Protocols (Months 4-6)
- [ ] COBOL/CICS adapter with GnuCOBOL integration
- [ ] HL7 v2→FHIR adapter with Mirth Connect
- [ ] SAP RFC adapter (C SDK + Go wrapper)
- [ ] IBM MQ→Kafka connector
- [ ] DB2 FDW deployment
- [ ] EDI X12→JSON adapter

### Phase 3: Industrial & Financial (Months 7-9)
- [ ] Modbus TCP/RTU adapter (PyModbus)
- [ ] OPC UA adapter (Eclipse Milo)
- [ ] Siemens S7 adapter (python-snap7)
- [ ] FIX adapter (QuickFIX)
- [ ] SWIFT MT→MX adapter (WSO2 CBPR+)
- [ ] Apache PLC4X integration

### Phase 4: Advanced Patterns (Months 10-12)
- [ ] Debezium CDC for all database adapters
- [ ] CQRS read model implementation
- [ ] Saga coordinator for distributed transactions
- [ ] Strangler Fig tooling
- [ ] Anti-Corruption Layer templates
- [ ] Performance optimization & load testing

---

## Appendix A: Protocol Comparison Matrix

| Protocol | Speed | Complexity | Open Source Tools | Maturity | ONE OS Priority |
|----------|-------|-----------|-------------------|----------|-----------------|
| COBOL/CICS | Medium | High | GnuCOBOL, cb2xml | High | Critical |
| HL7 v2 | Medium | Medium | Mirth, HAPI | High | Critical |
| FIX | Very High | Medium | QuickFIX | High | High |
| SWIFT MT/MX | Medium | Very High | WSO2 CBPR+ | High | High |
| EDI X12 | Low | Medium | edi-json-converter | High | Medium |
| Modbus | High | Low | PyModbus, PLC4X | High | High |
| OPC UA | Medium | High | Milo, open62541 | Medium | High |
| IBM MQ | Very High | Medium | Kafka Connect | High | Critical |
| DB2 | Medium | Medium | db2_fdw, Debezium | High | Critical |
| SAP RFC | Medium | High | NW RFC SDK | High | Critical |
| LDAP | Medium | Low | ldap3 | High | Medium |
| TN3270/5250 | Low | Medium | x3270, TN5250 | High | Low |

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **ACL** | Anti-Corruption Layer - DDD pattern that isolates new system from legacy semantics |
| **BAPI** | Business Application Programming Interface - SAP's RFC-enabled business functions |
| **CDC** | Change Data Capture - real-time tracking of database changes |
| **CICS** | Customer Information Control System - IBM mainframe transaction server |
| **Copybook** | COBOL data structure definition file |
| **CQRS** | Command Query Responsibility Segregation - separates read and write models |
| **EBCDIC** | Extended Binary Coded Decimal Interchange Code - IBM character encoding |
| **EIP** | Enterprise Integration Patterns - standard design vocabulary for integration |
| **FDW** | Foreign Data Wrapper - PostgreSQL extension for external data access |
| **FHIR** | Fast Healthcare Interoperability Resources - modern healthcare API standard |
| **FIX** | Financial Information eXchange - trading protocol |
| **HL7** | Health Level 7 - healthcare messaging standard |
| **IDoc** | Intermediate Document - SAP's data exchange format |
| **MLLP** | Minimal Lower Layer Protocol - TCP framing for HL7 v2 |
| **RFC** | Remote Function Call - SAP's inter-system communication protocol |
| **WAL** | Write-Ahead Log - database transaction log used by CDC |

---

*This specification is a living document. As legacy systems evolve and new integration patterns emerge, Layer 0 Protocol adapts to maintain the bridge between past and future.*

**Document Version:** 1.0.0
**Last Updated:** 2026
**Maintained by:** CSOAI Protocol Engineering
