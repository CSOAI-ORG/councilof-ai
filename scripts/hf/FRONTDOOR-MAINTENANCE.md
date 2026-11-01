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

For Kaggle, use the existing publisher's `--kaggle --kaggle-metadata-only` mode. It refuses when the downloadable snapshot bytes differ, preserves title/licence/privacy/collaborators and other metadata, and verifies readback. No new dataset version is needed for presentation-only changes. `scripts/spray/kaggle-gspc-packaging.json` records the reviewed tags, eight file descriptions, the visible 16-column CSV guide and native column descriptions. Merge those fields into a complete freshly read metadata object; never replace dataset settings with that partial file. Normal publication preserves nonempty typed `data` when returned and checks it on readback. The qualified Kaggle SDK version is deliberate; requalify its serializer before upgrading.

The metadata API can accept native column descriptions without retaining them. Its read returns an empty `data` list, and the file-list API omitted descriptions during qualification. Do not treat an accepted request as a completed update. The upstream report is [Kaggle CLI issue 1207](https://github.com/Kaggle/kaggle-cli/issues/1207). Confirm file and column descriptions in the public data explorer.

If native column descriptions are missing, use the existing owner's web editor:

1. Select `gspc-axes.csv`, choose **Detail**, and click **Edit file description** beside **About this file**. This also opens the column-description inputs below the headings.
2. Use **Change displayed columns → Select all → Apply** before editing. Confirm all 16 columns are visible; changing the displayed set can discard unsaved edits.
3. Copy each description from `kaggle-gspc-packaging.json` into its matching column. Keep the file description and existing column types intact.
4. Save and confirm edit mode closes before navigating. The Save button can be clipped by the table container; focus it and press Enter, or bring the button fully into view before clicking. A click with no visible state change is not proof of a save.
5. Reload, select the CSV, display all 16 columns and inspect **Column** view. Every native description must match the maintained source. Keep the full guide in the file description as an additional reference.

This editor path was qualified on 30 October 2026 without uploading a new dataset version or modifying snapshot data.

The existing Space sync workflow copies the board Space files from master. Merge the source change through its PR before relying on automated persistence; a direct Hub edit alone is not a completed source update. Council website deployment remains exclusively the gated master workflow under `DEPLOY-LOCK.md`.

Validation: run the focused HF and spray tests, inspect the static page at mobile/desktop widths in both themes, exercise the documented dataset examples, and check public links and viewer rows. Before a source push, run the repository's full pre-push gates. Keep receipts separate from source data.
