import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { ClientCreate, ClientResponse } from "@/api/generated";
import { Field } from "@/components/ui/Field";

export const CLIENT_FORM_ID = "client-form";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  industry: z.string(),
  website_url: z.string(),
  brand_voice: z.string(),
  audience: z.string(),
  eeat_signals: z.string(),
  language_variant: z.enum(["en-AU", "en-US", "en-GB"]),
  reading_level_target: z.string(),
  sentence_length_preference: z.enum(["", "short", "mixed", "longer"]),
  banned_words: z.string(),
  approved_phrases: z.string(),
  oxford_comma: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const splitLines = (text: string): string[] =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const joinLines = (items: readonly string[] | undefined): string =>
  (items ?? []).join("\n");

function toPayload(values: FormValues): ClientCreate {
  const orNull = (value: string): string | null => value.trim() || null;
  return {
    name: values.name.trim(),
    industry: orNull(values.industry),
    website_url: orNull(values.website_url),
    brand_voice: orNull(values.brand_voice),
    audience: orNull(values.audience),
    eeat_signals: orNull(values.eeat_signals),
    language_variant: values.language_variant,
    reading_level_target: orNull(values.reading_level_target),
    sentence_length_preference: values.sentence_length_preference || null,
    banned_words: splitLines(values.banned_words),
    approved_phrases: splitLines(values.approved_phrases),
    oxford_comma: values.oxford_comma,
  };
}

export function ClientForm({
  client,
  onSubmit,
}: {
  client?: ClientResponse;
  onSubmit: (payload: ClientCreate) => void | Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: client?.name ?? "",
      industry: client?.industry ?? "",
      website_url: client?.website_url ?? "",
      brand_voice: client?.brand_voice ?? "",
      audience: client?.audience ?? "",
      eeat_signals: client?.eeat_signals ?? "",
      language_variant: (client?.language_variant ??
        "en-AU") as FormValues["language_variant"],
      reading_level_target: client?.reading_level_target ?? "",
      sentence_length_preference: (client?.sentence_length_preference ??
        "") as FormValues["sentence_length_preference"],
      banned_words: joinLines(client?.banned_words),
      approved_phrases: joinLines(client?.approved_phrases),
      oxford_comma: client?.oxford_comma ?? true,
    },
  });

  const oxfordComma = watch("oxford_comma");

  return (
    <form
      id={CLIENT_FORM_ID}
      onSubmit={handleSubmit((values) => onSubmit(toPayload(values)))}
      style={{ display: "flex", flexDirection: "column", gap: 20 }}
    >
      <div className="card">
        <div className="card__head">
          <div>
            <div className="card__title">Identity</div>
            <div className="card__sub">
              Name, industry, and where their site lives.
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Name" required error={errors.name?.message}>
            <input className="input" {...register("name")} />
          </Field>
          <Field label="Industry">
            <input className="input" {...register("industry")} />
          </Field>
          <Field label="Website URL" hint="Used for E-E-A-T and internal links">
            <input className="input" {...register("website_url")} />
          </Field>
          <Field label="Language variant">
            <select className="select" {...register("language_variant")}>
              <option value="en-AU">Australian English</option>
              <option value="en-US">US English</option>
              <option value="en-GB">UK English</option>
            </select>
          </Field>
        </div>
      </div>

      <div className="card">
        <div className="card__head">
          <div>
            <div className="card__title">Voice &amp; audience</div>
            <div className="card__sub">
              Anchors the model's tone and reading-level decisions.
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Brand voice" hint="3-5 sentences">
            <textarea className="textarea" rows={4} {...register("brand_voice")} />
          </Field>
          <Field label="Audience">
            <textarea className="textarea" rows={3} {...register("audience")} />
          </Field>
          <Field
            label="E-E-A-T signals"
            hint="Experience, expertise, authority, trust"
          >
            <textarea className="textarea" rows={3} {...register("eeat_signals")} />
          </Field>
        </div>
      </div>

      <div className="card">
        <div className="card__head">
          <div>
            <div className="card__title">Style rules</div>
            <div className="card__sub">
              Hard constraints applied during generation and QA.
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Reading level target">
            <input
              className="input"
              placeholder="e.g. Grade 8"
              {...register("reading_level_target")}
            />
          </Field>
          <Field label="Sentence length">
            <select className="select" {...register("sentence_length_preference")}>
              <option value="">No preference</option>
              <option value="short">Short</option>
              <option value="mixed">Mixed</option>
              <option value="longer">Longer</option>
            </select>
          </Field>
          <Field label="Banned words" hint="One per line">
            <textarea className="textarea" rows={4} {...register("banned_words")} />
          </Field>
          <Field label="Approved phrases" hint="One per line">
            <textarea
              className="textarea"
              rows={4}
              {...register("approved_phrases")}
            />
          </Field>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 16,
            paddingTop: 16,
            borderTop: "1px solid var(--ink-8)",
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Oxford comma</div>
            <div style={{ fontSize: 12, color: "var(--ink-4)", marginTop: 2 }}>
              Apply consistently across all sections.
            </div>
          </div>
          <label className={`toggle ${oxfordComma ? "is-on" : ""}`}>
            <input
              type="checkbox"
              {...register("oxford_comma")}
              style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}
            />
            <span className="toggle__track">
              <span className="toggle__thumb" />
            </span>
            <span className="toggle__label">{oxfordComma ? "On" : "Off"}</span>
          </label>
        </div>
      </div>
    </form>
  );
}
