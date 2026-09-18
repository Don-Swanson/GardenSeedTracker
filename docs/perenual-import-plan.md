# Plant data source decision and import plan

Evaluated September 13, 2026.

## Decision

Use Perenual as the licensed broad care-data source, enriched conservatively with GrowStuff and the archived OpenFarm CC0 rescue. Perenual has granted permission for automated collection, transformation, storage, display, and use without attribution, contingent on maintaining the paid license. Keep provider payloads, credentials, collectors, and generated catalogs in the ignored `.gst-private/` workspace; only the source-neutral GST import contract belongs in the public repository.

Perenual documents more than 10,000 plants and exposes structured names, taxonomy, type, dimensions, lifecycle, water, sunlight, propagation, hardiness, soil, pests or diseases, harvest season, toxicity, descriptions, and licensed image metadata. Separate care-guide and pest/disease APIs are available. It does not document days to maturity, germination time, frost-relative planting dates, spacing, planting depth, row spacing, or companion relationships. Its `attracts` field is wildlife attraction, not companion planting.

A live entitlement probe compared species search, species detail, and care-guide responses for a conifer, fruiting tree, and carrot. Species detail contains the core GST fields: description, lifecycle, sunlight, watering and frequency, hardiness, propagation, pruning timing, care level, toxicity flags, and image licensing. Plant Care Guides added longer prose but did not supply maturity, germination, planting depth, reliable crop spacing, companion evidence, or harvest technique. The carrot guide contradicted the regular watering interval and recommended removing half the foliage as a thinning method, so its narrative is unsuitable for automatic import. Do not collect Care Guides or FAQs by default. Keep Care Guide support opt-in for future reviewed experiments.

GrowStuff's live API contains about 862 food or sustainability crops. Crop records expose a name, Wikipedia link, perennial status, and crowd-derived median days to first and last harvest. Seed records can contain user-entered maturity ranges, and planting/harvest records provide observations. It lacks scientific names in its crop schema, broad ornamental coverage, hardiness, care guides, spacing, pests, diseases, and companion relationships. Its public “Everyone's seeds” page is member inventory and trading data, so it must not be treated as an authoritative plant catalog or copied with member identity/location data.

Trefle reports about one million indexed plant names, including roughly 399,000 species and 840,000 resolved synonyms. It reports distribution for 80% of species, images for 32.1%, common names for 12%, and growth conditions for only 1.4%. Its compilation and community corrections are CC BY 4.0, while upstream credits and per-record source licenses must remain attached. It is therefore a much better breadth and identity supplement than a growing-guide source.

API Farmer advertises more than 100,000 species and exposes taxonomy, morphology, soil texture, pH, precipitation, minimum temperature, propagation, and suitability fields. Its documented field names and example values closely mirror USDA PLANTS Conservation Plant Characteristics, down to USDA symbols and fields such as bloat, C:N ratio, coppice potential, planting density per acre, and seed per pound. USDA states that its richer characteristics cover only about 2,500 conservation species and cultivars, so the advertised 100,000-record breadth should not be read as 100,000 complete growing guides. API Farmer does not document days to maturity, germination time, frost-relative sowing, garden spacing, companion plants, pests, diseases, or narrative care guides.

| Need | Recommended source | Use |
| --- | --- | --- |
| Broad catalog and basic care | Perenual | Primary candidate after contract approval and a completeness audit |
| Accepted names and synonyms | World Flora Online CC0 backbone; USDA PLANTS for US taxa | Canonical identity layer with pinned dataset versions |
| Global distribution, uses, and extra images | Trefle | Open enrichment; preserve every upstream source and image license |
| Conservation traits and US-native suitability | USDA PLANTS directly | Prefer the official source over API Farmer's similar paid field set |
| US range, invasive status, bloom and propagation | USDA PLANTS directly; FloraAPI only with custom terms | FloraAPI packages this well, but its standard terms prohibit systematic download and redistribution |
| Observed edible-crop harvest duration | GrowStuff | Optional aggregate enrichment with sample-size and quality thresholds |
| Regional field-crop calendars | USDA NASS | Optional US regional reference; limited to reported crops |
| Spacing and companion candidates | Archived OpenFarm CC0 rescue set | Optional 340-record lead set requiring horticultural review |
| Cultivar-specific maturity | Seed packets/vendor records or curated community submissions | Store at cultivar/seed-lot level, not on the species default |
| Companion and avoid relationships | Curated, cited GST relations | Require evidence and review; do not infer from co-occurrence |

## Licensing controls

Perenual has supplied the requested permission, contingent on a paid license, and waived attribution for its data. Preserve that written grant with the private operational records and verify that the subscription tier covers the full collection run. Image metadata must still be retained because third-party image licenses and creator credits can impose their own terms independently of Perenual's data attribution waiver.

