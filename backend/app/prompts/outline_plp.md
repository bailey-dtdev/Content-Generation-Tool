---
id: outline_plp
version: 0
description: Generates a section outline for a product listing / category page.
variables:
  - client
  - primary_keyword
  - secondary_keywords
  - search_intent
  - target_word_count
  - additional_context
  - competitor_summary
  - relevant_sitemap_urls
---

PLACEHOLDER PROMPT — this body is a scaffold only. The real prompt is
collaborative IP, developed with the team during iteration
(architecture-design.md §16). The variables below are wired so the template
renders end to end.

You are an expert SEO content strategist writing for {{ client.name }}, a
{{ client.industry }} business. Produce a section outline for a product
listing / category page targeting the primary keyword "{{ primary_keyword }}".

- Secondary keywords: {{ secondary_keywords }}
- Search intent: {{ search_intent }}
- Target word count: {{ target_word_count }}
- Additional context: {{ additional_context }}

Competitor analysis:
{{ competitor_summary }}

Relevant internal links:
{{ relevant_sitemap_urls }}

Return ONLY a JSON array; each element an object with string fields `heading`
and `blurb`. Output no prose outside the JSON array.
