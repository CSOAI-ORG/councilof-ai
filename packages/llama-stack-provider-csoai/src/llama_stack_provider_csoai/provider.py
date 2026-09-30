# SPDX-License-Identifier: Apache-2.0
from llama_stack_api import Api, RemoteProviderSpec


def get_provider_spec() -> RemoteProviderSpec:
    return RemoteProviderSpec(api=Api.eval, adapter_type="csoai", provider_type="remote::csoai",
                              config_class="llama_stack_provider_csoai.config.CsoaiEvalConfig",
                              module="llama_stack_provider_csoai", api_dependencies=[], pip_packages=["cryptography"],
                              description="Verify CSOAI signed evidence batches offline; report each event's state, never a score.")
