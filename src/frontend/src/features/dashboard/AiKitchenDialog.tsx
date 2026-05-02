import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import LocalDiningRoundedIcon from '@mui/icons-material/LocalDiningRounded'
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useMutation } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { useState } from 'react'

import { apiClient } from '../../shared/api/client'
import type {
  AiDashRecipe,
  AiDashRecipeRecord,
  AiDashRecipeRequest,
  DietPreference,
  MealType,
} from '../../shared/types/api'

// ── Form schema ───────────────────────────────────────────────────────────────

type FormValues = {
  meal_type: MealType
  diet_pref: DietPreference
  available_items_raw: string // comma-separated
  health_constraints_raw: string
  allergies_raw: string
  cuisine: string
  time_minutes: string
  servings: string
  notes: string
}

const DEFAULT_VALUES: FormValues = {
  meal_type: 'dinner',
  diet_pref: 'veg',
  available_items_raw: '',
  health_constraints_raw: 'low sodium, high fiber',
  allergies_raw: '',
  cuisine: '',
  time_minutes: '30',
  servings: '2',
  notes: '',
}

function parseCsv(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function buildRequest(values: FormValues): AiDashRecipeRequest {
  return {
    meal_type: values.meal_type,
    diet_pref: values.diet_pref,
    available_items: parseCsv(values.available_items_raw),
    health_constraints: parseCsv(values.health_constraints_raw),
    allergies: parseCsv(values.allergies_raw),
    cuisine: values.cuisine.trim() || undefined,
    time_minutes: values.time_minutes ? Number(values.time_minutes) : undefined,
    servings: values.servings ? Number(values.servings) : 2,
    notes: values.notes.trim() || undefined,
  }
}

// ── Recipe result display ─────────────────────────────────────────────────────

function RecipeResult({ recipe }: { recipe: AiDashRecipe }) {
  return (
    <Stack spacing={3} sx={{ mt: 1 }}>
      {/* Title + meta */}
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.3, mb: 0.5 }}>
          {recipe.title}
        </Typography>
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <TimerOutlinedIcon sx={{ fontSize: '0.95rem', color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              Prep {recipe.prep_time_minutes} min · Cook {recipe.cook_time_minutes} min
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <LocalDiningRoundedIcon sx={{ fontSize: '0.95rem', color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}
            </Typography>
          </Stack>
        </Stack>
      </Box>

      {/* Ingredients */}
      <Box>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
          Ingredients
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
          {recipe.ingredients?.map((ing, i) => (
            <Chip
              key={`${ing.item}-${i}`}
              label={`${ing.quantity} ${ing.unit} ${ing.item}`}
              size="small"
              variant="outlined"
            />
          ))}
        </Stack>
      </Box>

      {/* Nutrition Summary */}
      {recipe.nutrition_summary && (
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: 'primary.50',
            border: '1px solid',
            borderColor: 'primary.100',
          }}
        >
          <Tooltip
            title="Estimated by AI based on IFCT 2017 data. May contain errors. Always verify with actual packaging."
            arrow
            placement="top-start"
          >
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mb: 1, cursor: 'help' }}>
              <Typography variant="overline" color="primary.main" sx={{ letterSpacing: 1, lineHeight: 1 }}>
                Nutrition per serving
              </Typography>
              <InfoOutlinedIcon sx={{ fontSize: '0.8rem', color: 'primary.main', opacity: 0.8 }} />
            </Stack>
          </Tooltip>
          <Grid container spacing={2}>
            {[
              { label: 'Calories', value: `${recipe.nutrition_summary.total_kcal} kcal` },
              { label: 'Protein', value: `${recipe.nutrition_summary.protein_g}g` },
              { label: 'Carbs', value: `${recipe.nutrition_summary.carbs_g}g` },
              { label: 'Fat', value: `${recipe.nutrition_summary.fat_g}g` },
              { label: 'Fiber', value: `${recipe.nutrition_summary.fiber_g}g` },
            ].map((stat) => (
              <Grid key={stat.label} size={{ xs: 4, sm: 2.4 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>
                  {stat.label}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {stat.value}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Divider />

      {/* Steps */}
      <Box>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
          Steps
        </Typography>
        <Stack spacing={1.5} sx={{ mt: 1 }}>
          {recipe.steps.map((step, i) => (
            <Stack key={i} direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: 'primary.main',
                  minWidth: 20,
                  lineHeight: 1.6,
                }}
              >
                {i + 1}.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {step}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>

      {/* DASH notes */}
      {recipe.dash_notes.length > 0 && (
        <>
          <Divider />
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
              DASH Notes
            </Typography>
            <Stack spacing={0.75} sx={{ mt: 1 }}>
              {recipe.dash_notes.map((note, i) => (
                <Stack key={i} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                  <CheckCircleOutlineRoundedIcon
                    sx={{ fontSize: '1rem', color: 'primary.main', mt: '2px', flexShrink: 0 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {note}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </>
      )}
    </Stack>
  )
}

// ── Main dialog ───────────────────────────────────────────────────────────────

interface AiKitchenDialogProps {
  open: boolean
  onClose: () => void
  onRecipeSaved?: (record: AiDashRecipeRecord) => void
}

export function AiKitchenDialog({ open, onClose, onRecipeSaved }: AiKitchenDialogProps) {
  const [recipe, setRecipe] = useState<AiDashRecipe | null>(null)

  const { control, register, handleSubmit, formState, reset } = useForm<FormValues>({
    defaultValues: DEFAULT_VALUES,
    mode: 'onTouched',
  })

  const mutation = useMutation({
    mutationFn: (payload: AiDashRecipeRequest) => apiClient.generateDashRecipe(payload),
    onSuccess: async (data) => {
      setRecipe(data.recipe)
      if (!onRecipeSaved) return
      try {
        const history = await apiClient.listDashRecipes({ limit: 1, offset: 0 })
        if (history.items[0]) onRecipeSaved(history.items[0])
      } catch {
        // ignore history refresh failure
      }
    },
  })

  const onSubmit = handleSubmit((values) => {
    const items = parseCsv(values.available_items_raw)
    if (items.length === 0) return // guard – field is required
    mutation.mutate(buildRequest(values))
  })

  const handleClose = () => {
    onClose()
    // brief delay so the dialog exits before we reset state
    setTimeout(() => {
      setRecipe(null)
      reset(DEFAULT_VALUES)
      mutation.reset()
    }, 300)
  }

  const handleTryAnother = () => {
    setRecipe(null)
    mutation.reset()
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" scroll="paper">
      <DialogTitle
        sx={{
          pt: 3,
          pb: 1,
          px: 3,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <AutoAwesomeRoundedIcon sx={{ color: 'primary.main', fontSize: '1.2rem' }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              AI Kitchen
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {recipe
              ? 'Your DASH-friendly recipe is ready.'
              : "Tell us what's in your kitchen — we'll generate a DASH recipe."}
          </Typography>
        </Box>
        <IconButton
          aria-label="Close AI Kitchen dialog"
          size="small"
          onClick={handleClose}
          sx={{ color: 'text.secondary', mt: -0.5, mr: -0.5 }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ px: 3, py: 2.5 }}>
        {/* ── Recipe result ── */}
        {recipe ? (
          <RecipeResult recipe={recipe} />
        ) : (
          /* ── Form ── */
          <Box component="form" id="ai-kitchen-form" onSubmit={onSubmit} noValidate>
            <Grid container spacing={2.5}>
              {/* Row 1: Meal type + Diet pref */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="meal-type-label" shrink>
                    Meal Type
                  </InputLabel>
                  <Controller
                    control={control}
                    name="meal_type"
                    render={({ field }) => (
                      <Select labelId="meal-type-label" label="Meal Type" notched {...field}>
                        <MenuItem value="breakfast">Breakfast</MenuItem>
                        <MenuItem value="lunch">Lunch</MenuItem>
                        <MenuItem value="dinner">Dinner</MenuItem>
                        <MenuItem value="snack">Snack</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="diet-pref-label" shrink>
                    Diet Preference
                  </InputLabel>
                  <Controller
                    control={control}
                    name="diet_pref"
                    render={({ field }) => (
                      <Select labelId="diet-pref-label" label="Diet Preference" notched {...field}>
                        <MenuItem value="veg">Vegetarian</MenuItem>
                        <MenuItem value="non-veg">Non-Vegetarian</MenuItem>
                        <MenuItem value="any">Any</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>

              {/* Ingredients */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Available ingredients *"
                  placeholder="spinach, tomato, brown rice, chickpeas"
                  slotProps={{ inputLabel: { shrink: true } }}
                  helperText={
                    formState.errors.available_items_raw?.message ??
                    'Separate ingredients with commas'
                  }
                  error={Boolean(formState.errors.available_items_raw)}
                  {...register('available_items_raw', {
                    validate: (v) =>
                      parseCsv(v).length > 0 || 'Please enter at least one ingredient',
                  })}
                />
              </Grid>

              {/* Health constraints + allergies */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Health constraints"
                  placeholder="low sodium, high fiber"
                  slotProps={{ inputLabel: { shrink: true } }}
                  helperText="Comma-separated"
                  {...register('health_constraints_raw')}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Allergies"
                  placeholder="peanuts, dairy"
                  slotProps={{ inputLabel: { shrink: true } }}
                  helperText="Comma-separated"
                  {...register('allergies_raw')}
                />
              </Grid>

              {/* Cuisine + time */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Cuisine"
                  placeholder="Indian, Mediterranean…"
                  slotProps={{ inputLabel: { shrink: true } }}
                  {...register('cuisine')}
                />
              </Grid>

              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Time (min)"
                  placeholder="30"
                  slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: 1 } }}
                  {...register('time_minutes')}
                />
              </Grid>

              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Servings"
                  placeholder="2"
                  slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: 1, max: 8 } }}
                  {...register('servings')}
                />
              </Grid>

              {/* Notes */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  minRows={2}
                  label="Extra notes"
                  placeholder="avoid deep-frying, keep it simple…"
                  slotProps={{ inputLabel: { shrink: true } }}
                  {...register('notes')}
                />
              </Grid>
            </Grid>

            {mutation.error && (
              <Alert severity="error" sx={{ mt: 2.5 }}>
                {(mutation.error as Error).message}
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        {recipe ? (
          <>
            <Button onClick={handleTryAnother} color="inherit">
              Try another
            </Button>
            <Button onClick={handleClose} variant="contained" sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}>
              Done
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleClose} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              form="ai-kitchen-form"
              variant="contained"
              disabled={mutation.isPending}
              startIcon={
                mutation.isPending ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <AutoAwesomeRoundedIcon />
                )
              }
              sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
            >
              {mutation.isPending ? 'Generating…' : 'Generate Recipe'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}
