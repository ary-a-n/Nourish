import {
  Box,
  Button,
  Chip,
  Collapse,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'

import type {
  ConstraintsResponse,
  MealOption,
  PlanResponse,
  AiDashRecipe,
  PatientPlanResponse,
  PatientPlanItem,
} from '../../shared/types/api'

type PlanResultsProps = {
  result:
    | PlanResponse
    | PatientPlanResponse
    | { constraints?: ConstraintsResponse; items: Array<unknown> }
}

// ─── KPI Tile ────────────────────────────────────────────────────────────────

type KpiTileProps = {
  label: string
  value: string | number
  unit: string
  highlight?: boolean
}

function KpiTile({ label, value, unit, highlight }: KpiTileProps) {
  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 2.5 },
        bgcolor: highlight ? 'rgba(30, 111, 92, 0.05)' : 'background.paper',
        border: '1px solid',
        borderColor: highlight ? 'rgba(30, 111, 92, 0.18)' : '#e5ece5',
        boxShadow: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontSize: '0.72rem', letterSpacing: 0.4, textTransform: 'uppercase' }}
      >
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 800, color: highlight ? 'primary.main' : 'text.primary', lineHeight: 1 }}
        >
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
          {unit}
        </Typography>
      </Box>
    </Paper>
  )
}

// ─── Constraints Summary (4-column KPI row) ──────────────────────────────────

function ConstraintsSummary({ constraints }: { constraints: ConstraintsResponse }) {
  return (
    <Box>
      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1, fontSize: '0.7rem' }}>
        Daily Targets
      </Typography>
      <Grid container spacing={{ xs: 1, sm: 1.5 }} sx={{ mt: 0.5 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <KpiTile label="Daily Energy" value={constraints.indian_tdee} unit="kcal" highlight />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <KpiTile label="Sodium Limit" value={constraints.daily_sodium_limit} unit="mg/day" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <KpiTile label="Per Main Meal" value={constraints.sodium_per_main} unit="mg Na" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <KpiTile label="Per Snack" value={constraints.sodium_per_snack} unit="mg Na" />
        </Grid>
      </Grid>
    </Box>
  )
}

// ─── Inline stat pill ────────────────────────────────────────────────────────

function StatPill({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontSize: '0.65rem',
          textTransform: 'uppercase',
          letterSpacing: 0.4,
          color: warn ? 'secondary.main' : 'text.secondary',
          fontWeight: 600,
        }}
      >
        {label}
        {warn ? ' ⚠' : ''}
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontWeight: 700, color: warn ? 'secondary.main' : 'text.primary' }}
      >
        {value}
      </Typography>
    </Box>
  )
}

// ─── Meal Card ───────────────────────────────────────────────────────────────

