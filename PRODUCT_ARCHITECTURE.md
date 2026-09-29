# FORME — Product & Nutrition Architecture

This document is the source of truth for how FORME resolves
nutrition data. It exists so future work (Snap AI rebuild, Vybe
rebuild, any new food-input method) stays consistent with these
rules instead of re-inventing them differently each time.

## The Two Pillars

**Pillar 1 — Packaged Foods.** Anything with a barcode: snack
packets, drinks, jars, boxes. Resolved via barcode scanning.

**Pillar 2 — Cooked, whole, and fresh foods.** Home-cooked meals,
fruits, vegetables, anything without a package. Resolved via
manual text entry (matched against our own Indian food database
first, AI as fallback) or a photo of the plated meal. The public
barcode database is never used for this pillar — it has no
meaningful coverage for unpackaged food.

## Pillar 1 — Packaged Food Resolution Chain

    Barcode scanned
      |
      v
    Vybe verified cache (Cloudflare KV) — instant, no external call
      |  miss
      v
    Open Food Facts — free, has good coverage for major brands
      |  miss or incomplete
      v
    UPCitemdb — keyless trial tier, name/brand only, rarely has nutrition
      |  miss
      v
    GS1 — STUB ONLY. No key configured. Always skipped until a
          GS1 membership is obtained. Identity verification only,
          never treated as a nutrition source.
      |
      v
    Do we have at least a product NAME from any source above?
      |                                  |
     YES                                 NO
      |                                  |
      v                                  v
    AI Nutrition Estimator          Manual Add screen
    (name -> estimated profile)     (user types name,
      |                              can Snap the label
      v                              to auto-fill)
    Shown with an "AI Estimate"
    trust badge, downgraded to
    "Low Confidence" automatically
    for high-risk categories
    (coffee, tea, supplements,
    seasonings) or when the
    numbers don't check out
    internally

If the user is not satisfied with either a Database result or an
AI Estimate, "Snap Nutrition Label" reads the actual back-of-pack
label via the AI Orchestrator's vision capability and overwrites
whatever was shown. A label read is always the highest-trust tier.

## Pillar 2 — Cooked / Whole Food Resolution Chain

    Manual text entry
      |
      v
    Local Indian food database (INDIAN_FOODS, exact/alias match)
      |  no match
      v
    AI text estimator (meal mode) — deep micronutrient profile
    (potassium, magnesium, iron, calcium, zinc, vitamin A/C/D)

    Plate photo
      |
      v
    Snap AI vision (meal mode) — same deep micronutrient profile,
    always an ESTIMATE, UI must say so

The public barcode/product database is intentionally never
consulted for Pillar 2. It is a packaged-goods database and has
no meaningful data for a home-cooked plate of dal and rice.

## Trust Tiers (used across both pillars)

| Tier | Badge | Meaning |
|---|---|---|
| Label-verified | green, "Verified from Label" | User scanned the actual package label |
| Database | green, "Database" | Real data from cache or Open Food Facts |
| AI Estimate | amber, "AI Estimate" | Name-based or vision-based AI guess |
| AI Estimate (Low Confidence) | amber, "AI Estimate · Low Confidence" | AI estimate flagged as unreliable — high-risk category or internally inconsistent numbers |

## Required Data Fields

Every food entry, regardless of pillar or tier, must be able to
carry:

- Core 4: calories, protein, carbs, fat
- Essential extras: fiber, sugar, sodium
- Pillar 2 only, when available: potassium, magnesium, iron,
  calcium, zinc, vitamin A, vitamin C, vitamin D

Any field the source does not provide is `null` (unknown), never
`0`. A `0` must only ever mean "this food genuinely has zero of
this nutrient," never "we don't know."

## Non-Negotiable Rules

1. Never fabricate a value to fill a gap. Unknown stays unknown.
2. Every screen that shows nutrition data must let the user tap
   and manually type/edit any field.
3. A confirmed correction (via label scan or manual edit) saves
   to the user's personal library so it is fixed permanently for
   that user, and is never silently overwritten by a lower-trust
   source on a future scan of the same barcode.
4. AI estimates are never written to the shared Vybe cache as if
   verified. Only Database-tier and Label-verified results are
   eligible for the shared cache.
5. High-risk categories for AI estimation (coffee, tea,
   supplements, seasonings, extracts) are automatically capped at
   Low Confidence and must never be shown as a confident result.

## Status

- Pillar 1 barcode chain: implemented (AI Orchestrator, Product
  Resolution Engine, Nutrition Estimator, trust badges) as of this
  document's creation. Snap Nutrition Label mode and Manual
  Add/Edit screens are the next steps.
- Pillar 2 (manual + plate Snap with deep micros): scheduled as
  part of the Snap AI rebuild phase, not yet implemented.
- Personal library (rule 3 above): scheduled as the step after
  Manual Add/Edit.
