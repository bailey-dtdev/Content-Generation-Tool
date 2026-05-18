import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { ClientCreate, ClientResponse } from "@/api/generated";
import { Field, inputClass } from "@/components/ui/Field";

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
  submitting,
}: {
  client?: ClientResponse;
  onSubmit: (payload: ClientCreate) => void | Promise<void>;
  submitting: boolean;
}) {
  const {
    register,
    handleSubmit,
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

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(toPayload(values)))}
      className="space-y-4"
    >
      <Field label="Name" error={errors.name?.message}>
        <input className={inputClass} {...register("name")} />
      </Field>
      <Field label="Industry">
        <input className={inputClass} {...register("industry")} />
      </Field>
      <Field label="Website URL">
        <input className={inputClass} {...register("website_url")} />
      </Field>
      <Field label="Brand voice">
        <textarea rows={3} className={inputClass} {...register("brand_voice")} />
      </Field>
      <Field label="Audience">
        <textarea rows={3} className={inputClass} {...register("audience")} />
      </Field>
      <Field label="E-E-A-T signals">
        <textarea rows={3} className={inputClass} {...register("eeat_signals")} />
      </Field>
      <Field label="Language variant">
        <select className={inputClass} {...register("language_variant")}>
          <option value="en-AU">Australian English</option>
          <option value="en-US">US English</option>
          <option value="en-GB">UK English</option>
        </select>
      </Field>
      <Field label="Reading level target">
        <input className={inputClass} {...register("reading_level_target")} />
      </Field>
      <Field label="Sentence length preference">
        <select className={inputClass} {...register("sentence_length_preference")}>
          <option value="">No preference</option>
          <option value="short">Short</option>
          <option value="mixed">Mixed</option>
          <option value="longer">Longer</option>
        </select>
      </Field>
      <Field label="Banned words (one per line)">
        <textarea rows={3} className={inputClass} {...register("banned_words")} />
      </Field>
      <Field label="Approved phrases (one per line)">
        <textarea rows={3} className={inputClass} {...register("approved_phrases")} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register("oxford_comma")} />
        <span>Use the Oxford comma</span>
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {submitting ? "Saving…" : "Save client"}
      </button>
    </form>
  );
}
