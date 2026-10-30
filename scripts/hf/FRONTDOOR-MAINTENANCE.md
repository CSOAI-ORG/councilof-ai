# Maintain the Hugging Face and Kaggle front pages

The monorepo owns the presentation sources:

| Surface | Source |
| --- | --- |
| Hugging Face organisation card and static page | `spaces/README/README.md`, `spaces/README/index.html` |
| Hugging Face board dataset card | `scripts/hf/templates/gspc-board.md` plus the existing snapshot provenance paragraph |
| Hugging Face board Space card | `spaces/gspc-board/README.md` |
| Kaggle subtitle and description | `kaggle_page_text` in `scripts/spray/gspc-spray.py` |

The organisation uses native Markdown plus a scoped, responsive static page. Do not style global headings or rely on a host page's background. Both light and dark themes must remain readable. Avoid frozen current-count claims: link to the live board; dated dataset claims must match the captured snapshot.

Preview the existing public HF pages using the existing owner's environment:

```sh
python3 scripts/hf/polish_frontdoors.py \
  --target organisation --target dataset --target board-space --out /tmp/gspc-card-preview
```

Inspect the rendered files and receipts. Add `--publish` only to publish the reviewed source. The publisher pins the current parent commit, preserves existing YAML except Space title/description, and changes only the allowed presentation files. It verifies public readback and unchanged blob IDs for every other repository file. It never creates repositories, changes access, deletes files, uploads data or requests compute.

The board dataset template retains the exact dated provenance paragraph consumed by `hf_dataset_companions`; routine snapshot publication continues to update it atomically. The existing `hf-org-card.py` keeps machine-derived tables under collapsible details on the front pages. Historical notes remain available at pinned earlier revisions.

For Kaggle, use the existing publisher's `--kaggle --kaggle-metadata-only` mode. It refuses when the downloadable snapshot bytes differ, preserves title/licence/privacy/collaborators and other metadata, and verifies readback. No new dataset version is needed for presentation-only changes. `scripts/spray/kaggle-gspc-packaging.json` records the reviewed tags, eight file descriptions and a visible 16-column CSV guide, plus the attempted native column metadata. Merge those fields into a complete freshly read metadata object; never replace dataset settings with that partial file. The qualified metadata read currently returns an empty `data` list even after successful file/column updates. The file-list API also omitted descriptions during qualification. Confirm file descriptions in the public data explorer. Native column descriptions were not visibly retained during this pass, even with explicit types, so the complete schema is also placed in the CSV file description. Do not claim native column descriptors are complete until their UI readback matches. Normal publication preserves nonempty typed `data` when returned and checks it on readback. The qualified Kaggle SDK version is deliberate; requalify its serializer before upgrading.

The existing Space sync workflow copies the board Space files from master. Merge the source change through its PR before relying on automated persistence; a direct Hub edit alone is not a completed source update. Council website deployment remains exclusively the gated master workflow under `DEPLOY-LOCK.md`.

Validation: run the focused HF and spray tests, inspect the static page at mobile/desktop widths in both themes, exercise the documented dataset examples, and check public links and viewer rows. Before a source push, run the repository's full pre-push gates. Keep receipts separate from source data.
