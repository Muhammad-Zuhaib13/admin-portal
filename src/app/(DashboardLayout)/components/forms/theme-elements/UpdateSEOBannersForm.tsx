"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  TextField,
  Button,
  Stack,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { supabase } from "@/app/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import SuccessModal from "./SuccessModal";
import ErrorModal from "./ErrorModal";
// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

// Updated validation schema - removed content fields
const validationSchema = Yup.object({
  seo: Yup.object({
    title: Yup.string().required("Required"),
    description: Yup.string().required("Required"),
    keywords: Yup.string().required("Required"),
    canonicalURL: Yup.string().url("Must be a valid URL").required("Required"),
    openGraph: Yup.object({
      title: Yup.string().required("Required"),
      description: Yup.string().required("Required"),
      url: Yup.string().url("Must be a valid URL").required("Required"),
      image: Yup.string().url("Must be a valid URL").required("Required"),
    }),
  }),
  banner: Yup.object({
    title: Yup.string().required("Required"),
    description: Yup.string().required("Required"),
    videoUrl: Yup.string().url("Must be a valid URL").required("Required"),
    poster: Yup.string().url("Must be a valid URL").required("Required"),
  }),
});

// Empty initial values structure
const emptyInitialValues = {
  seo: {
    title: "",
    description: "",
    keywords: "",
    metaRobots: "index, follow",
    metaViewport: "width=device-width, initial-scale=1",
    canonicalURL: "",
    openGraph: {
      title: "",
      description: "",
      url: "",
      type: "website",
      image: "",
    },
  },
  banner: {
    title: "",
    description: "",
    videoUrl: "",
    poster: "",
  },
};

