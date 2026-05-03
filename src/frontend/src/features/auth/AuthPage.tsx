import { useState } from 'react'

import {
  Alert,
  Box,
  Button,
  InputAdornment,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import SpaRoundedIcon from '@mui/icons-material/SpaRounded'
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'

import { apiClient } from '../../shared/api/client'
import { setAccessToken } from '../../shared/lib/auth'
import { PageShell } from '../../shared/ui/PageShell'
import { loginSchema, registerSchema, type LoginSchema, type RegisterSchema } from './schemas'

export function AuthPage() {
  const [tab, setTab] = useState(1)
  const [role, setRole] = useState<'patient' | 'dietician'>('patient')
  const [authError, setAuthError] = useState<string | null>(null)
  const navigate = useNavigate()

  const registerForm = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      mobile: '+91',
      password: '',
    },
  })

  const loginForm = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      mobile: '+91',
      password: '',
    },
  })

  const registerMutation = useMutation({
    mutationFn: role === 'patient' ? apiClient.register : apiClient.dieticianRegister,
    onSuccess: () => {
      setAuthError(null)
      setTab(1)
      loginForm.setValue('mobile', registerForm.getValues('mobile'))
      loginForm.setFocus('password')
    },
    onError: (error: Error) => {
      setAuthError(error.message)
    },
  })

  const loginMutation = useMutation({
    mutationFn: role === 'patient' ? apiClient.login : apiClient.dieticianLogin,
    onSuccess: (result) => {
      setAuthError(null)
      setAccessToken(result.access_token)
      if (result.user.role === 'dietician') {
        navigate('/dietician', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    },
    onError: (error: Error) => {
      setAuthError(error.message)
    },
  })

  const submitRegister = registerForm.handleSubmit((values) => {
    setAuthError(null)
    registerMutation.mutate(values)
  })

  const submitLogin = loginForm.handleSubmit((values) => {
    setAuthError(null)
    loginMutation.mutate(values)
  })

  return (
    <PageShell>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: { xs: 'stretch', sm: 'center' },
          minHeight: { xs: 'auto', sm: '80vh' },
        }}
      >
        <Paper
          sx={{
            width: '100%',
            maxWidth: 440,
            p: { xs: 2, sm: 3, md: 5 },
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 6,
              bgcolor: 'primary.main',
            }}
          />
          
          <Stack spacing={1} sx={{ mb: { xs: 3, sm: 4 }, alignItems: 'center', textAlign: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'primary.main' }}>
              <SpaRoundedIcon fontSize="large" />
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  fontSize: { xs: '1.6rem', sm: '2rem' },
                }}
              >
                Nourish
              </Typography>
            </Box>
            <Typography color="text.secondary" variant="body1">
              Your personalized DASH diet plan.
            </Typography>
          </Stack>

          <Tabs
            value={tab}
            onChange={(_, value: number) => setTab(value)}
            sx={{
              mb: 2,
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                fontSize: { xs: '0.95rem', sm: '1rem' },
                textTransform: 'none',
                fontWeight: 600,
              },
            }}
            variant="fullWidth"
          >
            <Tab label="Register" />
            <Tab label="Login" />
          </Tabs>

          <Tabs
            value={role}
            onChange={(_, value: 'patient' | 'dietician') => {
              setRole(value)
              setAuthError(null)
            }}
            sx={{
              mb: { xs: 3, sm: 4 },
              minHeight: 32,
              '& .MuiTab-root': {
                fontSize: '0.8rem',
                minHeight: 32,
                py: 0.5,
                textTransform: 'none',
              },
            }}
            centered
          >
            <Tab label="I'm a Patient" value="patient" />
            <Tab label="I'm a Dietician" value="dietician" />
          </Tabs>

          {authError ? <Alert severity="error" sx={{ mb: 3 }}>{authError}</Alert> : null}

          {tab === 0 ? (
            <Stack
              key="register-form"
              component="form"
              spacing={{ xs: 2.5, sm: 3 }}
              onSubmit={submitRegister}
              noValidate
            >
              <TextField
                label="Full Name"
                placeholder="Jane Doe"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonRoundedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
                {...registerForm.register('name')}
                error={Boolean(registerForm.formState.errors.name)}
                helperText={registerForm.formState.errors.name?.message}
              />
              <TextField
                label="Mobile Number"
                placeholder="+919876543210"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneRoundedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
                {...registerForm.register('mobile')}
                error={Boolean(registerForm.formState.errors.mobile)}
                helperText={registerForm.formState.errors.mobile?.message}
              />
              <TextField
                type="password"
                label="Password"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockRoundedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
                {...registerForm.register('password')}
                error={Boolean(registerForm.formState.errors.password)}
                helperText={registerForm.formState.errors.password?.message}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={registerMutation.isPending}
                sx={{ mt: 1, py: 1.25, fontSize: { xs: '1rem', sm: '1.05rem' } }}
              >
                {registerMutation.isPending ? 'Creating account...' : 'Create account'}
              </Button>
            </Stack>
          ) : (
            <Stack
              key="login-form"
              component="form"
              spacing={{ xs: 2.5, sm: 3 }}
              onSubmit={submitLogin}
              noValidate
            >
              <TextField
                label="Mobile Number"
                placeholder="+919876543210"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneRoundedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
                {...loginForm.register('mobile')}
                error={Boolean(loginForm.formState.errors.mobile)}
                helperText={loginForm.formState.errors.mobile?.message}
              />
              <TextField
                type="password"
                label="Password"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockRoundedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
                {...loginForm.register('password')}
                error={Boolean(loginForm.formState.errors.password)}
                helperText={loginForm.formState.errors.password?.message}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loginMutation.isPending}
                sx={{ mt: 1, py: 1.25, fontSize: { xs: '1rem', sm: '1.05rem' } }}
              >
                {loginMutation.isPending ? 'Signing in...' : 'Login'}
              </Button>
            </Stack>
          )}
        </Paper>
      </Box>
    </PageShell>
  )
}
