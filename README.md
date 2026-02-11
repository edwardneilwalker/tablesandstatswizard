# Tables and Stats Reporting Wizard

A lightweight decision-tree wizard for selecting the correct GRA/COA report.

## Run locally

Open `index.html` directly in a browser, or serve with a simple local server:

```bash
python3 -m http.server 8000
```

Then open: `http://127.0.0.1:8000/index.html`

## Example report PDFs

Store example PDFs in:

- `example-reports/`

Expected naming format:

- `GRA_301.pdf`
- `COA_312.pdf`

On report outcome screens, the wizard auto-generates an **Open PDF in New Tab** button by reading the report code from the outcome text and linking to `example-reports/<CODE>.pdf`.

## Automated route test

Run:

```bash
node scripts/test-routes.js
```

What it checks:

1. Every decision button points to a valid next step.
2. Key business-critical routes (group, clinical, cages, individual) resolve to expected report outputs.
3. Every report endpoint resolves to an expected example PDF path format.

If all checks pass, you will see ✅ lines and a final success message.
