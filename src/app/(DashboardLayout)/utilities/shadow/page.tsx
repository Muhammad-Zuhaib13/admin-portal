'use client';

import React, { useState } from 'react';
import {
  Paper,
  Box,
  Grid,
  Switch,
  FormControlLabel,
} from '@mui/material';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';

const Item = styled(Paper)(({ theme }) => ({
  ...theme.typography.body1,
  textAlign: 'center',
  color: theme.palette.text.secondary,
  height: 60,
  lineHeight: '60px',
}));

const darkTheme = createTheme({ palette: { mode: 'dark' } });
const lightTheme = createTheme({ palette: { mode: 'light' } });

const Shadow = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <PageContainer title="Shadow" description="this is Shadow">
        <DashboardCard
          title="Shadow"
          action={
            <FormControlLabel
              control={
                <Switch
                  checked={isDarkMode}
                  onChange={() => setIsDarkMode(!isDarkMode)}
                />
              }
              label={isDarkMode ? 'Dark' : 'Light'}
            />
          }
        >
          <Grid container spacing={2}>
            <Grid size={12}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'background.default',
                  display: 'grid',
                  gridTemplateColumns: { md: '1fr 1fr' },
                  gap: 2,
                }}
              >
                {[0, 1, 2, 3, 4, 6, 8, 12, 16, 24].map((elevation) => (
                  <Item key={elevation} elevation={elevation}>
                    {`elevation=${elevation}`}
                  </Item>
                ))}
              </Box>
            </Grid>
          </Grid>
        </DashboardCard>
      </PageContainer>
    </ThemeProvider>
  );
};

export default Shadow;
