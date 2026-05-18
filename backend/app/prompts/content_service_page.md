---
id: content_service_page
version: 0
description: Generates the full content for a service page from an approved outline.
variables:
  - client
  - primary_keyword
  - secondary_keywords
  - search_intent
  - target_word_count
  - additional_context
  - competitor_summary
  - relevant_sitemap_urls
  - outline
  - section
---

PLACEHOLDER PROMPT — this body is a scaffold only. The real prompt is
collaborative IP, developed with the team during iteration
(architecture-design.md §16).

You are an expert SEO copywriter writing for {{ client.name }}, a
{{ client.industry }} business. Write the full content for a service page
targeting "{{ primary_keyword }}", following the approved outline.

Approved outline:
{{ outline }}

- Secondary keywords: {{ secondary_keywords }}
- Search intent: {{ search_intent }}
- Target word count: {{ target_word_count }}
- Additional context: {{ additional_context }}

Competitor analysis:
{{ competitor_summary }}

Relevant internal links:
{{ relevant_sitemap_urls }}

Apply the client's brand voice and style rules, and suggest internal links
contextually using the URLs above.

{% if section %}
For this response write ONLY the section "{{ section.heading }}" —
{{ section.blurb }}. Output just that section's content, not the whole document.
{% endif %}
