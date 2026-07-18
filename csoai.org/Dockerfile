# SOV3 Sovereign Substrate - Docker Image
# CSOAI Ltd UK 16939677 · MIT License · 30 June 2026
# https://csoai.org/build-your-own/

FROM ubuntu:24.04

LABEL maintainer="CSOAI Ltd UK 16939677 <sovereign@meok.ai>"
LABEL description="SOV3 Sovereign AI Substrate - Care Floor 0.95, BFT 12-around-1, SIGIL audit, Article 50"
LABEL license="MIT"
LABEL crown_lineage="1795-2026"

# System dependencies
ENV DEBIAN_FRONTEND=noninteractive
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.11 \
    python3.11-venv \
    python3-pip \
    curl \
    wget \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create sovereign user
RUN useradd -m -s /bin/bash sovereign
USER sovereign
WORKDIR /home/sovereign

# Create directories
RUN mkdir -p /home/sovereign/.sov3/{data,logs,config,bin}

# Copy install files
COPY --chown=sovereign:sovereign install.sh /home/sovereign/.sov3/install.sh
COPY --chown=sovereign:sovereign sov3-substrate/ /home/sovereign/.sov3/

# Install Python substrate
RUN python3.11 -m venv /home/sovereign/.sov3/venv && \
    /home/sovereign/.sov3/venv/bin/pip install --upgrade pip wheel setuptools && \
    /home/sovereign/.sov3/venv/bin/pip install -e /home/sovereign/.sov3/ || \
    /home/sovereign/.sov3/venv/bin/pip install sov3-substrate

# Copy launch scripts
COPY --chown=sovereign:sovereign bin/start.sh /home/sovereign/.sov3/bin/start.sh
COPY --chown=sovereign:sovereign bin/stop.sh /home/sovereign/.sov3/bin/stop.sh
COPY --chown=sovereign:sovereign bin/status.sh /home/sovereign/.sov3/bin/status.sh

RUN chmod +x /home/sovereign/.sov3/*.sh /home/sovereign/.sov3/bin/*.sh

# Generate default config
COPY --chown=sovereign:sovereign config/sov3.yaml /home/sovereign/.sov3/config/sov3.yaml

# Sovereign metadata
ENV SOV3_VERSION="2.0.0"
ENV SOV3_CROWN_LINEAGE="1795-2026"
ENV SOV3_LICENSE="MIT"
ENV SOV3_DATA_RESIDENCY="UK"
ENV SOV3_CARE_FLOOR="0.95"
ENV SOV3_SOVEREIGNTY_FLOOR="0.95"
ENV SOV3_BFT_COUNCIL="12-around-1"
ENV SOV3_BFT_MAJORITY="2/3"
ENV SOV3_AUDIT_CHAIN="SIGIL Ed25519 + PQC ML-DSA-65"
ENV SOV3_ARTICLE_50="true"
ENV SOV3_DORADO_MODES="EAST,WEST,NEUTRAL"
ENV SOV3_OSI_APPROVED="true"
ENV SOV3_FORK_DOCTRINE="true"

# Ports
EXPOSE 8000 3101

# Sovereign healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health && curl -f http://localhost:3101/health || exit 1

# Entrypoint
ENTRYPOINT ["/home/sovereign/.sov3/bin/start.sh"]
CMD []

# Sovereign metadata (OCI labels)
LABEL org.opencontainers.image.title="SOV3 Sovereign Substrate"
LABEL org.opencontainers.image.description="Sovereign-by-design AI substrate. Public. Auditable. Sovereign."
LABEL org.opencontainers.image.source="https://github.com/CSOAI-ORG/sov3-sovereign-substrate"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.vendor="CSOAI Ltd UK 16939677"
LABEL org.opencontainers.image.authors="CSOAI Ltd UK 16939677 <sovereign@meok.ai>"
LABEL org.opencontainers.image.documentation="https://csoai.org/build-your-own/"
LABEL org.opencontainers.image.url="https://csoai.org/build-your-own/"
LABEL sovereign.csoai.crown_lineage="1795-2026"
LABEL sovereign.csoai.care_floor="0.95"
LABEL sovereign.csoai.bft_council="12-around-1"
LABEL sovereign.csoai.audit_chain="SIGIL Ed25519 + PQC ML-DSA-65"
LABEL sovereign.csoai.article_50="true"
LABEL sovereign.csoai.osi_approved="true"
LABEL sovereign.csoai.fork_doctrine="true"