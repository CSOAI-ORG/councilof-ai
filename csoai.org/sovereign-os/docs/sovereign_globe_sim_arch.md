# Sovereign Globe Simulation Engine - Architectural Blueprint (Phase 508.1)

## 1. MEok.ai Character Data Model

Each MEok.ai character will be represented as a Sovereign Character Profile (SCP), a JSON-serializable structure containing:

*   **`character_id` (string):** Unique Ed25519 public key of the character's sovereign identity.
*   **`name` (string):** Human-readable character name.
*   **`model_3d_path` (string):** URL or local path to the character's 3D model (e.g., glTF, GLB).
*   **`current_location` (object):**
    *   `latitude` (float): WGS84 latitude.
    *   `longitude` (float): WGS84 longitude.
    *   `altitude` (float): Altitude above terrain in meters.
    *   `heading` (float): Current direction in degrees (0-360).
*   **`status` (string):** Current operational status (e.g., "active", "idle", "patrolling", "repair").
*   **`behavior_profile_id` (string):** Reference to a pre-defined behavior profile (e.g., "theme_park_guest", "hospital_staff", "delivery_drone").
*   **`health_metrics` (object):** (Optional, for Theme Hospital style simulation)
    *   `energy` (float): Current energy level (0-100).
    *   `mood` (float): Current mood (0-100).
*   **`inventory` (array):** (Optional, for Rollercoaster Tycoon style simulation)
    *   List of items held by the character.
*   **`last_update_sigil` (string):** Ed25519 signature of the last state update, ensuring provenance.

## 2. GCP VM Orchestration for MEok.ai Character MCPs

Each active MEok.ai character will have a dedicated GCP e2-micro VM running its character MCP (a Python application). This ensures isolation, scalability, and adherence to the `sovereign-cloud-cost-control` doctrine.

### 2.1. VM Provisioning and Lifecycle Management

*   **`character_hatch_mcp`:** A new master MCP responsible for:
    *   Receiving requests to "hatch" or "de-hatch" characters.
    *   Interacting with Google Cloud APIs (via `gcloud` CLI or Python client library) to provision/deprovision e2-micro VMs.
    *   Deploying the character's specific MCP code to the VM (e.g., via `git pull` from a private repo, or `pip install` from a private PyPI).
    *   Configuring the VM with the character's initial `SCP` and its unique Ed25519 keypair.
    *   Exposing a health endpoint and logging mechanism for monitoring.
*   **Terraform Integration:** Leverage existing Terraform (e.g., `28-hives.tf.json`) for declarative VM definitions and network configuration, ensuring consistency and auditability.
*   **Cost Optimization:**
    *   Utilize pre-emptible VMs where character persistence is not critical.
    *   Implement aggressive auto-scaling to de-provision idle character VMs.
    *   Monitor GCP billing alerts via the `observability_dashboard.py` to ensure adherence to free-tier/minimal cost principles.

### 2.2. Character MCP Runtime Environment

*   **Base Image:** A minimal Linux image (e.g., Debian slim) with Python 3.11 and `uv` pre-installed.
*   **Character MCP:** A Python application that:
    *   Loads its `SCP` and private key.
    *   Executes its `behavior_profile` (e.g., pathfinding, interaction logic).
    *   Communicates its `current_location` and `status` to the `defoneos-cesium-mcp` via a secure, authenticated channel (e.g., authenticated HTTP POST with Ed25519 signed payloads).
    *   Responds to commands from the `character_hatch_mcp` (e.g., "move to X," "interact with Y").

## 3. Real-time Position and State Update to Cesium Globe

### 3.1. CZML Generation and Streaming

*   **Character MCP Responsibility:** Each MEok.ai character MCP will generate CZML (Cesium Markup Language) packets describing its current state.
*   **`defoneos-cesium-mcp` Endpoint:** The `defoneos-cesium-mcp` will expose a secure HTTP endpoint (`/api/v1/czml_feed`) that accepts signed CZML payloads.
*   **Update Frequency:** Character MCPs will send updates at a configurable frequency (e.g., 1-5 Hz) based on their `behavior_profile` and movement speed.
*   **Authentication:** All CZML updates will be signed by the character's Ed25519 private key, and the `defoneos-cesium-mcp` will verify the signature against the `character_id` (public key).

### 3.2. Cesium Viewer Integration

*   The `generate_cesium_viewer` tool will be extended to:
    *   Include a `WebSocket` or `EventSource` client that subscribes to real-time CZML updates from the `defoneos-cesium-mcp`.
    *   Dynamically add/update Cesium `Entity` objects based on the incoming CZML, ensuring smooth visualization of character movement and state changes.

## 4. Interactive Control and Feedback

*   **Command MCP:** A new `character_command_mcp` will expose endpoints for external agents or user interfaces to issue commands to specific `character_id`s.
*   **Secure Command Channel:** Commands will be Ed25519 signed by the commanding agent/user and relayed through the `character_hatch_mcp` to the target character's VM.
*   **Feedback Loop:** Character MCPs will send acknowledgements and status updates back to the `character_command_mcp` for display or further processing.

## 5. Multi-Agent Interaction and "SimCity" Logic

*   **Behavior Profiles:** Complex "SimCity" logic will be encoded in `behavior_profile`s, managed by a `behavior_engine_mcp`.
*   **Local Interactions:** Character MCPs will be able to detect proximity to other characters and trigger local interactions based on their `behavior_profile`s (e.g., "talk," "trade," "collide").
*   **Global Event Bus:** A sovereign event bus (e.g., built on Nostr) will allow characters to publish significant events and subscribe to global events within the simulation (e.g., "new building constructed," "park opened").
*   **Resource Management:** For "Theme Hospital/Rollercoaster Tycoon" aspects, a `resource_management_mcp` will track shared resources (e.g., money, supplies, happiness levels) and facilitate economic interactions between characters.
