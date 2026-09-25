"""llama-index-tools-csoai — LlamaIndex tool spec for the Council of AI GSPC board."""
from ._board import DOCTRINE_SHA256, read_board
from .base import CSOAIGSPCToolSpec

__version__ = "0.1.0"
__all__ = ["CSOAIGSPCToolSpec", "read_board", "DOCTRINE_SHA256", "__version__"]
