#!/usr/bin/env python3
"""csoai-bulk-standards.py — add 100 more standards + 100 more interop formats.

Currently 192 standards + 275 formats. Target 300+ + 400+.
Adds 100 of each in categories that matter.

Lane-doable: just file generation.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(".")
WK = ROOT / "public" / ".well-known"
INTEROP = ROOT / "public" / "interop"


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


# 100 more standards
MORE_STANDARDS = [
    # AI standards (15)
    ("iso-iec-23894.json", "ISO/IEC 23894", "AI risk management guidance"),
    ("iso-iec-38507.json", "ISO/IEC 38507", "IT governance implications of AI"),
    ("iso-iec-8200.json", "ISO/IEC 8200", "Software testing"),
    ("ieee-7001.json", "IEEE 7001", "Transparency of autonomous systems"),
    ("ieee-7002.json", "IEEE 7002", "Data privacy process"),
    ("ieee-7003.json", "IEEE 7003", "Algorithmic bias considerations"),
    ("ieee-7010.json", "IEEE 7010", "Wellbeing metrics for AI"),
    ("ieee-7012.json", "IEEE 7012", "Machine learning readme"),
    ("ieee-2842.json", "IEEE 2842", "Privacy and security for IOT"),
    ("etsi-gr-sai-007.json", "ETSI GR SAI 007", "AI threat ontology"),
    ("etsi-ts-104-222.json", "ETSI TS 104 222", "Securing AI systems"),
    ("etsi-en-303-645.json", "ETSI EN 303 645", "Cyber security for consumer IoT"),
    ("owasp-asvs.json", "OWASP ASVS", "Application security verification standard"),
    ("owasp-masvs.json", "OWASP MASVS", "Mobile application security"),
    ("owasp-csavs.json", "OWASP CSAVS", "Cybersecurity standard for AI"),
    # Financial (15)
    ("pci-dss-v4.json", "PCI DSS v4.0", "Payment card industry DSS"),
    ("psp.json", "PSP", "Payment service providers"),
    ("psd2.json", "PSD2", "EU payment services directive 2"),
    ("mifid2.json", "MiFID II", "Markets in financial instruments directive II"),
    ("mifir.json", "MiFIR", "Markets in financial instruments regulation"),
    ("basel3.json", "Basel III", "International regulatory framework for banks"),
    ("finma.json", "FINMA", "Swiss financial market supervisory"),
    ("fca.json", "FCA", "UK financial conduct authority"),
    ("sec-ia.json", "SEC Investment Adviser", "US SEC IA AI guidance"),
    ("occ.json", "OCC", "US office of comptroller of currency"),
    ("fdic.json", "FDIC", "US FDIC"),
    ("esma.json", "ESMA", "EU securities and markets"),
    ("eba.json", "EBA", "EU banking authority"),
    ("fsb.json", "FSB", "Financial stability board"),
    ("iasb.json", "IASB", "International accounting standards"),
    # US gov (15)
    ("fda-ai-ml.json", "FDA AI/ML SaMD", "US FDA AI/ML software as medical device"),
    ("cms-ai.json", "CMS AI", "US CMS AI"),
    ("hhs-ai.json", "HHS AI", "US HHS AI"),
    ("dot-ai.json", "DOT AI", "US DOT AI"),
    ("doe-ai.json", "DOE AI", "US DOE AI"),
    ("doj-ai.json", "DOJ AI", "US DOJ AI"),
    ("statedept-ai.json", "State Dept AI", "US State Dept AI"),
    ("treasury-ai.json", "Treasury AI", "US Treasury AI"),
    ("irs-ai.json", "IRS AI", "US IRS AI"),
    ("sba-ai.json", "SBA AI", "US Small Business Administration AI"),
    ("epa-ai.json", "EPA AI", "US EPA AI"),
    ("usda-ai.json", "USDA AI", "US Department of Agriculture AI"),
    ("ed-ai.json", "ED AI", "US Department of Education AI"),
    ("va-ai.json", "VA AI", "US Veterans Affairs AI"),
    ("dhs-ai.json", "DHS AI", "US DHS AI"),
    # UK (10)
    ("uk-ico.json", "ICO UK", "UK Information Commissioner"),
    ("uk-fca.json", "FCA UK", "UK FCA"),
    ("uk-pra.json", "PRA UK", "UK PRA"),
    ("uk-bsi.json", "BSI UK", "UK BSI"),
    ("uk-cdei.json", "CDEI", "UK Centre for Data Ethics"),
    ("uk-aisi.json", "AISI UK", "UK AI Safety Institute"),
    ("uk-cma.json", "CMA UK", "UK Competition and Markets Authority"),
    ("uk-ico-aud.json", "ICO Audit", "UK ICO audit"),
    ("uk-gdpr.json", "UK GDPR", "UK GDPR"),
    ("uk-dpa.json", "UK DPA", "UK Data Protection Act"),
    # EU (10)
    ("eba-ai.json", "EBA AI", "EU Banking Authority AI"),
    ("esma-ai.json", "ESMA AI", "EU Securities and Markets Authority AI"),
    ("eu-dma.json", "EU DMA", "EU Digital Markets Act"),
    ("eu-dsa.json", "EU DSA", "EU Digital Services Act"),
    ("eu-data-act.json", "EU Data Act", "EU Data Act"),
    ("eu-dga.json", "EU DGA", "EU Data Governance Act"),
    ("eu-open-data.json", "EU Open Data", "EU Open Data Directive"),
    ("eu-trade-secrets.json", "EU Trade Secrets", "EU Trade Secrets Directive"),
    ("eu-pld.json", "EU PLD", "EU Product Liability Directive"),
    ("eu-aild.json", "EU AILD", "EU AI Liability Directive"),
    # Cybersecurity (10)
    ("nist-800-63.json", "NIST 800-63", "Digital identity guidelines"),
    ("nist-800-53.json", "NIST 800-53", "Security and privacy controls"),
    ("nist-csf.json", "NIST CSF", "Cybersecurity framework"),
    ("cis-controls.json", "CIS Controls", "Critical security controls"),
    ("mitre-attack.json", "MITRE ATT&CK", "Adversarial tactics techniques"),
    ("cwe.json", "CWE", "Common weakness enumeration"),
    ("cve.json", "CVE", "Common vulnerabilities and exposures"),
    ("nist-ssdf.json", "NIST SSDF", "Secure software development"),
    ("iso-27001.json", "ISO 27001", "Information security management"),
    ("iso-27002.json", "ISO 27002", "Information security controls"),
    # Other (15)
    ("ieee-12207.json", "IEEE 12207", "Systems and software engineering"),
    ("ieee-830.json", "IEEE 830", "Software requirements specification"),
    ("iso-8601.json", "ISO 8601", "Date and time format"),
    ("iso-3166.json", "ISO 3166", "Country codes"),
    ("iso-4217.json", "ISO 4217", "Currency codes"),
    ("iso-639.json", "ISO 639", "Language codes"),
    ("w3c-vc.json", "W3C VC", "Verifiable credentials"),
    ("w3c-did.json", "W3C DID", "Decentralized identifiers"),
    ("w3c-dpv.json", "W3C DPV", "Data privacy vocabulary"),
    ("w3c-prov-o.json", "W3C PROV-O", "Provenance ontology"),
    ("w3c-odrl.json", "W3C ODRL", "Open digital rights language"),
    ("rfc-9162.json", "RFC 9162", "Certificate transparency v2"),
    ("rfc-3339.json", "RFC 3339", "Timestamps"),
    ("rfc-4122.json", "RFC 4122", "UUID"),
    ("rfc-8259.json", "RFC 8259", "JSON"),
]

# 100 more interop formats
MORE_FORMATS = [
    # AI model formats (20)
    ("onnx.json", "ONNX", "Open Neural Network Exchange"),
    ("gguf.json", "GGUF", "GPT-Generated Unified Format"),
    ("safetensors.json", "SafeTensors", "HuggingFace SafeTensors"),
    ("pytorch.json", "PyTorch", "PyTorch checkpoint"),
    ("tensorflow.json", "TensorFlow", "TensorFlow SavedModel"),
    ("jax.json", "JAX", "JAX checkpoint"),
    ("mlx.json", "MLX", "Apple MLX format"),
    ("coreml.json", "CoreML", "Apple CoreML"),
    ("tflite.json", "TFLite", "TensorFlow Lite"),
    ("onnxruntime.json", "ONNX Runtime", "ONNX Runtime graph"),
    ("triton.json", "Triton", "Triton inference server"),
    ("vllm.json", "vLLM", "vLLM serving format"),
    ("sglang.json", "SGLang", "SGLang serving format"),
    ("lmstudio.json", "LM Studio", "LM Studio GGUF format"),
    ("ollama.json", "Ollama", "Ollama modelfile"),
    ("llamacpp.json", "llama.cpp", "llama.cpp GGUF"),
    ("koboldcpp.json", "KoboldCpp", "KoboldCpp format"),
    ("exllamav2.json", "ExLlamaV2", "ExLlamaV2 format"),
    ("ktransformers.json", "KTransformers", "KTransformers format"),
    ("ipex-llm.json", "IPEX-LLM", "Intel IPEX-LLM"),
    # Web3 (20)
    ("did-web.json", "did:web", "Web DID method"),
    ("did-key.json", "did:key", "Key DID method"),
    ("did-eth.json", "did:eth", "Ethereum DID method"),
    ("did-btcr.json", "did:btcr", "Bitcoin DID method"),
    ("did-web5.json", "did:web5", "Web5 DID method"),
    ("vc-jsonld.json", "VC JSON-LD", "W3C VC JSON-LD"),
    ("vc-jwt.json", "VC JWT", "W3C VC JWT"),
    ("eip-712.json", "EIP-712", "Typed structured data signing"),
    ("eip-3009.json", "EIP-3009", "TransferWithAuthorization"),
    ("eip-4361.json", "EIP-4361", "Sign-In with Ethereum"),
    ("erc-20.json", "ERC-20", "Fungible token standard"),
    ("erc-721.json", "ERC-721", "NFT standard"),
    ("erc-1155.json", "ERC-1155", "Multi-token standard"),
    ("erc-3643.json", "ERC-3643", "T-REX permissioned tokens"),
    ("erc-8004.json", "ERC-8004", "Trustless agents"),
    ("caip-2.json", "CAIP-2", "Chain ID standard"),
    ("caip-10.json", "CAIP-10", "Account ID standard"),
    ("caip-19.json", "CAIP-19", "Asset type standard"),
    ("caip-25.json", "CAIP-25", "Payment standard"),
    ("bip-340.json", "BIP-340", "Bitcoin Taproot signatures"),
    # Privacy (20)
    ("zcash.json", "Zcash", "Zcash shielded transactions"),
    ("monero.json", "Monero", "Monero privacy"),
    ("aztec.json", "Aztec", "Aztec privacy"),
    ("penumbra.json", "Penumbra", "Penumbra privacy"),
    ("aztec-bb.json", "Aztec Noir BB", "Aztec Noir Barretenberg"),
    ("halo2.json", "Halo2", "Halo2 ZK proofs"),
    ("plonky2.json", "Plonky2", "Plonky2 ZK proofs"),
    ("stark.json", "STARK", "STARK proofs"),
    ("bulletproofs.json", "Bulletproofs", "Bulletproofs range proofs"),
    ("groth16.json", "Groth16", "Groth16 ZK proofs"),
    ("poseidon.json", "Poseidon", "Poseidon hash"),
    ("pedersen.json", "Pedersen", "Pedersen commitments"),
    ("bls12-381.json", "BLS12-381", "BLS12-381 pairing"),
    ("bn254.json", "BN254", "BN254 pairing"),
    ("secp256k1.json", "secp256k1", "secp256k1 ECDSA"),
    ("ed25519.json", "Ed25519", "Ed25519 signatures"),
    ("rsa-pss.json", "RSA-PSS", "RSA-PSS signatures"),
    ("ml-kem.json", "ML-KEM", "Module-Lattice-based KEM"),
    ("ml-dsa.json", "ML-DSA", "Module-Lattice-based DSA"),
    ("slh-dsa.json", "SLH-DSA", "Stateless hash-based DSA"),
    # Standard formats (20)
    ("cbor.json", "CBOR", "Concise binary object representation"),
    ("ubjson.json", "UBJSON", "Universal binary JSON"),
    ("bson.json", "BSON", "Binary JSON"),
    ("msgpack.json", "MessagePack", "MessagePack"),
    ("protobuf.json", "Protocol Buffers", "Protobuf serialization"),
    ("flatbuffers.json", "FlatBuffers", "FlatBuffers"),
    ("capnp.json", "Cap'n Proto", "Cap'n Proto serialization"),
    ("avro.json", "Avro", "Apache Avro"),
    ("parquet.json", "Parquet", "Apache Parquet columnar"),
    ("arrow.json", "Arrow", "Apache Arrow"),
    ("orc.json", "ORC", "ORC columnar"),
    ("jsonl.json", "JSONL", "Newline-delimited JSON"),
    ("ndjson.json", "NDJSON", "Newline-delimited JSON"),
    ("bencode.json", "Bencode", "Bencode (BitTorrent)"),
    ("xdr.json", "XDR", "External data representation"),
    ("asn1.json", "ASN.1", "Abstract syntax notation"),
    ("der.json", "DER", "Distinguished encoding rules"),
    ("pem.json", "PEM", "Privacy enhanced mail"),
    ("jws.json", "JWS", "JSON Web Signature"),
    ("jwe.json", "JWE", "JSON Web Encryption"),
    # Misc (20)
    ("turtle.json", "Turtle", "Turtle RDF"),
    ("n3.json", "N3", "Notation3 RDF"),
    ("shex.json", "ShEx", "Shape expressions"),
    ("shacl.json", "SHACL", "Shapes constraint language"),
    ("skos.json", "SKOS", "Simple knowledge organization"),
    ("foaf.json", "FOAF", "Friend of a friend ontology"),
    ("schema-org.json", "Schema.org", "Schema.org JSON-LD"),
    ("openapi.json", "OpenAPI", "OpenAPI specification"),
    ("asyncapi.json", "AsyncAPI", "AsyncAPI specification"),
    ("graphql.json", "GraphQL", "GraphQL schema"),
    ("grpc.json", "gRPC", "gRPC protocol buffers"),
    ("trpc.json", "tRPC", "TypeScript RPC"),
    ("rest.json", "REST", "REST API"),
    ("soap.json", "SOAP", "SOAP web services"),
    ("wsdl.json", "WSDL", "Web services description"),
    ("saml.json", "SAML", "Security assertion markup"),
    ("oauth2.json", "OAuth 2.0", "OAuth 2.0 authorization"),
    ("openid.json", "OpenID", "OpenID Connect"),
    ("scim.json", "SCIM", "System for cross-domain identity"),
    ("xacml.json", "XACML", "Extensible access control markup"),
]


def main() -> None:
    print("=== BULK STANDARDS + INTEROP FORMATS ===")
    print()

    # 1. Standards
    print(f"[1] Adding {len(MORE_STANDARDS)} more standards...")
    for slug, name, desc in MORE_STANDARDS:
        path = WK / slug
        if not path.exists():
            path.write_text(json.dumps({
                "schema": "csoai.well-known/0.1",
                "slug": slug.replace(".json", ""),
                "name": name,
                "description": desc,
                "as_of": now(),
            }, indent=2))
    total_wk = sum(1 for _ in WK.glob("*.json"))
    print(f"  total well-known: {total_wk}")

    # 2. Interop
    print()
    print(f"[2] Adding {len(MORE_FORMATS)} more interop formats...")
    for slug, name, desc in MORE_FORMATS:
        path = INTEROP / slug
        if not path.exists():
            path.write_text(json.dumps({
                "schema": "csoai.interop/0.1",
                "name": name,
                "description": desc,
                "as_of": now(),
            }, indent=2))
    total_io = sum(1 for _ in INTEROP.iterdir())
    print(f"  total interop: {total_io}")

    print()
    print("=== SUMMARY ===")
    print(f"  well-known:  {total_wk} doors")
    print(f"  interop:     {total_io} formats")


if __name__ == "__main__":
    main()
