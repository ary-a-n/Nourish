import type { PropsWithChildren } from 'react'

import { Box, Container } from '@mui/material'

export function PageShell({ children }: PropsWithChildren) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        background: (theme) =>
          `radial-gradient(ellipse 60% 40% at 15% 10%, ${theme.palette.primary.main}18, transparent 65%),
           radial-gradient(ellipse 55% 45% at 85% 90%, ${theme.palette.secondary.main}14, transparent 65%),
           ${theme.palette.background.default}`,
        py: { xs: 2, md: 6 },
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        {children}
      </Container>
    </Box>
  )
}
