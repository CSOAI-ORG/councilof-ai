#!/usr/bin/env bash
# Installs every pinned decoder into ./tools (idempotent). Verifies checksums / commits; fails closed.
set -euo pipefail
LANE="$(cd "$(dirname "$0")" && pwd)"; T="$LANE/tools"; mkdir -p "$T/jars" "$T/src"
export UV_CACHE_DIR="$T/uvcache" UV_PYTHON_INSTALL_DIR="$T/pythons"

free_kb=$(df -Pk "$LANE" | awk 'NR==2{print $4}')
if [ "$free_kb" -lt $((2*1024*1024)) ]; then echo "setup: under 2 GB free at $LANE; refusing" >&2; exit 3; fi

fetch() { # url dest sha256
  if [ ! -f "$2" ] || ! echo "$3  $2" | sha256sum -c --quiet - 2>/dev/null; then curl -sSfL -o "$2" "$1"; fi
  echo "$3  $2" | sha256sum -c --quiet - || { echo "setup: checksum mismatch for $2" >&2; exit 4; }
}
# JDK (Temurin 17.0.12+7)
fetch "https://api.adoptium.net/v3/binary/version/jdk-17.0.12%2B7/linux/x64/jdk/hotspot/normal/eclipse?project=jdk" \
      "$T/jdk17.tgz" 9d4dd339bf7e6a9dcba8347661603b74c61ab2a5083ae67bf76da6285da8a778
[ -x "$T/jdk-17.0.12+7/bin/java" ] || tar -C "$T" -xzf "$T/jdk17.tgz"
# JRecord / cb2xml (GitHub release assets) and Cobrix (Maven Central)
fetch https://github.com/bmTas/JRecord/releases/download/0.93.3/jrecord-0.93.3.jar "$T/jars/jrecord-0.93.3.jar" \
      cc6f4c7d9846344205a9b9d388edcb3db3149db5b6e6629ac06121730f13092d
fetch https://github.com/bmTas/cb2xml/releases/download/1.01.08/cb2xml.jar "$T/jars/cb2xml-1.01.08.jar" \
      4d4fce7a9f590d2bbcd138a4eee4cfcafb40b4dcbe76d1f2f39b7085db5c81b2
M=https://repo1.maven.org/maven2/za/co/absa/cobrix
fetch $M/spark-cobol_2.12/2.11.1/spark-cobol_2.12-2.11.1.jar "$T/jars/spark-cobol_2.12-2.11.1.jar" \
      c2e19f7d0045954fca50f0c8ed8d51fa592ad2d9979033af35619793708fd9d8
fetch $M/cobol-parser_2.12/2.11.1/cobol-parser_2.12-2.11.1.jar "$T/jars/cobol-parser_2.12-2.11.1.jar" \
      353060ff3e293f01596693c111cd873592808b9da4c169c952beaaf68329f77a
# git sources at pinned commits
clone() { # url dir commit
  [ -d "$T/src/$2/.git" ] || git clone -q "$1" "$T/src/$2"
  git -C "$T/src/$2" fetch -q origin "$3" 2>/dev/null || true
  git -C "$T/src/$2" checkout -q --detach "$3"
  [ "$(git -C "$T/src/$2" rev-parse HEAD)" = "$3" ] || { echo "setup: $2 not at $3" >&2; exit 5; }
}
clone https://github.com/aws-samples/mainframe-data-utilities.git mainframe-data-utilities 5fc427629e51b87d4c6310860cac6f93c0eb756c
clone https://github.com/wilcoyay/copybook-parser.git copybook-parser 82ebbec9ba4c117a39e0ac3225cf910a576c3bdc
# Python 3.11 venv with an exact lock (all transitive packages pinned)
[ -x "$T/venv/bin/python" ] || uv venv -q --python 3.11.8 "$T/venv"
uv pip sync -q --python "$T/venv/bin/python" "$LANE/requirements.lock"
echo "setup: ok"
