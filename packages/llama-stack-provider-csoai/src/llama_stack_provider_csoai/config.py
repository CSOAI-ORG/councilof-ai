# SPDX-License-Identifier: Apache-2.0
from typing import Any
from pydantic import BaseModel, Field


class CsoaiEvalConfig(BaseModel):
    """did_json: a pinned copy of the issuer's DID document (https://csoai.org/.well-known/did.json). No network is used."""
    did_json: str = Field(description="Path to the pinned DID document used to verify signatures offline.")

    @classmethod
    def sample_run_config(cls, **kwargs) -> dict[str, Any]:
        return {"did_json": "${env.CSOAI_DID_JSON:=./did.json}"}
