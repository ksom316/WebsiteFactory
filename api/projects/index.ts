import { sendJson, getQueryParams, readJsonBody, InvalidJsonError, PayloadTooLargeError, type ApiRequest, type ApiResponse } from '../_lib/http.js'
import { withAuth } from '../_lib/auth.js'
import { handleApiError } from '../_lib/errors.js'
import { listProjects, createProjectWithConfig } from '../_lib/db/queries/projects.js'
import { createProjectSchema, listProjectsQuerySchema } from '../_lib/projectValidation.js'
import { CORPORATE_TEMPLATE_ID } from '../../src/templates/corporate/registry.js'
import { parseCorporateConfig } from '../../src/templates/corporate/schema.js'
import { RESTAURANT_TEMPLATE_ID } from '../../src/templates/restaurant/registry.js'
import { parseRestaurantConfig } from '../../src/templates/restaurant/schema.js'
import { REAL_ESTATE_TEMPLATE_ID } from '../../src/templates/real-estate/registry.js'
import { parseRealEstateConfig } from '../../src/templates/real-estate/schema.js'
import { PORTFOLIO_TEMPLATE_ID } from '../../src/templates/portfolio/registry.js'
import { parsePortfolioConfig } from '../../src/templates/portfolio/schema.js'
import { CATALOG_TEMPLATE_ID } from '../../src/templates/catalog/registry.js'
import { parseCatalogConfig } from '../../src/templates/catalog/schema.js'
import { ECOMMERCE_TEMPLATE_ID } from '../../src/templates/ecommerce/registry.js'
import { parseEcommerceConfig } from '../../src/templates/ecommerce/schema.js'
import type { AnyTemplateConfig, TemplateFamilyId } from '../../src/templates/parseConfig.js'

interface StartingConfigInput {
  name: string
  businessName?: string
  variant: 'premium' | 'neutral'
  industry?: string
  location?: string
}

/**
 * Builds the project's starting configuration from the chosen family's own schema,
 * paired with that family's `templates` row id — returning both from one switch is
 * what keeps `projects.template_id` and the saved config's own `family` tag from ever
 * disagreeing at creation time (see README.md's "Template families" section). An
 * unrecognized `family` can't reach here: `createProjectSchema` already rejects it
 * with a 400 via its `z.enum(PROJECT_FAMILIES)` check before this function is called.
 */
function buildStartingConfig(family: TemplateFamilyId, input: StartingConfigInput): { templateId: string; config: AnyTemplateConfig } {
  const { name, businessName, variant, industry, location } = input
  const displayName = businessName || name

  if (family === 'restaurant') {
    return {
      templateId: RESTAURANT_TEMPLATE_ID,
      config: parseRestaurantConfig({
        restaurant: { name: displayName, location },
        hero: { heading: `Welcome to ${displayName}` },
      }),
    }
  }

  if (family === 'real-estate') {
    return {
      templateId: REAL_ESTATE_TEMPLATE_ID,
      config: parseRealEstateConfig({
        agency: { name: displayName, location },
        hero: { heading: `Welcome to ${displayName}` },
      }),
    }
  }

  if (family === 'portfolio') {
    return {
      templateId: PORTFOLIO_TEMPLATE_ID,
      config: parsePortfolioConfig({
        person: { name: displayName, location },
        hero: { heading: `Hello, I'm ${displayName}` },
      }),
    }
  }

  if (family === 'catalog') {
    return {
      templateId: CATALOG_TEMPLATE_ID,
      config: parseCatalogConfig({
        business: { name: displayName, location },
        hero: { heading: `Welcome to ${displayName}` },
      }),
    }
  }

  if (family === 'ecommerce') {
    return {
      templateId: ECOMMERCE_TEMPLATE_ID,
      config: parseEcommerceConfig({
        store: { name: displayName },
        hero: { heading: `Welcome to ${displayName}` },
      }),
    }
  }

  return {
    templateId: CORPORATE_TEMPLATE_ID,
    config: parseCorporateConfig({
      variant,
      business: { name: displayName, industry, location },
      hero: { heading: `Welcome to ${displayName}` },
    }),
  }
}

async function handleGet(req: ApiRequest, res: ApiResponse): Promise<void> {
  const query = getQueryParams(req)
  const parsed = listProjectsQuerySchema.safeParse({
    status: query.get('status') ?? undefined,
    limit: query.get('limit') ?? undefined,
    offset: query.get('offset') ?? undefined,
  })

  if (!parsed.success) {
    sendJson(res, 400, { error: 'Invalid query parameters' })
    return
  }

  try {
    const result = await listProjects(parsed.data)
    sendJson(res, 200, result)
  } catch (error) {
    handleApiError(res, error)
  }
}

async function handlePost(req: ApiRequest, res: ApiResponse): Promise<void> {
  let body: unknown
  try {
    body = await readJsonBody(req)
  } catch (error) {
    if (error instanceof PayloadTooLargeError) sendJson(res, 413, { error: 'Request body too large' })
    else if (error instanceof InvalidJsonError) sendJson(res, 400, { error: 'Invalid JSON body' })
    else sendJson(res, 400, { error: 'Invalid request' })
    return
  }

  const parsed = createProjectSchema.safeParse(body)
  if (!parsed.success) {
    sendJson(res, 400, { error: 'Invalid project details', issues: parsed.error.issues.map((i) => i.message) })
    return
  }

  const { name, businessName, slug, family, variant, industry, location } = parsed.data

  // Build the project's starting configuration from the family's own schema, and its
  // `templates` row id, from the SAME `family` switch — this is what keeps the
  // project-level template id and the config's own `family` tag from ever disagreeing
  // at creation time (see README.md's "Template families" section).
  const { templateId, config } = buildStartingConfig(family, { name, businessName, variant, industry, location })

  try {
    const result = await createProjectWithConfig({
      name,
      slug,
      businessName,
      templateId,
      config,
    })
    sendJson(res, 201, result)
  } catch (error) {
    handleApiError(res, error)
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'GET' && req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  await withAuth(async (innerReq: ApiRequest, innerRes: ApiResponse) => {
    if (innerReq.method === 'GET') await handleGet(innerReq, innerRes)
    else await handlePost(innerReq, innerRes)
  })(req, res)
}
