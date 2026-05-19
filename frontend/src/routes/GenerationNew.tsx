import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

import {
  ClientsService,
  GenerationInput,
  GenerationsService,
  type ClientResponse,
} from "@/api/generated";
import { Stepper } from "@/components/Stepper";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { useGenerationStore } from "@/stores/generation";

const schema = z.object({
  client_id: z.string().min(1, "Select a client"),
  content_type: z.nativeEnum(GenerationInput.content_type),
  primary_keyword: z.string().min(1, "Primary keyword is required"),
  secondary_keywords: z.string(),
  search_intent: z.nativeEnum(GenerationInput.search_intent),
  competitor_urls: z.string(),
  target_url: z.string(),
  target_word_count: z.coerce.number().int().positive("Enter a target word count"),
  additional_context: z.string(),
});

type FormValues = z.infer<typeof schema>;

const splitLines = (text: string): string[] =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export function GenerationNew() {
  const navigate = useNavigate();
  const setGeneration = useGenerationStore((s) => s.setGeneration);
  const setOutline = useGenerationStore((s) => s.setOutline);
  const [clients, setClients] = useState<ClientResponse[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      client_id: "",
      content_type: GenerationInput.content_type.SERVICE_PAGE,
      primary_keyword: "",
      secondary_keywords: "",
      search_intent: GenerationInput.search_intent.INFORMATIONAL,
      competitor_urls: "",
      target_url: "",
      target_word_count: 1000,
      additional_context: "",
    },
  });

  useEffect(() => {
    ClientsService.clientsListClients()
      .then(setClients)
      .catch(() => setClients([]));
  }, []);

  const selectedClientId = watch("client_id");
  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId),
    [clients, selectedClientId],
  );

  const submit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const generation = await GenerationsService.generationsCreateGeneration({
        requestBody: {
          client_id: values.client_id,
          content_type: values.content_type,
          primary_keyword: values.primary_keyword,
          secondary_keywords: splitLines(values.secondary_keywords),
          search_intent: values.search_intent,
          competitor_urls: splitLines(values.competitor_urls),
          target_url: values.target_url.trim() || null,
          target_word_count: values.target_word_count,
          additional_context: values.additional_context,
        },
      });
      setGeneration(generation);
      setOutline([]);
      navigate(`/generations/${generation.id}/outline`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="main__head">
        <div
          style={{
            fontSize: 12,
            color: "var(--ink-5)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>Generations</span>
          <Icon name="chevron-right" size={12} />
          <span style={{ color: "var(--ink-2)", fontWeight: 600 }}>
            New generation
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 className="page-title">New generation</h1>
            <p className="page-sub">
              Tell Content Studio what to write. We'll pull competitors and
              sitemap matches next.
            </p>
          </div>
          <Stepper current={0} />
        </div>
      </div>

      <form onSubmit={handleSubmit(submit)}>
        <div
          className="main__body"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 320px",
            gap: 24,
            alignItems: "start",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="card">
              <div className="card__head">
                <div>
                  <div className="card__title">Subject</div>
                  <div className="card__sub">
                    Who this is for and what we're writing.
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <Field label="Client" required error={errors.client_id?.message}>
                  <select className="select" {...register("client_id")}>
                    <option value="">Select a client…</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Content type">
                  <select className="select" {...register("content_type")}>
                    <option value={GenerationInput.content_type.SERVICE_PAGE}>
                      Service page
                    </option>
                    <option value={GenerationInput.content_type.PLP}>
                      Product listing page
                    </option>
                    <option value={GenerationInput.content_type.PDP}>
                      Product detail page
                    </option>
                    <option value={GenerationInput.content_type.BLOG}>
                      Blog post
                    </option>
                  </select>
                </Field>
                <Field
                  label="Primary keyword"
                  required
                  error={errors.primary_keyword?.message}
                >
                  <input className="input" {...register("primary_keyword")} />
                </Field>
                <Field label="Search intent">
                  <select className="select" {...register("search_intent")}>
                    <option value={GenerationInput.search_intent.INFORMATIONAL}>
                      Informational
                    </option>
                    <option value={GenerationInput.search_intent.COMMERCIAL}>
                      Commercial
                    </option>
                    <option value={GenerationInput.search_intent.TRANSACTIONAL}>
                      Transactional
                    </option>
                    <option value={GenerationInput.search_intent.NAVIGATIONAL}>
                      Navigational
                    </option>
                  </select>
                </Field>
                <Field label="Target URL" hint="Optional — for refreshes">
                  <input className="input" {...register("target_url")} />
                </Field>
                <Field
                  label="Target word count"
                  error={errors.target_word_count?.message}
                >
                  <input
                    className="input"
                    type="number"
                    {...register("target_word_count")}
                  />
                </Field>
              </div>
            </div>

            <div className="card">
              <div className="card__head">
                <div>
                  <div className="card__title">Research inputs</div>
                  <div className="card__sub">
                    Competitors and supporting keywords. We'll fetch what we can.
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Field label="Secondary keywords" hint="One per line">
                  <textarea
                    className="textarea"
                    rows={4}
                    {...register("secondary_keywords")}
                  />
                </Field>
                <Field
                  label="Competitor URLs"
                  hint="One per line · we'll analyse up to 8"
                >
                  <textarea
                    className="textarea"
                    rows={4}
                    {...register("competitor_urls")}
                  />
                </Field>
                <Field
                  label="Additional context"
                  hint="Anything specific for this piece"
                >
                  <textarea
                    className="textarea"
                    rows={3}
                    {...register("additional_context")}
                  />
                </Field>
              </div>
            </div>
          </div>

          <aside
            style={{
              position: "sticky",
              top: 16,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div className="card" style={{ padding: 20 }}>
              <div className="page-eyebrow" style={{ marginBottom: 12 }}>
                Client snapshot
              </div>
              {selectedClient ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                    {selectedClient.name}
                  </div>
                  <div className="kv">
                    <span className="kv__k">Language</span>
                    <span className="kv__v">{selectedClient.language_variant}</span>
                  </div>
                  <div className="kv">
                    <span className="kv__k">Reading level</span>
                    <span className="kv__v">
                      {selectedClient.reading_level_target || "—"}
                    </span>
                  </div>
                  <div className="kv">
                    <span className="kv__k">Sentence length</span>
                    <span className="kv__v">
                      {selectedClient.sentence_length_preference || "—"}
                    </span>
                  </div>
                  <div className="kv">
                    <span className="kv__k">Banned words</span>
                    <span className="kv__v">
                      {selectedClient.banned_words?.length ?? 0}
                    </span>
                  </div>
                  <div className="kv">
                    <span className="kv__k">Oxford comma</span>
                    <span className="kv__v">
                      {selectedClient.oxford_comma ? "On" : "Off"}
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 12.5, color: "var(--ink-5)", lineHeight: 1.5 }}>
                  Select a client to see the voice and style rules that will
                  shape this generation.
                </div>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              iconRight="arrow-right"
              disabled={submitting}
            >
              {submitting ? "Starting…" : "Start generation"}
            </Button>
            <div
              style={{ fontSize: 11.5, color: "var(--ink-5)", textAlign: "center" }}
            >
              Next: outline review
            </div>
          </aside>
        </div>
      </form>
    </>
  );
}
