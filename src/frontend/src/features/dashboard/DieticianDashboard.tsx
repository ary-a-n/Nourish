import { useState, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import {
  Box,
  Typography,
  Stack,
  Paper,
  Button,
  TextField,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Chip,
  Divider,
  Grid,
  CircularProgress,
  IconButton,
  Tooltip,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CancelRoundedIcon from '@mui/icons-material/CancelRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import PersonRemoveRoundedIcon from '@mui/icons-material/PersonRemoveRounded'
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { PageShell } from '../../shared/ui/PageShell'
import { clearAccessToken } from '../../shared/lib/auth'
import { apiClient } from '../../shared/api/client'
import type { DieticianPatient, DieticianPlan, MealOption, AiDashRecipe, PatientProfile } from '../../shared/types/api'
import { AiKitchenDialog } from './AiKitchenDialog'

export function DieticianDashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'mine'>('all')
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)

  const { data: patientsData, isLoading, refetch } = useQuery({
    queryKey: ['dietician-patients'],
    queryFn: apiClient.listDieticianPatients,
  })

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: apiClient.me,
  })

  const assignMutation = useMutation({
    mutationFn: apiClient.assignPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dietician-patients'] })
    },
  })

  const unassignMutation = useMutation({
    mutationFn: apiClient.unassignPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dietician-patients'] })
    },
  })

  const handleLogout = () => {
    clearAccessToken()
    navigate('/auth', { replace: true })
  }

  const patients = useMemo(() => patientsData?.patients ?? [], [patientsData?.patients])
  const filteredPatients = useMemo(() => {
    if (patients.length === 0) return []
    return patients.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) || p.mobile.includes(search)
      const matchesFilter = filter === 'all' || p.assigned
      return matchesSearch && matchesFilter
    })
  }, [patients, search, filter])

  const selectedPatient = useMemo(() => {
    return patients.find((p) => p.id === selectedPatientId) || null
  }, [patients, selectedPatientId])

  return (
    <PageShell>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Dietician Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Logged in as {me?.name} (Dietician)
            </Typography>
          </Box>
          <Button startIcon={<LogoutRoundedIcon />} onClick={handleLogout} color="inherit">
            Sign Out
          </Button>
        </Stack>

        <Grid container spacing={3} sx={{ height: 'calc(100vh - 160px)' }}>
          {/* Patient List Column */}
          <Grid size={{ xs: 12, md: 4, lg: 3 }} sx={{ height: '100%' }}>
            <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Stack spacing={2}>
                  <TextField
                    size="small"
                    placeholder="Search patients..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchRoundedIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }
                    }}
                    fullWidth
                  />
                  <Stack direction="row" spacing={1}>
                    <Chip
                      label="All"
                      size="small"
                      onClick={() => setFilter('all')}
                      color={filter === 'all' ? 'primary' : 'default'}
                      variant={filter === 'all' ? 'filled' : 'outlined'}
                      sx={{ flex: 1 }}
                    />
                    <Chip
                      label="My Patients"
                      size="small"
                      onClick={() => setFilter('mine')}
                      color={filter === 'mine' ? 'primary' : 'default'}
                      variant={filter === 'mine' ? 'filled' : 'outlined'}
                      sx={{ flex: 1 }}
                    />
                    <IconButton size="small" onClick={() => refetch()}>
                      <RefreshRoundedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>
              </Box>

              <Box sx={{ flex: 1, overflowY: 'auto' }}>
                {isLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : filteredPatients.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No patients found.
                    </Typography>
                  </Box>
                ) : (
                  <List disablePadding>
                    {filteredPatients.map((patient) => (
                      <ListItemButton
                        key={patient.id}
                        selected={selectedPatientId === patient.id}
                        onClick={() => setSelectedPatientId(patient.id)}
                        sx={{
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          py: 1.5,
                        }}
                      >
                        <ListItemText
                          primary={
                            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                {patient.name}
                              </Typography>
                               {patient.assigned && (
                                 <Chip label="My" size="small" color="success" variant="outlined" sx={{ height: 18, fontSize: '0.6rem' }} />
                               )}
                            </Stack>
                          }
                          secondary={
                            <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                {patient.mobile}
                              </Typography>
                              {patient.last_plan_status && (
                                <Box>
                                  <Chip
                                    label={patient.last_plan_status}
                                    size="small"
                                    color={patient.last_plan_status === 'approved' ? 'success' : 'default'}
                                    sx={{ height: 16, fontSize: '0.55rem', textTransform: 'uppercase' }}
                                  />
                                </Box>
                              )}
                            </Stack>
                          }
                        />
                      </ListItemButton>
                    ))}
                  </List>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Patient Details Column */}
          <Grid size={{ xs: 12, md: 8, lg: 9 }} sx={{ height: '100%' }}>
            {selectedPatient ? (
              <PatientDetailsView
                 patient={selectedPatient}
                 onAssign={() => assignMutation.mutate(selectedPatient.id)}
                 onUnassign={() => unassignMutation.mutate(selectedPatient.id)}
                 isAssigning={assignMutation.isPending}
               />
            ) : (
              <Paper sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">Select a patient to view details</Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Stack>
    </PageShell>
  )
}

