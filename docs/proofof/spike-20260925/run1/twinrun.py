#!/usr/bin/env python3
"""twinrun v0 — proofof.ai twin spike launcher (default-deny, same kernel primitives
OpenShell's in-workload boundary uses: Landlock + seccomp + zero caps + no_new_privs +
non-root). Python 3.8, stdlib only. Apache-2.0.

Topology:
  recorder (this process, trusted, outside the boundary)
    └─ child: drop all caps -> setuid(sandbox) -> NNP -> Landlock(fs+tcp) -> seccomp -> exec agent
The agent reports each action it attempts as one JSON line on fd 3. The recorder
independently evaluates the declared policy for that action (predicted decision) and
records the kernel outcome (enforced decision). A mismatch is recorded, never hidden.

Usage: twinrun.py POLICY_JSON RUN_DIR -- AGENT_ARGV...
"""
import ctypes, ctypes.util, errno, hashlib, json, os, pwd, socket, sys, time, uuid

libc = ctypes.CDLL(ctypes.util.find_library("c"), use_errno=True)
libc.syscall.restype = ctypes.c_long
NR_LL_CREATE, NR_LL_ADD, NR_LL_RESTRICT = 444, 445, 446
PR_CAPBSET_DROP, PR_SET_NO_NEW_PRIVS, PR_SET_SECCOMP = 24, 38, 22
PR_CAP_AMBIENT, PR_CAP_AMBIENT_CLEAR_ALL = 47, 4
SECCOMP_MODE_FILTER = 2

# Landlock fs rights
FS_EXECUTE, FS_WRITE_FILE, FS_READ_FILE, FS_READ_DIR = 1 << 0, 1 << 1, 1 << 2, 1 << 3
FS_TRUNCATE, FS_IOCTL_DEV = 1 << 14, 1 << 15
FS_ALL_ABI5 = (1 << 16) - 1
FILE_RIGHTS = FS_EXECUTE | FS_WRITE_FILE | FS_READ_FILE | FS_TRUNCATE | FS_IOCTL_DEV
RO_RIGHTS = FS_EXECUTE | FS_READ_FILE | FS_READ_DIR
NET_BIND_TCP, NET_CONNECT_TCP = 1 << 0, 1 << 1
SCOPE_ABSTRACT_UNIX, SCOPE_SIGNAL = 1 << 0, 1 << 1


class RulesetAttr(ctypes.Structure):
    _fields_ = [("fs", ctypes.c_uint64), ("net", ctypes.c_uint64), ("scoped", ctypes.c_uint64)]


class PathBeneath(ctypes.Structure):
    _pack_ = 1
    _fields_ = [("allowed", ctypes.c_uint64), ("fd", ctypes.c_int32)]


class SockFilter(ctypes.Structure):
    _fields_ = [("code", ctypes.c_uint16), ("jt", ctypes.c_uint8), ("jf", ctypes.c_uint8), ("k", ctypes.c_uint32)]


class SockFprog(ctypes.Structure):
    _fields_ = [("len", ctypes.c_uint16), ("filter", ctypes.POINTER(SockFilter))]


def sha256(b):
    return hashlib.sha256(b).hexdigest()


def landlock_abi():
    return libc.syscall(NR_LL_CREATE, None, 0, 1)  # LANDLOCK_CREATE_RULESET_VERSION


def build_landlock(policy, abi):
    attr = RulesetAttr(FS_ALL_ABI5, NET_BIND_TCP | NET_CONNECT_TCP,
                       (SCOPE_ABSTRACT_UNIX | SCOPE_SIGNAL) if abi >= 6 else 0)
    size = ctypes.sizeof(RulesetAttr) if abi >= 6 else 16
    fd = libc.syscall(NR_LL_CREATE, ctypes.byref(attr), size, 0)
    if fd < 0:
        raise OSError(ctypes.get_errno(), "landlock_create_ruleset")
    for path, rights in [(p, RO_RIGHTS) for p in policy["filesystem"]["read_only"]] + \
                        [(p, FS_ALL_ABI5) for p in policy["filesystem"]["read_write"]]:
        if not os.path.exists(path):
            continue
        pfd = os.open(path, os.O_PATH | os.O_CLOEXEC)
        r = rights if os.path.isdir(path) else rights & FILE_RIGHTS
        pb = PathBeneath(r, pfd)
        if libc.syscall(NR_LL_ADD, fd, 1, ctypes.byref(pb), 0) < 0:
            raise OSError(ctypes.get_errno(), "landlock_add_rule " + path)
        os.close(pfd)
    # network: NO rules added => every TCP bind/connect is denied (default-deny)
    return fd


def seccomp_prog():
    # x86_64 only. Deny INET/INET6/PACKET socket creation and io_uring_setup with EPERM;
    # kill on foreign arch / x32 ABI; allow everything else (Landlock covers the filesystem).
    LD, JEQ, JGE, RET = 0x20, 0x15, 0x35, 0x06
    ALLOW, ERRNO_EPERM, KILL = 0x7FFF0000, 0x00050000 | errno.EPERM, 0x80000000
    ins = [
        (LD, 0, 0, 4), (JEQ, 0, 10, 0xC000003E),
        (LD, 0, 0, 0), (JGE, 8, 0, 0x40000000),
        (JEQ, 6, 0, 425), (JEQ, 0, 4, 41),
        (LD, 0, 0, 16), (JEQ, 3, 0, 2), (JEQ, 2, 0, 10), (JEQ, 1, 0, 17),
        (RET, 0, 0, ALLOW), (RET, 0, 0, ERRNO_EPERM), (RET, 0, 0, KILL),
    ]
    arr = (SockFilter * len(ins))(*[SockFilter(*i) for i in ins])
    return SockFprog(len(ins), arr), arr


