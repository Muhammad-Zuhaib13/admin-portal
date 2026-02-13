"use client";

import React, { useEffect, useState } from "react";
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
import { Formik, Form, FieldArray } from "formik";
import * as Yup from "yup";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { supabase } from "@/app/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import SuccessModal from "./SuccessModal";
import ErrorModal from "./ErrorModal";

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

// Update validation schema to include poster field
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
  content: Yup.object({
    title: Yup.string().required("Required"),
    createdDate: Yup.string().required("Required"),
    cta: Yup.object({
      slug: Yup.string().required("Required"),
      text: Yup.string().required("Required"),
    }),
    description: Yup.array()
      .of(
        Yup.object({
          text: Yup.string().required("Required"),
        })
      )
      .min(1, "At least one description paragraph is required"),
    tags: Yup.object({
      list: Yup.array()
        .of(
          Yup.object({
            text: Yup.string().required("Tag is required"),
          })
        )
        .min(1, "At least one tag is required"),
      text: Yup.string().default("Tags"),
    }),
    urls: Yup.object({
      list: Yup.array()
        .of(
          Yup.object({
            text: Yup.string(),
            href: Yup.string().url("Must be a valid URL"),
          })
        )
        .min(1, "At least one URL is required"),
      text: Yup.string().default("Urls"),
    }),
    thumbImage: Yup.string().url("Must be a valid URL").optional(),
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
  content: {
    cta: {
      slug: "",
      text: "",
    },
    title: "",
    thumbImage: "",
    createdDate: new Date().toISOString().split('T')[0],
    description: [{ text: "" }],
    tags: {
      list: [{ text: "" }],
      text: "Tags",
    },
    urls: {
      list: [{ text: "", href: "" }],
      text: "Urls",
    },
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
        value={value || ''}
        onChange={onChange}
        onBlur={onBlur}
        error={error}
        helperText={helperText}
        disabled={disabled || isUploading}
        placeholder={placeholder}
        slotProps={{
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

const UpdateBlogForm = () => {
  const params = useParams();
  const router = useRouter();
  const blogId = params.id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [uploadingFields, setUploadingFields] = useState<Set<string>>(new Set());
  const [initialValues, setInitialValues] = useState(emptyInitialValues);
  const [formResetKey, setFormResetKey] = useState(Date.now());

   // Fetch blog data when component mounts
  useEffect(() => {
    const fetchBlogData = async () => {
      if (!blogId) return;

      setFetching(true);
      setError(null);

      try {
        const { data, error: supabaseError } = await supabase
          .from("blogs")
          .select("*")
          .eq("id", blogId)
          .single();

        if (supabaseError) {
          throw new Error(supabaseError.message);
        }

        if (!data) {
          throw new Error("Blog not found");
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
          content: {
            cta: {
              slug: data.content?.cta?.slug || "",
              text: data.content?.cta?.text || "",
            },
            title: data.content?.title || "",
            thumbImage: data.content?.thumbImage || "",
            createdDate: data.content?.createdDate || new Date().toISOString().split('T')[0],
            description: data.content?.description?.length
              ? data.content.description.map((item: any) => ({
                text: item.text || "",
                id: item.id || undefined
              }))
              : [{ text: "" }],
            tags: {
              list: data.content?.tags?.list?.length
                ? data.content.tags.list.map((item: any) => ({
                  text: item.text || "",
                  id: item.id || undefined
                }))
                : [{ text: "" }],
              text: data.content?.tags?.text || "Tags",
            },
            urls: {
              list: data.content?.urls?.list?.length
                ? data.content.urls.list.map((item: any) => ({
                  text: item.text || "",
                  href: item.href || "",
                  id: item.id || undefined
                }))
                : [{ text: "", href: "" }],
              text: data.content?.urls?.text || "Urls",
            },
          },
        };

        setInitialValues(transformedData);
        setFormResetKey(Date.now());
      } catch (err: any) {
        console.error("Error fetching blog:", err);
        setError(err.message || "Failed to load blog data");
        setErrorModalOpen(true);
      } finally {
        setFetching(false);
      }
    };

    fetchBlogData();
  }, [blogId]);

  const handleSubmit = async (values: typeof emptyInitialValues) => {
    if (!blogId) {
      setError("Blog ID is missing");
      setErrorModalOpen(true);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Prepare data for Supabase update
      const blogData = {
        seo: values.seo,
        banner: values.banner,
        content: values.content,
      };

      // console.log("Updating blog in Supabase:", blogData);

      // Update in Supabase
      const { data, error: supabaseError } = await supabase
        .from("blogs")
        .update(blogData)
        .eq("id", blogId)
        .select();

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      // console.log("Blog updated successfully:", data);
      setSuccess(true);
      setSuccessModalOpen(true);

    } catch (err: any) {
      console.error("Error updating blog:", err);
      setError(err.message || "Failed to update blog");
      setErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setSuccessModalOpen(false);
    setSuccess(false);
    router.push("/created-blogs");
  };

  const handleCloseErrorModal = () => {
    setErrorModalOpen(false);
    setError(null);
  };

  const handleGoBack = () => {
    router.push("/created-blogs");
  };

  const handleFileUpload = (fieldName: string, url: string, setFieldValue: any) => {
    setFieldValue(fieldName, url);
    setUploadingFields(prev => {
      const newSet = new Set(prev);
      newSet.delete(fieldName);
      return newSet;
    });
  };

  if (fetching) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography>Loading blog data...</Typography>
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
      enableReinitialize={true}
    >
      {({ values, handleChange, handleBlur, touched, errors, setFieldValue }) => (
        <Form>
          <Stack spacing={4} sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>

            {/* Header with Back Button */}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleGoBack}
                variant="outlined"
              >
                Back to Blogs
              </Button>
              <Typography variant="h5" component="h1" fontWeight="bold">
                Update Blog #{blogId}
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
                      router.push("/created-blogs");
                    }}
                  >
                    View All Blogs
                  </Button>
                }
              >
                Blog updated successfully!
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
                    value={values.seo.title || ''}
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
                    value={values.seo.description || ''}
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
                    value={values.seo.keywords || ''}
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
                    value={values.seo.canonicalURL || ''}
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
                    value={values.seo.openGraph.title || ''}
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
                    value={values.seo.openGraph.description || ''}
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
                    value={values.seo.openGraph.url || ''}
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
                    key={`og-image-${formResetKey}`}
                    label="OG Image"
                    name="seo.openGraph.image"
                    value={values.seo.openGraph.image}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.seo?.openGraph?.image && errors.seo?.openGraph?.image)}
                    helperText={touched.seo?.openGraph?.image && errors.seo?.openGraph?.image ? String(errors.seo.openGraph.image) : undefined}
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
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: '18px' }} >
                <Typography variant="h6" gutterBottom>Banner</Typography>
                <Stack spacing={3}>
                  <TextField
                    label="Banner Title"
                    name="banner.title"
                    value={values.banner.title || ''}
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
                    value={values.banner.description || ''}
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
                    key={`video-${formResetKey}`}
                    label="Video URL"
                    name="banner.videoUrl"
                    value={values.banner.videoUrl}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.banner?.videoUrl && errors.banner?.videoUrl)}
                    helperText={touched.banner?.videoUrl && errors.banner?.videoUrl ? String(errors.banner.videoUrl) : undefined}
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
                    key={`poster-${formResetKey}`}
                    label="Poster Image URL"
                    name="banner.poster"
                    value={values.banner.poster}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.banner?.poster && errors.banner?.poster)}
                    helperText={touched.banner?.poster && errors.banner?.poster ? String(errors.banner.poster) : undefined}
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

            {/* Content Section */}
            <Card>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <Typography variant="h6" gutterBottom>Content</Typography>
                <Stack spacing={3}>
                  <TextField
                    label="Content Title"
                    name="content.title"
                    value={values.content.title || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.content?.title && errors.content?.title)}
                    helperText={touched.content?.title && errors.content?.title}
                    fullWidth
                    disabled={loading}
                  />

                  {/* Thumbnail Image URL with Cloudinary upload */}
                  <FileUploadField
                    key={`thumbnail-${formResetKey}`}
                    label="Thumbnail Image URL"
                    name="content.thumbImage"
                    value={values.content.thumbImage}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.content?.thumbImage && errors.content?.thumbImage)}
                    helperText={touched.content?.thumbImage && errors.content?.thumbImage ? String(errors.content.thumbImage) : undefined}
                    disabled={loading}
                    placeholder="https://example.com/image.jpg or upload image"
                    accept="image/*"
                    type="image"
                    onUpload={(url) => {
                      setFieldValue("content.thumbImage", url);
                      setUploadingFields(prev => {
                        const newSet = new Set(prev);
                        newSet.delete("content.thumbImage");
                        return newSet;
                      });
                    }}
                    uploading={uploadingFields.has("content.thumbImage")}
                    resetKey={formResetKey}
                  />

                  <TextField
                    label="Created Date"
                    name="content.createdDate"
                    type="date"
                    value={values.content.createdDate || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.content?.createdDate && errors.content?.createdDate)}
                    helperText={touched.content?.createdDate && errors.content?.createdDate}
                    fullWidth
                    disabled={loading}
                    slotProps={{
                      inputLabel: { shrink: true }
                    }}
                  />

                  {/* CTA */}
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>Call to Action (CTA)</Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <TextField
                        label="CTA Slug"
                        name="content.cta.slug"
                        value={values.content.cta.slug || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={Boolean(touched.content?.cta?.slug && errors.content?.cta?.slug)}
                        helperText={touched.content?.cta?.slug && errors.content?.cta?.slug}
                        fullWidth
                        disabled={loading}
                        placeholder="/blogs/sample-blog"
                      />
                      <TextField
                        label="CTA Text"
                        name="content.cta.text"
                        value={values.content.cta.text || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={Boolean(touched.content?.cta?.text && errors.content?.cta?.text)}
                        helperText={touched.content?.cta?.text && errors.content?.cta?.text}
                        fullWidth
                        disabled={loading}
                        placeholder="Read more"
                      />
                    </Stack>
                  </Box>

                  {/* Description Blocks */}
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Description Paragraphs
                    </Typography>
                    <FieldArray name="content.description">
                      {({ push, remove }) => (
                        <Stack spacing={2}>
                          {values.content.description.map((item, index) => {
                            const fieldError = errors.content?.description?.[index];
                            const fieldTouched = touched.content?.description?.[index];
                            const errorMessage = typeof fieldError === 'object' && fieldError?.text ? fieldError.text : '';

                            return (
                              <Stack direction="row" spacing={1} key={index} alignItems="flex-start">
                                <TextField
                                  fullWidth
                                  multiline
                                  rows={3}
                                  name={`content.description.${index}.text`}
                                  value={item.text || ''}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  error={Boolean(fieldTouched?.text && errorMessage)}
                                  helperText={fieldTouched?.text && errorMessage}
                                  disabled={loading}
                                  placeholder={`Paragraph ${index + 1}`}
                                />
                                <IconButton
                                  onClick={() => remove(index)}
                                  disabled={loading || values.content.description.length <= 1}
                                  sx={{ mt: 1 }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Stack>
                            );
                          })}
                          <Button
                            startIcon={<AddIcon />}
                            onClick={() => push({ text: "" })}
                            disabled={loading}
                            variant="outlined"
                            sx={{ alignSelf: 'flex-start' }}
                          >
                            Add Paragraph
                          </Button>
                          {typeof errors.content?.description === 'string' && (
                            <Typography color="error" variant="caption">
                              {errors.content.description}
                            </Typography>
                          )}
                        </Stack>
                      )}
                    </FieldArray>
                  </Box>

                  {/* Tags */}
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Tags
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      Add relevant tags for your blog (e.g., "creative design agency", "branding and design agency")
                    </Typography>
                    <FieldArray name="content.tags.list">
                      {({ push, remove }) => (
                        <Stack spacing={2}>
                          {values.content.tags.list.map((item, index) => {
                            const fieldError = errors.content?.tags?.list?.[index];
                            const fieldTouched = touched.content?.tags?.list?.[index];
                            const errorMessage = typeof fieldError === 'object' && fieldError?.text ? fieldError.text : '';

                            return (
                              <Stack direction="row" spacing={1} key={index} alignItems="flex-start">
                                <TextField
                                  fullWidth
                                  name={`content.tags.list.${index}.text`}
                                  value={item.text || ''}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  error={Boolean(fieldTouched?.text && errorMessage)}
                                  helperText={fieldTouched?.text && errorMessage}
                                  disabled={loading}
                                  placeholder={`Tag ${index + 1}`}
                                />
                                <IconButton
                                  onClick={() => remove(index)}
                                  disabled={loading || values.content.tags.list.length <= 1}
                                  sx={{ mt: 1 }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Stack>
                            );
                          })}
                          <Button
                            startIcon={<AddIcon />}
                            onClick={() => push({ text: "" })}
                            disabled={loading}
                            variant="outlined"
                            sx={{ alignSelf: 'flex-start' }}
                          >
                            Add Tag
                          </Button>
                          {typeof errors.content?.tags?.list === 'string' && (
                            <Typography color="error" variant="caption">
                              {errors.content.tags.list}
                            </Typography>
                          )}
                        </Stack>
                      )}
                    </FieldArray>
                  </Box>

                  {/* URLs */}
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Related URLs
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      Add related links (e.g., "Read More", "View Source")
                    </Typography>
                    <FieldArray name="content.urls.list">
                      {({ push, remove }) => (
                        <Stack spacing={2}>
                          {values.content.urls.list.map((item, index) => {
                            const fieldError = errors.content?.urls?.list?.[index];
                            const fieldTouched = touched.content?.urls?.list?.[index];
                            const textError = typeof fieldError === 'object' && fieldError?.text ? fieldError.text : '';
                            const hrefError = typeof fieldError === 'object' && fieldError?.href ? fieldError.href : '';

                            return (
                              <Stack spacing={1} key={index}>
                                <Stack direction="row" spacing={1} alignItems="flex-start">
                                  <TextField
                                    fullWidth
                                    name={`content.urls.list.${index}.text`}
                                    value={item.text || ''}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={Boolean(fieldTouched?.text && textError)}
                                    helperText={fieldTouched?.text && textError}
                                    disabled={loading}
                                    placeholder="Link text (e.g., Read More)"
                                  />
                                  <TextField
                                    fullWidth
                                    name={`content.urls.list.${index}.href`}
                                    value={item.href || ''}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={Boolean(fieldTouched?.href && hrefError)}
                                    helperText={fieldTouched?.href && hrefError}
                                    disabled={loading}
                                    placeholder="https://example.com"
                                  />
                                  <IconButton
                                    onClick={() => remove(index)}
                                    disabled={loading || values.content.urls.list.length <= 1}
                                    sx={{ mt: 1 }}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Stack>
                              </Stack>
                            );
                          })}
                          <Button
                            startIcon={<AddIcon />}
                            onClick={() => push({ text: "", href: "" })}
                            disabled={loading}
                            variant="outlined"
                            sx={{ alignSelf: 'flex-start' }}
                          >
                            Add URL
                          </Button>
                          {typeof errors.content?.urls?.list === 'string' && (
                            <Typography color="error" variant="caption">
                              {errors.content.urls.list}
                            </Typography>
                          )}
                        </Stack>
                      )}
                    </FieldArray>
                  </Box>
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
                {loading ? "Updating..." : "Update Blog"}
              </Button>
            </Stack>
          </Stack>
          <SuccessModal
            open={successModalOpen}
            onClose={handleCloseSuccessModal}
            message="Blog updated successfully!"
            buttonText="View All Blogs"
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

export default UpdateBlogForm;