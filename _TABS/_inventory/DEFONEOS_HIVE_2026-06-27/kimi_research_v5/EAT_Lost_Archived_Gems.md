# EAT Lost, Archived & Forgotten Open-Source Gems

> **A catalog of 50+ under-appreciated open-source projects** that are incredibly valuable but buried, abandoned, or forgotten. These are the gems everyone else missed.
>
> Curated for the MEOK stack and beyond.

---

## Table of Contents

1. [DARPA Programs That Went Open](#1-darpa-programs-that-went-open)
2. [Hidden Government Lab Releases](#2-hidden-government-lab-releases)
3. [Abandoned Google Research Projects](#3-abandoned-google-research-projects)
4. [Forgotten Academic Releases](#4-forgotten-academic-releases)
5. [Archived Startup Code](#5-archived-startup-code)
6. [Buried GitHub Gems](#6-buried-github-gems)
7. [Defense & Intelligence Specific Gems](#7-defense--intelligence-specific-gems)
8. [Knowledge Graph & Ontology Builders](#8-knowledge-graph--ontology-builders)
9. [Graph Databases & Analytics Engines](#9-graph-databases--analytics-engines)
10. [Autonomous Navigation & Robotics](#10-autonomous-navigation--robotics)
11. [Behavioral Biometrics & Auth](#11-behavioral-biometrics--auth)
12. [Stream Processing & Real-Time Analytics](#12-stream-processing--real-time-analytics)
13. [Electronic Warfare & SIGINT](#13-electronic-warfare--sigint)
14. [Anomaly Detection & Time Series](#14-anomaly-detection--time-series)

---

## 1. DARPA Programs That Went Open

### 1.1 DARPA BRASS / SPIRAL - Write-Once-Run-Everywhere Code Generator
- **GitHub**: https://github.com/darpa-brass/brass
- **What it does**: SPIRAL is a code generation system that produces hyper-portable, future-proof computational kernels. It demonstrated true write-once-run-everywhere capability for mission-critical code, moving polar formatting SAR imaging across CPUs and FPGAs without interruption.
- **Why it's valuable**: This is the holy grail of software portability for defense systems. New hardware can be installed post-deployment and the running software adapts dynamically. Perfect for ISR systems that need to run across different hardware generations.
- **Last commit**: 2020-03-20
- **How to revive**: Extract the SPIRAL kernel generator for your own signal processing pipelines. The delayed-evaluation interface uses BLAS, LAPACK, FFTW and C as a DSL.
- **MEOK integration**: Use SPIRAL-generated kernels in the O (orchestration) layer for signal processing workloads that need to run across heterogeneous hardware.

### 1.2 DARPA XDATA / Apache OODT - Big Data Triage for Defense
- **GitHub**: https://github.com/apache/oodt + https://github.com/darpa-xdata
- **What it does**: Apache OODT (Object Oriented Data Technology) is the information integration framework developed for DARPA XDATA. It wraps legacy analytics, connects data sources, and scales from laptop to datacenter. Combined with Apache Tika for metadata extraction and WINGS for workflow orchestration.
- **Why it's valuable**: OODT is purpose-built for the "data triage" problem - figuring out what data you have, wrapping it, and connecting it. This is exactly what ISR pipelines need when ingesting from multiple sensor types. 24 DARPA XDATA performers contributed tools.
- **Last commit**: Active at Apache but underused
- **How to revive**: Use OODT as the ingestion backbone for multi-sensor ISR pipelines. Wrap existing analytics without recoding them. Combine with Tika for automatic file type detection.
- **MEOK integration**: OODT becomes your E (extraction) layer, handling the messy work of ingesting disparate data formats from multiple intelligence sources.

### 1.3 DARPA HIVE Graph Challenge - Trillion-Edge Graph Analytics
- **GitHub**: https://graphchallenge.mit.edu/
- **What it does**: The DARPA HIVE program produced graph analytics benchmarks at billion- and trillion-edge scale. MIT Lincoln Lab and AWS host the challenge datasets and reference implementations for sub-graph isomorphism and dynamic graph clustering.
- **Why it's valuable**: These are the only freely available trillion-edge graph datasets. The sub-graph isomorphism challenge maps directly to threat network detection. The dynamic clustering challenge maps to community detection in communications networks.
- **Last commit**: Challenge ongoing
- **How to revive**: Use HIVE datasets to benchmark your graph analytics pipeline. Reference implementations exist in multiple languages.
- **MEOK integration**: Benchmark your K (knowledge) layer graph analytics against HIVE datasets to prove scale.

### 1.4 DARPA SSITH / FETT - Secure Hardware Evaluation Platform
- **GitHub**: https://github.com/GaloisInc/BESSPIN
- **What it does**: The FETT (Finding Exploits to Thwart Tampering) Bug Bounty platform evaluates hardware security architectures. It provides virtualized access to secure RISC-V processors via AWS F1 FPGA instances. 587 researchers spent 13,171 hours attacking it, finding 10 vulnerabilities.
- **Why it's valuable**: First-of-its-kind infrastructure for crowdsourced hardware security evaluation. Includes baseline RISC-V processors, automotive cyber-physical demonstrators, and medical device emulators.
- **Last commit**: ~2021 (open sourced)
- **How to revive**: Use FETT to evaluate your embedded systems' hardware security. The CloudGFE platform runs on AWS F1 - no $8,000 VCU118 needed.
- **MEOK integration**: Integrate FETT-based hardware security testing into your CI/CD pipeline for IoT/edge deployments.

### 1.5 DARPA Transparent Computing - APT Detection at Scale
- **GitHub**: https://github.com/darpa-i2o/transparent-computing
- **What it does**: Material from the DARPA Transparent Computing Program - a complete dataset and tools for detecting Advanced Persistent Threats (APTs) using Common Data Model (CDM) format. Includes ground truth, operational event logs, and data from 6 different TA1 performers (Cadets, ClearScope, FiveDirections, Marple, Theia, Trace).
- **Why it's valuable**: This is the most comprehensive open-source APT detection dataset available. 5 full engagement datasets with ground truth, Avro schemas, and Java consumers. Perfect for training ML-based threat detection.
- **Last commit**: 2020-04-29
- **How to revive**: Use the CDM schema as your data model for endpoint detection. Train anomaly detection on the 5 engagement datasets. The Java consumer code parses Avro binary files.
- **MEOK integration**: CDM becomes your standard data model for the O (orchestration) layer's security monitoring.

### 1.6 DARPA POCUS AI - AI for Point-of-Care Ultrasound
- **GitHub**: https://github.com/KitwareMedical/itkARGUS-DARPA-POCUS_AI-Archive
- **What it does**: All of Kitware's code and resources for the DARPA POCUS AI project - using AI to interpret portable ultrasound images in austere environments. Part of the itkARGUS framework.
- **Why it's valuable**: Field medical AI that works without cloud connectivity. Ultrasound interpretation for battlefield medicine. Uses ITK (Insight Toolkit) medical imaging framework.
- **Last commit**: 2021-05-12 (archived)
- **How to revive**: Fork itkARGUS and adapt the models for your medical imaging needs. The ITK pipeline is modular and extensible.
- **MEOK integration**: Deploy as a M (model) service at the edge for battlefield medical triage.

### 1.7 DARPA Memex Tools - Dark Web Search & Crawl Framework
- **GitHub**: https://github.com/darpa-i2o/memex-program-index
- **What it does**: A complete index of 40+ tools developed for the DARPA Memex program for searching the deep web and dark web. Includes: Scrapy-based crawlers (Frontera), forum spiders for Tor hidden services, image similarity (ImageSift), login automation (AutoLogin), page classifiers, record linkage (rltk), and end-to-end search systems (DIG, TellFinder).
- **Why it's valuable**: This is a complete OSINT pipeline. TellFinder was the actual system used to combat human trafficking. The DIG (Domain-Specific Insight Graphs) framework builds knowledge graphs from crawled data automatically.
- **Last commit**: 2018-2019 era tools
- **How to revive**: Use Frontera + Splash for large-scale web crawling. TellFinder pipeline for image similarity search. DIG/etk for automated knowledge extraction. rltk for record linkage across datasets.
- **MEOK integration**: Full E (extraction) pipeline - crawl → extract → link → knowledge graph. TellFinder image search becomes part of your ISR imagery analysis.

### 1.8 DARPA Cyber Grand Challenge Binaries
- **GitHub**: https://github.com/trailofbits/cb-multios
- **What it does**: The DARPA Challenge Binaries ported to Linux, macOS, and Windows. Custom programs designed to contain vulnerabilities representing a wide variety of crashing software flaws. Each CB comes with functionality tests, bug triggers, patches, and performance monitoring.
- **Why it's valuable**: Best available benchmark for evaluating program analysis tools. Test your vulnerability scanner, static analyzer, or fuzzer against these. The CGC DECREE OS has only 7 system calls.
- **Last commit**: 2015-08-31
- **How to revive**: Use as benchmark for your security tools. Test automated patching systems. Compare your bug-finding tool against Cyber Grand Challenge winners.
- **MEOK integration**: Automated vulnerability detection pipeline for the O layer's security monitoring.

---

## 2. Hidden Government Lab Releases

### 2.1 NASA ION-DTN - Interplanetary Overlay Network
- **GitHub**: https://github.com/nasa-jpl/ION-DTN
- **What it does**: NASA JPL's implementation of Delay/Disruption Tolerant Networking (DTN). ION implements the Bundle Protocol for reliable data delivery across networks with long delays, high error rates, or intermittent connectivity. Flight-proven on multiple space missions.
- **Why it's valuable**: Not just for space - this solves any networking problem with intermittent connectivity: underwater, underground, disaster zones, contested environments. The Bundle Protocol is an RFC standard.
- **Last commit**: 2026-02-24 (actively maintained!)
- **How to revive**: Use for any network where TCP/IP fails. Tactical networks with jamming. Maritime environments. Disaster response where infrastructure is destroyed.
- **MEOK integration**: ION-DTN becomes your network layer for K (knowledge) distribution in denied/degraded environments.

### 2.2 NASA Open Source Catalog - 100+ Hidden Projects
- **GitHub**: https://github.com/nasa/Open-Source-Catalog
- **What it does**: Catalog of 100+ NASA open source projects. Hidden gems include: World Wind (3D Earth visualization), OpenMDAO (multidisciplinary design optimization), NAIF/SPICE (spacecraft navigation), PVS (verification system), and dozens more.
- **Why it's valuable**: NASA writes code for the hardest possible environment (space). Their verification, simulation, and optimization tools are among the best in the world. Most projects have <100 stars.
- **Last commit**: 2014-09-18 (catalog), individual projects vary
- **How to revive**: Browse the catalog for your specific domain. SPICE for trajectory/position calculations. OpenMDAO for optimization problems. World Wind for 3D geospatial visualization.
- **MEOK integration**: SPICE for precise positioning in the K layer. World Wind for O layer visualization.

### 2.3 MIT Lincoln Laboratory - SPARTA Security Framework
- **GitHub**: https://github.com/mit-ll/SPARTA
- **What it does**: SPARTA (SPAR Testing and Assessment) is a framework for evaluating secure database systems and messaging systems. Includes synthetic SQL database generation, test case generation, SQL query generation, system resource monitoring, and report generation.
- **Why it's valuable**: Purpose-built for evaluating secure/private information retrieval systems. The database generation utilities can create arbitrarily large test datasets. Circuit generation for privacy-preserving computation benchmarking.
- **Last commit**: 2017-06-02
- **How to revive**: Use for benchmarking your database security. Generate synthetic data for testing. Evaluate encrypted database performance.
- **MEOK integration**: Test database performance in the K layer before production deployment.

### 2.4 MIT Lincoln Laboratory - Radar Course & Tools
- **GitHub**: https://github.com/mit-ll/radar-intro
- **What it does**: Interactive Jupyter notebooks for MIT Lincoln Lab's Introduction to Radar course. Includes animations and interactive elements for understanding radar signal processing.
- **Why it's valuable**: Best open-source radar education resource available. The interactive notebooks make radar concepts accessible. Distribution Statement A - approved for public release, distribution unlimited.
- **Last commit**: 2021-09-14
- **How to revive**: Use as training material for radar/SIGINT analysts. Adapt the interactive elements for your own sensor visualization dashboards.
- **MEOK integration**: Interactive radar visualization becomes part of the O layer's sensor dashboard.

### 2.5 MIT Lincoln Laboratory - pySLGR (Speaker/Language/Gender Recognition)
- **GitHub**: https://github.com/mitll/pyslgr
- **What it does**: Python tools for Speaker Recognition, Language Identification, and Gender Recognition. Part of the broader LLTools suite from MIT Lincoln Lab's speech processing group.
- **Why it's valuable**: Government-grade speaker recognition. LLString for soft string matching. LLHash for locality-sensitive hashing. LLClass for document classification with pre-trained models.
- **Last commit**: Check repository
- **How to revive**: Use pySLGR for speaker identification in intercepted audio. LLString for fuzzy name matching across datasets. LLHash for fast similarity search.
- **MEOK integration**: Speaker recognition pipeline in the M layer. String matching for the E layer's entity resolution.

### 2.6 MIT Lincoln Laboratory - Common Evaluation Platform (CEP)
- **GitHub**: https://github.com/mit-ll/CEP
- **What it does**: The Common Evaluation Platform is an open-source SoC design based on UC Berkeley's Chipyard Framework. Contains only license-unencumbered components. Provides a standard platform for hardware security evaluation.
- **Why it's valuable**: Standard evaluation platform for hardware security research. Can be instantiated on FPGA or in simulation. Used across multiple DARPA programs.
- **Last commit**: Check repository
- **How to revive**: Use as your standard hardware platform for security evaluation. Instantiate on AWS F1 for cloud-based testing.
- **MEOK integration**: Hardware-in-the-loop security testing for edge deployments.

### 2.7 CERN ROOT - High Energy Physics Data Analysis Framework
- **GitHub**: https://github.com/root-project/root
- **What it does**: ROOT is CERN's data analysis framework used at the heart of high-energy physics research. Handles petabyte-scale data analysis, statistical modeling, and visualization. Born at CERN in the 1990s.
- **Why it's valuable**: ROOT handles data volumes that dwarf most commercial analytics platforms. The statistical libraries are world-class. The I/O system is optimized for reading terabytes from tape/disk efficiently. Most physics PhDs know ROOT - huge talent pool.
- **Last commit**: Active
- **How to revive**: Use ROOT for large-scale statistical analysis. The RooFit library for advanced fitting. The TTree I/O for efficient storage of structured data.
- **MEOK integration**: ROOT statistical analysis in the M layer for advanced analytics on massive datasets.

### 2.8 CERN Geant4 - Particle Simulation Toolkit
- **GitHub**: https://github.com/Geant4/geant4
- **What it does**: Geant4 simulates the passage of particles through matter. Used for detector design, space radiation effects, medical physics, and nuclear applications.
- **Why it's valuable**: The most accurate radiation transport simulation available. Can model any geometry, any particle, any energy. Used by NASA for spacecraft radiation shielding design. Medical physics applications for radiation therapy.
- **Last commit**: Active
- **How to revive**: Use for radiation effects modeling on electronics. Space environment simulation. Medical radiation planning.
- **MEOK integration**: Radiation environment modeling for edge/space hardware deployment planning.

### 2.9 CERN REANA - Reproducible Research Platform
- **GitHub**: https://github.com/reanahub/reana
- **What it does**: REANA is a reproducible research data analysis platform. Run computational research data analysis workflows on remote compute clouds. Supports Docker, Kubernetes, and multiple workflow languages.
- **Why it's valuable**: The "reproducible" part is critical for intelligence analysis. Every analysis step is containerized and versioned. Provenance tracking is built-in. Supports CWL, Snakemake, Yadage workflow languages.
- **Last commit**: Active
- **How to revive**: Use as the workflow orchestration layer for your analytics pipeline. Every transformation is reproducible and auditable.
- **MEOK integration**: REANA becomes the O (orchestration) layer's workflow engine. Full provenance tracking for every analytic product.

---

## 3. Abandoned Google Research Projects

### 3.1 TensorFlow Federated - Federated Learning Framework
- **GitHub**: https://github.com/google-parfait/tensorflow-federated (original) / https://github.com/tensorflow/federated
- **What it does**: An open-source framework for machine learning on decentralized data. Enables training models across many clients that keep their data locally. Was used to train mobile keyboard prediction models without uploading sensitive typing data.
- **Why it's valuable**: The ONLY production-grade federated learning framework. Critical for coalition operations where data can't be centralized. Privacy-preserving ML for sensitive intelligence data. The Federated Core API lets you express novel distributed algorithms.
- **Status**: Effectively abandoned - Google shut down most of the team
- **How to revive**: Fork and maintain. The core is solid. Use for training models across distributed nodes without data centralization. The federated averaging algorithm works out of the box.
- **MEOK integration**: Train M layer models across distributed K nodes without exposing raw data. Federated analytics for coalition partner data sharing.

### 3.2 Google OR-Tools - Operations Research at Scale
- **GitHub**: https://github.com/google/or-tools
- **What it does**: Google's operations research tools - constraint programming, linear programming, vehicle routing, network flow, and scheduling. The CP-SAT solver consistently wins gold medals in the MiniZinc Challenge.
- **Why it's valuable**: Best open-source constraint solver available. Vehicle routing for logistics optimization. The constraint programming engine can solve scheduling problems that stump commercial solvers. Free alternative to CPLEX/Gurobi for many problems.
- **Last commit**: Active (but underappreciated - most people don't know it exists)
- **How to revive**: Use for resource allocation, scheduling, routing, and optimization problems. The CP-SAT solver handles mixed integer problems with millions of variables.
- **MEOK integration**: Optimization engine for O layer's resource allocation and scheduling decisions.

### 3.3 Google Code Archive - The Graveyard of Gems
- **URL**: https://code.google.com/archive/
- **What it does**: Archive of all Google Code projects (~1.4 million projects). Contains early versions of many now-famous tools, plus thousands of abandoned gems that never made it to GitHub.
- **Why it's valuable**: Pre-GitHub open source history. Many projects were ahead of their time. Search for specific domain tools that were abandoned when Google Code shut down. GWT, Protocol Buffers, AngularJS all started here.
- **How to revive**: Browse by language/topic. Search for "[your domain] + library" and limit to Google Code. Many projects have working code that just needs dependency updates.
- **MEOK integration**: Historical code that solves specific problems. Many data structure and algorithm implementations that are still valid.

---

## 4. Forgotten Academic Releases

### 4.1 CMU Auton Lab - auton-survival
- **GitHub**: https://github.com/autonlab/auton-survival
- **What it does**: Comprehensive Python package for survival analysis with censored time-to-event data. Includes Deep Cox Mixtures, Deep Survival Machines, adversarial survival analysis, and counterfactual estimation.
- **Why it's valuable**: Only Python package that combines deep learning with survival analysis. Critical for predicting time-to-failure of equipment, time-to-event in intelligence scenarios. Handles censored data (events that haven't happened yet) correctly.
- **Last commit**: 2022
- **How to revive**: Use for predictive maintenance (time-to-failure of equipment). Medical prognosis modeling. Any "when will X happen" prediction problem with incomplete observations.
- **MEOK integration**: Predictive maintenance in the O layer. Time-to-failure estimation for critical infrastructure.

### 4.2 CMU Auton Lab - MOMENT (Time Series Foundation Model)
- **GitHub**: https://github.com/autonlab/MOMENT
- **What it does**: The first open-source foundation model for time series. Pre-trained on millions of time series. Supports forecasting, anomaly detection, classification, and imputation.
- **Why it's valuable**: Time series foundation models are the next frontier. MOMENT learns transferable representations. Downloaded 3.78 million times. Can be fine-tuned for your specific sensor data with minimal examples.
- **Last commit**: 2024
- **How to revive**: Fine-tune MOMENT on your sensor data for anomaly detection and forecasting. Use as a feature extractor for time series classification.
- **MEOK integration**: M layer foundation model for all time series data. Anomaly detection on sensor feeds in the O layer.

### 4.3 USC ISI - DIG (Domain-Specific Insight Graphs)
- **GitHub**: https://github.com/usc-isi-i2/dig-etl-engine (myDIG)
- **What it does**: End-to-end information extraction and integration system. Extracts structured data from unstructured text, builds knowledge graphs, and provides search interfaces. Part of the DARPA Memex program.
- **Why it's valuable**: Complete ETL pipeline from text to knowledge graph. Landmark extraction for location identification. etk (Extraction Toolkit) for building custom extractors. Record linkage across datasets.
- **Last commit**: ~2019
- **How to revive**: Use etk for custom entity extraction. myDIG for building domain-specific search engines. The knowledge graph search translates structured queries to Elasticsearch.
- **MEOK integration**: Full E (extraction) layer for text documents. Build domain knowledge graphs automatically.

### 4.4 USC ISI - Web-Karma Information Integration
- **GitHub**: https://github.com/usc-isi-i2/Web-Karma
- **What it does**: Information integration tool that maps data from databases, spreadsheets, APIs, XML, JSON to RDF/linked data. GUI-based mapping with semi-automatic alignment.
- **Why it's valuable**: Best open-source tool for data integration. Point it at any data source and produce linked data. Supports R2RML standard mapping. Can integrate dozens of sources into a unified knowledge graph.
- **Last commit**: ~2019
- **How to revive**: Use for integrating multiple data sources into your knowledge graph. Map existing databases to RDF without writing code. Semi-automatic alignment suggests mappings.
- **MEOK integration**: K layer data integration - bring all your sources into the knowledge graph.

### 4.5 USC ISI - rltk (Record Linkage Toolkit)
- **GitHub**: https://github.com/usc-isi-i2/rltk
- **What it does**: General-purpose, highly-scalable record linkage toolkit. Contains similarity metrics, blocking schemes, and ML algorithms for matching records across datasets.
- **Why it's valuable**: Entity resolution is critical for intelligence fusion - "is this person the same as that person?" rltk handles large-scale record linkage with blocking to make it efficient.
- **Last commit**: ~2019
- **How to revive**: Use for entity resolution across multiple intelligence datasets. Match persons, organizations, locations across different data sources.
- **MEOK integration**: Entity resolution in the E layer before data enters the K layer.

### 4.6 SEMI - Semantic Modeling with Graph Neural Networks
- **GitHub**: https://github.com/giuseppefutia/semi
- **What it does**: A SEmantic Modeling machIne that builds knowledge graphs using Graph Neural Networks. Creates semantic models from data sources automatically using domain ontologies.
- **Why it's valuable**: Automated ontology alignment using GNNs. Creates multi-edge weighted graphs of all possible semantic models, then finds the optimal Steiner tree. State-of-the-art for automated knowledge graph construction from data.
- **Last commit**: 2018-05-30
- **How to revive**: Use for automated knowledge graph construction from your data sources. The GNN-based approach outperforms traditional mapping techniques.
- **MEOK integration**: Automated K layer construction from structured data sources.

---

## 5. Archived Startup Code

### 5.1 IBM Research - CLAI (Command Line AI)
- **GitHub**: https://github.com/ibm/clai
- **What it does**: Brings AI to the command line interface. Skills include: nlc2cmd (natural language to bash command), fixit (auto-fix command errors), helpme (contextual help), howdoi (stackoverflow search), gitbot (git assistance), voice (voice control).
- **Why it's valuable**: Makes complex command-line tools accessible to non-technical users. The nlc2cmd skill alone is worth the price of admission - describe what you want in English, get the bash command. The fixit skill catches errors and suggests fixes.
- **Last commit**: ~2021
- **How to revive**: Deploy for analysts who need to use command-line tools but aren't CLI experts. The skill system is extensible - write your own skills for your specific tools.
- **MEOK integration**: O layer interface - analysts interact with complex tools using natural language.

### 5.2 IBM Research - Docling (Document Processing)
- **GitHub**: https://github.com/DS4SD/docling
- **What it does**: Simplifies document processing with advanced PDF understanding. Parses diverse formats and provides seamless integrations with the gen AI ecosystem.
- **Why it's valuable**: The best open-source PDF parser available. Handles complex layouts, tables, figures. The DoclingDocument format is a standard for document representation. Integrates with LLMs for RAG applications.
- **Last commit**: Active (but underappreciated)
- **How to revive**: Use as the document ingestion pipeline. Extract text, tables, and structure from any document format. Feed into your RAG system.
- **MEOK integration**: E layer document processing - convert any document to structured data for the knowledge graph.

### 5.3 IBM Research - Deep Search
- **GitHub**: https://github.com/DS4SD/deepsearch-toolkit
- **What it does**: Interprets, indexes, and integrates knowledge from documents. Offers a chat interface for interacting with RAG backend and navigating data collections.
- **Why it's valuable**: Enterprise-grade document search and RAG. Processes patent documents, scientific papers, and technical documents. The PatCID database contains chemical structures extracted from millions of patents.
- **Last commit**: Active
- **How to revive**: Use as the search interface for your document collection. The programmatic API enables bulk processing and integration.
- **MEOK integration**: Search layer for the K layer's document corpus.

---

## 6. Buried GitHub Gems

### 6.1 ABI - AI Operating System (Palantir Alternative)
- **GitHub**: https://github.com/jupyter-naas/abi
- **What it does**: An open-source AI Operating System that grounds LLMs in organizational ontology. Built as an alternative to Palantir Foundry. Uses Basic Formal Ontology (BFO) ISO standard for the knowledge graph.
- **Why it's valuable**: Full-stack alternative to Palantir: ingestion → ontology → AI tools → UI. Every layer is swappable. BFO-grounded data makes AI Act compliance easier. The ontology layer is the key differentiator from generic RAG.
- **Last commit**: Active
- **How to revive**: Deploy as your K layer. Define your domain ontology in BFO. Connect your data sources. The LLM reasons over the ontology, not just raw text.
- **MEOK integration**: This IS your K layer - knowledge graph + ontology + AI reasoning in one system.

### 6.2 Palantir Gotham-Like (Open Source Intelligence Platform)
- **GitHub**: https://github.com/jmfloreszazo/palantir-ghotam-like
- **What it does**: An open-source implementation mapping Palantir Gotham's architecture. Includes: Neo4j knowledge graph, OpenSearch, Redis pub/sub, local LLM via Ollama, React frontend with Cytoscape.js graph visualization, timeline visualization, and geospatial maps.
- **Why it's valuable**: Complete open-source COTS intelligence platform. Layer-by-layer mapping to Palantir Gotham. Zero cloud dependency (runs locally). 7 containers, single-command deployment.
- **Last commit**: 2026-03-02
- **How to revive**: Deploy as-is for intelligence analysis. Replace Ollama with your own LLM. Connect your data sources to Neo4j. Add domain-specific ontologies.
- **MEOK integration**: Complete O+K layer in one deployment. Graph visualization, search, and AI reasoning.

### 6.3 BehaveFormer - Behavioral Biometrics Authentication
- **GitHub**: https://github.com/nganntk/BehaveFormer
- **What it does**: Framework for behavioral biometrics continuous authentication using Spatio-Temporal Dual Attention Transformers. State-of-the-art on keystroke dynamics and swipe dynamics datasets.
- **Why it's valuable**: EER of 2.95% on HuMIdb keystroke dataset. Uses attention mechanisms to model the unique temporal patterns of user behavior. Can be adapted for mouse dynamics, gait, and other behavioral biometrics.
- **Last commit**: 2023-11-09
- **How to revive**: Train on your own behavioral data. Adapt for touchscreen dynamics, mouse movements, or typing patterns. The transformer architecture is highly transferable.
- **MEOK integration**: Continuous authentication layer in the O layer. Verify user identity throughout a session based on behavior.

### 6.4 OpenAI-GPT-Powered Behavioral Biometrics
- **GitHub**: https://github.com/Agisthemantobeat/OpenAI-GPT-Powered-Behavioral-Biometrics
- **What it does**: Complete behavioral biometrics system using keystroke dynamics. Captures keystroke events, extracts features (hold time, press-press duration), trains a Random Forest classifier for user authentication.
- **Why it's valuable**: Simple but effective implementation. Works with just keyboard input. Can be extended to include mouse dynamics, touch patterns, and other behavioral signals.
- **Last commit**: 2023-10-22
- **How to revive**: Extend with more sophisticated models. Add mouse dynamics. Integrate as a background authentication mechanism.
- **MEOK integration**: Low-friction authentication in the O layer. Continuously verify identity without explicit login actions.

### 6.5 RoCA - Robust Contrastive One-Class Time Series Anomaly Detection
- **GitHub**: https://github.com/ruiking04/RoCA
- **What it does**: Robust contrastive learning for time series anomaly detection with contaminated training data. Published in IEEE TNNLS 2026.
- **Why it's valuable**: Handles the real-world problem where training data already contains anomalies. Uses contrastive learning to learn normal patterns even with contamination. State-of-the-art results on SWaT, WADI, UCR benchmarks.
- **Last commit**: 2024-04-21
- **How to revive**: Use for anomaly detection when you can't guarantee clean training data. Critical for industrial control systems and sensor monitoring.
- **MEOK integration**: Anomaly detection in the M layer for sensor data with potentially contaminated training sets.

### 6.6 RoCA Contaminated Data Anomaly Detection
- **GitHub**: https://github.com/ruiking04/RoCA
- **What it does**: Robust Contrastive One-Class Time Series Anomaly Detection that works even when training data contains anomalies (contaminated data). Uses contrastive learning to separate normal from abnormal patterns without clean labels.
- **Why it's valuable**: Real-world training data is always contaminated. Most anomaly detectors fail when training data contains anomalies. RoCA handles this gracefully. Published IEEE TNNLS 2026.
- **Last commit**: 2024
- **How to revive**: Deploy on any sensor stream where you can't guarantee clean training data. Works on SWaT, WADI industrial control datasets.
- **MEOK integration**: Robust anomaly detection in the M layer for real-world sensor data.

### 6.7 Aero-SIGINT - Passive Electronic Warfare Early Warning
- **GitHub**: https://github.com/hade00752/aero-sigint
- **What it does**: Passive Electronic Warfare Early Warning System for civilians in conflict zones. Detects RF jamming, GPS spoofing, and surveillance activity using an Android phone or Raspberry Pi. No data collection, fully local processing.
- **Why it's valuable**: Turns a $50 Raspberry Pi into an EW awareness station. Detects GPS spoofing via coordinate inconsistency. Detects RF jamming via WiFi signal baseline deviation. Detects surveillance via probe request analysis. GPL-3.0 licensed.
- **Last commit**: 2026-04-14
- **How to revive**: Deploy on Raspberry Pi nodes across an area. Mesh network the nodes for distributed detection. Adapt detection algorithms for your specific threat environment.
- **MEOK integration**: Sensor input for the O layer's threat detection. Feed alerts into the K layer for situational awareness.

### 6.8 vCEW - Cognitive Electronic Warfare with Countermeasures
- **GitHub**: https://github.com/youshixun/vCEW
- **What it does**: Versatile model of cognitive electronic warfare with countermeasures. Uses reinforcement learning to develop jamming and anti-jamming strategies. Python implementation with training results for different operating cycles.
- **Why it's valuable**: Cognitive EW is the future - systems that learn and adapt jamming strategies in real-time. This implements the full loop: sense → learn → jam → adapt. Only 25 stars but implements cutting-edge concepts.
- **Last commit**: 2018-12-11
- **How to revive**: Update the RL algorithms (replace with modern methods like PPO/SAC). Adapt for SDR platforms (GNU Radio, USRP). Train on your specific threat waveforms.
- **MEOK integration**: Adaptive EW controller in the O layer. Learns optimal jamming strategies against observed threats.

### 6.9 Autonomous Drone Navigation - GPS-Denied Indoor SLAM
- **GitHub**: https://github.com/ahmedeltaher/Autonomous-drone-navigation
- **What it does**: Complete GPS-denied indoor navigation system for drones. Uses optical flow, IMU, and LiDAR sensor fusion with real-time SLAM, obstacle avoidance, and waypoint missions. 16 ROS2 packages.
- **Why it's valuable**: Full autonomous stack beyond PX4/ArduPilot. Graph-based SLAM with loop closure. Dynamic window approach for obstacle avoidance. Vision pose estimation injected into EKF2. Position hold without GPS.
- **Last commit**: 2025-11-20
- **How to revive**: Deploy on Raspberry Pi 4 + PX4 for indoor inspection. Adapt for different sensor configurations. The SLAM engine is reusable for ground robots.
- **MEOK integration**: Autonomous navigation in the O layer for indoor/GPS-denied environments.

### 6.10 Redamon - AI-Powered Autonomous Red Team
- **GitHub**: https://github.com/samugit83/redamon
- **What it does**: Complete AI-powered agentic red team framework. Automated reconnaissance, exploitation, and post-exploitation with zero human intervention. Neo4j attack surface mapping, LangGraph-based autonomous agent with ReAct pattern, GVM vulnerability scanner, TruffleHog secret scanner.
- **Why it's valuable**: Full autonomous penetration testing framework. Graph database for attack surface mapping. MCP tool servers for security tools integration. The most comprehensive open-source red team automation available.
- **Last commit**: 2026-06-25
- **How to revive**: Deploy for continuous security assessment. Adapt the attack graph for your specific environment. The Neo4j schema is reusable for any attack surface analysis.
- **MEOK integration**: Automated security assessment in the O layer. Attack surface mapping feeds into the K layer.

### 6.11 Graphiti - Real-Time Temporal Knowledge Graphs
- **GitHub**: https://github.com/getzep/graphiti
- **What it does**: Framework for building temporal context graphs for AI agents. Unlike static knowledge graphs, Graphiti tracks how facts change over time, maintains provenance, and supports learned ontology. Purpose-built for agents operating on evolving data.
- **Why it's valuable**: Temporal knowledge graphs are critical for intelligence analysis - facts change, relationships evolve. Graphiti maintains full provenance (every fact traces back to source). Temporal queries: "what was true then vs now?"
- **Last commit**: Active (2026)
- **How to revive**: Use as the knowledge graph backbone for time-aware intelligence analysis. Every fact has a validity window. Full provenance tracking.
- **MEOK integration**: Temporal K layer - track how intelligence assessments change over time with full provenance.

### 6.12 OpenSPG - Ant Group Knowledge Graph Engine
- **GitHub**: https://github.com/OpenSPG/openspg
- **What it does**: Open engine for knowledge graphs based on the SPG (Semantic-enhanced Programmable Graph) framework. Domain model constrained knowledge modeling, facts and logic fused representation, natively supports KAG (Knowledge Augmented Generation).
- **Why it's valuable**: Industry-proven (Ant Group's production KG engine). KGDSL (Knowledge Graph Domain Specific Language) for logic rules. Supports both structured and unstructured knowledge construction. Programmable framework (KNext) for extensibility.
- **Last commit**: Active
- **How to revive**: Deploy as your enterprise knowledge graph engine. Define domain ontologies. Connect structured and unstructured data sources. Use KAG for LLM-augmented reasoning.
- **MEOK integration**: Core K layer engine with logic rule reasoning and LLM augmentation.



---

## 7. Defense & Intelligence Specific Gems

### 7.1 Caldera - MITRE ATT&CK C2 Framework
- **GitHub**: https://github.com/mitre/caldera
- **What it does**: Adversary emulation platform built on the MITRE ATT&CK framework. Plan, execute, and analyze adversary operations. Plugin-based architecture with over 70 plugins for various ATT&CK techniques.
- **Why it's valuable**: The most comprehensive open-source adversary emulation framework. Maps every action to MITRE ATT&CK. Used by defenders to test their detection capabilities. The planning engine can chain techniques automatically.
- **Last commit**: Active
- **How to revive**: Deploy for purple team exercises. Build custom plugins for your specific threat model. The fact source system enables dynamic planning based on collected intelligence.
- **MEOK integration**: Adversary emulation in the O layer. Test detection capabilities against real ATT&CK techniques.

### 7.2 C3 - Custom Command & Control Channels
- **GitHub**: https://github.com/ReversecLabs/C3
- **What it does**: Framework for rapid prototyping of custom C2 channels. Extends existing red team tooling (Cobalt Strike) via ExternalC2. Supports esoteric channels: Mattermost, Asana, GitHub, Dropbox, Cisco WebEx, JIRA, Discord, Slack, EWS.
- **Why it's valuable**: Network segmentation bypass via legitimate services. If you can communicate via GitHub issues or Dropbox, you bypass most network controls. Modular channel system - write a new channel in hours.
- **Last commit**: 2019-08-30
- **How to revive**: Write new channels for your environment's allowed services. The framework handles all the C2 infrastructure - you just implement the channel protocol.
- **MEOK integration**: Alternative communication channels for the O layer in restricted network environments.

### 7.3 War Probability OSINT Pipeline
- **GitHub**: https://github.com/mohd-faizy/War-Probability-OSINT
- **What it does**: Machine learning pipeline that fuses real-time signals from military aviation (ADS-B), civic anomalies (foot traffic), geopolitical news sentiment (GDELT), and financial markets to output a continuously updated probability of military conflict.
- **Why it's valuable**: Multi-source fusion for conflict early warning. ADS-B Exchange for military aircraft tracking (doesn't filter military flights). GDELT for global news sentiment analysis. Financial market anomaly detection for defense stocks.
- **Last commit**: 2026-02-22
- **How to revive**: Add your own OSINT sources. Adapt the fusion model for your specific intelligence requirements. The modular API client architecture makes adding sources easy.
- **MEOK integration**: E layer OSINT fusion feeding into the K layer's situational awareness graph.

### 7.4 Iran-Israel War 2026 OSINT Data
- **GitHub**: https://github.com/danielrosehill/Iran-Israel-War-2026-Data
- **What it does**: Structured data model of the Iranian aerial warfare attacks on Israel. Neo4j graph database with relationship-driven analysis. JSON source files for all rounds of attacks.
- **Why it's valuable**: Shows how to model military conflicts as knowledge graphs. Graph queries answer questions like "which defense systems intercepted which missiles?" 210+ entity international reactions. Clean data model with JSON Schema validation.
- **Last commit**: 2026-03-04
- **How to revive**: Use the data model as a template for your own conflict modeling. The Neo4j schema is reusable for any military situation. The JSON structure can be adapted for any conflict domain.
- **MEOK integration**: K layer conflict modeling template. Graph schema for military operations analysis.

---

## 8. Knowledge Graph & Ontology Builders

### 8.1 Morph-RDB - RDB2RDF Engine
- **GitHub**: https://github.com/oeg-upm/morph-rdb
- **What it does**: RDB-to-RDF engine that follows the W3C R2RML specification. Supports data upgrade (generating RDF from SQL databases) and query translation (SPARQL-to-SQL). Includes self-join elimination and subquery elimination optimizations.
- **Why it's valuable**: Turn any existing relational database into a knowledge graph without data migration. Query it with SPARQL while keeping the data in place. Optimized SQL generation for efficient queries.
- **Last commit**: Active
- **How to revive**: Map your existing databases to a knowledge graph. Use SPARQL to query across multiple databases as if they were one graph.
- **MEOK integration**: K layer data virtualization - query existing databases as a unified knowledge graph.

### 8.2 RMLStreamer - Streaming Knowledge Graph Construction
- **GitHub**: https://github.com/RMLio/RMLStreamer
- **What it does**: Executes RML (RDF Mapping Language) rules to generate Linked Data from multiple sources in a streaming way. Designed for big data sets and continuous data streams.
- **Why it's valuable**: Knowledge graph construction that keeps up with real-time data. Processes CSV, XML, JSON from files, TCP sockets, or Kafka topics. Runs on Flink clusters for distributed processing.
- **Last commit**: Active
- **How to revive**: Deploy on your Flink cluster for continuous KG updates from streaming sources. Process Kafka topics directly into your knowledge graph.
- **MEOK integration**: Real-time K layer construction from streaming data sources.

### 8.3 Squerall - Semantic Data Lake Query Engine
- **GitHub**: https://github.com/EIS-Bonn/Squerall
- **What it does**: Virtual OBDA (Ontology-Based Data Access) engine. Query disparate data sources (CSV, Parquet, MongoDB, Cassandra, SQL) using SPARQL. No data ingestion required - queries are translated on-the-fly.
- **Why it's valuable**: Leave data where it is, query it with SPARQL. Apache Spark and Presto backends for distributed queries. The data never moves - queries go to the data.
- **Last commit**: 2017 (but the concept is still valid)
- **How to revive**: Update to modern Spark/Presto versions. Add support for additional data sources. The core SPARQL-to-distributed-query translation is solid.
- **MEOK integration**: Query all your data sources through a single SPARQL interface without data movement.

### 8.4 OntoBricks - Databricks-Native Knowledge Graph
- **GitHub**: https://github.com/databrickslabs/ontobricks
- **What it does**: The only Databricks-native knowledge graph solution. Combines W3C standards (OWL, R2RML, SPARQL), LLM-automated ontology generation, interactive graph visualization, and industry-standard ontologies (FIBO, CDISC, IOF).
- **Why it's valuable**: Native Delta Lake integration - no data export needed. LLM generates ontologies from your table schemas. Open-source under MIT license. The only solution that combines all of these in Databricks.
- **Last commit**: Active
- **How to revive**: Deploy in your Databricks environment. Point it at your Delta tables, let the LLM generate the ontology. Start querying with SPARQL immediately.
- **MEOK integration**: If you're on Databricks, this is your K layer. Native integration with no data movement.

### 8.5 Apache Jena - Semantic Web Framework
- **GitHub**: https://github.com/apache/jena
- **What it does**: Complete Java framework for building Semantic Web and Linked Data applications. RDF API, SPARQL query engine, reasoning engine (OWL, RDFS), Fuseki SPARQL server, TDB persistent triple store.
- **Why it's valuable**: The most mature open-source semantic web framework. Supports full OWL reasoning. Fuseki provides a production SPARQL endpoint. TDB handles billions of triples on a single server.
- **Last commit**: Active
- **How to revive**: Deploy Fuseki as your SPARQL endpoint. Use the reasoning engine for inference. The SHACL validator for data quality checks.
- **MEOK integration**: Production K layer with SPARQL endpoint and OWL reasoning.

### 8.6 Stardog Community - Enterprise Knowledge Graph
- **GitHub**: https://github.com/stardog-union/stardog
- **What it does**: Enterprise knowledge graph platform with virtual graph capabilities, reasoning, and graph analytics. The community edition provides core features free.
- **Why it's valuable**: Virtual graphs query data where it lives without copying. Powerful reasoning engine. BI tool integration (Tableau, PowerBI). Path analysis and graph algorithms.
- **Last commit**: Active
- **How to revive**: Use virtual graphs to federate queries across your data sources. Enable reasoning for inferred relationships. BI connectors for analyst access.
- **MEOK integration**: Enterprise K layer with virtual graph federation and BI connectivity.

---

## 9. Graph Databases & Analytics Engines

### 9.1 Memgraph - High-Performance In-Memory Graph DB
- **GitHub**: https://github.com/memgraph/memgraph
- **What it does**: In-memory graph database built in C/C++. Cypher-compatible. Sub-millisecond traversals. 40+ graph algorithms (PageRank, community detection, GNN link prediction). Built-in vector, text, and geospatial indexes.
- **Why it's valuable**: In-memory speed for real-time analytics. Native GraphRAG support - pivot search, graph expansion, and prompt assembly in a single Cypher query. Kafka/Pulsar streaming ingestion. Query modules in Python, Rust, C++.
- **Last commit**: Active (2026)
- **How to revive**: Deploy as your primary graph database. Use query modules to implement custom algorithms. Stream data from Kafka for real-time graph updates.
- **MEOK integration**: Core K layer graph database with real-time analytics and GraphRAG support.

### 9.2 FalkorDB - GraphBLAS-Powered Graph DB
- **GitHub**: https://github.com/FalkorDB/FalkorDB
- **What it does**: Lightning-fast graph database powered by GraphBLAS sparse matrix algebra. Purpose-built for Knowledge Graphs and GraphRAG. Redis module architecture. Cypher query language.
- **Why it's valuable**: GraphBLAS sparse matrix operations make it extremely fast for large graphs. Purpose-built for LLM RAG applications. Redis ecosystem integration. Next-gen Rust rewrite in progress.
- **Last commit**: Active (2026)
- **How to revive**: Deploy as Redis module for existing Redis users. The GraphBLAS foundation provides excellent performance for large-scale graph analytics.
- **MEOK integration**: High-performance K layer with Redis ecosystem integration.

### 9.3 GrafeoDB - Rust Graph Database (6 Query Languages)
- **GitHub**: https://github.com/GrafeoDB/grafeo
- **What it does**: Embeddable graph database in pure Rust. Dual data models (LPG + RDF). Six query languages: GQL (ISO), Cypher, Gremlin, GraphQL, SPARQL, SQL/PGQ. HNSW vector search. MVCC transactions.
- **Why it's valuable**: Fastest graph database in LDBC-inspired benchmarks. Zero external dependencies. Embeddable as a library (Rust, Python, Node.js, Go, C#, Dart, WASM). Vector search built-in.
- **Last commit**: Active (2026)
- **How to revive**: Embed directly in your application. No separate database process needed. The multi-language support means you can use whatever query language your team knows.
- **MEOK integration**: Embedded K layer for applications that need graph capabilities without a separate database.

### 9.4 KyuGraph - Rust Graph DB with JIT Compilation
- **GitHub**: https://github.com/offbit-ai/kyugraph
- **What it does**: High-performance embedded property graph database in Rust. Cranelift JIT compilation for filter predicates (22x speedup over tree-walking). Cypher query language. Columnar storage. MVCC transactions.
- **Why it's valuable**: JIT-compiled queries are extremely fast. The Rust implementation is memory-safe and performant. Arrow Flight protocol for remote access. Cloud-native S3 storage backend.
- **Last commit**: 2026-02-22
- **How to revive**: Use as embedded graph database for analytical workloads. The JIT compilation makes it especially fast for complex filter predicates.
- **MEOK integration**: High-performance analytical K layer with JIT-compiled queries.

### 9.5 FalkorDB Next-Gen (Rust Rewrite)
- **GitHub**: https://github.com/FalkorDB/falkordb-rs-next-gen
- **What it does**: Next-generation FalkorDB engine rewritten in Rust. Built on GraphBLAS sparse matrix algebra. Knowledge graph and GraphRAG optimized.
- **Why it's valuable**: The Rust rewrite provides memory safety and performance. GraphBLAS foundation for mathematical correctness. Purpose-built for AI knowledge graph applications.
- **Last commit**: Active (2025+)
- **How to revive**: Track the Rust rewrite for next-gen performance. The GraphBLAS foundation ensures correctness for complex graph algorithms.
- **MEOK integration**: Next-generation K layer with mathematical correctness guarantees.

---

## 10. Autonomous Navigation & Robotics

### 10.1 Autonomous Drone Navigation - Indoor SLAM
- **GitHub**: https://github.com/ahmedeltaher/Autonomous-drone-navigation
- **What it does**: GPS-denied indoor navigation with optical flow, IMU, and LiDAR sensor fusion. 16 ROS2 packages covering: multi-sensor acquisition, graph-based SLAM, occupancy grid mapping, dynamic object filtering, global/local path planning, PX4 offboard control, vision pose estimation, failsafe controller.
- **Why it's valuable**: Complete autonomous stack beyond PX4/ArduPilot. Works indoors where GPS is unavailable. Centimeter-level accuracy. Graph SLAM with loop closure. Dynamic obstacle avoidance. Position hold without GPS.
- **Last commit**: 2025-11-20
- **How to revive**: Deploy on Raspberry Pi 4 + PX4 flight controller. Adapt sensor configuration for your platform (ground robot, boat, etc.). The SLAM engine is platform-agnostic.
- **MEOK integration**: O layer autonomous navigation for indoor/GPS-denied environments.

### 10.2 mavctl-python - Open Source Drone Navigation Library
- **GitHub**: https://github.com/uaarg/mavctl-python
- **What it does**: Open-source library for autonomous drone navigation via MAVLink. Designed as a replacement for DroneKit with improved structure. Navigator class for drone movement, advanced maneuver system.
- **Why it's valuable**: More structured than DroneKit. Designed for autonomous navigation rather than manual control. The maneuver system allows complex flight patterns to be composed from basic movements.
- **Last commit**: 2025-05-13
- **How to revive**: Use as the navigation layer for autonomous drone operations. Extend with custom maneuvers for your specific mission requirements.
- **MEOK integration**: Drone navigation in the O layer for autonomous ISR missions.

---

## 11. Behavioral Biometrics & Auth

### 11.1 BehaveFormer - Transformer-Based Behavioral Biometrics
- **GitHub**: https://github.com/nganntk/BehaveFormer
- **What it does**: Continuous authentication using Spatio-Temporal Dual Attention Transformers. Combines time series from multiple sensors. State-of-the-art on keystroke and swipe dynamics.
- **Why it's valuable**: EER of 2.95% on HuMIdb keystroke dataset, 3.67% on swipe dataset. The attention mechanism models the unique temporal-spatial patterns of user behavior. Transfer learning support.
- **Last commit**: 2023-11-09
- **How to revive**: Train on your own behavioral data. Adapt for different sensor combinations. The transformer architecture is highly transferable to new biometric modalities.
- **MEOK integration**: Continuous authentication in the O layer. Verify user identity throughout a session.

### 11.2 Behavioral Biometrics Authentication System
- **GitHub**: https://github.com/Agisthemantobeat/OpenAI-GPT-Powered-Behavioral-Biometrics
- **What it does**: Simplified behavioral biometrics using keystroke dynamics. Captures keystroke events, extracts hold time and typing speed features, trains a Random Forest classifier.
- **Why it's valuable**: Simple but effective. Works with just keyboard input. Easy to extend with mouse dynamics, touch patterns, and other signals. Minimal dependencies.
- **Last commit**: 2023-10-22
- **How to revive**: Extend with more sophisticated feature extraction. Add mouse movement tracking. Deploy as a background authentication layer.
- **MEOK integration**: Low-friction continuous authentication in the O layer.

---

## 12. Stream Processing & Real-Time Analytics

### 12.1 Apache Flink - Stream Processing Framework
- **GitHub**: https://github.com/apache/flink
- **What it does**: Open-source stream processing framework with powerful stream and batch capabilities. Event-time processing, exactly-once semantics, stateful computations, SQL support.
- **Why it's valuable**: The most mature open-source stream processing framework. True streaming (not micro-batching). Stateful stream processing with checkpoints. SQL and Table API for analyst-friendly queries.
- **Last commit**: Active
- **How to revive**: Deploy as your real-time processing backbone. Process sensor streams, event logs, and data feeds. The SQL interface makes it accessible to analysts.
- **MEOK integration**: Real-time E layer processing. Stream data into K layer as it arrives.

### 12.2 Apache Flink HTTP Connector
- **GitHub**: https://github.com/apache/flink-connector-http
- **What it does**: Official Apache Flink HTTP connector for ingesting data from REST APIs into Flink streams. Supports polling and webhook patterns.
- **Why it's valuable**: Most OSINT data comes from REST APIs. This connector enables continuous ingestion from API sources into your stream processing pipeline. Configurable polling intervals and authentication.
- **Last commit**: 2025-07-08
- **How to revive**: Use for continuous OSINT data ingestion. Poll APIs at configurable intervals. Feed API responses directly into Flink for real-time processing.
- **MEOK integration**: E layer API ingestion connector for OSINT data feeds.

---

## 13. Electronic Warfare & SIGINT

### 13.1 Aero-SIGINT - Passive EW Detection (Android + Raspberry Pi)
- **GitHub**: https://github.com/hade00752/aero-sigint
- **What it does**: Passive early-warning system detecting RF jamming, GPS spoofing, and surveillance activity. Runs on Android phone or Raspberry Pi. No root required. Fully local processing, no data transmission.
- **Why it's valuable**: $50 hardware for EW awareness. Detects: RF jamming (WiFi baseline deviation), GPS spoofing (coordinate inconsistency), device/drone scanning (probe request analysis), EMF anomalies (magnetometer spikes), time manipulation (GNSS vs NTP drift). GPL-3.0.
- **Last commit**: 2026-04-14
- **How to revive**: Deploy Pi nodes across an operational area. Mesh network for distributed validation. Adapt detection thresholds for your environment.
- **MEOK integration**: Sensor input for the O layer's threat detection system.

### 13.2 vCEW - Cognitive Electronic Warfare
- **GitHub**: https://github.com/youshixun/vCEW
- **What it does**: Cognitive electronic warfare system using reinforcement learning. Develops jamming and anti-jamming strategies automatically. Training results for 0.2s and 1s operating cycles.
- **Why it's valuable**: Cognitive EW learns and adapts. This implements the sense-learn-jam-adapt loop. Only 25 stars but represents cutting-edge EW concepts. Python implementation for easy experimentation.
- **Last commit**: 2018-12-11
- **How to revive**: Update RL algorithms to modern methods (PPO/SAC). Integrate with GNU Radio for SDR-based implementation. Train against your specific threat waveforms.
- **MEOK integration**: Adaptive EW controller in the O layer.

### 13.3 Easy-SDR - Affordable SDR Hardware
- **GitHub**: https://github.com/igrikxd/Easy-SDR
- **What it does**: Affordable, easy-to-manufacture PCB designs expanding low-cost RTL2832U SDR receivers. Modules: Mini-Whip antenna, HF upconverter, LNA with filtering, balun, attenuator, RF power limiter, antenna switch.
- **Why it's valuable**: Turn a $20 RTL-SDR dongle into a capable SIGINT receiver. Modular design for different frequency ranges and applications. Detailed assembly guides.
- **Last commit**: 2017-11-19 (stable/final)
- **How to revive**: Order PCBs from EasyEDA. Assemble modules for your frequency range of interest. Combine with GNURadio for signal processing.
- **MEOK integration**: Hardware layer for SIGINT collection at minimal cost.

### 13.4 GNSS-SDR - Open-Source GNSS Receiver
- **GitHub**: https://github.com/gnss-sdr/gnss-sdr
- **What it does**: Complete open-source software-defined GNSS receiver. Supports GPS, Galileo, GLONASS, BeiDou. Signal processing chain from RF front-end to PVT solution. GNU Radio compatible.
- **Why it's valuable**: Full GNSS receiver in software - study exactly how GPS works. Supports multiple constellations. Can be modified for custom signal processing. Educational and research applications.
- **Last commit**: Active (2026)
- **How to revive**: Use for GNSS signal analysis and education. Adapt for custom signal processing. Combine with SDR hardware for custom GNSS receiver configurations.
- **MEOK integration**: GNSS analysis in the O layer for navigation and timing assurance.

---

## 14. Anomaly Detection & Time Series

### 14.1 Salesforce Merlion - Time Series Intelligence Framework
- **GitHub**: https://github.com/salesforce/Merlion (ARCHIVED March 2026)
- **What it does**: End-to-end ML framework for time series: forecasting, anomaly detection, change point detection. AutoML for hyperparameter tuning. GUI dashboard. PySpark distributed backend.
- **Why it's valuable**: Comprehensive - univariate and multivariate support. Practical post-processing rules for anomaly detectors (reduces false positives). Benchmarking pipeline simulates live deployment. Now ARCHIVED by Salesforce - community needs to maintain it.
- **Last commit**: ARCHIVED March 2026 - community fork needed!
- **How to revive**: Fork immediately! The core is solid. Update dependencies. The benchmarking framework alone is worth it. Add modern deep learning models.
- **MEOK integration**: M layer time series analytics - forecasting, anomaly detection, and change point detection.

### 14.2 RoCA - Robust Anomaly Detection with Contaminated Data
- **GitHub**: https://github.com/ruiking04/RoCA
- **What it does**: Robust contrastive learning for time series anomaly detection when training data contains anomalies. Uses contrastive learning to separate normal from abnormal patterns.
- **Why it's valuable**: Real training data is always contaminated. Most detectors fail with dirty training data. RoCA handles this. State-of-the-art on SWaT, WADI, UCR benchmarks. Published IEEE TNNLS 2026.
- **Last commit**: 2024
- **How to revive**: Use for any anomaly detection where clean training data isn't available. Industrial control systems, sensor monitoring, financial fraud.
- **MEOK integration**: Robust M layer anomaly detection for real-world sensor data.

---

## MEOK Stack Integration Matrix

| Gem | Layer | Role | Integration Priority |
|-----|-------|------|---------------------|
| DARPA BRASS/SPIRAL | O | Hardware-portable signal processing kernels | HIGH |
| Apache OODT | E | Multi-sensor data ingestion & triage | HIGH |
| DARPA HIVE datasets | K | Trillion-edge graph analytics benchmarks | MEDIUM |
| DARPA FETT/BESSPIN | O | Hardware security evaluation | MEDIUM |
| DARPA TC/CDM | O | APT detection data model & datasets | HIGH |
| DARPA POCUS AI | M | Field medical AI | LOW |
| DARPA Memex (DIG/TellFinder) | E+K | OSINT crawl → extract → knowledge graph | HIGH |
| NASA ION-DTN | Network | Delay-tolerant networking for denied environments | HIGH |
| NASA SPICE | K | Precise positioning & timing | MEDIUM |
| MIT LL SPARTA | O | Secure database evaluation | MEDIUM |
| MIT LL pySLGR | M | Speaker/language recognition | HIGH |
| MIT LL CEP | O | Hardware security evaluation platform | LOW |
| CERN ROOT | M | Large-scale statistical analysis | MEDIUM |
| CERN REANA | O | Reproducible workflow orchestration | HIGH |
| TensorFlow Federated | M | Federated learning across distributed nodes | HIGH |
| Google OR-Tools | O | Optimization for resource allocation | HIGH |
| CMU auton-survival | M | Predictive maintenance & time-to-event | HIGH |
| CMU MOMENT | M | Time series foundation model | HIGH |
| USC DIG/myDIG | E | Text → knowledge graph extraction | HIGH |
| USC Web-Karma | E | Data source → knowledge graph mapping | HIGH |
| USC rltk | E | Entity resolution across datasets | HIGH |
| IBM CLAI | O | Natural language command interface | MEDIUM |
| IBM Docling | E | Document processing & extraction | HIGH |
| ABI (Palantir alt) | K | AI Operating System with ontology | CRITICAL |
| Palantir-Gotham-Like | O+K | Open-source intelligence platform | CRITICAL |
| BehaveFormer | O | Continuous behavioral authentication | HIGH |
| RoCA | M | Robust anomaly detection | HIGH |
| Aero-SIGINT | O | Passive EW detection | HIGH |
| vCEW | O | Cognitive electronic warfare | MEDIUM |
| GPS-Denied Drone Nav | O | Indoor autonomous navigation | HIGH |
| Redamon | O | AI-powered security assessment | HIGH |
| Graphiti | K | Temporal knowledge graphs | CRITICAL |
| OpenSPG | K | Enterprise knowledge graph engine | HIGH |
| Memgraph | K | High-performance graph database | HIGH |
| FalkorDB | K | GraphBLAS-powered graph DB | HIGH |
| GrafeoDB | K | Embedded graph database | MEDIUM |
| Apache Flink | E | Real-time stream processing | HIGH |
| Caldera | O | Adversary emulation (MITRE ATT&CK) | HIGH |
| C3 | O | Custom C2 channels | MEDIUM |
| War Probability OSINT | E | Multi-source conflict early warning | MEDIUM |
| Morph-RDB | K | Virtual RDB-to-RDF mapping | MEDIUM |
| RMLStreamer | E | Streaming KG construction | HIGH |
| Apache Jena | K | Semantic web framework + reasoning | MEDIUM |
| GNSS-SDR | O | Software-defined GNSS receiver | LOW |
| Salesforce Merlion | M | Time series ML framework (ARCHIVED - fork!) | HIGH |

---

## Revival Priority Tier List

### TIER 1: Revive Immediately (Critical capability gaps)
1. **ABI** - The only open-source alternative to Palantir with ontology grounding
2. **Palantir-Gotham-Like** - Complete open-source intelligence platform
3. **Graphiti** - Temporal knowledge graphs (facts change over time)
4. **Salesforce Merlion** - ARCHIVED! Fork now before dependencies rot
5. **TensorFlow Federated** - Only production federated learning framework (abandoned by Google)
6. **DARPA Memex/DIG** - Complete OSINT → knowledge graph pipeline
7. **Aero-SIGINT** - $50 EW detection system

### TIER 2: High Value Add (Significant capability enhancement)
8. **Apache OODT** - Multi-sensor data triage (DARPA-proven)
9. **DARPA BRASS/SPIRAL** - Hardware-portable signal processing
10. **DARPA TC/CDM** - APT detection datasets and model
11. **BehaveFormer** - Behavioral biometrics auth
12. **RoCA** - Robust anomaly detection
13. **CMU MOMENT** - Time series foundation model
14. **FalkorDB/Memgraph** - High-performance graph databases
15. **Caldera** - Adversary emulation
16. **GPS-Denied Drone Navigation** - Indoor autonomy

### TIER 3: Worth Exploring (Domain-specific gems)
17. **CERN REANA** - Reproducible workflows
18. **IBM Docling** - Document processing
19. **RMLStreamer** - Streaming KG construction
20. **vCEW** - Cognitive electronic warfare
21. **Redamon** - Autonomous red team
22. **War Probability OSINT** - Conflict early warning
23. **USC Web-Karma/rltk** - Data integration & entity resolution
24. **Google OR-Tools** - Optimization engine
25. **NASA ION-DTN** - Delay-tolerant networking

---

## How to Use This Catalog

1. **Start with TIER 1** - These fill critical gaps that commercial tools charge millions for
2. **Fork archived projects immediately** - Dependencies rot fast; lock them now
3. **Map to your MEOK stack** - Every gem has a layer assignment above
4. **Combine complementary gems** - OODT (ingestion) + DIG (extraction) + Graphiti (temporal KG) = complete intelligence pipeline
5. **Check DARPA program indexes** - The memex-program-index links to 40+ more tools not listed here
6. **Browse NASA's catalog** - 100+ projects, most with <100 stars
7. **MIT Lincoln Lab repos** - Regularly releases open-source tools, check their GitHub org

---

## License & Attribution

This catalog was compiled from publicly available open-source repositories. All projects listed are open-source under various licenses (Apache 2.0, MIT, GPL, BSD). Check individual repositories for license terms before use.

*Compiled for Operation EAT - Lost, Archived & Forgotten Open-Source Gems*

---

*"The best time to plant a tree was 20 years ago. The second best time is now."* - Same goes for reviving abandoned open-source projects.