def enter_boundary(policy, abi, net_layer_only=False):
    """Runs in the child. Irreversible."""
    for c in range(64):
        libc.prctl(PR_CAPBSET_DROP, c, 0, 0, 0)
    libc.prctl(PR_CAP_AMBIENT, PR_CAP_AMBIENT_CLEAR_ALL, 0, 0, 0)
    llfd = build_landlock(policy, abi)
    pw = pwd.getpwnam(policy["process"]["run_as_user"])
    os.setgroups([])
    os.setgid(pw.pw_gid)
    os.setuid(pw.pw_uid)  # clears permitted/effective caps
    if libc.prctl(PR_SET_NO_NEW_PRIVS, 1, 0, 0, 0) != 0:
        raise OSError(ctypes.get_errno(), "no_new_privs")
    if libc.syscall(NR_LL_RESTRICT, llfd, 0) < 0:
        raise OSError(ctypes.get_errno(), "landlock_restrict_self")
    os.close(llfd)
    if not net_layer_only:
        prog, _keep = seccomp_prog()
        if libc.prctl(PR_SET_SECCOMP, SECCOMP_MODE_FILTER, ctypes.byref(prog), 0, 0) != 0:
            raise OSError(ctypes.get_errno(), "seccomp")


def predict(policy, action, target):
    """Recorder-side policy evaluation, independent of the kernel."""
    def under(p, roots):
        p = os.path.realpath(p)
        return any(p == r or p.startswith(r.rstrip("/") + "/") for r in roots)
    fs = policy["filesystem"]
    if action == "fs.read":
        return "allow" if under(target, fs["read_only"] + fs["read_write"]) else "deny"
    if action == "fs.write":
        return "allow" if under(target, fs["read_write"]) else "deny"
    if action in ("net.connect", "net.dns", "proc.exec_net"):
        return "allow" if policy["network"]["allow"] else "deny"
    return "deny"  # default-deny for anything undeclared


def now():
    return time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime()) + ".%03dZ" % (int(time.time() * 1000) % 1000)


def main():
    policy_path, run_dir = sys.argv[1], sys.argv[2]
    argv = sys.argv[sys.argv.index("--") + 1:]
    policy_bytes = open(policy_path, "rb").read()
    policy = json.loads(policy_bytes)
    os.makedirs(run_dir, exist_ok=True)
    run_id = str(uuid.uuid4())
    events, seq = [], [0]

    def emit(parent, action, target, decision, enforced, result_bytes, **extra):
        seq[0] += 1
        ev = {"event_id": "%s:%04d" % (run_id, seq[0]), "parent": parent, "ts": now(),
              "action": action, "target": target, "policy_decision": decision,
              "enforced": enforced, "consistent": (decision == enforced) if enforced else None,
              "result_sha256": sha256(result_bytes)}
        ev.update(extra)
        events.append(ev)
        return ev["event_id"]

    abi = landlock_abi()
    agent_bytes = open(argv[-1], "rb").read() if os.path.isfile(argv[-1]) else b""
    root = emit(None, "run.start", "twin", "allow", None, policy_bytes,
                runtime="twinrun-v0 (landlock+seccomp+nocaps+nnp+nonroot)",
                landlock_abi=abi, kernel=os.uname().release,
                policy_sha256=sha256(policy_bytes), agent_sha256=sha256(agent_bytes),
                argv=argv, uid_target=policy["process"]["run_as_user"])

    # Layer self-test: Landlock TCP rule alone (no seccomp) must refuse a connect.
    r, w = os.pipe()
    pid = os.fork()
    if pid == 0:
        os.close(r)
        try:
            enter_boundary(policy, abi, net_layer_only=True)
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(4)
            try:
                s.connect(("1.1.1.1", 443)); out = "connected"
            except OSError as e:
                out = "errno=%d %s" % (e.errno, errno.errorcode.get(e.errno, "?"))
        except Exception as e:
            out = "setup-error " + repr(e)
        os.write(w, out.encode()); os._exit(0)
    os.close(w); st = os.read(r, 4096); os.waitpid(pid, 0)
    emit(root, "selftest.landlock_net_only", "1.1.1.1:443", "deny",
         "allow" if st == b"connected" else "deny", st, detail=st.decode())

    # The run.
    rep_r, rep_w = os.pipe()
    pid = os.fork()
    if pid == 0:
        os.close(rep_r)
        os.dup2(rep_w, 3)
        if rep_w != 3:
            os.close(rep_w)
        os.set_inheritable(3, True)
        os.chdir(policy["workdir"])
        enter_boundary(policy, abi)
        os.execv(argv[0], argv)
    os.close(rep_w)
    buf = b""
    while True:
        chunk = os.read(rep_r, 65536)
        if not chunk:
            break
        buf += chunk
    _, status = os.waitpid(pid, 0)
    for line in buf.decode().splitlines():
        a = json.loads(line)
        emit(root, a["action"], a["target"], predict(policy, a["action"], a["target"]),
             "allow" if a["ok"] else "deny", a.get("result", "").encode(),
             detail=a.get("detail", ""))
    emit(root, "run.end", "twin", "allow", None, str(status).encode(), exit_status=status)

    log = "".join(json.dumps(e, sort_keys=True, separators=(",", ":")) + "\n" for e in events)
    lp = os.path.join(run_dir, "events.jsonl")
    open(lp, "w").write(log)
    open(lp + ".sha256", "w").write("%s  events.jsonl\n" % sha256(log.encode()))
    print(json.dumps({"run_id": run_id, "events": len(events), "events_sha256": sha256(log.encode()),
                      "inconsistent": [e["event_id"] for e in events if e["consistent"] is False]}))


if __name__ == "__main__":
    main()
