import gradio as gr
rows = [
    ["governance","GovBench","24","MEASURED","macro-F1"],
    ["safety","DefBench","14","MEASURED","macro-F1 (binary)"],
    ["provenance","ProvBench","15","MEASURED","macro-F1 (binary)"],
    ["continuity","PQCBench","13","MEASURED","macro-F1"],
    ["conformance","MCPBench","11","MEASURED","macro-F1 (binary)"],
    ["openness","OSSBench","13","MEASURED","macro-F1 (binary)"],
    ["jail","—","—","UNTESTED","consent-gated / self-enforcing"],
]
def tbl():
    return rows
with gr.Blocks(theme=gr.themes.Soft(primary_hue="green")) as demo:
    gr.Markdown("# GSPC Governance & Measurement Leaderboard\n**13 measured of 14** — jail axis UNTESTED, self-enforcing. Signed, stranger-verifiable. Measurement ≠ certification.")
    gr.Markdown("*Scores are signed measurement state. Nothing is sold. Regulators read free.*")
    gr.DataFrame(headers=["Axis","Bench","n","Status","Metric"], value=rows, interactive=False)
    gr.Markdown("*Council of AI · csoai.org*")
demo.launch()
