# Vendored pdf.js

- Source: https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/
- Version: 5.4.149
- License: Apache-2.0 (see header in `pdf.min.mjs`)

Vendored locally (not fetched from a CDN at runtime) so the app's
`script-src 'self'` CSP can stay strict and PDF text extraction
doesn't depend on a third-party CDN being available/uncompromised.
To upgrade, replace `pdf.min.mjs` and `pdf.worker.min.mjs` with a
matching pair from a newer pdf.js release and bump the version here.
