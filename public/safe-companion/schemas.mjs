// Generated from exact pinned project schemas; see vendor/retrieved-inputs.json.
// Freeze the complete dependency when exported, before any consumer can import
// and change a rule while diagnostics still cite the pinned upstream hash.
function deepFreeze(value) {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
export const CATALOG_SCHEMA = deepFreeze({
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "urn:safe-starter-kit:schema:catalog-export:0.1.0",
  "$comment": "Project-defined draft (catalog_export_schema_version 0.1.0) of the SAFE-Starter-Kit public catalog export. This is NOT an official SAFE schema: SAFE v1.0 adopts no catalog export format. Fields and enums are provisional until the F0 decision log is signed off.",
  "title": "SAFE-Starter-Kit public catalog export (draft 0.1.0)",
  "description": "Public derivative of the versioned catalog, served by GET /api/v1/catalog/export and written by 'safe-kit catalog export'. Every entry carries its public history, oldest version first. It holds no restricted reference, no digest of a restricted reference, and no internal identifier (creator, checker, evidence path, recommendation or verification run). It has no export time, so an unchanged catalog exports the same document. Timestamps are UTC (RFC 3339 with an offset or Z).",
  "type": "object",
  "additionalProperties": false,
  "required": ["catalog_export_schema_version", "catalog_export"],
  "properties": {
    "catalog_export_schema_version": {
      "const": "0.1.0",
      "description": "Version of this schema. Changes to the fields or enums change it."
    },
    "catalog_export": {
      "type": "object",
      "additionalProperties": false,
      "required": ["entries"],
      "properties": {
        "entries": {
          "type": "array",
          "description": "Every catalog entry that is not deleted, ordered by creation time and then by ID.",
          "items": { "$ref": "#/$defs/entry" }
        }
      }
    }
  },
  "$defs": {
    "entry": {
      "type": "object",
      "additionalProperties": false,
      "required": ["id", "status", "version", "versions"],
      "properties": {
        "id": {
          "type": "string",
          "format": "uuid",
          "description": "Stable ID of the catalog entry."
        },
        "status": {
          "$ref": "#/$defs/status",
          "description": "Status of the current version."
        },
        "version": {
          "type": "integer",
          "minimum": 1,
          "description": "Number of the current version. It equals the version of the last item in versions."
        },
        "versions": {
          "type": "array",
          "minItems": 1,
          "description": "The public history, oldest first. Earlier versions are kept unchanged.",
          "items": { "$ref": "#/$defs/version" }
        }
      }
    },
    "version": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "version",
        "operation",
        "status",
        "title",
        "body",
        "reason",
        "replacement_entry_id",
        "created_at",
        "verification"
      ],
      "properties": {
        "version": { "type": "integer", "minimum": 1 },
        "operation": {
          "enum": ["create", "version", "correction", "dispute", "withdrawal", "supersession"],
          "description": "The change that produced this version."
        },
        "status": { "$ref": "#/$defs/status" },
        "title": { "type": "string", "minLength": 1, "maxLength": 200 },
        "body": { "type": "string", "minLength": 1, "maxLength": 4000 },
        "reason": {
          "type": ["string", "null"],
          "minLength": 1,
          "maxLength": 1000,
          "description": "The reason given for a correction, dispute, withdrawal or supersession. Null for create and version."
        },
        "replacement_entry_id": {
          "type": ["string", "null"],
          "format": "uuid",
          "description": "The entry that replaces this one, set only by a supersession."
        },
        "created_at": {
          "type": "string",
          "pattern": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(Z|[+-]\\d{2}:\\d{2})$"
        },
        "verification": {
          "description": "The passing or failing verification run this version cites, or null. A recommendation alone is never a verification.",
          "oneOf": [{ "type": "null" }, { "$ref": "#/$defs/verification" }]
        }
      }
    },
    "verification": {
      "type": "object",
      "additionalProperties": false,
      "required": ["subject", "method", "result", "verified_at"],
      "properties": {
        "subject": { "type": "string", "minLength": 1, "maxLength": 1000 },
        "method": { "type": "string", "minLength": 1, "maxLength": 1000 },
        "result": { "enum": ["pass", "fail", "inconclusive"] },
        "verified_at": {
          "type": "string",
          "pattern": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(Z|[+-]\\d{2}:\\d{2})$"
        }
      }
    },
    "status": {
      "enum": ["active", "disputed", "withdrawn", "superseded"]
    }
  }
});
export const DISCLOSURE_SCHEMA = deepFreeze({
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "urn:safe-starter-kit:schema:disclosure-export:0.1.0",
  "$comment": "Project-defined draft (disclosure_export_schema_version 0.1.0) of the SAFE-Starter-Kit export of one approved disclosure package version. This is NOT an official SAFE schema: SAFE v1.0 adopts no disclosure export format. Fields and enums are provisional until the F0 decision log is signed off.",
  "title": "SAFE-Starter-Kit disclosure package export (draft 0.1.0)",
  "description": "One disclosure package version as approved, served by GET /api/v1/cases/{case_id}/disclosures/{version_id}/export and written by 'safe-kit case disclosure export'. Only a version with an approval can be exported. A version that a later version of its package replaced is exported with status 'superseded' and is history only. The document holds the derivatives of the version, never originals; the TLP audience of each item; the withheld items as placeholders with no detail; the manifest line ranges of the items the caller may see; the digest; and the approval reference. It never holds a file name, a case title, a redaction reason, the checksum of an original, or an internal redaction identifier. It has no export time, so an unchanged version exports the same document. Timestamps are UTC or carry an offset (RFC 3339).",
  "type": "object",
  "additionalProperties": false,
  "required": ["disclosure_export_schema_version", "disclosure_export"],
  "properties": {
    "disclosure_export_schema_version": {
      "const": "0.1.0",
      "description": "Version of this schema. Changes to the fields or enums change it."
    },
    "disclosure_export": {
      "$ref": "#/$defs/export"
    }
  },
  "$defs": {
    "uuid": {
      "type": "string",
      "format": "uuid"
    },
    "sha256": {
      "type": "string",
      "pattern": "^[0-9a-f]{64}$"
    },
    "timestamp": {
      "type": "string",
      "pattern": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(Z|[+-]\\d{2}:\\d{2})$"
    },
    "tlp_label": {
      "enum": ["RED", "AMBER", "AMBER+STRICT", "GREEN", "CLEAR"]
    },
    "export": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "case_id",
        "package_id",
        "version_id",
        "version",
        "status",
        "latest_version",
        "template",
        "recipient",
        "purpose",
        "tlp_audience",
        "digest",
        "items",
        "withheld_count",
        "manifest",
        "approval"
      ],
      "properties": {
        "case_id": { "$ref": "#/$defs/uuid", "description": "The case the package belongs to." },
        "package_id": { "$ref": "#/$defs/uuid", "description": "The package that groups the versions." },
        "version_id": { "$ref": "#/$defs/uuid", "description": "The exported version." },
        "version": { "type": "integer", "minimum": 1, "description": "Number of the exported version." },
        "status": {
          "enum": ["approved", "superseded"],
          "description": "'approved': the latest version of the package, with its approval. 'superseded': an approved version that a later version replaced. Its approval covers this version only; it is history and must not be sent as current."
        },
        "latest_version": {
          "type": "integer",
          "minimum": 1,
          "description": "Number of the latest version of the package. It equals version when status is 'approved'."
        },
        "template": {
          "type": "object",
          "additionalProperties": false,
          "required": ["key", "title", "sections"],
          "properties": {
            "key": {
              "enum": ["confidential_rapid_alert", "de_identified_member_advisory", "redacted_public_safety_report"]
            },
            "title": { "type": "string", "minLength": 1, "maxLength": 200 },
            "sections": {
              "type": "array",
              "minItems": 1,
              "items": {
                "type": "object",
                "additionalProperties": false,
                "required": ["title", "contains"],
                "properties": {
                  "title": { "type": "string", "minLength": 1, "maxLength": 200 },
                  "contains": { "type": "string", "minLength": 1, "maxLength": 500 }
                }
              }
            }
          }
        },
        "recipient": { "type": "string", "minLength": 1, "maxLength": 200 },
        "purpose": { "type": "string", "minLength": 1, "maxLength": 500 },
        "tlp_audience": { "$ref": "#/$defs/tlp_label" },
        "digest": {
          "$ref": "#/$defs/sha256",
          "description": "SHA-256 of the canonical content of the version, as approved."
        },
        "items": {
          "type": "array",
          "maxItems": 50,
          "description": "One entry per derivative of the version, ordered by evidence ID. An item the caller may not see is only {\"withheld\": true}.",
          "items": {
            "oneOf": [{ "$ref": "#/$defs/withheld_item" }, { "$ref": "#/$defs/visible_item" }]
          }
        },
        "withheld_count": {
          "type": "integer",
          "minimum": 0,
          "description": "Number of entries of items that are withheld. Equal to the count of {\"withheld\": true} entries."
        },
        "manifest": {
          "type": "object",
          "additionalProperties": false,
          "required": ["items"],
          "properties": {
            "items": {
              "type": "array",
              "maxItems": 50,
              "description": "The removed line ranges of each visible item. No removed text, no redaction reason.",
              "items": { "$ref": "#/$defs/manifest_item" }
            }
          }
        },
        "approval": {
          "type": "object",
          "additionalProperties": false,
          "required": ["id", "approved_by", "approved_at", "digest", "separation_rule"],
          "properties": {
            "id": { "$ref": "#/$defs/uuid", "description": "ID of the approval record." },
            "approved_by": { "$ref": "#/$defs/uuid", "description": "ID of the approver. Never the preparer." },
            "approved_at": { "$ref": "#/$defs/timestamp" },
            "digest": {
              "$ref": "#/$defs/sha256",
              "description": "The digest the approver confirmed. It equals the digest of the version."
            },
            "separation_rule": {
              "const": "preparer_differs_from_approver"
            }
          }
        }
      }
    },
    "withheld_item": {
      "type": "object",
      "additionalProperties": false,
      "required": ["withheld"],
      "properties": {
        "withheld": { "const": true }
      }
    },
    "visible_item": {
      "type": "object",
      "additionalProperties": false,
      "required": ["withheld", "evidence_id", "media_type", "size_bytes", "sha256_plaintext", "tlp_label"],
      "properties": {
        "withheld": { "const": false },
        "evidence_id": { "$ref": "#/$defs/uuid", "description": "ID of the derivative item. Never an original." },
        "media_type": { "type": "string", "minLength": 1, "maxLength": 200 },
        "size_bytes": { "type": "integer", "minimum": 0 },
        "sha256_plaintext": {
          "$ref": "#/$defs/sha256",
          "description": "Checksum of the derivative item. Never the checksum of its original."
        },
        "tlp_label": {
          "$ref": "#/$defs/tlp_label",
          "description": "TLP label of the derivative item."
        }
      }
    },
    "manifest_item": {
      "type": "object",
      "additionalProperties": false,
      "required": ["evidence_id", "lines_total", "removed_lines", "removed"],
      "properties": {
        "evidence_id": { "$ref": "#/$defs/uuid" },
        "lines_total": { "type": "integer", "minimum": 0 },
        "removed_lines": { "type": "integer", "minimum": 0 },
        "removed": {
          "type": "array",
          "maxItems": 50,
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": ["from_line", "to_line", "lines"],
            "properties": {
              "from_line": { "type": "integer", "minimum": 1 },
              "to_line": { "type": "integer", "minimum": 1 },
              "lines": { "type": "integer", "minimum": 1 }
            }
          }
        }
      }
    }
  }
});
export const SCHEMA_HASHES = deepFreeze({"catalog": "4d8f156ad550ef336414d419769b9dd205f479aea5e70ece5804b87672c5e501", "disclosure": "b097ff18a735a6f8b8d7614bb8e5fc860983725e6092a332d296ab1c8916af93"});
