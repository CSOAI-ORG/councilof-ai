
import json
import os
import subprocess
import time
from datetime import datetime
from functools import wraps

from flask import Flask, request, jsonify

# --- Configuration ---
GCP_PROJECT_ID = os.environ.get('GCP_PROJECT_ID', 'meok-sovereign-ai')
GCP_REGION = os.environ.get('GCP_REGION', 'europe-west2') # London
GCP_ZONE = os.environ.get('GCP_ZONE', 'europe-west2-a')

# Base image for character VMs
CHARACTER_VM_IMAGE = os.environ.get('CHARACTER_VM_IMAGE', 'debian-cloud/debian-11')
CHARACTER_VM_MACHINE_TYPE = os.environ.get('CHARACTER_VM_MACHINE_TYPE', 'e2-micro')
CHARACTER_VM_DISK_SIZE = os.environ.get('CHARACTER_VM_DISK_SIZE', '10GB') # Small disk for cost efficiency

# Path to the character MCP code repository (to be deployed on character VMs)
CHARACTER_MCP_REPO = os.environ.get('CHARACTER_MCP_REPO', 'https://github.com/CSOAI-ORG/meok-character-mcp.git')

# --- Flask App Setup ---
app = Flask(__name__)

# --- Utility Functions ---
def gcloud_command(cmd, log_prefix="GCLOUD"):
    """Executes a gcloud command and returns stdout/stderr."""
    full_cmd = ['gcloud'] + cmd + [
        '--project', GCP_PROJECT_ID,
        '--region', GCP_REGION,
        '--zone', GCP_ZONE,
        '--format', 'json'
    ]
    print(f"[{log_prefix}] Executing: {' '.join(full_cmd)}")
    try:
        result = subprocess.run(full_cmd, capture_output=True, text=True, check=True)
        return json.loads(result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"[{log_prefix} ERROR] Command failed: {e.cmd}")
        print(f"[{log_prefix} ERROR] Stdout: {e.stdout}")
        print(f"[{log_prefix} ERROR] Stderr: {e.stderr}")
        raise
    except json.JSONDecodeError as e:
        print(f"[{log_prefix} ERROR] JSON decode error: {e}")
        print(f"[{log_prefix} ERROR] Raw stdout: {result.stdout}") # Assuming 'result' is in scope from try block
        raise

def log_event(event_type, character_id, details):
    """Logs an event to a persistent store (placeholder for now)."""
    timestamp = datetime.now().isoformat()
    log_entry = {
        "timestamp": timestamp,
        "event_type": event_type,
        "character_id": character_id,
        "details": details
    }
    print(f"[EVENT LOG] {json.dumps(log_entry)}")
    # TODO: Integrate with data_lake.py for persistent storage

# --- Decorators for authentication/authorization (placeholder) ---
def sovereign_auth_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Placeholder for Ed25519 signature verification or similar
        # For now, just a print statement
        print("[AUTH] Sovereign authentication check (placeholder)")
        return f(*args, **kwargs)
    return decorated_function

# --- GCP VM Management Functions ---

