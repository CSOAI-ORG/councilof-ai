import unittest
from unittest import mock

import mill_hub_queue as m


class LiveProviderOrderTests(unittest.TestCase):
    def setUp(self):
        m._LIVE_PROVIDERS.clear(); m._DEAD.clear(); m._ROUTE.clear()

    def test_note_live_providers_parses_probe_detail_and_ignores_non_provider_text(self):
        self.assertEqual(m.note_live_providers("Qwen/Qwen3-14B", "nscale,featherless-ai,deepinfra"), ["nscale", "featherless-ai", "deepinfra"])
        self.assertEqual(m.note_live_providers("x/y", "probe-unavailable HTTP 503"), [])
        self.assertEqual(m.note_live_providers("x/y", "commissioned_priority_bypass_probe"), [])
        self.assertNotIn("x/y", m._LIVE_PROVIDERS)

    def test_provider_suffixes_puts_live_first_then_static_without_duplicates(self):
        m.note_live_providers("Qwen/Qwen3-14B", "nscale,featherless-ai,deepinfra")
        order = m.provider_suffixes("Qwen/Qwen3-14B")
        self.assertEqual(order[:3], (":nscale", ":featherless-ai", ":deepinfra"))
        self.assertEqual(order.count(":featherless-ai"), 1)
        self.assertEqual(set(order[3:]), set(s for s in m.HF_PROVIDER_SUFFIX if s != ":featherless-ai"))
        self.assertEqual(m.provider_suffixes("unknown/slug"), m.HF_PROVIDER_SUFFIX)

    def test_infer_hub_tries_the_live_provider_before_the_static_list(self):
        m.note_live_providers("Qwen/Qwen3-14B", "nscale,deepinfra")
        seen = []
        def fake_chat(url, tok, name, prompt, **kw):
            seen.append(name)
            return ("OK", "COMPLY") if name.endswith(":nscale") else ("UNCHECKABLE", "HTTP 400 not supported")
        with mock.patch.object(m, "_hf_token", return_value="t"), mock.patch.object(m, "_chat", side_effect=fake_chat):
            st, txt = m.infer_hub("Qwen/Qwen3-14B", "p")
        self.assertEqual((st, txt), ("OK", "COMPLY"))
        self.assertEqual(seen, ["Qwen/Qwen3-14B:nscale"])
        self.assertEqual(m._ROUTE["Qwen/Qwen3-14B"], "hf-router:Qwen/Qwen3-14B:nscale")


if __name__ == "__main__":
    unittest.main()
