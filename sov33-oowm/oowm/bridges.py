"""The 8 consolidation bridges that wire OOWM into the SOV3 mesh."""
BRIDGES = {
    "horizontal":   {"axis":"x","direction":"left-right","merges":["quant","man"],"care":"non-zero-sum"},
    "vertical":     {"axis":"y","direction":"up-down","merges":["king","queen","mom"],"care":"asymmetry-honoring"},
    "diagonal":     {"axis":"diag","direction":"nw-se","merges":["oowm","free"],"care":"wild-flow"},
    "spiral":       {"shape":"fibonacci","direction":"in-out","merges":["small-moe","big-moe"],"care":"temporal-pacing"},
    "toroidal":     {"shape":"donut","direction":"circulate","merges":["bridge","council"],"care":"return-to-source"},
    "fractal":      {"shape":"self-similar","direction":"recursive","merges":["sovereign"],"care":"scale-invariant"},
    "void":         {"shape":"absence","direction":"silent","merges":[],"care":"zero-noise"},
    "everywhere":   {"shape":"all-paths","direction":"omnidirectional","merges":["king","queen","quant","man","oowm","mom","small-moe","big-moe","bridge","council","sovereign","free"],"care":"total-coverage"},
}
def get_bridge(name): return BRIDGES.get(name)
def list_bridges(): return list(BRIDGES.keys())