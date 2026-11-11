import copy
import os
from contextlib import contextmanager
from types import SimpleNamespace
import unittest
from unittest.mock import Mock, patch
from memory_readiness import assess_storage


class Store:
    root = '/qualified-mount'
    require_mount = True
    def __init__(self):
        self.opened = self.closed = 0
    @contextmanager
    def _root(self):
        self.opened += 1
        try:
            yield 91
        finally:
            self.closed += 1


class ReadinessTests(unittest.TestCase):
    def setUp(self):
        self.config = {'MEOK_MEMORY_ROOT':'/qualified-mount'}
        self.store = Store()
        self.factory = Mock(return_value=self.store)
    def run_case(self, flags=0, config=None):
        with patch('memory_readiness.os.fstatvfs', return_value=SimpleNamespace(f_flag=flags)):
            return assess_storage(environ=self.config if config is None else config, store_factory=self.factory)
    def test_missing_config_never_opens_store(self):
        self.assertEqual(self.run_case(config={})['state'],'NOT_CONFIGURED')
        self.factory.assert_not_called()
    def test_empty_config_never_opens_store(self):
        self.assertEqual(self.run_case(config={'MEOK_MEMORY_ROOT':''})['state'],'NOT_CONFIGURED')
        self.factory.assert_not_called()
    def test_relative_path_is_not_used(self):
        self.assertEqual(self.run_case(config={'MEOK_MEMORY_ROOT':'tmp/store'})['state'],'INVALID_CONFIGURATION')
        self.factory.assert_not_called()
    def test_parent_traversal_is_not_used(self):
        self.assertEqual(self.run_case(config={'MEOK_MEMORY_ROOT':'/data/../other'})['state'],'INVALID_CONFIGURATION')
        self.factory.assert_not_called()
    def test_invalid_types_rejected(self):
        for value in (True,32,[],{}):
            with self.subTest(value=value):
                r=self.run_case(config={'MEOK_MEMORY_ROOT':value})
                self.assertEqual(r['state'],'INVALID_CONFIGURATION')
        self.factory.assert_not_called()
    def test_nul_path_rejected(self):
        self.assertEqual(self.run_case(config={'MEOK_MEMORY_ROOT':'/data\x00'})['state'],'INVALID_CONFIGURATION')
    def test_no_fallback_to_ephemeral_backend(self):
        self.store.require_mount=False
        r=self.run_case();self.assertFalse(r['can_attempt']);self.assertEqual(self.store.opened,0)
    def test_factory_path_mismatch_refused(self):
        self.store.root='/different-mount'
        self.assertEqual(self.run_case()['state'],'INVALID_CONFIGURATION')
        self.assertEqual(self.store.opened,0)
    def test_mount_failure_disables_without_leaking_exception(self):
        self.factory.side_effect=OSError('/private/location hf_secret_example')
        r=self.run_case()
        self.assertEqual(r['state'],'MOUNT_UNAVAILABLE');self.assertFalse(r['can_attempt'])
        self.assertNotIn('hf_secret',str(r));self.assertNotIn('/private',str(r))
    def test_stat_failure_releases_root(self):
        with patch('memory_readiness.os.fstatvfs',side_effect=OSError('not supported')):
            r=assess_storage(environ=self.config,store_factory=self.factory)
        self.assertEqual(r['state'],'MOUNT_UNAVAILABLE');self.assertEqual(self.store.closed,1)
    def test_read_only_mount_disables(self):
        r=self.run_case(os.ST_RDONLY)
        self.assertEqual(r['state'],'MOUNT_READ_ONLY');self.assertFalse(r['can_attempt'])
    def test_accessible_is_explicitly_unqualified(self):
        r=self.run_case();self.assertTrue(r['can_attempt'])
        self.assertEqual(r['state'],'MOUNT_ACCESSIBLE_UNQUALIFIED')
        for key in ('identity_verified','write_performed','durability_qualified','execution_authority','gspc_admitted'):
            self.assertIs(r[key],False)
    def test_every_check_reopens_current_root(self):
        self.run_case();self.run_case();self.assertEqual(self.store.opened,2);self.assertEqual(self.store.closed,2)
    def test_environment_not_modified(self):
        before=copy.deepcopy(self.config);self.run_case();self.assertEqual(self.config,before)
    def test_no_configuration_or_owner_identifier_returned(self):
        r=self.run_case();self.assertNotIn('/qualified-mount',str(r));self.assertNotIn('owner',r)
    def test_configuration_removed_between_checks(self):
        self.assertTrue(self.run_case()['can_attempt']);self.config.clear()
        self.assertFalse(self.run_case()['can_attempt']);self.assertEqual(self.store.opened,1)
    def test_normalized_trailing_slash_is_accepted(self):
        self.config['MEOK_MEMORY_ROOT']='/qualified-mount/'
        self.assertTrue(self.run_case()['can_attempt'])
    def test_keyboard_interrupt_is_not_swallowed(self):
        self.factory.side_effect=KeyboardInterrupt()
        with self.assertRaises(KeyboardInterrupt):self.run_case()
    def test_permission_mode_change_between_checks(self):
        self.assertTrue(self.run_case()['can_attempt']);self.assertFalse(self.run_case(os.ST_RDONLY)['can_attempt'])

if __name__=='__main__': unittest.main()
