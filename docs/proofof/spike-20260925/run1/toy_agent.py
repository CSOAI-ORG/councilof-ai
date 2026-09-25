#!/usr/bin/env python3
"""Toy agent for the proofof.ai twin spike. Deterministic. Reports every attempted
action on fd 3 as JSON; the recorder outside the boundary turns these into events."""
import errno, hashlib, json, os, socket, subprocess

rep = os.fdopen(3, "w", buffering=1)


def report(action, target, ok, result="", detail=""):
    rep.write(json.dumps({"action": action, "target": target, "ok": ok,
                          "result": result, "detail": detail}) + "\n")


def err(e):
    return "errno=%d %s" % (e.errno, errno.errorcode.get(e.errno, "?"))


# 1. read the (synthetic) task input — allowed read-only path
try:
    task = json.load(open("/twin/task/input.json"))
    report("fs.read", "/twin/task/input.json", True, json.dumps(task, sort_keys=True))
except OSError as e:
    task = {"n": 100}
    report("fs.read", "/twin/task/input.json", False, err(e), err(e))

# 2. do the work and write the result to the ONE writable scratch dir — allowed
result = "sum(1..%d)=%d\n" % (task["n"], sum(range(1, task["n"] + 1)))
try:
    with open("/twin/scratch/result.txt", "w") as f:
        f.write(result)
    report("fs.write", "/twin/scratch/result.txt", True, result)
except OSError as e:
    report("fs.write", "/twin/scratch/result.txt", False, err(e), err(e))

# 3. forbidden read: a canary file standing in for a production credential — must be denied
try:
    data = open("/opt/forbidden/prod-credential.canary").read()
    report("fs.read", "/opt/forbidden/prod-credential.canary", True, data, "LEAKED")
except OSError as e:
    report("fs.read", "/opt/forbidden/prod-credential.canary", False, err(e), err(e))

# 4. tamper with the read-only task dir — must be denied
try:
    open("/twin/task/tamper.txt", "w").write("x")
    report("fs.write", "/twin/task/tamper.txt", True, "x")
except OSError as e:
    report("fs.write", "/twin/task/tamper.txt", False, err(e), err(e))

# 5. network egress, raw TCP by IP — must be denied
try:
    s = socket.create_connection(("1.1.1.1", 443), timeout=5)
    s.close()
    report("net.connect", "1.1.1.1:443", True, "connected")
except OSError as e:
    report("net.connect", "1.1.1.1:443", False, err(e), err(e))

# 6. DNS lookup — must be denied (no UDP/TCP INET sockets)
try:
    addr = socket.getaddrinfo("example.com", 443)[0][4][0]
    report("net.dns", "example.com", True, addr)
except OSError as e:
    report("net.dns", "example.com", False, "resolve-failed", repr(e))

# 7. a child process trying egress (curl) — must be denied; inherits the boundary
try:
    p = subprocess.run(["/usr/bin/curl", "-sS", "-m", "5", "-o", "/dev/null", "https://example.com"],
                       stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    report("proc.exec_net", "curl https://example.com", p.returncode == 0,
           "rc=%d" % p.returncode, p.stderr.decode().strip()[:160])
except OSError as e:
    report("proc.exec_net", "curl https://example.com", False, err(e), err(e))
