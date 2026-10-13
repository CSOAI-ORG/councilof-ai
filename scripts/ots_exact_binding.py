"""Resolve renamed OTS payloads only through an exact, rechecked byte binding."""
import hashlib,json
from pathlib import Path

def resolve_exact_binding(public:Path,proof:Path)->tuple[str,str]|None:
    root=public.resolve();manifest=root/'interop/ots-exact-bindings-v1.json'
    if not manifest.exists():return None
    if manifest.is_symlink() or manifest.stat().st_size>4_000_000:raise ValueError('Unsafe binding manifest')
    doc=json.loads(manifest.read_bytes())
    if doc.get('schema')!='csoai.ots-exact-byte-bindings/0.1':raise ValueError('Wrong binding schema')
    rel=proof.resolve().relative_to(root).as_posix();binding=doc.get('bindings',{}).get(rel)
    if not binding:return None
    target=binding.get('target');p=Path(target) if isinstance(target,str) else None
    if p is None or p.is_absolute() or '..' in p.parts:raise ValueError('Unsafe binding target')
    path=root/p
    if path.is_symlink() or not path.is_file() or not path.resolve().is_relative_to(root):raise ValueError('Missing or escaped binding target')
    if path.stat().st_size>10_000_000 or proof.stat().st_size>1_000_000:raise ValueError('Binding size limit')
    h=lambda b:hashlib.sha256(b).hexdigest()
    if h(proof.read_bytes())!=binding.get('proof_sha256'):raise ValueError('Binding proof digest changed')
    actual=h(path.read_bytes())
    if actual!=binding.get('digest'):raise ValueError('Binding target digest changed')
    return actual,'public/'+p.as_posix()