function PatientDetailsView({
  patient,
  onAssign,
  onUnassign,
  isAssigning,
}: {
  patient: DieticianPatient
  onAssign: () => void
  onUnassign: () => void
  isAssigning: boolean
}) {
  const queryClient = useQueryClient()
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [confirmUnassign, setConfirmUnassign] = useState(false)
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['patient-profile', patient.id],
    queryFn: () => apiClient.getPatientProfile(patient.id),
  })

  const profileForm = useForm<PatientProfile>({
    defaultValues: profile ?? undefined,
  })

  // Reset form whenever profile data loads
  const handleOpenEdit = () => {
    if (profile) profileForm.reset(profile)
    setEditProfileOpen(true)
  }

  const saveProfileMutation = useMutation({
    mutationFn: (data: PatientProfile) => apiClient.updatePatientProfile(patient.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-profile', patient.id] })
      setEditProfileOpen(false)
    },
  })

  const generateMutation = useMutation({
    mutationFn: () => apiClient.createPatientPlan(patient.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-plan', patient.id] })
      queryClient.invalidateQueries({ queryKey: ['dietician-patients'] })
    },
  })

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: { xs: 2, sm: 3 }, overflow: 'hidden' }}>
      {/* Patient Profile Header */}
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {patient.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {patient.mobile}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
           {!patient.assigned ? (
             <Button
               variant="contained"
               startIcon={<PersonAddRoundedIcon />}
               onClick={onAssign}
               disabled={isAssigning}
             >
               Assign to Me
             </Button>
           ) : (
             <Button
               variant="outlined"
               size="small"
               color="error"
               startIcon={<PersonRemoveRoundedIcon />}
               onClick={() => setConfirmUnassign(true)}
             >
               Unassign
             </Button>
           )}
           {profile && (
             <Button
               variant="outlined"
               size="small"
               startIcon={<EditRoundedIcon />}
               onClick={handleOpenEdit}
             >
               Edit Profile
             </Button>
           )}
        </Stack>
      </Stack>

      {profileLoading ? (
        <CircularProgress size={20} />
      ) : profile ? (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="text.secondary">Vitals</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {profile.age_years}y | {profile.gender} | {profile.weight_kg}kg | {profile.height_cm}cm
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="text.secondary">BP Stage</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                {profile.bp_stage}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="text.secondary">Activity</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                {profile.activity_level}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="text.secondary">Diet Preference</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {profile.diet_pref}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      ) : null}

      <Divider sx={{ mb: 2 }} />

      {/* Two-column: Plan Editor | AI Recipe History */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {!patient.assigned ? (
          <Alert severity="info">Assign this patient to yourself to manage their diet plan.</Alert>
        ) : (
          <Grid container spacing={2} sx={{ height: '100%' }}>
            {/* Left: Plan Editor */}
            <Grid size={{ xs: 12, lg: 7 }} sx={{ height: '100%', overflowY: 'auto' }}>
              <PlanEditor
                patientId={patient.id}
                dietPref={profile?.diet_pref || 'Any'}
                onRegenerate={() => generateMutation.mutate()}
                isRegenerating={generateMutation.isPending}
              />
            </Grid>

            {/* Right: Patient AI Recipe History */}
            <Grid size={{ xs: 12, lg: 5 }} sx={{ height: '100%' }}>
              <Paper
                variant="outlined"
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  borderRadius: 2,
                }}
              >
                {/* Panel header */}
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    alignItems: 'center',
                    px: 2,
                    py: 1.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'action.hover',
                  }}
                >
                  <HistoryRoundedIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Patient AI Kitchen History
                  </Typography>
                </Stack>

                {/* Scrollable recipe list */}
                <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
                  <PatientRecipeHistory patientId={patient.id} />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Box>

      {/* Confirm Unassign Dialog */}
      <Dialog open={confirmUnassign} onClose={() => setConfirmUnassign(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pt: 3, pb: 1, px: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Unassign Patient?</Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <DialogContentText>
            This will remove {patient.name} from your patient list. You can reassign them later.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setConfirmUnassign(false)} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => { setConfirmUnassign(false); onUnassign() }}
            sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
          >
            Unassign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileOpen} onClose={() => setEditProfileOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ pb: 1, pt: 3, px: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Edit Patient Profile</Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 1 }}>
          <DialogContentText sx={{ mb: 3 }}>
            Update {patient.name}'s health profile. This will affect future plan recommendations.
          </DialogContentText>
          <Box
            component="form"
            id="dietician-profile-form"
            onSubmit={profileForm.handleSubmit((vals) => saveProfileMutation.mutateAsync(vals))}
            noValidate
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Full Name"
                  slotProps={{ inputLabel: { shrink: true } }}
                  {...profileForm.register('name')}
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Age"
                  placeholder="Years"
                  slotProps={{ inputLabel: { shrink: true } }}
                  {...profileForm.register('age_years', { valueAsNumber: true })}
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <FormControl fullWidth>
                  <InputLabel id="edit-gender-label" shrink>Gender</InputLabel>
                  <Controller
                    control={profileForm.control}
                    name="gender"
                    render={({ field }) => (
                      <Select labelId="edit-gender-label" label="Gender" notched {...field}>
                        <MenuItem value="male">Male</MenuItem>
                        <MenuItem value="female">Female</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6, md: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Weight (kg)"
                  slotProps={{ inputLabel: { shrink: true } }}
                  {...profileForm.register('weight_kg', { valueAsNumber: true })}
                />
              </Grid>
              <Grid size={{ xs: 6, md: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Height (cm)"
                  slotProps={{ inputLabel: { shrink: true } }}
                  {...profileForm.register('height_cm', { valueAsNumber: true })}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel id="edit-bp-label" shrink>BP Stage</InputLabel>
                  <Controller
                    control={profileForm.control}
                    name="bp_stage"
                    render={({ field }) => (
                      <Select labelId="edit-bp-label" label="BP Stage" notched {...field}>
                        <MenuItem value="pre">Pre-hypertension</MenuItem>
                        <MenuItem value="stage1">Stage 1</MenuItem>
                        <MenuItem value="stage2">Stage 2</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="edit-activity-label" shrink>Activity Level</InputLabel>
                  <Controller
                    control={profileForm.control}
                    name="activity_level"
                    render={({ field }) => (
                      <Select labelId="edit-activity-label" label="Activity Level" notched {...field}>
                        <MenuItem value="sedentary">Sedentary</MenuItem>
                        <MenuItem value="light">Light</MenuItem>
                        <MenuItem value="moderate">Moderate</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Diet Preference"
                  placeholder="Vegetarian, Non-Veg, Any"
                  slotProps={{ inputLabel: { shrink: true } }}
                  {...profileForm.register('diet_pref')}
                />
              </Grid>
            </Grid>
            {saveProfileMutation.error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {(saveProfileMutation.error as Error).message}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
          <Button onClick={() => setEditProfileOpen(false)} color="inherit">Cancel</Button>
          <Button
            type="submit"
            form="dietician-profile-form"
            variant="contained"
            disabled={saveProfileMutation.isPending}
            sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
          >
            {saveProfileMutation.isPending ? 'Saving…' : 'Save Profile'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}

function MealSelectionDialog({
  open,
  onClose,
  slot,
  dietPref,
  onSelect,
  isUpdating,
}: {
  open: boolean
  onClose: () => void
  slot: string | null
  dietPref: string
  onSelect: (meal: MealOption) => void
  isUpdating: boolean
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['ranked-meals', dietPref],
    queryFn: () => apiClient.getRankedMeals({ diet_pref: dietPref, top_k: 50 }),
    enabled: open && !!slot,
  })

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 600 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Select {slot} from dataset
        </Typography>
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <List>
              {data?.meals.map((meal, idx) => (
                <ListItemButton 
                  key={idx} 
                  onClick={() => onSelect(meal)}
                  disabled={isUpdating}
                  sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
                >
                  <ListItemText
                    primary={meal.food_name}
                    secondary={`${Math.round(meal.unit_serving_energy_kcal)} kcal | Score: ${meal.dash_score}`}
                  />
                  <Chip label={meal.course_type} size="small" variant="outlined" />
                </ListItemButton>
              ))}
            </List>
          )}
        </Box>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Cancel</Button>
        </Box>
      </Paper>
    </Dialog>
  )
}

function PlanAuditLog({ plan }: { plan: DieticianPlan }) {
  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
        Action History
      </Typography>
      <Stack spacing={1} sx={{ mt: 1 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
          <Typography variant="caption" color="text.secondary">
            {new Date(plan.created_at).toLocaleString()} — Plan created
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
          <Typography variant="caption" color="text.secondary">
            {new Date(plan.updated_at).toLocaleString()} — Content updated
          </Typography>
        </Box>
        {plan.status !== 'draft' && (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box sx={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              bgcolor: plan.status === 'approved' ? 'success.main' : 'error.main' 
            }} />
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {new Date(plan.updated_at).toLocaleString()} — Plan {plan.status}
              {plan.approved_by && ` by ${plan.approved_by}`}
            </Typography>
          </Box>
        )}
      </Stack>
    </Box>
  )
}

function PlanEditor({ 
  patientId, 
  dietPref,
  onRegenerate,
  isRegenerating 
}: { 
  patientId: string,
  dietPref: string,
  onRegenerate: () => void,
  isRegenerating: boolean
}) {
  const queryClient = useQueryClient()
  const [editingSlot, setEditingSlot] = useState<string | null>(null)
  const [aiKitchenSlot, setAiKitchenSlot] = useState<string | null>(null)

  const { data: planResponse, isLoading, isError } = useQuery({
    queryKey: ['patient-plan', patientId],
    queryFn: () => apiClient.getPatientPlan(patientId),
    retry: false,
  })

  const updateStatusMutation = useMutation({
    mutationFn: (status: 'approved' | 'rejected' | 'draft') =>
      apiClient.updatePatientPlan(planResponse!.plan.id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-plan', patientId] })
      queryClient.invalidateQueries({ queryKey: ['dietician-patients'] })
    },
  })

  const updateItemMutation = useMutation({
    mutationFn: (meal: MealOption) => {
      const currentItems = planResponse?.plan.items || []
      const otherItems = currentItems.filter((i) => i.meal_slot !== editingSlot)
      const newItem = {
        meal_slot: editingSlot!,
        source_type: 'dataset' as const,
        payload_json: meal,
      }
      return apiClient.updatePatientPlan(planResponse!.plan.id, {
        items: [...otherItems, newItem],
      })
    },
    onSuccess: () => {
      setEditingSlot(null)
      queryClient.invalidateQueries({ queryKey: ['patient-plan', patientId] })
    },
  })

  const attachAiMutation = useMutation({
    mutationFn: (recipe: AiDashRecipe) =>
      apiClient.attachDieticianAiRecipe(planResponse!.plan.id, {
        meal_slot: aiKitchenSlot!,
        recipe,
      }),
    onSuccess: () => {
      setAiKitchenSlot(null)
      queryClient.invalidateQueries({ queryKey: ['patient-plan', patientId] })
    }
  })

  if (isLoading || isRegenerating) {
    return (
      <Stack spacing={2} sx={{ alignItems: 'center', py: 8 }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          {isRegenerating ? 'Generating fresh plan...' : 'Loading plan...'}
        </Typography>
      </Stack>
    )
  }

  if (isError || !planResponse) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="body1" sx={{ mb: 2 }}>No active plan found for this patient.</Typography>
        <Button variant="contained" onClick={onRegenerate} startIcon={<AutoAwesomeRoundedIcon />}>
          Generate Initial Plan
        </Button>
      </Box>
    )
  }

  const { plan } = planResponse

  return (
    <Stack spacing={3}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, textTransform: 'capitalize' }}>Diet Plan ({plan.status})</Typography>
          <Typography variant="caption" color="text.secondary">
            Last updated: {new Date(plan.updated_at).toLocaleString()}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            size="small" 
            variant="outlined" 
            startIcon={<RefreshRoundedIcon />} 
            onClick={onRegenerate}
            disabled={updateStatusMutation.isPending || updateItemMutation.isPending || attachAiMutation.isPending}
          >
            Regenerate
          </Button>
          {plan.status !== 'approved' && (
            <Button 
              size="small" 
              variant="contained" 
              color="success" 
              startIcon={<CheckCircleRoundedIcon />}
              onClick={() => updateStatusMutation.mutate('approved')}
              disabled={updateStatusMutation.isPending || updateItemMutation.isPending || attachAiMutation.isPending}
            >
              Approve
            </Button>
          )}
          {plan.status === 'approved' && (
            <Button 
              size="small" 
              variant="outlined" 
              color="warning" 
              onClick={() => updateStatusMutation.mutate('draft')}
              disabled={updateStatusMutation.isPending || updateItemMutation.isPending || attachAiMutation.isPending}
            >
              Reopen
            </Button>
          )}
          {plan.status !== 'rejected' && (
            <Button 
              size="small" 
              variant="outlined" 
              color="error" 
              startIcon={<CancelRoundedIcon />}
              onClick={() => updateStatusMutation.mutate('rejected')}
              disabled={updateStatusMutation.isPending || updateItemMutation.isPending || attachAiMutation.isPending}
            >
              Reject
            </Button>
          )}
        </Stack>
      </Stack>

      <Stack spacing={2}>
        {['Breakfast', 'Lunch', 'Dinner', 'Snack 1', 'Snack 2'].map((slot) => {
          const item = plan.items.find((i) => i.meal_slot === slot)
          const foodName = item?.source_type === 'dataset'
            ? (item.payload_json as MealOption).food_name
            : (item?.payload_json as any)?.title
          const isUpdatingSlot =
            updateItemMutation.isPending && editingSlot === slot
          const isAiUpdatingSlot =
            attachAiMutation.isPending && aiKitchenSlot === slot
           
          return (
            <Paper key={slot} variant="outlined" sx={{ p: 2 }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                      {slot}
                    </Typography>
                    {item?.source_type === 'ai' && (
                      <Chip label="AI generated" size="small" variant="outlined" color="primary" sx={{ height: 16, fontSize: '0.55rem' }} />
                    )}
                    {(isUpdatingSlot || isAiUpdatingSlot) && (
                      <Chip
                        label="Updating"
                        size="small"
                        color="warning"
                        variant="outlined"
                        sx={{ height: 16, fontSize: '0.55rem' }}
                      />
                    )}
                  </Stack>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {foodName || 'No meal selected'}
                  </Typography>
                  {(item?.payload_json as any)?.unit_serving_energy_kcal && (
                    <Typography variant="caption" color="text.secondary">
                      {Math.round((item?.payload_json as any).unit_serving_energy_kcal)} kcal | Na: {Math.round((item?.payload_json as any).unit_serving_sodium_mg)}mg
                    </Typography>
                  )}
                </Box>
                <Stack direction="row" spacing={1}>
                  <Tooltip title="Choose from dataset">
                    <IconButton
                      size="small"
                      onClick={() => setEditingSlot(slot)}
                      disabled={updateItemMutation.isPending || attachAiMutation.isPending}
                    >
                      <EditRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="AI Kitchen">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => setAiKitchenSlot(slot)}
                      disabled={attachAiMutation.isPending || updateItemMutation.isPending}
                    >
                      <AutoAwesomeRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            </Paper>
          )
        })}
      </Stack>

      <PlanAuditLog plan={plan} />

      <MealSelectionDialog
        open={Boolean(editingSlot)}
        onClose={() => setEditingSlot(null)}
        slot={editingSlot}
        dietPref={dietPref}
        onSelect={(meal) => updateItemMutation.mutate(meal)}
        isUpdating={updateItemMutation.isPending}
      />

      {aiKitchenSlot && (
        <AiKitchenDialog
          open={true}
          onClose={() => setAiKitchenSlot(null)}
          onRecipeSaved={(record) => attachAiMutation.mutate(record.recipe)}
        />
      )}
    </Stack>
  )
}

function PatientRecipeHistory({ patientId }: { patientId: string }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['patient-recipes', patientId],
    queryFn: () => apiClient.getPatientRecipes(patientId, { limit: 20 }),
  })

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={20} />
      </Box>
    )
  }

  const items = data?.items ?? []

  if (items.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <AutoAwesomeRoundedIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Patient hasn't generated any AI recipes yet.
        </Typography>
      </Box>
    )
  }

  return (
    <Stack spacing={1}>
      {items.map((record) => {
        const isExpanded = expandedId === record.id
        const r = record.recipe
        const totalTime = r.prep_time_minutes + r.cook_time_minutes

        return (
          <Paper
            key={record.id}
            variant="outlined"
            sx={{
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'box-shadow 0.15s',
              '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
              borderColor: isExpanded ? 'primary.main' : 'divider',
            }}
            onClick={() => setExpandedId(isExpanded ? null : record.id)}
          >
            {/* Collapsed header */}
            <Stack direction="row" sx={{ alignItems: 'flex-start', p: 1.5, gap: 1 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, lineHeight: 1.3, mb: 0.5, color: isExpanded ? 'primary.main' : 'text.primary' }}
                  noWrap
                >
                  {r.title}
                </Typography>
                <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                  <Chip label={`${r.servings} srv`} size="small" sx={{ height: 17, fontSize: '0.58rem' }} />
                  <Chip label={`${totalTime} min`} size="small" sx={{ height: 17, fontSize: '0.58rem' }} />
                  {r.nutrition_summary && (
                    <Chip
                      label={`${r.nutrition_summary.total_kcal} kcal`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ height: 17, fontSize: '0.58rem' }}
                    />
                  )}
                </Stack>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', pt: 0.25 }}>
                {new Date(record.created_at).toLocaleDateString()}
              </Typography>
            </Stack>

            {/* Expanded detail */}
            {isExpanded && (
              <Box
                sx={{ px: 1.5, pb: 1.5, borderTop: '1px solid', borderColor: 'divider', pt: 1.5 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Nutrition row */}
                {r.nutrition_summary && (
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1.5,
                      flexWrap: 'wrap',
                      mb: 1.5,
                      p: 1,
                      borderRadius: 1.5,
                      bgcolor: 'primary.50',
                      border: '1px solid',
                      borderColor: 'primary.100',
                    }}
                  >
                    {[
                      { l: 'kcal', v: r.nutrition_summary.total_kcal },
                      { l: 'protein', v: `${r.nutrition_summary.protein_g}g` },
                      { l: 'carbs', v: `${r.nutrition_summary.carbs_g}g` },
                      { l: 'fat', v: `${r.nutrition_summary.fat_g}g` },
                      { l: 'fiber', v: `${r.nutrition_summary.fiber_g}g` },
                    ].map(({ l, v }) => (
                      <Box key={l}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.6rem' }}>
                          {l}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>
                          {v}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Ingredients */}
                <Typography variant="overline" sx={{ fontSize: '0.6rem', letterSpacing: 1, color: 'text.secondary' }}>
                  Ingredients
                </Typography>
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5, mt: 0.5, mb: 1.5 }}>
                  {r.ingredients?.map((ing, i) => (
                    <Chip
                      key={`${ing.item}-${i}`}
                      label={`${ing.quantity} ${ing.unit} ${ing.item}`}
                      size="small"
                      variant="outlined"
                      sx={{ height: 18, fontSize: '0.58rem' }}
                    />
                  ))}
                </Stack>

                {/* Steps */}
                <Typography variant="overline" sx={{ fontSize: '0.6rem', letterSpacing: 1, color: 'text.secondary' }}>
                  Steps
                </Typography>
                <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                  {r.steps.map((step, i) => (
                    <Typography key={i} variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                      <Box component="span" sx={{ fontWeight: 700, color: 'primary.main', mr: 0.5 }}>
                        {i + 1}.
                      </Box>
                      {step}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            )}
          </Paper>
        )
      })}
    </Stack>
  )
}