// Cloudinary upload function
const uploadToCloudinary = async (file: File, type: 'image' | 'video') => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error("Cloudinary configuration is missing. Please check your environment variables.");
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  // Optional: Add folder for organization
  formData.append('folder', 'seo_banners');

  let cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/`;

  if (type === 'image') {
    cloudinaryUrl += 'image/upload';
  } else if (type === 'video') {
    cloudinaryUrl += 'video/upload';
    // Add video optimization parameters
    formData.append('resource_type', 'video');
  }

  try {
    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudinary upload failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

// File upload field component for Cloudinary
const FileUploadField = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  disabled,
  placeholder,
  accept,
  type = 'image',
  onUpload,
  uploading,
  resetKey
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  error: boolean;
  helperText?: string;
  disabled: boolean;
  placeholder: string;
  accept: string;
  type?: 'image' | 'video';
  onUpload: (url: string) => void;
  uploading: boolean;
  resetKey?: string | number;
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [localUploading, setLocalUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLocalUploading(true);
    try {
      const url = await uploadToCloudinary(file, type);
      onUpload(url);
    } catch (error) {
      console.error(`Failed to upload ${type}:`, error);
      alert(`Failed to upload ${type}. Please try again.`);
    } finally {
      setLocalUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const isUploading = uploading || localUploading;

  return (
    <Box sx={{ width: '100%' }} key={resetKey}>
      <TextField
        fullWidth
        label={label}
        name={name}
        value={value || ''} // Fix: Ensure value is never undefined
        onChange={onChange}
        onBlur={onBlur}
        error={error}
        helperText={helperText}
        disabled={disabled || isUploading}
        placeholder={placeholder}
        slotProps={{ // Fix: Use slotProps instead of InputProps for MUI v6+
          input: {
            endAdornment: (
              <Button
                component="label"
                variant="outlined"
                size="small"
                startIcon={isUploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                disabled={disabled || isUploading}
                sx={{ ml: 1, flexShrink: '0' }}
              >
                Upload
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={accept}
                  hidden
                  onChange={handleFileUpload}
                  disabled={disabled || isUploading}
                />
              </Button>
            ),
          }
        }}
      />
      {isUploading && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          Uploading...
        </Typography>
      )}
    </Box>
  );
};

const UpdateSEOBannersForm = () => {
  const params = useParams();
  const router = useRouter();
  const bannerId = params.id;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [uploadingFields, setUploadingFields] = useState<Set<string>>(new Set());
  const [initialValues, setInitialValues] = useState(emptyInitialValues);
  const [formResetKey, setFormResetKey] = useState(Date.now());

  // Fetch SEO Banner data when component mounts
  useEffect(() => {
    const fetchSEOBannerData = async () => {
      if (!bannerId) return;
      
      setFetching(true);
      setError(null);
      
      try {
        const { data, error: supabaseError } = await supabase
          .from("seo_banners")
          .select("*")
          .eq("id", bannerId)
          .single();

        if (supabaseError) {
          throw new Error(supabaseError.message);
        }

        if (!data) {
          throw new Error("SEO Banner not found");
        }

        // Transform the data to match our form structure
        const transformedData = {
          seo: {
            title: data.seo?.title || "",
            description: data.seo?.description || "",
            keywords: data.seo?.keywords || "",
            metaRobots: data.seo?.metaRobots || "index, follow",
            metaViewport: data.seo?.metaViewport || "width=device-width, initial-scale=1",
            canonicalURL: data.seo?.canonicalURL || "",
            openGraph: {
              title: data.seo?.openGraph?.title || "",
              description: data.seo?.openGraph?.description || "",
              url: data.seo?.openGraph?.url || "",
              type: data.seo?.openGraph?.type || "website",
              image: data.seo?.openGraph?.image || "",
            },
          },
          banner: {
            title: data.banner?.title || "",
            description: data.banner?.description || "",
            videoUrl: data.banner?.videoUrl || "",
            poster: data.banner?.poster || "",
          },
        };
         
        setInitialValues(transformedData);
        // Reset the form key when new data loads
        setFormResetKey(Date.now());
      } catch (err: any) {
        console.error("Error fetching SEO Banner:", err);
        setError(err.message || "Failed to load SEO Banner data");
        setErrorModalOpen(true);
      } finally {
        setFetching(false);
      }
    };

    fetchSEOBannerData();
  }, [bannerId]);
  
  const handleSubmit = async (values: typeof emptyInitialValues) => {
    if (!bannerId) {
      setError("SEO Banner ID is missing");
      setErrorModalOpen(true);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Prepare data for Supabase update
      const seoBannerData = {
        seo: values.seo,
        banner: values.banner,
      };

      // console.log("Updating SEO Banner in Supabase:", seoBannerData);

      // Update in Supabase
      const { data, error: supabaseError } = await supabase
        .from("seo_banners")
        .update(seoBannerData)
        .eq("id", bannerId)
        .select();

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      // console.log("SEO Banner updated successfully:", data);
      setSuccess(true);
      setSuccessModalOpen(true);
      
    } catch (err: any) {
      console.error("Error updating SEO Banner:", err);
      setError(err.message || "Failed to update SEO Banner");
      setErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.push("/created-seo-banners");
  };

  const handleFileUpload = (fieldName: string, url: string, setFieldValue: any) => {
    setFieldValue(fieldName, url);
    setUploadingFields(prev => {
      const newSet = new Set(prev);
      newSet.delete(fieldName);
      return newSet;
    });
  };

  const handleCloseSuccessModal = () => {
    setSuccessModalOpen(false);
    setSuccess(false);
    router.push("/created-seo-banners");
  };

  const handleCloseErrorModal = () => {
    setErrorModalOpen(false);
    setError(null);
  };

  if (fetching) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography>Loading SEO Banner data...</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      validateOnChange={false}
      validateOnBlur={true}
      onSubmit={handleSubmit}
      enableReinitialize={true} // Important: This allows the form to reinitialize when initialValues change
    >
      {({ values, handleChange, handleBlur, touched, errors, resetForm, setFieldValue }) => (
        <Form>
          <Stack spacing={4} sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>

            {/* Header with Back Button */}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleGoBack}
                variant="outlined"
              >
                Back to SEO Banners
              </Button>
              <Typography variant="h5" component="h1" fontWeight="bold">
                Update SEO Banner #{bannerId}
              </Typography>
            </Stack>

            {/* Status Messages */}
            {success && (
              <Alert
                severity="success"
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => {
                      setSuccess(false);
                      router.push("/created-seo-banners");
                    }}
                  >
                    View All SEO Banners
                  </Button>
                }
              >
                SEO Banner updated successfully!
              </Alert>
            )}

            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* SEO Section */}
            <Card>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <Typography variant="h6" gutterBottom>SEO Settings</Typography>
                <Stack spacing={3}>
                  <TextField
                    label="SEO Title"
                    name="seo.title"
                    value={values.seo.title || ''} // Fix: Add fallback
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.seo?.title && errors.seo?.title)}
                    helperText={touched.seo?.title && errors.seo?.title}
                    fullWidth
                    disabled={loading}
                  />

                  <TextField
                    label="SEO Description"
                    name="seo.description"
                    multiline
                    rows={3}
                    value={values.seo.description || ''} // Fix: Add fallback
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.seo?.description && errors.seo?.description)}
                    helperText={touched.seo?.description && errors.seo?.description}
                    fullWidth
                    disabled={loading}
                  />

                  <TextField
                    label="Keywords"
                    name="seo.keywords"
                    value={values.seo.keywords || ''} // Fix: Add fallback
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.seo?.keywords && errors.seo?.keywords)}
                    helperText={touched.seo?.keywords && errors.seo?.keywords}
                    fullWidth
                    disabled={loading}
                    placeholder="keyword1, keyword2, keyword3"
                  />

                  <TextField
                    label="Canonical URL"
                    name="seo.canonicalURL"
                    value={values.seo.canonicalURL || ''} // Fix: Add fallback
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.seo?.canonicalURL && errors.seo?.canonicalURL)}
                    helperText={touched.seo?.canonicalURL && errors.seo?.canonicalURL}
                    fullWidth
                    disabled={loading}
                  />

                  <Divider />
                  <Typography variant="subtitle1">Open Graph</Typography>

                  <TextField
                    label="OG Title"
                    name="seo.openGraph.title"
                    value={values.seo.openGraph.title || ''} // Fix: Add fallback
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(
                      touched.seo?.openGraph?.title &&
                      errors.seo?.openGraph?.title
                    )}
                    helperText={
                      touched.seo?.openGraph?.title &&
                      errors.seo?.openGraph?.title
                    }
                    fullWidth
                    disabled={loading}
                  />

                  <TextField
                    label="OG Description"
                    name="seo.openGraph.description"
                    value={values.seo.openGraph.description || ''} // Fix: Add fallback
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(
                      touched.seo?.openGraph?.description &&
                      errors.seo?.openGraph?.description
                    )}
                    helperText={
                      touched.seo?.openGraph?.description &&
                      errors.seo?.openGraph?.description
                    }
                    fullWidth
                    disabled={loading}
                  />

                  <TextField
                    label="OG URL"
                    name="seo.openGraph.url"
                    value={values.seo.openGraph.url || ''} // Fix: Add fallback
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(
                      touched.seo?.openGraph?.url &&
                      errors.seo?.openGraph?.url
                    )}
                    helperText={
                      touched.seo?.openGraph?.url &&
                      errors.seo?.openGraph?.url
                    }
                    fullWidth
                    disabled={loading}
                  />

                  {/* OG Image with Cloudinary upload */}
                  <FileUploadField
                    key={`og-image-${formResetKey}`} // Fix: Add key for reset
                    label="OG Image"
                    name="seo.openGraph.image"
                    value={values.seo.openGraph.image}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.seo?.openGraph?.image && errors.seo?.openGraph?.image)}
                    helperText={touched.seo?.openGraph?.image && errors.seo?.openGraph?.image ? String(errors.seo.openGraph.image) : undefined} // Fix: Proper helperText
                    disabled={loading}
                    placeholder="https://example.com/image.jpg or upload file"
                    accept="image/*"
                    type="image"
                    onUpload={(url) => {
                      setFieldValue("seo.openGraph.image", url);
                      setUploadingFields(prev => {
                        const newSet = new Set(prev);
                        newSet.delete("seo.openGraph.image");
                        return newSet;
                      });
                    }}
                    uploading={uploadingFields.has("seo.openGraph.image")}
                    resetKey={formResetKey}
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Banner Section */}
            <Card>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <Typography variant="h6" gutterBottom>Banner</Typography>
                <Stack spacing={3}>
                  <TextField
                    label="Banner Title"
                    name="banner.title"
                    value={values.banner.title || ''} // Fix: Add fallback
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.banner?.title && errors.banner?.title)}
                    helperText={touched.banner?.title && errors.banner?.title}
                    fullWidth
                    disabled={loading}
                  />

                  <TextField
                    label="Banner Description"
                    name="banner.description"
                    multiline
                    rows={2}
                    value={values.banner.description || ''} // Fix: Add fallback
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(
                      touched.banner?.description &&
                      errors.banner?.description
                    )}
                    helperText={
                      touched.banner?.description &&
                      errors.banner?.description
                    }
                    fullWidth
                    disabled={loading}
                  />

                  {/* Video URL with Cloudinary upload */}
                  <FileUploadField
                    key={`video-${formResetKey}`} // Fix: Add key for reset
                    label="Video URL"
                    name="banner.videoUrl"
                    value={values.banner.videoUrl}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.banner?.videoUrl && errors.banner?.videoUrl)}
                    helperText={touched.banner?.videoUrl && errors.banner?.videoUrl ? String(errors.banner.videoUrl) : undefined} // Fix: Proper helperText
                    disabled={loading}
                    placeholder="https://example.com/video.mp4 or upload video"
                    accept="video/*"
                    type="video"
                    onUpload={(url) => {
                      setFieldValue("banner.videoUrl", url);
                      setUploadingFields(prev => {
                        const newSet = new Set(prev);
                        newSet.delete("banner.videoUrl");
                        return newSet;
                      });
                    }}
                    uploading={uploadingFields.has("banner.videoUrl")}
                    resetKey={formResetKey}
                  />

                  {/* Poster Image URL with Cloudinary upload */}
                  <FileUploadField
                    key={`poster-${formResetKey}`} // Fix: Add key for reset
                    label="Poster Image URL"
                    name="banner.poster"
                    value={values.banner.poster}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.banner?.poster && errors.banner?.poster)}
                    helperText={touched.banner?.poster && errors.banner?.poster ? String(errors.banner.poster) : undefined} // Fix: Proper helperText
                    disabled={loading}
                    placeholder="https://example.com/poster.jpg or upload image"
                    accept="image/*"
                    type="image"
                    onUpload={(url) => {
                      setFieldValue("banner.poster", url);
                      setUploadingFields(prev => {
                        const newSet = new Set(prev);
                        newSet.delete("banner.poster");
                        return newSet;
                      });
                    }}
                    uploading={uploadingFields.has("banner.poster")}
                    resetKey={formResetKey}
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                onClick={handleGoBack}
                variant="outlined"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || success}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                sx={{ px: 4 }}
              >
                {loading ? "Updating..." : "Update SEO Banner"}
              </Button>
            </Stack>
          </Stack>

          <SuccessModal
            open={successModalOpen}
            onClose={handleCloseSuccessModal}
            message="SEO Banner updated successfully!"
            buttonText="View All SEO Banners"
            onButtonClick={handleCloseSuccessModal}
          />

          {/* Error Modal */}
          <ErrorModal
            open={errorModalOpen}
            onClose={handleCloseErrorModal}
            message={error || "An error occurred"}
          />
        </Form>
      )}
    </Formik>
  );
};

export default UpdateSEOBannersForm;