GrowStuff structured data is CC BY-SA 3.0. Its policy allows caching, asks consumers to refresh deletions/privacy changes, and requires attribution and share-alike. GrowStuff's API wiki says combining its data with another collection makes the combined collection CC BY-SA. That may conflict with Perenual's eventual contract. Keep GrowStuff records and derived aggregates in a separate provenance layer and do not distribute a combined export until the licenses are confirmed compatible. Do not ingest member profiles, free-text content, garden names, locations, or private/deleted records.

World Flora Online publishes its downloadable taxonomic backbone under CC0. Trefle publishes its compilation under CC BY 4.0 but requires preservation of upstream credits and licenses. Treat each Trefle field and image as sourced material rather than assigning one blanket license to the entire record.

API Farmer's standard terms allow API access only while a subscription is active, limit acquired data to internal use, and prohibit distributing, publishing, displaying, modifying, or creating derivatives without explicit permission. Its public documentation also does not describe a bulk export or a paginated way to enumerate the advertised catalog, and its Worker Bee allowance is inconsistent between the pricing page and documentation. Do not purchase or build an API Farmer collector unless a custom written license grants permanent transformed storage and public display, a sample audit shows meaningful data unavailable directly from USDA, and the provider supplies a complete bulk-access specification. On the evidence currently available, it does not justify its €99–€499 monthly cost for GST.

FloraAPI covers about 29,000 U.S. plants with strong state/county distribution, native and invasive status, bloom timing, soils, mature size, propagation, hazards, and per-image licensing. It is a useful U.S.-native suitability layer, not a substitute for Perenual's garden-care breadth: it does not provide days to maturity, planting depth, companion relationships, crop-specific sowing calendars, pests, or diseases. Its standard terms prohibit systematic downloads outside the designated bulk export and prohibit resale or redistribution; its Professional bulk export is capped at 100 plants per request and omits some premium fields. Use USDA PLANTS directly for the public-domain overlap. Add FloraAPI only if a custom agreement permits a complete bulk acquisition, permanent transformed storage, and public display in GST.

OpenFarm shut down in April 2025. Its original project states that database content was CC0, and a third-party rescue contains 340 records with spacing, sun, sowing method, and some companions. Treat that rescue as an optional lead set because its completeness and Wayback-derived provenance need review.

## Future GST data model

The version 1 importer can accept a merged record whose primary identity is Perenual and whose `sourceData` preserves every matched source and mapping decision. A future schema should replace that compatibility representation with related provenance records:

- `PlantSourceRecord`: provider, provider ID, public source URL, retrieval time, provider dataset/version, license, terms version, payload hash, and permitted raw JSON. Unique on provider plus provider ID.
- `PlantAlias`: name, locale, kind, and source record.
- `PlantImage`: URL, creator, source page, image license, and source record.
- `PlantFieldEvidence`: plant field, normalized value, source record, confidence, observation count, and review state.
- Structured pest, disease, and companion relation tables with direction, evidence, and review state.
- Cultivars as distinct records related to a species. Store cultivar maturity separately from species defaults.

This permits multiple claims without overwriting curated values. The displayed value should be selected by an explicit field policy and remain traceable to its evidence.

Keep the full WFO/Trefle name universe in a taxonomy or staging index. Promote a taxon into the user-facing Plant Encyclopedia only when it has garden-relevant content, a user inventory link, or an approved submission. This preserves comprehensive lookup and deduplication without burying useful guides under hundreds of thousands of bare scientific-name rows.

## Private standalone collector

Build the collector under ignored `.gst-private/catalog-builder/` so neither the automation nor its data can enter the public repository. It should:

1. Read `PERENUAL_API_KEY` only from the process environment and redact it from every log and saved URL.
2. Discover record counts and page boundaries from live responses rather than hard-coding the documentation example.
3. Fetch species-list pages, then species details and entitled pest/disease data. Save immutable response bodies without credential-bearing request URLs. Do not request FAQ or hardiness-map output. Keep care-guide collection disabled unless a future reviewed sample establishes sufficient quality.
4. Make requests sequentially with a minimum two-second pause plus positive jitter (about 27 calls/minute on average), honor `Retry-After`, use exponential backoff, and stop immediately on authentication or entitlement errors. Increase the delay if Perenual supplies a lower preferred request rate.
5. Checkpoint every successful response and resume idempotently after interruption.
6. Validate responses against a pinned local schema and quarantine malformed or changed records.
7. Produce a completeness report by field, duplicate/conflict reports, checksums, a source manifest, and a source-neutral GST export.
8. Refuse to mark an export complete unless discovered IDs equal successfully validated IDs and the failure list is empty.

