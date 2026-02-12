"use client";

import React, { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  Stack,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Formik } from "formik";
import * as Yup from "yup";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { Visibility, VisibilityOff, Person, Email, Lock, Badge } from "@mui/icons-material";

const validationSchema = Yup.object({
  firstName: Yup.string()
    .min(2, "Too Short!")
    .max(50, "Too Long!")
    .required("First name is required"),
  lastName: Yup.string()
    .min(2, "Too Short!")
    .max(50, "Too Long!")
    .required("Last name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    )
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm password is required"),
  terms: Yup.boolean()
    .oneOf([true], "You must accept the terms and conditions")
    .required("You must accept the terms and conditions"),
});

const initialValues = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  terms: false,
};

interface AuthRegisterProps {
  subtext?: React.ReactNode;
  subtitle?: React.ReactNode;
}

const AuthRegistrationForm = ({ subtext, subtitle }: AuthRegisterProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (values: typeof initialValues) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Register user with Supabase
      const { data, error: supabaseError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            first_name: values.firstName,
            last_name: values.lastName,
            full_name: `${values.firstName} ${values.lastName}`,
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/authentication/login`,
        },
      });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      if (data.user) {
        // console.log("User registered successfully:", data.user);
        setSuccess(true);
        
        // Redirect to login page after successful registration
        setTimeout(() => {
          router.push("/authentication/login");
        }, 3000);
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <>
      {subtext}
      
      {/* Success Message */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Registration successful! A confirmation email has been sent to your email address. 
          Please check your inbox and verify your email. Redirecting to login page...
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          handleSubmit,
          setFieldValue,
        }) => (
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              {/* First Name Field with Floating Label */}
              <Grid size={{ sm: 6, xs: 12 }}>
                <TextField
                  fullWidth
                  placeholder=" "
                  value={values.firstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.firstName && Boolean(errors.firstName)}
                  helperText={touched.firstName && errors.firstName}
                  disabled={loading}
                  name="firstName"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="action" />
                      </InputAdornment>
                    ),
                  }}
                  label="First Name"
                />
              </Grid>

              {/* Last Name Field with Floating Label */}
              <Grid size={{ sm: 6, xs: 12 }}>
                <TextField
                  fullWidth
                  placeholder=" "
                  value={values.lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.lastName && Boolean(errors.lastName)}
                  helperText={touched.lastName && errors.lastName}
                  disabled={loading}
                  name="lastName"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Badge color="action" />
                      </InputAdornment>
                    ),
                  }}
                  label="Last Name"
                />
              </Grid>

              {/* Email Field with Floating Label */}
              <Grid size={{ sm: 12, xs: 12 }}>
                <TextField
                  fullWidth
                  placeholder=" "
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.email && Boolean(errors.email)}
                  helperText={touched.email && errors.email}
                  disabled={loading}
                  name="email"
                  type="email"
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
              </Grid>

              {/* Password Field with Floating Label */}
              <Grid size={{ sm: 12, xs: 12 }}>
                <TextField
                  fullWidth
                  placeholder=" "
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.password && Boolean(errors.password)}
                  helperText={touched.password && errors.password}
                  disabled={loading}
                  name="password"
                  type={showPassword ? "text" : "password"}
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
              </Grid>

              {/* Confirm Password Field with Floating Label */}
              <Grid size={{ sm: 12, xs: 12 }}>
                <TextField
                  fullWidth
                  placeholder=" "
                  value={values.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                  helperText={touched.confirmPassword && errors.confirmPassword}
                  disabled={loading}
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
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
                          aria-label="toggle confirm password visibility"
                          onClick={handleToggleConfirmPasswordVisibility}
                          edge="end"
                          size="small"
                          disabled={loading}
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  label="Confirm Password"
                />
              </Grid>

              {/* Terms & Conditions Checkbox */}
              <Grid size={{ sm: 12, xs: 12 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="terms"
                      checked={values.terms}
                      onChange={(e) => setFieldValue("terms", e.target.checked)}
                      disabled={loading}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2">
                      I agree to the{" "}
                      <Typography
                        component="span"
                        color="primary"
                        sx={{ cursor: "pointer" }}
                        onClick={() => router.push("/terms")}
                      >
                        Terms & Conditions
                      </Typography>
                    </Typography>
                  }
                />
                {touched.terms && errors.terms && (
                  <Typography color="error" variant="caption">
                    {errors.terms}
                  </Typography>
                )}
              </Grid>

              {/* Submit Button */}
              <Grid size={{ sm: 12, xs: 12 }}>
                <Button
                  type="submit"
                  color="primary"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {loading ? "Creating Account..." : "Sign Up"}
                </Button>
              </Grid>

              {/* Divider */}
              <Grid size={{ sm: 12, xs: 12 }}>
                <Divider>
                  <Typography variant="body2" color="textSecondary">
                    OR
                  </Typography>
                </Divider>
              </Grid>
            </Grid>
          </form>
        )}
      </Formik>

      {subtitle}
    </>
  );
};

export default AuthRegistrationForm;