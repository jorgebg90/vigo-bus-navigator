# Municipal API fixtures

The files in this directory are deterministic, synthetic examples shaped to
exercise the proposed v5 client contract. They are not captures from the Vigo
municipal service and must not be used as evidence that provider fields,
identifiers, semantics, CORS behavior, or release readiness have been verified.

`manifest.json` identifies each allowlisted action, its UTF-8 byte encoding,
SHA-256 digest, and synthetic classification. Tests must feed these bytes
through the same decoding, validation, and normalization pipeline used by the
browser adapter. Malformed, oversized, and adversarial responses belong in
focused test cases rather than being presented as provider observations.
