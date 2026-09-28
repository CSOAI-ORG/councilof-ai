"""crewai-csoai — CrewAI tool for the Council of AI GSPC board."""
from ._board import DOCTRINE_SHA256, read_board
from .tools import GSPCBoardInput, GSPCBoardTool

__version__ = "0.1.0"
__all__ = ["GSPCBoardTool", "GSPCBoardInput", "read_board", "DOCTRINE_SHA256", "__version__"]
