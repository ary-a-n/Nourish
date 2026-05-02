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

import type { ConstraintsResponse, MealOption, PlanResponse } from '../../shared/types/api'

type PlanResultsProps = {
  result: PlanResponse
}

function slotGroups(plan: MealOption[]): Array<[string, MealOption[]]> {
  const grouped = new Map<string, MealOption[]>()
  for (const item of plan) {
    if (!grouped.has(item.meal_slot)) {
      grouped.set(item.meal_slot, [])
    }
    grouped.get(item.meal_slot)?.push(item)
  }
  return Array.from(grouped.entries())
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

function MealCard({ meal }: { meal: MealOption }) {
  const [expanded, setExpanded] = useState(false)
  const sodiumHigh = meal.unit_serving_sodium_mg > 600

  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 2.5 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: '#e5ece5',
        boxShadow: 'none',
        transition: 'box-shadow 0.18s ease, transform 0.18s ease',
        '&:hover': {
          boxShadow: '0 6px 24px rgba(15, 23, 42, 0.07)',
          transform: 'translateY(-1px)',
        },
      }}
    >
      {/* Top row: name + chips */}
      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, lineHeight: 1.3, color: 'text.primary', mb: 0.5 }}
          >
            {meal.food_name}
          </Typography>
          <Button
            size="small"
            variant="text"
            endIcon={<OpenInNewRoundedIcon sx={{ fontSize: '0.75rem !important' }} />}
            onClick={() =>
              window.open(
                `https://www.google.com/search?q=${encodeURIComponent(`${meal.food_name} recipe`)}`,
                '_blank',
              )
            }
            aria-label={`Search recipe for ${meal.food_name} on Google`}
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
        </Box>
        <Stack direction="column" spacing={0.5} sx={{ alignItems: 'flex-end', flexShrink: 0 }}>
          <Chip
            size="small"
            label={meal.course_type}
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
          <Chip
            size="small"
            label={meal.diet_type}
            sx={{
              bgcolor: 'transparent',
              color: 'primary.main',
              border: '1px solid',
              borderColor: 'rgba(30, 111, 92, 0.3)',
              fontSize: '0.7rem',
              height: 22,
              boxShadow: 'none',
              display: { xs: 'none', sm: 'inline-flex' },
            }}
          />
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 1.5, display: { xs: 'flex', sm: 'none' } }}>
        <Chip
          size="small"
          label={meal.course_type}
          sx={{
            bgcolor: 'background.default',
            color: 'text.secondary',
            border: '1px solid #e5ece5',
            fontSize: '0.7rem',
            height: 22,
            boxShadow: 'none',
          }}
        />
        <Chip
          size="small"
          label={meal.diet_type}
          sx={{
            bgcolor: 'transparent',
            color: 'primary.main',
            border: '1px solid',
            borderColor: 'rgba(30, 111, 92, 0.3)',
            fontSize: '0.7rem',
            height: 22,
            boxShadow: 'none',
          }}
        />
      </Stack>

      {/* Primary 3-stat row */}
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
        <StatPill label="Calories" value={`${meal.unit_serving_energy_kcal.toFixed(0)} kcal`} />
        <StatPill
          label="Sodium"
          value={`${meal.unit_serving_sodium_mg.toFixed(0)} mg`}
          warn={sodiumHigh}
        />
        <StatPill label="Potassium" value={`${meal.unit_serving_potassium_mg.toFixed(0)} mg`} />
      </Box>

      {/* Expandable secondary nutrients */}
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
          <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, mt: 1.5, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
            <StatPill label="Fibre" value={`${meal.unit_serving_fibre_g.toFixed(1)} g`} />
            <StatPill label="Sat. Fat" value={`${meal.unit_serving_sfa_mg.toFixed(0)} mg`} />
          </Box>
        </Collapse>
      </Box>
    </Paper>
  )
}

// ─── PlanResults ──────────────────────────────────────────────────────────────

export function PlanResults({ result }: PlanResultsProps) {
  const grouped = slotGroups(result.plan)

  return (
    <Stack spacing={{ xs: 3, sm: 4, md: 5 }}>
      <ConstraintsSummary constraints={result.constraints} />

      {grouped.map(([slot, meals]) => (
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
              {meals.length} {meals.length === 1 ? 'option' : 'options'}
            </Typography>
          </Box>
          <Grid container spacing={{ xs: 1.5, sm: 2 }}>
            {meals.map((meal) => (
              <Grid
                size={{ xs: 12, md: 6 }}
                key={`${slot}-${meal.food_name}-${meal.dash_score}`}
              >
                <MealCard meal={meal} />
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
    </Stack>
  )
}
