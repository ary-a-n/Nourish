import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import RestaurantRoundedIcon from '@mui/icons-material/RestaurantRounded'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  Menu,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useMutation, useQuery } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { PlanResults } from '../plan/PlanResults'
import { profileSchema, type ProfileSchema } from '../profile/schemas'
import { apiClient } from '../../shared/api/client'
import { clearAccessToken } from '../../shared/lib/auth'
import { PageShell } from '../../shared/ui/PageShell'
import type { AiDashRecipeRecord } from '../../shared/types/api'
import { AiKitchenDialog } from './AiKitchenDialog'
import { RecipeHistoryPanel } from './RecipeHistoryPanel'

function toProfileDefaults(name = ''): Partial<ProfileSchema> {
  return {
    name,
    gender: 'male',
    activity_level: 'sedentary',
    bp_stage: 'pre',
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function DashboardPage() {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [aiKitchenOpen, setAiKitchenOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'suggested' | 'ai-kitchen'>('suggested')
  const [avatarMenuAnchor, setAvatarMenuAnchor] = useState<null | HTMLElement>(null)
  const avatarMenuOpen = Boolean(avatarMenuAnchor)

  const [selectedRecipe, setSelectedRecipe] = useState<AiDashRecipeRecord | null>(null)

  const profileForm = useForm<ProfileSchema>({
    resolver: zodResolver(profileSchema),
    defaultValues: toProfileDefaults(),
    mode: 'onTouched',
  })

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: apiClient.me,
    retry: false,
  })

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: apiClient.getProfile,
    retry: false,
    enabled: meQuery.isSuccess,
  })

  const patientPlanQuery = useQuery({
    queryKey: ['my-plan'],
    queryFn: apiClient.getMyPlan,
    enabled: meQuery.isSuccess,
  })

  const recipeHistoryQuery = useQuery({
    queryKey: ['dash-recipes'],
    queryFn: () => apiClient.listDashRecipes({ limit: 8, offset: 0 }),
    enabled: meQuery.isSuccess,
  })

  const saveProfileMutation = useMutation({
    mutationFn: apiClient.saveProfile,
    onSuccess: ({ profile }) => {
      profileForm.reset(profile)
      setProfileModalOpen(false)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: apiClient.logout,
    onSettled: () => {
      clearAccessToken()
      navigate('/auth', { replace: true })
    },
  })

  const onSaveProfile = profileForm.handleSubmit(async (values) => {
    await saveProfileMutation.mutateAsync({ profile: values })
  })

  const handleLogout = () => {
    logoutMutation.mutate()
  }

  useEffect(() => {
    if (meQuery.error) {
      clearAccessToken()
      navigate('/auth', { replace: true })
    }
  }, [meQuery.error, navigate])

  useEffect(() => {
    if (profileQuery.isSuccess) {
      profileForm.reset(profileQuery.data.profile)
      return
    }

    if (meQuery.isSuccess && !profileQuery.isLoading && profileQuery.error) {
      profileForm.setValue('name', meQuery.data.name)
    }
  }, [
    meQuery.data?.name,
    meQuery.isSuccess,
    profileForm,
    profileQuery.data,
    profileQuery.error,
    profileQuery.isLoading,
    profileQuery.isSuccess,
  ])

  useEffect(() => {
    if (!selectedRecipe && recipeHistoryQuery.data?.items?.length) {
      const firstItem = recipeHistoryQuery.data.items[0]
      if (firstItem) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedRecipe(firstItem)
      }
    }
  }, [recipeHistoryQuery.data?.items, selectedRecipe])

  if (meQuery.error) {
    return null
  }

  const planResult = patientPlanQuery.data
  const approvedPlan = planResult?.status === 'approved' ? planResult : null
  const hasPlanResult = Boolean(planResult)
  const hasProfile = profileQuery.isSuccess
  const displayName = hasProfile ? profileQuery.data.profile.name : (meQuery.data?.name ?? '')
  const initials = displayName ? getInitials(displayName) : '?'

  return (
    <PageShell>
      <Stack spacing={{ xs: 3, sm: 4, md: 5 }}>
        {/* ── Header ──────────────────────────────────────────────────── */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 2, sm: 2.5 }}
          sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
        >
          {/* App name + greeting */}
          <Box>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                fontSize: '0.7rem',
                mb: 0.25,
              }}
            >
              Nourish
            </Typography>
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2, fontSize: { xs: '1.35rem', sm: '1.5rem' } }}
            >
              {getGreeting()}{displayName ? `, ${displayName.split(' ')[0]}` : ''}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {approvedPlan
                ? 'Your dietician-approved DASH plan is ready.'
                : 'Your DASH diet meal plan is ready when you are.'}
            </Typography>
          </Box>

          {/* Actions */}
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: 'center', alignSelf: { xs: 'flex-end', sm: 'auto' } }}
          >
            {/* Avatar dropdown */}
            <Button
              id="avatar-button"
              aria-controls={avatarMenuOpen ? 'avatar-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={avatarMenuOpen ? 'true' : undefined}
              onClick={(e) => setAvatarMenuAnchor(e.currentTarget)}
              sx={{
                p: 0.5,
                minWidth: 'auto',
                borderRadius: 8,
                gap: 0.5,
                color: 'text.secondary',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
              }}
            >
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: 'primary.main',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}
              >
                {initials}
              </Avatar>
              <KeyboardArrowDownRoundedIcon sx={{ fontSize: '1.1rem' }} />
            </Button>

            <Menu
              id="avatar-menu"
              anchorEl={avatarMenuAnchor}
              open={avatarMenuOpen}
              onClose={() => setAvatarMenuAnchor(null)}
              slotProps={{
                list: { 'aria-labelledby': 'avatar-button' },
                paper: {
                  sx: {
                    mt: 0.5,
                    minWidth: 160,
                    boxShadow: '0 4px 24px rgba(15, 23, 42, 0.1)',
                    border: '1px solid #e5ece5',
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem
                onClick={() => {
                  setAvatarMenuAnchor(null)
                  setProfileModalOpen(true)
                }}
                sx={{ gap: 1.5, py: 1 }}
              >
                <EditRoundedIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                <Typography variant="body2">Edit Profile</Typography>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setAvatarMenuAnchor(null)
                  handleLogout()
                }}
                sx={{ gap: 1.5, py: 1, color: 'error.main' }}
              >
                <LogoutRoundedIcon sx={{ fontSize: '1rem' }} />
                <Typography variant="body2" color="inherit">Sign Out</Typography>
              </MenuItem>
            </Menu>
          </Stack>
        </Stack>

        {/* ── State 1: Loading ─────────────────────────────────────── */}
        {patientPlanQuery.isLoading && (
          <Paper
            sx={{
              p: { xs: 2.5, md: 6 },
              textAlign: 'center',
              border: '1px solid #e5ece5',
              boxShadow: 'none',
            }}
          >
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: '50%',
                border: '2px solid',
                borderColor: 'primary.main',
                mb: 3,
                '@keyframes spin': {
                  from: { transform: 'rotate(0deg)' },
                  to: { transform: 'rotate(360deg)' },
                },
                '@keyframes spinReverse': {
                  from: { transform: 'rotate(0deg)' },
                  to: { transform: 'rotate(-360deg)' },
                },
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  inset: -6,
                  borderRadius: '50%',
                  border: '1.5px dashed',
                  borderColor: 'rgba(30, 111, 92, 0.25)',
                  animation: 'spinReverse 4s linear infinite',
                },
              }}
            >
              <RestaurantRoundedIcon sx={{ color: 'primary.main', fontSize: 26 }} />
            </Box>
            <Typography variant="h6" sx={{ mb: 0.75, fontWeight: 700 }}>
              Loading your plan…
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Crunching nutrition data and finding the best DASH-compliant meals for you.
            </Typography>
          </Paper>
        )}

        {/* ── State 2: Idle — no plan yet ─────────────────────────────── */}
        {!hasPlanResult && !patientPlanQuery.isLoading && (
          <Paper
            sx={{
              p: { xs: 2.5, md: 6 },
              textAlign: 'center',
              border: '1px solid #e5ece5',
              boxShadow: 'none',
            }}
          >
            <Box sx={{ maxWidth: 440, mx: 'auto' }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
                No plan assigned yet
              </Typography>
              <Typography color="text.secondary" variant="body2" sx={{ mb: 4, lineHeight: 1.7 }}>
                Your dietician will create a personalized DASH diet plan for you. In the meantime,
                explore AI Kitchen to discover DASH-friendly recipes.
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<AutoAwesomeRoundedIcon />}
                onClick={() => setAiKitchenOpen(true)}
                sx={{
                  py: 1.5,
                  px: 4,
                  fontSize: '1rem',
                  boxShadow: 'none',
                  '&:hover': { boxShadow: 'none' },
                }}
              >
                Open AI Kitchen
              </Button>
            </Box>
          </Paper>
        )}

        {/* ── State 3: Pending approval ───────────────────────────────── */}
        {planResult && planResult.status !== 'approved' && !patientPlanQuery.isLoading && (
          <Paper
            sx={{
              p: { xs: 2.5, md: 6 },
              textAlign: 'center',
              border: '1px solid #e5ece5',
              boxShadow: 'none',
            }}
          >
            <Box sx={{ maxWidth: 480, mx: 'auto' }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
                {planResult.status === 'rejected'
                  ? 'Plan needs a revision'
                  : planResult.status === 'draft'
                    ? 'Plan awaiting approval'
                    : 'No approved plan yet'}
              </Typography>
              <Typography color="text.secondary" variant="body2" sx={{ mb: 3, lineHeight: 1.7 }}>
                {planResult.status === 'rejected'
                  ? 'Your dietician has rejected the plan. A new plan will be generated for you.'
                  : planResult.status === 'draft'
                    ? 'Your dietician is reviewing your plan. You will see it here once it is approved.'
                    : 'Once a dietician approves a plan, it will appear here.'}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AutoAwesomeRoundedIcon />}
                  onClick={() => setAiKitchenOpen(true)}
                  sx={{ py: 1.25, px: 3.5, boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
                >
                  AI Kitchen
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => patientPlanQuery.refetch()}
                  sx={{ py: 1.25, px: 3.5 }}
                >
                  Check again
                </Button>
              </Stack>
            </Box>
          </Paper>
        )}

        {/* ── State 4: Plan ready ─────────────────────────────────────── */}
        {approvedPlan && !patientPlanQuery.isLoading && (
          <Box>
            {/* Section header with tab toggles + regenerate */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 2, sm: 2.5 }}
              sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', mb: { xs: 2.5, sm: 4 } }}
            >
              {/* Toggle buttons */}
              <Box
                sx={{
                  display: 'inline-flex',
                  width: { xs: '100%', sm: 'auto' },
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  overflow: 'hidden',
                }}
              >
                <Button
                  id="tab-suggested"
                  disableRipple
                  onClick={() => setActiveTab('suggested')}
                  sx={{
                    flex: { xs: 1, sm: 'none' },
                    px: { xs: 1.5, sm: 2.5 },
                    py: 1,
                    borderRadius: 0,
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    boxShadow: 'none',
                    bgcolor: activeTab === 'suggested' ? 'primary.main' : 'transparent',
                    color: activeTab === 'suggested' ? 'primary.contrastText' : 'text.secondary',
                    '&:hover': {
                      bgcolor: activeTab === 'suggested' ? 'primary.dark' : 'action.hover',
                      boxShadow: 'none',
                    },
                  }}
                >
                  {approvedPlan.status === 'approved' ? 'My DASH Plan' : 'Suggested Recipes'}
                </Button>
                <Button
                  id="tab-ai-kitchen"
                  disableRipple
                  onClick={() => setActiveTab('ai-kitchen')}
                  startIcon={<AutoAwesomeRoundedIcon sx={{ fontSize: '0.95rem !important' }} />}
                  sx={{
                    flex: { xs: 1, sm: 'none' },
                    px: { xs: 1.5, sm: 2.5 },
                    py: 1,
                    borderRadius: 0,
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    boxShadow: 'none',
                    borderLeft: '1px solid',
                    borderColor: 'divider',
                    bgcolor: activeTab === 'ai-kitchen' ? 'primary.main' : 'transparent',
                    color: activeTab === 'ai-kitchen' ? 'primary.contrastText' : 'text.secondary',
                    '&:hover': {
                      bgcolor: activeTab === 'ai-kitchen' ? 'primary.dark' : 'action.hover',
                      boxShadow: 'none',
                    },
                  }}
                >
                  AI Kitchen
                </Button>
              </Box>

              {/* Right-side action */}
              {activeTab === 'ai-kitchen' && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AutoAwesomeRoundedIcon />}
                  onClick={() => setAiKitchenOpen(true)}
                  sx={{ alignSelf: { xs: 'stretch', sm: 'center' } }}
                >
                  New Recipe
                </Button>
              )}
            </Stack>

            {approvedPlan.status === 'approved' && activeTab === 'suggested' && (
              <Alert severity="success" sx={{ mb: 4 }}>
                This plan was approved by your dietician. Follow it for best results.
              </Alert>
            ) }

            {/* ── Tab content ── */}
            {activeTab === 'suggested' && <PlanResults result={approvedPlan} />}
