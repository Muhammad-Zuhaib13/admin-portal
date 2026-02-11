"use client";

import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Stack,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { supabase } from "@/app/lib/supabase";

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

const initialValues = {
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
  formData.append('folder', 'blogs');
  
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
  uploading
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
    <Box sx={{ width: '100%' }}>
      <TextField
        fullWidth
        label={label}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        error={error}
        helperText={helperText}
        disabled={disabled || isUploading}
        placeholder={placeholder}
        InputProps={{
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

const CreateSEOBannersForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadingFields, setUploadingFields] = useState<Set<string>>(new Set());

  const handleSubmit = async (values: typeof initialValues) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Prepare data for Supabase
      const seoBannerData = {
        seo: values.seo,
        banner: values.banner,
      };

      console.log("Submitting to Supabase:", seoBannerData);

      // Insert into Supabase - changed table name to something more appropriate like "seo_banners"
      const { data, error: supabaseError } = await supabase
        .from("seo_banners") // Changed from "blogs" to "seo_banners"
        .insert([seoBannerData])
        .select();

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      console.log("SEO Banner created successfully:", data);
      setSuccess(true);
      
    } catch (err: any) {
      console.error("Error creating SEO Banner:", err);
      setError(err.message || "Failed to create SEO Banner");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (fieldName: string, url: string, setFieldValue: any) => {
    setUploadingFields(prev => {
      const newSet = new Set(prev);
      newSet.delete(fieldName);
      return newSet;
    });
    setFieldValue(fieldName, url);
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      validateOnChange={false}
      validateOnBlur={true}
      onSubmit={handleSubmit}
    >
      {({ values, handleChange, handleBlur, touched, errors, resetForm, setFieldValue }) => (
        <Form>
          <Stack spacing={4} sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
            
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
                      resetForm();
                    }}
                  >
                    Create Another
                  </Button>
                }
              >
                SEO Banner created successfully!
              </Alert>
            )}

            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* SEO Section */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>SEO Settings</Typography>
                <Stack spacing={3}>
                  <TextField
                    label="SEO Title"
                    name="seo.title"
                    value={values.seo.title}
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
                    value={values.seo.description}
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
                    value={values.seo.keywords}
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
                    value={values.seo.canonicalURL}
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
                    value={values.seo.openGraph.title}
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
                    value={values.seo.openGraph.description}
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
                    value={values.seo.openGraph.url}
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
                    label="OG Image"
                    name="seo.openGraph.image"
                    value={values.seo.openGraph.image}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.seo?.openGraph?.image && errors.seo?.openGraph?.image)}
                    helperText={String(touched.seo?.openGraph?.image && errors.seo?.openGraph?.image) || undefined}
                    disabled={loading}
                    placeholder="https://example.com/image.jpg or upload file"
                    accept="image/*"
                    type="image"
                    onUpload={(url) => setFieldValue("seo.openGraph.image", url)}
                    uploading={uploadingFields.has("seo.openGraph.image")}
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Banner Section */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Banner</Typography>
                <Stack spacing={3}>
                  <TextField
                    label="Banner Title"
                    name="banner.title"
                    value={values.banner.title}
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
                    value={values.banner.description}
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
                    label="Video URL"
                    name="banner.videoUrl"
                    value={values.banner.videoUrl}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.banner?.videoUrl && errors.banner?.videoUrl)}
                    helperText={touched.banner?.videoUrl && errors.banner?.videoUrl || undefined}
                    disabled={loading}
                    placeholder="https://example.com/video.mp4 or upload video"
                    accept="video/*"
                    type="video"
                    onUpload={(url) => setFieldValue("banner.videoUrl", url)}
                    uploading={uploadingFields.has("banner.videoUrl")}
                  />

                  {/* Poster Image URL with Cloudinary upload */}
                  <FileUploadField
                    label="Poster Image URL"
                    name="banner.poster"
                    value={values.banner.poster}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.banner?.poster && errors.banner?.poster)}
                    helperText={String(touched.banner?.poster && errors.banner?.poster) || undefined}
                    disabled={loading}
                    placeholder="https://example.com/poster.jpg or upload image"
                    accept="image/*"
                    type="image"
                    onUpload={(url) => setFieldValue("banner.poster", url)}
                    uploading={uploadingFields.has("banner.poster")}
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button 
              type="submit" 
              variant="contained" 
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{ alignSelf: 'flex-start', px: 4 }}
            >
              {loading ? "Creating..." : "Create SEO Banner"}
            </Button>
          </Stack>
        </Form>
      )}
    </Formik>
  );
};

export default CreateSEOBannersForm;