def create_character_vm(character_id, scp_data, vm_name=None):
    """Provisions a new GCP VM for a MEok.ai character."""
    vm_name = vm_name or f"meok-character-{character_id.lower()[:10]}-{int(time.time())}" # Unique VM name
    metadata = [
        f"character-id={character_id}",

        f"startup-script-url=gs://{GCP_PROJECT_ID}/startup-script.sh" # Assumes a GCS bucket for startup script
    ]

    # Startup script to install dependencies, clone repo, run character MCP
    startup_script_content = f"""#!/bin/bash
sudo apt-get update -y
sudo apt-get install -y python3 python3-pip git
python3 -m pip install uv
cd /home/meok-character
git clone {CHARACTER_MCP_REPO} .
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt # Assumes requirements.txt in repo
# Start character MCP (replace with actual command)
# Example: nohup python3 character_mcp.py --character-id {character_id} --scp '{json.dumps(scp_data)}' > character_mcp.log 2>&1 &
echo "Character VM startup script completed for {character_id}"
"""
    # Upload startup script to GCS (ensure bucket exists and is accessible)
    # This is a temporary way to handle startup scripts; for production, use Terraform or build custom images
    # For now, we'll write it directly into the instance create command for simplicity and immediate testing
    # In a real scenario, this would be uploaded to GCS and referenced by URL
    # Or, preferably, baked into a custom image.

    cmd = [
        'compute', 'instances', 'create', vm_name,
        '--machine-type', CHARACTER_VM_MACHINE_TYPE,
        '--image-family', CHARACTER_VM_IMAGE,
        '--boot-disk-size', CHARACTER_VM_DISK_SIZE,
        '--metadata-from-file', f"startup-script=/tmp/startup-script-{vm_name}.sh", # Point to a temporary file
        '--metadata', ','.join(metadata),
        '--preemptible', # Use preemptible VMs for cost optimization
        '--tags', 'meok-character-mcp'
    ]

    # Create a temporary startup script file
    startup_script_path = f"/tmp/startup-script-{vm_name}.sh"
    with open(startup_script_path, "w") as f:
        f.write(startup_script_content)
    os.chmod(startup_script_path, 0o755) # Make it executable

    try:
        result = gcloud_command(cmd, log_prefix=f"CREATE_VM({character_id})")
        log_event("VM_CREATED", character_id, {"vm_name": vm_name, "details": result})
        return {"vm_name": vm_name, "details": result}
    finally:
        os.remove(startup_script_path) # Clean up temporary file

def delete_character_vm(vm_name):
    """De-provisions a GCP VM."""
    cmd = ['compute', 'instances', 'delete', vm_name, '--quiet']
    result = gcloud_command(cmd, log_prefix=f"DELETE_VM({vm_name})")
    log_event("VM_DELETED", vm_name, {"details": result})
    return {"vm_name": vm_name, "details": result}

def list_character_vms(character_id=None):
    """Lists active character VMs."""
    cmd = ['compute', 'instances', 'list', '--filter=tags:meok-character-mcp']
    if character_id:
        cmd[2:2] = [f'--filter=metadata.character-id={character_id}']
    result = gcloud_command(cmd, log_prefix="LIST_VMS")
    return result

# --- API Endpoints ---
@app.route('/hatch', methods=['POST'])
@sovereign_auth_required
def hatch_character():
    """Hatch a new MEok.ai character by provisioning a GCP VM."""
    data = request.json
    character_id = data.get('character_id')
    scp_data = data.get('scp_data') # Sovereign Character Profile data

    if not character_id or not scp_data:
        return jsonify({"error": "character_id and scp_data are required"}), 400

    # Basic check to prevent duplicate VM creation for the same character_id for now
    existing_vms = list_character_vms(character_id=character_id)
    if existing_vms and len(existing_vms) > 0:
        # TODO: This logic needs to be more robust for updates vs. new
        return jsonify({"message": f"Character VM for {character_id} already exists.", "vms": existing_vms}), 200

    try:
        vm_info = create_character_vm(character_id, scp_data)
        return jsonify({"message": "Character hatched successfully", "vm_info": vm_info}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/dehatch', methods=['POST'])
@sovereign_auth_required
def dehatch_character():
    """De-hatch a MEok.ai character by de-provisioning its GCP VM."""
    data = request.json
    vm_name = data.get('vm_name')

    if not vm_name:
        return jsonify({"error": "vm_name is required"}), 400

    try:
        delete_character_vm(vm_name)
        return jsonify({"message": f"Character VM {vm_name} de-hatched successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/list', methods=['GET'])
@sovereign_auth_required
def get_character_vms():
    """List all active MEok.ai character VMs."""
    try:
        vms = list_character_vms()
        return jsonify(vms), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "ok", "timestamp": datetime.now().isoformat()}), 200

if __name__ == '__main__':
    # For development: run directly
    # In production, use Gunicorn or similar WSGI server
    app.run(debug=True, host='0.0.0.0', port=5000)