...

            {activeTab === 'ai-kitchen' && (
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                <Grid size={{ xs: 12, md: 5 }}>
                  <RecipeHistoryPanel
                    recipes={recipeHistoryQuery.data?.items ?? []}
                    selectedId={selectedRecipe?.id}
                    onSelect={(record) => setSelectedRecipe(record)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 7 }}>
                  <Paper
                    sx={{
                      border: '1px solid #e5ece5',
                      boxShadow: 'none',
                      p: { xs: 2, sm: 3 },
                      minHeight: 320,
                    }}
                  >
                    {selectedRecipe ? (
                      <Stack spacing={{ xs: 1.5, sm: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {selectedRecipe.recipe.title}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                          <Chip label={`${selectedRecipe.recipe.servings} servings`} size="small" />
                          <Chip
                            label={`${selectedRecipe.recipe.prep_time_minutes + selectedRecipe.recipe.cook_time_minutes} min`}
                            size="small"
                          />
                          <Chip label={`Saved ${new Date(selectedRecipe.created_at).toLocaleString()}`} size="small" />
                        </Stack>
                        <Divider />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Ingredients
                        </Typography>
                        <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 1 }}>
                          {selectedRecipe.recipe.ingredients?.map((ing, i) => (
                            <Chip
                              key={`${ing.item}-${i}`}
                              label={`${ing.quantity} ${ing.unit} ${ing.item}`}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Stack>

                        {/* Nutrition Summary */}
                        {selectedRecipe.recipe.nutrition_summary && (
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
                                { label: 'Calories', value: `${selectedRecipe.recipe.nutrition_summary.total_kcal} kcal` },
                                { label: 'Protein', value: `${selectedRecipe.recipe.nutrition_summary.protein_g}g` },
                                { label: 'Carbs', value: `${selectedRecipe.recipe.nutrition_summary.carbs_g}g` },
                                { label: 'Fat', value: `${selectedRecipe.recipe.nutrition_summary.fat_g}g` },
                                { label: 'Fiber', value: `${selectedRecipe.recipe.nutrition_summary.fiber_g}g` },
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
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Steps
                        </Typography>
                        <Stack spacing={1}>
                          {selectedRecipe.recipe.steps.map((step, idx) => (
                            <Typography key={`${selectedRecipe.id}-step-${idx}`} variant="body2" color="text.secondary">
                              {idx + 1}. {step}
                            </Typography>
                          ))}
                        </Stack>
                      </Stack>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 8 }}>
                        <AutoAwesomeRoundedIcon sx={{ fontSize: 36, color: 'primary.light', mb: 2 }} />
                        <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                          No AI recipes yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                          Generate a DASH-friendly recipe from your kitchen ingredients.
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<AutoAwesomeRoundedIcon />}
                          onClick={() => setAiKitchenOpen(true)}
                          sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
                        >
                          Open AI Kitchen
                        </Button>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            )}
          </Box>
        )}


      </Stack>

      {/* ── AI Kitchen Dialog ───────────────────────────────────────────── */}

      <AiKitchenDialog
        open={aiKitchenOpen}
        onClose={() => setAiKitchenOpen(false)}
        onRecipeSaved={(record) => {
          setSelectedRecipe(record)
          recipeHistoryQuery.refetch()
        }}
      />

      {/* ── Profile Modal ──────────────────────────────────────────────── */}
      <Dialog
        open={profileModalOpen}
        onClose={() => {
          if (hasProfile) setProfileModalOpen(false)
        }}
        fullWidth
        fullScreen={isMobile}
        maxWidth="md"
      >
        <DialogTitle sx={{ pb: 1, pt: { xs: 2.5, sm: 3 }, px: { xs: 2, sm: 3 } }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Health Profile
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, sm: 3 }, pb: 1 }}>
          <DialogContentText sx={{ mb: { xs: 2, sm: 3 } }}>
            {!hasProfile
              ? 'Please complete your health profile to get accurate DASH diet recommendations.'
              : 'Update your vitals and preferences to refine your meal plans.'}
          </DialogContentText>

          <Box component="form" id="profile-form" onSubmit={onSaveProfile} noValidate>
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Full Name"
                  placeholder="e.g. Jane Doe"
                  slotProps={{ inputLabel: { shrink: true } }}
                  {...profileForm.register('name')}
                  error={Boolean(profileForm.formState.errors.name)}
                  helperText={profileForm.formState.errors.name?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Age"
                  placeholder="Years"
                  slotProps={{ inputLabel: { shrink: true } }}
                  {...profileForm.register('age_years', { valueAsNumber: true })}
                  error={Boolean(profileForm.formState.errors.age_years)}
                  helperText={profileForm.formState.errors.age_years?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth error={Boolean(profileForm.formState.errors.gender)}>
                  <InputLabel id="gender-label" shrink>Gender</InputLabel>
                  <Controller
                    control={profileForm.control}
                    name="gender"
                    render={({ field }) => (
                      <Select labelId="gender-label" label="Gender" notched {...field}>
                        <MenuItem value="male">Male</MenuItem>
                        <MenuItem value="female">Female</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Weight"
                  placeholder="kg"
                  slotProps={{ inputLabel: { shrink: true } }}
                  {...profileForm.register('weight_kg', { valueAsNumber: true })}
                  error={Boolean(profileForm.formState.errors.weight_kg)}
                  helperText={profileForm.formState.errors.weight_kg?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Height"
                  placeholder="cm"
                  slotProps={{ inputLabel: { shrink: true } }}
                  {...profileForm.register('height_cm', { valueAsNumber: true })}
                  error={Boolean(profileForm.formState.errors.height_cm)}
                  helperText={profileForm.formState.errors.height_cm?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 12, md: 4 }}>
                <FormControl fullWidth error={Boolean(profileForm.formState.errors.bp_stage)}>
                  <InputLabel id="bp-label" shrink>BP Stage</InputLabel>
                  <Controller
                    control={profileForm.control}
                    name="bp_stage"
                    render={({ field }) => (
                      <Select labelId="bp-label" label="Blood Pressure Stage" notched {...field}>
                        <MenuItem value="pre">Pre-hypertension</MenuItem>
                        <MenuItem value="stage1">Stage 1</MenuItem>
                        <MenuItem value="stage2">Stage 2</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth error={Boolean(profileForm.formState.errors.activity_level)}>
                  <InputLabel id="activity-label" shrink>Activity Level</InputLabel>
                  <Controller
                    control={profileForm.control}
                    name="activity_level"
                    render={({ field }) => (
                      <Select labelId="activity-label" label="Activity Level" notched {...field}>
                        <MenuItem value="sedentary">Sedentary (Little to no exercise)</MenuItem>
                        <MenuItem value="light">Light (Exercise 1–3 days/wk)</MenuItem>
                        <MenuItem value="moderate">Moderate (Exercise 3–5 days/wk)</MenuItem>
                        <MenuItem value="active">Active (Exercise 6–7 days/wk)</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Dietary Preference"
                  placeholder="e.g. Vegetarian, None"
                  slotProps={{ inputLabel: { shrink: true } }}
                  {...profileForm.register('diet_pref')}
                  error={Boolean(profileForm.formState.errors.diet_pref)}
                  helperText={profileForm.formState.errors.diet_pref?.message}
                />
              </Grid>
            </Grid>

            {saveProfileMutation.error ? (
              <Alert severity="error" sx={{ mt: 3 }}>
                {(saveProfileMutation.error as Error).message}
              </Alert>
            ) : null}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 }, pt: 2 }}>
          {hasProfile && (
            <Button onClick={() => setProfileModalOpen(false)} color="inherit">
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            form="profile-form"
            variant="contained"
            disabled={saveProfileMutation.isPending}
            sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
          >
            {saveProfileMutation.isPending ? 'Saving…' : 'Save Profile'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageShell>
  )
}
