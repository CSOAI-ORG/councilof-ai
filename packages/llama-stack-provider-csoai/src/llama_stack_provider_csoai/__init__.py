# SPDX-License-Identifier: Apache-2.0
from typing import Any
from .config import CsoaiEvalConfig


async def get_adapter_impl(config: CsoaiEvalConfig, deps: dict[Any, Any]):
    from .eval import CsoaiEvalImpl
    impl = CsoaiEvalImpl(config)
    await impl.initialize()
    return impl
