"use client";

import React from "react";
import {
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Button,
  Stack,
  Checkbox,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import CustomTextField from "@/app/(DashboardLayout)/components/forms/theme-elements/CustomTextField";
import { Visibility, VisibilityOff, Email, Lock } from "@mui/icons-material";

interface loginType {
  title?: string;
  subtitle?: React.ReactNode;
  subtext?: React.ReactNode;
}

const validationSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string().required("Password is required"),
  rememberMe: Yup.boolean(),
});

const initialValues = {
  email: "",
  password: "",
  rememberMe: true,
};

const AuthLogin = ({ title, subtitle, subtext }: loginType) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const router = useRouter();

  const handleSubmit = async (values: typeof initialValues) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      if (data.user) {
        // Store remember me preference
        if (values.rememberMe) {
          localStorage.setItem("rememberMe", "true");
        } else {
          localStorage.removeItem("rememberMe");
        }
        
        // Redirect to dashboard
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (email?: string) => {
    try {
      let userEmail = email;
      
      if (!userEmail) {
        userEmail = prompt("Please enter your email address:") || "";
        if (!userEmail) return;
      }

      const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/authentication/reset-password`,
      });
      
      if (supabaseError) throw supabaseError;
      
      setError(null);
      alert("Password reset email sent! Please check your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
      {title ? (
        <Typography fontWeight="700" variant="h2" mb={1}>
          {title}
        </Typography>
      ) : null}

      {subtext}

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }} 
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => (
          <Form>
            <Stack spacing={3}>
              {/* Email Field with Floating Label */}
              <Box>
                <CustomTextField
                  id="email"
                  name="email"
                  variant="outlined"
                  fullWidth
                  placeholder=" "
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.email && Boolean(errors.email)}
                  helperText={touched.email && errors.email}
                  disabled={loading}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
                      </InputAdornment>
                    ),
                  }}
                  label="Email Address"
                />
              </Box>

              {/* Password Field with Floating Label */}
              <Box>
                <CustomTextField
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  variant="outlined"
                  fullWidth
                  placeholder=" "
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.password && Boolean(errors.password)}
                  helperText={touched.password && errors.password}
                  disabled={loading}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleTogglePasswordVisibility}
                          edge="end"
                          size="small"
                          disabled={loading}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  label="Password"
                />
              </Box>

              <Stack
                justifyContent="space-between"
                direction="row"
                alignItems="center"
              >
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="rememberMe"
                        checked={values.rememberMe}
                        onChange={(e) => setFieldValue("rememberMe", e.target.checked)}
                        disabled={loading}
                      />
                    }
                    label="Remember this Device"
                  />
                </FormGroup>
                {/* <Typography
                  component="button"
                  type="button"
                  onClick={() => handleForgotPassword(values.email)}
                  fontWeight="500"
                  sx={{
                    textDecoration: "none",
                    color: "primary.main",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                >
                  Forgot Password ?
                </Typography> */}
              </Stack>

              <Box>
                <Button
                  color="primary"
                  variant="contained"
                  size="large"
                  fullWidth
                  type="submit"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {loading ? "Signing In..." : "Sign In"}
                </Button>
              </Box>
            </Stack>
          </Form>
        )}
      </Formik>
      {subtitle}
    </>
  );
};

export default AuthLogin;