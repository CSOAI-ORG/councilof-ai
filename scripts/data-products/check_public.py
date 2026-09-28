#!/usr/bin/env python3
"""No-new-disclosure check: every verbatim file in a staged dataset must already be served, byte-identical,
by councilof.ai (redirects followed, e.g. to the public evidence mirror). Reads croissant.json's
distribution (description 'verbatim copy of <url>', sha256). One GET per file, >= 1 s apart, named UA.

    python3 check_public.py DIR [DIR...]      # exit 1 if any file is not served identically
"""
import hashlib
import json
import os
import sys
import time
import urllib.request

UA = "CSOAI-data-products-lane/0.1 (+https://councilof.ai/contact)"


def main():
    bad, n = [], 0
    for d in sys.argv[1:]:
        cr = json.load(open(os.path.join(d, "croissant.json")))
        for fo in cr["distribution"]:
            desc = fo.get("description", "")
            if not desc.startswith("verbatim copy of "):
                continue
            url = desc[len("verbatim copy of "):]
            n += 1
            try:
                r = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=60)
                got = hashlib.sha256(r.read()).hexdigest()
                final = r.geturl()
            except Exception as e:
                got, final = f"ERR {type(e).__name__} {getattr(e, 'code', '')}", url
            same = got == fo["sha256"]
            if not same:
                bad.append(f"{os.path.basename(d)}/{fo['name']}: {url} -> {got[:20]}")
            print(("SAME " if same else "DIFF ") + f"{os.path.basename(d)}/{fo['name']}" + (f"  (via {final})" if final != url else ""))
            time.sleep(1.05)
    print(f"{n} verbatim files checked against the live site; {len(bad)} not served identically")
    for b in bad:
        print("  " + b)
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
