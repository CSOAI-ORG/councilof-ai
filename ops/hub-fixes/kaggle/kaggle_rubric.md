# Kaggle dataset usability rubric and metadata schema (prepared 2026-11-20)

Scope: inputs used to build `kaggle_fix_bundle` for the 149 public datasets of Kaggle user `nicktempleman`. Everything below was read during this session from the sources named.

## 1. Sources read

- Kaggle API docs, `docs/datasets_metadata.md` and `docs/kernels_metadata.md` in github.com/Kaggle/kaggle-api (main). The old wiki pages "Dataset Metadata" and "Kernel Metadata" now redirect there.
- Kaggle CLI source, `src/kaggle/api/kaggle_api_extended.py` (`dataset_metadata_update`) and `src/kaggle/cli.py`.
- Kaggle docs page https://www.kaggle.com/docs/datasets (subtitle, tags, description, column descriptions; "JSON files do not support column descriptions or metrics").
- Chicco et al. (2025), *BioData Mining* 18:1, doi:10.1186/s13040-024-00412-x, Table 1: reverse-engineered weights of the usability score.
- Live anonymous Kaggle API, called with curl: `datasets/list`, `datasets/metadata/{ref}` and `datasets/list/{ref}` (files) for all 149 owner datasets, plus 37 search pages (610 datasets) for the tag vocabulary and peers.

## 2. Usability score components

Kaggle names 11 components. Chicco et al. derived the weights below. Read as 17ths, they are 2 or 1 points each; datasets with no tabular file drop column description and are scored out of 16.

| # | Component | Weight (/10) | Points (/17) | How the bundle addresses it |
|---|---|---|---|---|
| 1 | Subtitle | ~1.17 | 2 | kept when 20-80 chars; 3 written from facts in the dataset's own files and descriptions |
| 2 | Tags | ~1.17 | 2 | `keywords`: existing kept, then rule-based tags; every tag was seen on live Kaggle datasets; 5-8 per dataset |
| 3 | Description | ~1.17 | 2 | existing text kept verbatim; a "Dataset facts" block and a citation added (if missing) |
| 4 | Cover image | ~0.59 | 1 | `cover-proposal.png` (1120x560); uploaded only with `--with-cover` (owner choice) |
| 5 | Source / provenance | ~0.59 | 1 | `userSpecifiedSources` filled when empty (publisher, HF twin and byte-size overlap) |
| 6 | Public notebook | ~0.59 | 1 | starter notebooks for the top-20 by downloads |
| 7 | Update frequency | ~0.59 | 1 | `expectedUpdateFrequency` set; recommended values flagged for owner |
| 8 | License | ~1.18 | 2 | kept; `unknown`/`other` get a recommendation + `needs_owner_ruling` |
| 9 | File format | ~1.18 | 2 | already earned (see calibration) |
| 10 | File description | ~1.18 | 2 | every file in every dataset gets a `resources[].description` |
| 11 | Column description | ~0.59 | 1 | `schema.fields` for tabular files (CSV/Parquet) whose bytes were read from an identical-size HF copy |

**Calibration against the owner's 149 datasets.** Observed usability × 16 (no tabular file) or × 17 (tabular file) minus the points that are observable anonymously (subtitle, tags, description, licence, sources, update frequency, notebook) leaves this residual distribution: {-2.0: 2, 0.0: 2, 2.0: 139, 2.625: 1, 3.0: 3, 4.0: 1, 6.0: 1}. For 139/149 the residual is exactly 2, the file-format points. Cover image, file descriptions and column descriptions currently score 0 almost everywhere; 146/149 thumbnails are Kaggle default backgrounds. This is a model fit, not a Kaggle statement.

## 3. `dataset-metadata.json` constraints

