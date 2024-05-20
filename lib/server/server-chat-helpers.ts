import { Database, Tables } from "@/supabase/types"
import { VALID_ENV_KEYS } from "@/types/valid-keys"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { LLM_LIST } from "@/lib/models/llm/llm-list"
import { LLMID } from "@/types"
import { SupabaseClient } from "@supabase/supabase-js"
import { SubscriptionRequiredError } from "@/lib/errors"
import { validateProPlan } from "@/lib/subscription"
import { PLAN_FREE } from "@/lib/stripe/config"

function createClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value
        }
      }
    }
  )
}

export async function getServerProfile() {
  const cookieStore = cookies()
  const supabase = createClient()

  const user = (await supabase.auth.getUser()).data.user
  if (!user) {
    throw new Error("User not found")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (!profile) {
    throw new Error("Profile not found")
  }

  const profileWithKeys = addApiKeysToProfile(profile)

  return profileWithKeys
}

function addApiKeysToProfile(profile: Tables<"profiles">) {
  const apiKeys = {
    [VALID_ENV_KEYS.OPENAI_API_KEY]: "openai_api_key",
    [VALID_ENV_KEYS.ANTHROPIC_API_KEY]: "anthropic_api_key",
    [VALID_ENV_KEYS.GOOGLE_GEMINI_API_KEY]: "google_gemini_api_key",
    [VALID_ENV_KEYS.MISTRAL_API_KEY]: "mistral_api_key",
    [VALID_ENV_KEYS.GROQ_API_KEY]: "groq_api_key",
    [VALID_ENV_KEYS.PERPLEXITY_API_KEY]: "perplexity_api_key",
    [VALID_ENV_KEYS.AZURE_OPENAI_API_KEY]: "azure_openai_api_key",
    [VALID_ENV_KEYS.OPENROUTER_API_KEY]: "openrouter_api_key",

    [VALID_ENV_KEYS.OPENAI_ORGANIZATION_ID]: "openai_organization_id",

    [VALID_ENV_KEYS.AZURE_OPENAI_ENDPOINT]: "azure_openai_endpoint",
    [VALID_ENV_KEYS.AZURE_GPT_35_TURBO_NAME]: "azure_openai_35_turbo_id",
    [VALID_ENV_KEYS.AZURE_GPT_45_VISION_NAME]: "azure_openai_45vision_id",
    [VALID_ENV_KEYS.AZURE_GPT_45_TURBO_NAME]: "azure_openai_45_turbo_id",
    [VALID_ENV_KEYS.AZURE_EMBEDDINGS_NAME]: "azure_openai_embeddings_id"
  }

  for (const [envKey, profileKey] of Object.entries(apiKeys)) {
    if (process.env[envKey] && !(profile as any)[profileKey]) {
      ;(profile as any)[profileKey] = process.env[envKey]
    }
  }

  return profile
}

export function checkApiKey(apiKey: string | null, keyName: string) {
  if (apiKey === null || apiKey === "") {
    throw new Error(`${keyName} API Key not found`)
  }
}

function isPaidModel(model: LLMID) {
  const paidLLMS = LLM_LIST.filter(x => x.paid).map(x => x.modelId)
  return paidLLMS.includes(model)
}

export async function validateModel(profile: Tables<"profiles">, model: LLMID) {
  const { plan } = profile

  if (validateProPlan(profile)) {
    return
  }

  if (isPaidModel(model)) {
    throw new SubscriptionRequiredError("Pro plan required to use this model")
  }
}

function getEnvInt(varName: string, def: number) {
  if (varName in process.env) {
    return parseInt(process.env[varName] + "")
  }

  return def
}

const FREE_MESSAGE_DAILY_LIMIT = getEnvInt("FREE_MESSAGE_LIMIT", 30)
const PRO_MESSAGE_DAILY_LIMIT = getEnvInt("PRO_MESSAGE_LIMIT", 50)
const CATCHALL_MESSAGE_DAILY_LIMIT = getEnvInt(
  "CATCHALL_MESSAGE_DAILY_LIMIT",
  300
)

export async function validateMessageCount(
  profile: Tables<"profiles">,
  model: LLMID,
  date: Date,
  supabase: SupabaseClient
) {
  const { plan } = profile

  if (plan.startsWith("byok_")) {
    return
  }

  // subtract 24 hours

  let previousDate = new Date(date.getTime() - 24 * 60 * 60 * 1000)

  const { count, data, error } = await supabase
    .from("messages")
    .select("*", {
      count: "exact"
    })
    .eq("role", "user")
    .eq("model", model)
    .gte("created_at", previousDate.toISOString())

  if (count === null) {
    throw new Error("Could not fetch message count")
  }

  if (
    (plan === PLAN_FREE || plan.startsWith("premium_")) &&
    count > FREE_MESSAGE_DAILY_LIMIT
  ) {
    throw new SubscriptionRequiredError(
      `You have reached daily message limit for ${model}. Upgrade to Pro plan to continue come back tomorrow.`
    )
  }

  if (
    isPaidModel(model) &&
    plan.startsWith("pro_") &&
    count > PRO_MESSAGE_DAILY_LIMIT
  ) {
    throw new SubscriptionRequiredError(
      `You have reached daily message limit for Pro plan for ${model}`
    )
  }

  if (count > CATCHALL_MESSAGE_DAILY_LIMIT) {
    throw new SubscriptionRequiredError(
      `You have reached hard daily message limit for model ${model}`
    )
  }
}

export async function validateModelAndMessageCount(model: LLMID, date: Date) {
  const client = createClient()
  const profile = await getServerProfile()
  await validateModel(profile, model)
  await validateMessageCount(profile, model, date, client)
}