The full Perenual detail pass requires more than 10,000 requests. The Premium plan's 10,000 daily limit is tight and its care-guide coverage stops at IDs 1–3000. Supreme advertises 100,000 daily requests and care guides for 10,000+, so it is the likely technical tier if the licensing answer is acceptable. Actual entitlement and response completeness must be measured before committing to it.

## Mapping rules

Map only source fields with the same meaning:

- common/scientific/other names to canonical identity and aliases
- type through a reviewed GST category map, with unknown values left as `other`
- hardiness minimum/maximum to generated USDA half-zone arrays, preserving the original range
- sunlight and watering to GST display fields
- description, cycle, propagation, origin, dimensions, soil, harvest season/method, toxicity, and care data to structured fields or evidence records
- pest susceptibility to reviewable pest/disease candidates rather than blindly merging both into one list
- images only when creator, source URL, and license metadata are present and compatible

Leave days to maturity, germination, frost timing, spacing, depth, row spacing, and companions blank when Perenual does not provide them. Never convert `harvest_season` into days to maturity or `attracts` into companions.

## GrowStuff enrichment method

If license compatibility is confirmed, build a separate collector for `/api/v1/crops`, `/plantings`, and `/harvests`. Match crops through reviewed aliases/Wikipedia targets and then a taxonomic identifier; common-name equality alone is insufficient.

Compute harvest durations from planting-to-first-harvest observations only when dates, crop identity, and planting linkage are valid. Store observation count, median, quartiles, source dataset date, and geography resolution. Separate hemispheres and climate regions where the sample supports it. Reject implausible durations and never import member identity or exact location. A crop-level value with a small or geographically mixed sample should remain evidence, not become GST's default days-to-maturity field.

## Import flow

1. Take an online SQLite backup and run the catalog API in dry-run mode.
2. Import canonical plants and source records in batches of at most 50 with stable request IDs.
3. Add new records and fill only blank fields that pass the field policy. Preserve every curated value and linked inventory row.
4. Review ambiguous scientific identities, cultivars, incompatible units, and source conflicts.
5. Apply the reviewed batches and keep their transactional audit receipts.
6. Verify expected counts, hashes, field completeness, duplicate rate, attribution, and representative plants before publishing the catalog.

The existing source-neutral uploader and protected API endpoint provide checkpointed delivery. The API should move to a version 2 payload when the multi-source provenance models are implemented.

## Delivery sequence

1. Obtain Perenual's written data-retention and redistribution permission.
2. Run a 100–200 plant audit covering vegetables, herbs, flowers, trees, houseplants, cultivars, and known duplicates; publish null rates and mapping conflicts.
3. Add the multi-source schema and version 2 import API with migration and preservation tests.
4. Build the standalone Perenual collector and validate a sample end to end.
5. Collect the licensed full dataset, review the quality report, and import it into a disposable GST database.
6. Back up production, preview through the production API, review receipts/conflicts, and apply.
7. Add the pinned World Flora Online backbone and evaluate Trefle, GrowStuff, and the OpenFarm rescue as separate enrichment passes after the primary catalog is stable.

## Research references

- [Perenual API documentation](https://perenual.com/docs/api), [pricing](https://www.perenual.com/subscription-api-pricing), and [terms](https://www.perenual.com/terms-of-service)
- [GrowStuff API documentation](https://www.growstuff.org/api-docs/index.html), [seed inventory](https://www.growstuff.org/seeds), [data policy](https://www.growstuff.org/policy/api), and [API license notes](https://github.com/Growstuff/growstuff/wiki/API)
- [Trefle catalog](https://trefle.io/), [API documentation](https://docs.trefle.io/), and [data citation/license](https://trefle.io/citation)
- [World Flora Online](https://www.worldfloraonline.org/) and its [CC0 taxonomic backbone downloads](https://www.worldfloraonline.org/downloadData)
- [USDA PLANTS downloads](https://plants.sc.egov.usda.gov/downloads) and [USDA NASS crop calendars](https://data.nass.usda.gov/Publications/National_Crop_Progress/index.php)
- [API Farmer plant database](https://apifarmer.com/plant-database-api/), [documentation](https://apifarmer.com/documentation-api/), [pricing](https://apifarmer.com/pricing-plans/), and [terms](https://apifarmer.com/terms-conditions/)
- [FloraAPI guide](https://floraapi.com/guide), [data attribution](https://floraapi.com/attribution), [pricing](https://floraapi.com/pricing), and [terms](https://floraapi.com/terms)
- [OpenFarm shutdown and CC0 data notice](https://github.com/openfarmcc/OpenFarm) and the [third-party rescue set](https://github.com/thefullnacho/openfarm-crops-rescue)