- `title` 6-50 chars; `subtitle` 20-80 chars; `id` = `owner/slug` (slug 3-50); `id_no` preferred when present.
- `licenses`: exactly one entry; only `name` is read. Valid names: CC0-1.0, CC-BY-SA-3.0, CC-BY-SA-4.0, CC-BY-NC-SA-4.0, GPL-2.0, ODbL-1.0, DbCL-1.0, copyright-authors, other, unknown, CC-BY-4.0, CC-BY-NC-4.0, PDDL, CC-BY-3.0, CC-BY-3.0-IGO, US-Government-Works, CC-BY-NC-SA-3.0-IGO, CDLA-Permissive-1.0, CDLA-Sharing-1.0, CC-BY-ND-4.0, CC-BY-NC-ND-4.0, ODC-BY-1.0, LGPL-3.0, AGPL-3.0, FDL-1.3, EU-ODP-Legal-Notice, apache-2.0, GPL-3.0. The API returns the display name "Attribution 4.0 International (CC BY 4.0)"; the bundle sends the documented short name `CC-BY-4.0`.
- `keywords`: strings matching existing Kaggle tags; unknown tags are silently dropped. The anonymous API has no tag list, so the vocabulary is the 258 tags seen on 610 live datasets (`kaggle_tag_vocabulary.csv`).
- `resources[]`: `path`, `description`, `schema.fields[]` (`name`, `description`, `type`). Docs: fields must list ALL columns in order. Types: string, boolean, numeric, datetime, id, uuid, latitude, longitude, coordinates, country, province, postalcode, address, email, url, integer, decimal, city.
- `expectedUpdateFrequency`: not specified, never, annually, quarterly, monthly, weekly, daily, hourly.
- `userSpecifiedSources`: free text, basic markdown.
- Image: `dataset-cover-image.(png|jpg|jpeg|webp)` beside the JSON, min 560x280; 2:1 header crop and 1:1 thumbnail crop.
- **`metadata --update` is a full replacement.** The CLI sends title, subtitle, description, isPrivate (default False), licenses, keywords, collaborators (default []), data/resources, sources and frequency in one settings object. Each bundle file therefore carries the complete current state. `push_kaggle.py` refuses to publish if the live page changed after prep or has collaborators.
- Kernels: `kernel-metadata.json` with id, title (slug = lowercased title with dashes), code_file, language=python, kernel_type=notebook, is_private, enable_internet, dataset_sources.

## 4. Peer datasets with usability 1.0 (AI-relevant searches, top 10 by votes)

| ref | votes | subtitle chars | description chars | keywords | licence | update freq | sources chars | notebooks |
|---|---|---|---|---|---|---|---|---|
| rmisra/news-headlines-dataset-for-sarcasm-detection | 1056 | 68 | 4,516 | 8 | Attribution 4.0 International (CC BY 4.0) | annually | 52 | 373 |
| rmisra/news-category-dataset | 890 | 67 | 3,883 | 5 | Attribution 4.0 International (CC BY 4.0) | annually | 25 | 304 |
| eswarchandt/amazon-music-reviews | 317 | 32 | 1,909 | 6 | CC0: Public Domain | annually | 37 | 85 |
| atharvasoundankar/impact-of-ai-on-digital-media-2020-2025 | 159 | 80 | 668 | 5 | Apache 2.0 | never | 739 | 28 |
| alitaqishah/ai-jobs-market-2025-2026-salaries | 137 | 55 | 4,046 | 5 | CC0: Public Domain | annually | 771 | 53 |
| prvsiyan/prvsiyans-extended-name-that-llm-dataset | 107 | 63 | 44,771 | 5 | Attribution 4.0 International (CC BY 4.0) | daily | 1556 | 991 |
| thedevastator/nlp-mental-health-conversations | 86 | 44 | 5,702 | 4 | CC0: Public Domain | never | 124 | 21 |
| sohaibdevv/ai-and-student-life-2026-the-new-normal | 85 | 80 | 756 | 5 | CC0: Public Domain | never | 0 | 11 |
| Microsoft/microsoft-security-incident-prediction | 74 | 65 | 9,724 | 5 | Other (specified in description) | never | 376 | 36 |
| rhythmghai/ai-vs-real-images-dataset | 67 | 75 | 3,049 | 5 | CC BY-NC-SA 4.0 | quarterly | 203 | 25 |

Common pattern: subtitle near the 80-char limit, 4-8 tags, a description of 0.7k-45k chars, an explicit update frequency, a provenance string, and at least 11 public notebooks. The anonymous files endpoint returned no file or column descriptions even for these 1.0 datasets, so it does not expose those fields. The owner's current file descriptions therefore cannot be observed anonymously; the 0 points in the calibration are inferred.

## 5. Limits of this rubric

- The weights are a third-party reverse-engineering (Chicco et al. 2025); Kaggle has not published them.
- Whether Kaggle counts `never` as a specified frequency, and how many files must be described for full file-description points, is inferred, not documented.
- JSON/JSONL files cannot carry column descriptions on Kaggle. Their fields are listed in the file description and in `FIELDS.md`, which is not uploaded.
