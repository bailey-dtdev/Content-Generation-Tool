import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

import { ClientsService, GenerationsService, type ClientResponse } from "@/api/generated";
import { GenerationInput } from "@/api/generated";
import { Field, inputClass } from "@/components/ui/Field";
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
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <h1 className="text-lg font-semibold">New generation</h1>

      <Field label="Client" error={errors.client_id?.message}>
        <select className={inputClass} {...register("client_id")}>
          <option value="">Select a client…</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Content type">
        <select className={inputClass} {...register("content_type")}>
          <option value={GenerationInput.content_type.SERVICE_PAGE}>Service page</option>
          <option value={GenerationInput.content_type.PLP}>Product listing page</option>
          <option value={GenerationInput.content_type.PDP}>Product detail page</option>
          <option value={GenerationInput.content_type.BLOG}>Blog post</option>
        </select>
      </Field>
      <Field label="Primary keyword" error={errors.primary_keyword?.message}>
        <input className={inputClass} {...register("primary_keyword")} />
      </Field>
      <Field label="Secondary keywords (one per line)">
        <textarea rows={3} className={inputClass} {...register("secondary_keywords")} />
      </Field>
      <Field label="Search intent">
        <select className={inputClass} {...register("search_intent")}>
          <option value={GenerationInput.search_intent.INFORMATIONAL}>Informational</option>
          <option value={GenerationInput.search_intent.COMMERCIAL}>Commercial</option>
          <option value={GenerationInput.search_intent.TRANSACTIONAL}>Transactional</option>
          <option value={GenerationInput.search_intent.NAVIGATIONAL}>Navigational</option>
        </select>
      </Field>
      <Field label="Competitor URLs (one per line)">
        <textarea rows={3} className={inputClass} {...register("competitor_urls")} />
      </Field>
      <Field label="Target URL (optional)">
        <input className={inputClass} {...register("target_url")} />
      </Field>
      <Field label="Target word count" error={errors.target_word_count?.message}>
        <input type="number" className={inputClass} {...register("target_word_count")} />
      </Field>
      <Field label="Additional context">
        <textarea rows={4} className={inputClass} {...register("additional_context")} />
      </Field>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {submitting ? "Preparing…" : "Start generation"}
      </button>
    </form>
  );
}
