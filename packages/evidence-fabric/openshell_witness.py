# SPDX-License-Identifier: Apache-2.0
"""Canonical typed OpenShell witness outcomes, shared by source and packaged readers.

This is a bounded result vocabulary, not witness authentication or a new adapter.
Unknown values remain unknown on every host platform.
"""
from __future__ import annotations

from typing import Any

# Fixed witness-format vocabulary, not the executing host's errno table. A log
# must have the same interpretation on Linux and macOS. Unknown names stay unknown.
WITNESS_ERRNO_NAMES = frozenset("""
E2BIG EACCES EADDRINUSE EADDRNOTAVAIL EADV EAFNOSUPPORT EAGAIN EALREADY EBADE EBADF
EBADFD EBADMSG EBADR EBADRQC EBADSLT EBFONT EBUSY ECANCELED ECHILD ECHRNG ECOMM
ECONNABORTED ECONNREFUSED ECONNRESET EDEADLK EDEADLOCK EDESTADDRREQ EDOM EDOTDOT
EDQUOT EEXIST EFAULT EFBIG EHOSTDOWN EHOSTUNREACH EIDRM EILSEQ EINPROGRESS EINTR
EINVAL EIO EISCONN EISDIR EISNAM EKEYEXPIRED EKEYREJECTED EKEYREVOKED EL2HLT EL2NSYNC
EL3HLT EL3RST ELIBACC ELIBBAD ELIBEXEC ELIBMAX ELIBSCN ELNRNG ELOOP EMEDIUMTYPE
EMFILE EMLINK EMSGSIZE EMULTIHOP ENAMETOOLONG ENAVAIL ENETDOWN ENETRESET ENETUNREACH
ENFILE ENOANO ENOBUFS ENOCSI ENODATA ENODEV ENOENT ENOEXEC ENOKEY ENOLCK ENOLINK
ENOMEDIUM ENOMEM ENOMSG ENONET ENOPKG ENOPROTOOPT ENOSPC ENOSR ENOSTR ENOSYS
ENOTBLK ENOTCONN ENOTDIR ENOTEMPTY ENOTNAM ENOTRECOVERABLE ENOTSOCK ENOTSUP ENOTTY
ENOTUNIQ ENXIO EOPNOTSUPP EOVERFLOW EOWNERDEAD EPERM EPFNOSUPPORT EPIPE EPROTO
EPROTONOSUPPORT EPROTOTYPE ERANGE EREMCHG EREMOTE EREMOTEIO ERESTART ERFKILL EROFS
ESHUTDOWN ESOCKTNOSUPPORT ESPIPE ESRCH ESRMNT ESTALE ESTRPIPE ETIME ETIMEDOUT
ETOOMANYREFS ETXTBSY EUCLEAN EUNATCH EUSERS EWOULDBLOCK EXDEV EXFULL
""".split())



def witness_outcome(w: Any) -> bool | None:
    """Typed effect observation; None means unknown, never a failed operation.

    This evaluates the existing witness format only. It does not authenticate
    the witness or establish independence. In particular bool is not an integer
    result and a string such as "false" is not an egress boolean.
    """
    if not isinstance(w, dict):
        return None
    if w.get("kind") == "egress":
        value = w.get("left")
        return value if type(value) is bool else None
    if w.get("kind") not in ("file", "syscall"):
        return None
    value = w.get("result")
    if type(value) is int and value == 0:
        return True
    if not isinstance(value, str):
        return None
    if value.lower() in ("ok", "0", "success"):
        return True
    if value in WITNESS_ERRNO_NAMES:
        return False
    return None
