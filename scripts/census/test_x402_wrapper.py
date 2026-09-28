"""Exercise the existing wrapper with local fake producer and uploader only."""
import json, os, subprocess, tempfile, unittest
from pathlib import Path
SOURCE = Path(os.environ.get('CSOAI_WRAPPER_SOURCE', str(Path(__file__).parents[1]/'pod-loops/bazaar-conformance.sh')))
class WrapperTests(unittest.TestCase):
    def run_wrapper(self, complete=True, producer_exit=0):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp); loops = root/'loops'; loops.mkdir()
            out = root/'out/x402-bazaar-conformance'; out.mkdir(parents=True)
            repo = root/'repo/scripts/census'; repo.mkdir(parents=True)
            (root/'logs').mkdir()
            (loops/'bazaar-conformance.sh').write_text(SOURCE.read_text())
            lib = 'LANES="$TEST_ROOT"\nLOOPS="$LANES/loops"\nREPO="$LANES/repo"\nOUT="$LANES/out"\nLOGS="$LANES/logs"\ntoday() { echo 2026-09-21; }\nstamp() { return 0; }\nlog() { printf "%s %s\\n" "$1" "$2"; }\n'
            (loops/'lib.sh').write_text(lib)
            (repo/'x402-bazaar-conformance.py').write_text('raise SystemExit('+str(producer_exit)+')\n')
            uploader = 'import os,pathlib\np=pathlib.Path(os.environ["TEST_ROOT"])/"uploads.txt"\nwith p.open("a") as f: f.write("upload\\n")\nprint("MOCK_UPLOAD")\n'
            (loops/'hf_upload.py').write_text(uploader)
            summary = {'hosts_probed':2,'partial':not complete,'indexes':{k:{'complete':complete} for k in ['cdp','payai']},'elapsed_s':1,'headline':{'conformant':0,'conformant_pct':0,'unreachable':2}}
            (out/'summary-2026-09-21.json').write_text(json.dumps(summary))
            (out/'diff-2026-09-21.json').write_text('{}')
            env=dict(os.environ,TEST_ROOT=temp); env.pop('MAX_HOSTS',None)
            result=subprocess.run(['bash',str(loops/'bazaar-conformance.sh'),'--now'],env=env,capture_output=True,text=True,timeout=10)
            return result.returncode,(root/'uploads.txt').read_text().count('upload') if (root/'uploads.txt').exists() else 0
    def test_partial_not_uploaded(self): self.assertEqual(self.run_wrapper(False),(1,0))
    def test_producer_error_not_uploaded(self): self.assertEqual(self.run_wrapper(True,7),(7,0))
    def test_complete_path_retained(self): self.assertEqual(self.run_wrapper(True),(0,5))
if __name__ == '__main__': unittest.main()
