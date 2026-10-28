import { useState } from 'react'
import { ViewportToggle, type Viewport } from '../components/preview/ViewportToggle'
import { useRadioGroup } from '../hooks/useRadioGroup'
import { pageTitleClass } from '../styles/typography'
import { CORPORATE_VARIANTS, SAMPLE_PROFILES, type TemplateVariantMeta } from '../templates/corporate'
import { RESTAURANT_SAMPLE_PROFILES } from '../templates/restaurant'
import { REAL_ESTATE_SAMPLE_PROFILES } from '../templates/real-estate'
import { PORTFOLIO_SAMPLE_PROFILES } from '../templates/portfolio'
import { CATALOG_SAMPLE_PROFILES } from '../templates/catalog'
import { ECOMMERCE_SAMPLE_PROFILES } from '../templates/ecommerce'
import { TEMPLATE_FAMILIES, type TemplateFamilyId } from '../templates/parseConfig'

interface ShowcaseSampleProfile {
  id: string
  name: string
  description: string
}

/** Each non-corporate family has exactly one sample profile list — keyed generically
 * here so adding a fourth family only means adding one entry, not another branch. Only
 * id/name/description are used by this page, so each family's differently-typed
 * `config` field doesn't need to unify here. */
const SAMPLE_PROFILES_BY_FAMILY: Record<Exclude<TemplateFamilyId, 'corporate'>, ShowcaseSampleProfile[]> = {
  restaurant: RESTAURANT_SAMPLE_PROFILES,
  'real-estate': REAL_ESTATE_SAMPLE_PROFILES,
  portfolio: PORTFOLIO_SAMPLE_PROFILES,
  catalog: CATALOG_SAMPLE_PROFILES,
  ecommerce: ECOMMERCE_SAMPLE_PROFILES,
}

export function TemplatesShowcasePage() {
  const [family, setFamily] = useState<TemplateFamilyId>('corporate')
  const [variant, setVariant] = useState<TemplateVariantMeta['id']>('premium')
  const [profileId, setProfileId] = useState(SAMPLE_PROFILES[0].id)
  const [otherProfileIds, setOtherProfileIds] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const [familyId, profiles] of Object.entries(SAMPLE_PROFILES_BY_FAMILY)) initial[familyId] = profiles[0].id
    return initial
  })
  const [viewport, setViewport] = useState<Viewport>('desktop')

  const otherProfiles = family !== 'corporate' ? SAMPLE_PROFILES_BY_FAMILY[family] : null
  const selectedProfileId = otherProfiles ? otherProfileIds[family] : profileId

  const previewSrc =
    family === 'corporate'
      ? `/templates/preview?family=corporate&variant=${variant}&profile=${profileId}`
      : `/templates/preview?family=${family}&profile=${selectedProfileId}`

  const familyGroup = useRadioGroup({
    value: family,
    onChange: setFamily,
    values: TEMPLATE_FAMILIES.map((item) => item.id),
  })
  const variantGroup = useRadioGroup({
    value: variant,
    onChange: setVariant,
    values: CORPORATE_VARIANTS.map((item) => item.id),
  })
  const profileOptions = otherProfiles ?? SAMPLE_PROFILES
  const profileGroup = useRadioGroup({
    value: selectedProfileId,
    onChange: (id) => (otherProfiles ? setOtherProfileIds((prev) => ({ ...prev, [family]: id })) : setProfileId(id)),
    values: profileOptions.map((profile) => profile.id),
  })

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className={pageTitleClass}>Template showcase</h2>
        <p className="text-sm text-text-muted">
          Compare template families and their design variants with sample business content. This is a
          development preview — it doesn't save anything.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-8">
          <fieldset className="min-w-0">
            <legend className="text-sm font-semibold text-text">Family</legend>
            <div {...familyGroup.groupProps} aria-label="Family" className="mt-2 flex flex-wrap gap-2">
              {TEMPLATE_FAMILIES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  {...familyGroup.getItemProps(item.id)}
                  onClick={() => setFamily(item.id)}
                  title={item.description}
                  className={`rounded-md border px-3.5 py-2 text-sm font-medium transition-colors ${
                    family === item.id
                      ? 'border-accent bg-accent/10 text-accent-strong'
                      : 'border-border-strong text-text-muted hover:text-text'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </fieldset>

          {family === 'corporate' && (
            <fieldset className="min-w-0">
              <legend className="text-sm font-semibold text-text">Variant</legend>
              <div {...variantGroup.groupProps} aria-label="Variant" className="mt-2 flex flex-wrap gap-2">
                {CORPORATE_VARIANTS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    {...variantGroup.getItemProps(item.id)}
                    onClick={() => setVariant(item.id)}
                    title={item.description}
                    className={`rounded-md border px-3.5 py-2 text-sm font-medium transition-colors ${
                      variant === item.id
                        ? 'border-accent bg-accent/10 text-accent-strong'
                        : 'border-border-strong text-text-muted hover:text-text'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <fieldset className="min-w-0">
            <legend className="text-sm font-semibold text-text">Sample profile</legend>
            <div {...profileGroup.groupProps} aria-label="Sample profile" className="mt-2 flex flex-wrap gap-2">
              {profileOptions.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  {...profileGroup.getItemProps(profile.id)}
                  onClick={() =>
                    otherProfiles
                      ? setOtherProfileIds((prev) => ({ ...prev, [family]: profile.id }))
                      : setProfileId(profile.id)
                  }
                  title={profile.description}
                  className={`rounded-md border px-3.5 py-2 text-sm font-medium transition-colors ${
                    selectedProfileId === profile.id
                      ? 'border-accent bg-accent/10 text-accent-strong'
                      : 'border-border-strong text-text-muted hover:text-text'
                  }`}
                >
                  {profile.name}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <ViewportToggle viewport={viewport} onChange={setViewport} />
      </div>

      <div className="flex justify-center overflow-auto rounded-lg border border-border bg-bg p-4">
        <iframe
          title="Template preview"
          src={previewSrc}
          className="h-[1400px] rounded-md border border-border-strong bg-white transition-[width] duration-200"
          style={{ width: viewport === 'mobile' ? '390px' : '100%' }}
        />
      </div>
    </div>
  )
}