function MealCard({ item }: { item: PatientPlanItem }) {
  const [expanded, setExpanded] = useState(false)
  const isAi = item.source_type === 'ai'
  const payload = item.payload_json as MealOption | AiDashRecipe

  // Handle both types of payloads
  const foodName = isAi ? (payload as AiDashRecipe).title : (payload as MealOption).food_name
  const calories = isAi
    ? (payload as AiDashRecipe).nutrition_summary?.total_kcal
    : (payload as MealOption).unit_serving_energy_kcal
  const sodium = isAi
    ? undefined
    : (payload as MealOption).unit_serving_sodium_mg
  const potassium = isAi
    ? undefined
    : (payload as MealOption).unit_serving_potassium_mg
  
  const sodiumHigh = sodium ? sodium > 600 : false

  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 2.5 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: isAi ? 'primary.100' : '#e5ece5',
        boxShadow: 'none',
        transition: 'box-shadow 0.18s ease, transform 0.18s ease',
        position: 'relative',
        '&:hover': {
          boxShadow: '0 6px 24px rgba(15, 23, 42, 0.07)',
          transform: 'translateY(-1px)',
        },
      }}
    >
      {isAi && (
        <Chip
          label="AI Kitchen"
          size="small"
          color="primary"
          icon={<AutoAwesomeRoundedIcon style={{ fontSize: '0.8rem' }} />}
          sx={{
            position: 'absolute',
            top: -10,
            right: 16,
            height: 20,
            fontSize: '0.65rem',
            fontWeight: 800,
          }}
        />
      )}

      {/* Top row: name + chips */}
      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, lineHeight: 1.3, color: 'text.primary', mb: 0.5 }}
          >
            {foodName}
          </Typography>
          {!isAi ? (
            <Button
              size="small"
              variant="text"
              endIcon={<OpenInNewRoundedIcon sx={{ fontSize: '0.75rem !important' }} />}
              onClick={() =>
                window.open(
                  `https://www.google.com/search?q=${encodeURIComponent(`${foodName} recipe`)}`,
                  '_blank',
                )
              }
              aria-label={`Search recipe for ${foodName} on Google`}
              sx={{
                fontSize: '0.7rem',
                fontWeight: 500,
                color: 'text.secondary',
                p: 0,
                minWidth: 'auto',
                '&:hover': { color: 'primary.main', background: 'none' },
              }}
            >
              Search recipe
            </Button>
          ) : (
             <Typography variant="caption" color="text.secondary">
               Custom DASH recipe
             </Typography>
          )}
        </Box>
        {!isAi && (
          <Stack direction="column" spacing={0.5} sx={{ alignItems: 'flex-end', flexShrink: 0 }}>
            <Chip
              size="small"
              label={(payload as MealOption).course_type}
              sx={{
                bgcolor: 'background.default',
                color: 'text.secondary',
                border: '1px solid #e5ece5',
                fontSize: '0.7rem',
                height: 22,
                boxShadow: 'none',
                display: { xs: 'none', sm: 'inline-flex' },
              }}
            />
          </Stack>
        )}
      </Stack>

      {/* Primary stats row */}
      <Box
        sx={{
          display: 'flex',
          gap: { xs: 2, sm: 3 },
          mt: 'auto',
          pt: 1.5,
          borderTop: '1px solid',
          borderColor: '#f0f0f0',
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
        }}
      >
        {calories !== undefined && <StatPill label="Calories" value={`${Math.round(calories)} kcal`} />}
        {sodium !== undefined && (
          <StatPill
            label="Sodium"
            value={`${Math.round(sodium)} mg`}
            warn={sodiumHigh}
          />
        )}
        {potassium !== undefined && <StatPill label="Potassium" value={`${Math.round(potassium)} mg`} />}
        
        {isAi && (payload as AiDashRecipe).prep_time_minutes && (
          <StatPill label="Time" value={`${(payload as AiDashRecipe).prep_time_minutes + (payload as AiDashRecipe).cook_time_minutes} min`} />
        )}
      </Box>

      {/* Expandable details */}
      <Box sx={{ mt: 1 }}>
        <Button
          size="small"
          variant="text"
          onClick={() => setExpanded((v) => !v)}
          endIcon={
            expanded ? (
              <KeyboardArrowUpRoundedIcon sx={{ fontSize: '1rem' }} />
            ) : (
              <KeyboardArrowDownRoundedIcon sx={{ fontSize: '1rem' }} />
            )
          }
          sx={{
            color: 'text.secondary',
            fontSize: '0.72rem',
            fontWeight: 500,
            p: 0,
            minWidth: 'auto',
            '&:hover': { background: 'none', color: 'primary.main' },
          }}
        >
          {expanded ? 'Less details' : 'More details'}
        </Button>
        <Collapse in={expanded}>
          <Box sx={{ mt: 1.5 }}>
            {isAi ? (
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                    Ingredients
                  </Typography>
                  <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                    {(payload as AiDashRecipe).ingredients.map((ing, i) => (
                      <Chip key={i} label={`${ing.quantity} ${ing.unit} ${ing.item}`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                    ))}
                  </Stack>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                    Quick Steps
                  </Typography>
                  <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                    {(payload as AiDashRecipe).steps.slice(0, 3).map((step, i) => (
                      <Typography key={i} variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
                        • {step}
                      </Typography>
                    ))}
                    {(payload as AiDashRecipe).steps.length > 3 && (
                      <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                        + {(payload as AiDashRecipe).steps.length - 3} more steps
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </Stack>
            ) : (
              <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 } }}>
                <StatPill label="Fibre" value={`${(payload as MealOption).unit_serving_fibre_g.toFixed(1)} g`} />
                <StatPill label="Sat. Fat" value={`${(payload as MealOption).unit_serving_sfa_mg.toFixed(0)} mg`} />
              </Box>
            )}
          </Box>
        </Collapse>
      </Box>
    </Paper>
  )
}

// ─── PlanResults ──────────────────────────────────────────────────────────────

export function PlanResults({ result }: PlanResultsProps) {
  const isStandardPlan = 'plan' in result
  const isPatientPlan = 'items' in result && !isStandardPlan
  const constraints = 'constraints' in result ? result.constraints : undefined
  const items: PatientPlanItem[] = isStandardPlan
    ? (result as PlanResponse).plan.map((m) => ({
        meal_slot: m.meal_slot,
        source_type: 'dataset',
        payload_json: m,
      }))
    : isPatientPlan
      ? (result as PatientPlanResponse).items
      : ((result as { items: Array<PatientPlanItem> }).items ?? [])

  const normalizedItems = items.map((item) => {
    if (item?.payload_json && typeof item.payload_json === 'object' && 'food_name' in item.payload_json) {
      return item
    }
    if ((item?.payload_json as any)?.food_name) {
      return item
    }
    return {
      ...item,
      payload_json: item.payload_json ?? item,
    }
  })

  const grouped = new Map<string, PatientPlanItem[]>()
  for (const item of normalizedItems) {
    if (!grouped.has(item.meal_slot)) grouped.set(item.meal_slot, [])
    grouped.get(item.meal_slot)?.push(item)
  }
  const groups = Array.from(grouped.entries())

  return (
    <Stack spacing={{ xs: 3, sm: 4, md: 5 }}>
      {constraints && <ConstraintsSummary constraints={constraints} />}

      {groups.map(([slot, slotItems]) => (
        <Box key={slot}>
          <Box
            sx={{
              mb: 2,
              pb: 1,
              borderBottom: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {slot}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
              {slotItems.length} {slotItems.length === 1 ? 'option' : 'options'}
            </Typography>
          </Box>
          <Grid container spacing={{ xs: 1.5, sm: 2 }}>
            {slotItems.map((item, idx) => (
              <Grid
                size={{ xs: 12, md: 6 }}
                key={`${slot}-${idx}`}
              >
                <MealCard item={item} />
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
    </Stack>
  )
}
