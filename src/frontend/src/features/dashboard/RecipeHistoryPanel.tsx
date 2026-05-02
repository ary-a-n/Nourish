import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded'
import {
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useMemo } from 'react'

import type { AiDashRecipeRecord } from '../../shared/types/api'

type RecipeHistoryPanelProps = {
  recipes: AiDashRecipeRecord[]
  onSelect: (recipe: AiDashRecipeRecord) => void
  selectedId?: string
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function RecipeHistoryPanel({ recipes, onSelect, selectedId }: RecipeHistoryPanelProps) {
  const items = useMemo(() => recipes.slice(0, 8), [recipes])

  return (
    <Paper
      sx={{
        border: '1px solid #e5ece5',
        boxShadow: 'none',
        p: { xs: 2, sm: 3 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <AutoAwesomeRoundedIcon sx={{ color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Recipe History
        </Typography>
      </Stack>

      {items.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
          <Typography variant="body2">No recipes yet.</Typography>
          <Typography variant="caption">Generate one from AI Kitchen to see it here.</Typography>
        </Box>
      ) : (
        <Stack spacing={{ xs: 1, sm: 1.5 }} sx={{ flex: 1 }}>
          {items.map((record) => (
            <Paper
              key={record.id}
              variant="outlined"
              onClick={() => onSelect(record)}
              sx={{
                p: { xs: 1.25, sm: 1.5 },
                borderColor: record.id === selectedId ? 'primary.main' : 'divider',
                backgroundColor: record.id === selectedId ? 'primary.50' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: record.id === selectedId ? 'primary.50' : 'rgba(30, 111, 92, 0.04)',
                },
              }}
            >
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                  <RestaurantMenuRoundedIcon sx={{ color: 'primary.main', fontSize: '1.1rem', mt: '2px' }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {record.recipe.title}
                    </Typography>
                    <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', alignItems: 'center', mt: 0.5 }}>
                      <Chip label={`${record.recipe.servings} servings`} size="small" />
                      <Chip label={`${record.recipe.prep_time_minutes + record.recipe.cook_time_minutes} min`} size="small" />
                    </Stack>
                  </Box>
                  <AccessTimeRoundedIcon fontSize="small" sx={{ color: 'text.secondary', mt: '4px' }} />
                </Stack>
                <Divider />
                <Typography variant="caption" color="text.secondary">
                  {formatDate(record.created_at)}
                </Typography>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Paper>
  )
}
