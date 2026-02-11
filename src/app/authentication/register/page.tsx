"use client";
import { Grid, Box, Card, Typography, Stack } from "@mui/material";
import Link from "next/link";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";


import AuthRegistrationForm from "@/app/(DashboardLayout)/components/forms/theme-elements/AuthRegistrationForm";
const Register2 = () => (
  <PageContainer title="Register" description="this is Register page">
    <Box
      sx={{
        position: "relative",
        "&:before": {
          content: '""',
          background: "#FFD6BA",
          backgroundSize: "400% 400%",
          animation: "gradient 15s ease infinite",
          position: "absolute",
          height: "100%",
          width: "100%",
          opacity: "0.3",
        },
      }}
    >
      <Grid
        container
        spacing={0}
        justifyContent="center"
        sx={{ height: "100vh" }}
      >
        <Grid
          display="flex"
          justifyContent="center"
          alignItems="center"
          size={{
            xs: 12,
            sm: 12,
            lg: 4,
            xl: 3
          }}>
          <Card
            elevation={9}
            sx={{ p: 4, zIndex: 1, width: "100%", maxWidth: "500px" }}
          >
            <Box
              component={Link}
              href="/"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 3,
                py: 2,
                textDecoration: "none",
                justifyContent: "center"
              }}
            >
              <Box
                component="img"
                src="/images/logos/logo.png"
                alt="Art By Encore"
                sx={{ width: 36, height: 36 }}
              />

              <Typography
                variant="h6"
                fontWeight={700}
                color="text.primary"
              >
                Art By Encore
              </Typography>
            </Box>
            <AuthRegistrationForm
              subtext={
                <Typography
                  variant="subtitle1"
                  textAlign="center"
                  color="textSecondary"
                  mb={1}
                >
                  Create your account
                </Typography>
              }
              subtitle={
                <Stack
                  direction="row"
                  justifyContent="center"
                  spacing={1}
                  mt={3}
                >
                  <Typography
                    color="textSecondary"
                    variant="h6"
                    fontWeight="400"
                  >
                    Already have an Account?
                  </Typography>
                  <Typography
                    component={Link}
                    href="/authentication/login"
                    fontWeight="500"
                    sx={{
                      textDecoration: "none",
                      color: "primary.main",
                    }}
                  >
                    Sign In
                  </Typography>
                </Stack>
              }
            />
          </Card>
        </Grid>
      </Grid>
    </Box>
  </PageContainer>
);

export default Register2;
