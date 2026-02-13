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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
} from "@mui/material";
import { Formik, Form, FieldArray } from "formik";
import * as Yup from "yup";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { supabase } from "@/app/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import SuccessModal from "./SuccessModal";
import ErrorModal from "./ErrorModal";
// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

// Custom validation for image (updated to accept file or URL)
const imageValidation = Yup.object().shape({
  image: Yup.string().optional(),
  alt: Yup.string().when('image', {
    is: (image: string) => image && image.trim().length > 0,
    then: (schema: any) => schema.required('Alt text is required when image is provided'),
    otherwise: (schema: any) => schema.optional()
  })
});

// Custom validation for video (updated to accept file or URL)
const videoValidation = Yup.object().shape({
  video: Yup.string().optional(),
  poster: Yup.string().when('video', {
    is: (video: string) => video && video.trim().length > 0,
    then: (schema: any) => schema.required('Poster is required when video is provided'),
    otherwise: (schema: any) => schema.optional()
  })
});

// Card validation - all fields are required
const cardValidation = Yup.object().shape({
  cardTitle: Yup.string().required("Card Title is required"),
  ctaText: Yup.string().required("CTA Text is required"),
  pageUrl: Yup.string().required("Page slug is required"),
  cardBackgroundImage: Yup.string().required("Background Image is required"),
});

// Validation Schema - UPDATED to include card validation
// Validation Schema - UPDATED to make tabTitle conditional
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
  key: Yup.string()
    .oneOf(["imageGallery", "videoGallery", "imageVideoTabsGallery"], "Invalid selection")
    .required("Required"),
  // Content validation - INCLUDES CARD VALIDATION
  content: Yup.object().shape({
    card: cardValidation.required(),
    // Other content fields remain optional
    imageGallery: Yup.array().of(imageValidation).optional(),
    videoGallery: Yup.array().of(videoValidation).optional(),
    imageVideoTabsGallery: Yup.array().of(
      Yup.object({
        // Only validate tabTitle when imageVideoTabsGallery is actually selected
        tabTitle: Yup.string().when('$key', {
          is: 'imageVideoTabsGallery',
          then: (schema: any) => schema.required("Tab title is required"),
          otherwise: (schema: any) => schema.optional()
        }),
        key: Yup.string().oneOf(["image", "video"]).required("Tab type is required"),
        list: Yup.array().of(
          Yup.lazy((value: any, context: any) => {
            const path = context.path;
            const tabIndex = parseInt(path.split('.')[2]);
            const tab = context.from?.[2]?.value?.content?.imageVideoTabsGallery?.[tabIndex];

            if (tab?.key === 'image') {
              return imageValidation;
            } else {
              return videoValidation;
            }
          })
        ).optional()
      })
    ).optional(),
  }).required(),
});

// Initial values based on your structure - UPDATED to include card
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
  key: "",
  content: {
    card: {
      cardTitle: "",
      ctaText: "",
      pageUrl: "",
      cardBackgroundImage: ""
    },
    imageGallery: [{ image: "", alt: "" }],
    videoGallery: [{ video: "", poster: "" }],
    imageVideoTabsGallery: [{
      tabTitle: "",
      key: "image",
      list: [{ image: "", alt: "" }],
    }],
  },
};

// Custom validation function - SIMPLIFIED VERSION (only gallery type specific validation)
const validateForm = (values: typeof initialValues) => {
  const errors: any = {};

  if (!values.key) {
    errors.key = "Required";
    return errors;
  }

  // Only validate the selected gallery type
  if (values.key === "imageGallery") {
    const imageGalleryErrors: any[] = [];
    values.content.imageGallery?.forEach((item, index) => {
      const itemErrors: any = {};

      if (item.image && !item.alt) {
        itemErrors.alt = "Alt text is required when image is provided";
      }

      if (Object.keys(itemErrors).length > 0) {
        imageGalleryErrors[index] = itemErrors;
      }
    });

    if (imageGalleryErrors.length > 0) {
      if (!errors.content) errors.content = {};
      errors.content.imageGallery = imageGalleryErrors;
    }
  } else if (values.key === "videoGallery") {
    const videoGalleryErrors: any[] = [];
    values.content.videoGallery?.forEach((item, index) => {
      const itemErrors: any = {};

      if (item.video && !item.poster) {
        itemErrors.poster = "Poster is required when video is provided";
      }

      if (Object.keys(itemErrors).length > 0) {
        videoGalleryErrors[index] = itemErrors;
      }
    });

    if (videoGalleryErrors.length > 0) {
      if (!errors.content) errors.content = {};
      errors.content.videoGallery = videoGalleryErrors;
    }
  } else if (values.key === "imageVideoTabsGallery") {
    const tabsErrors: any[] = [];
    values.content.imageVideoTabsGallery?.forEach((tab, tabIndex) => {
      const tabErrors: any = {};
      const listErrors: any[] = [];

      // Validate tab title
      if (!tab.tabTitle) {
        tabErrors.tabTitle = "Tab title is required";
      }

      // Validate tab key
      if (!tab.key) {
        tabErrors.key = "Tab type is required";
      }

      // Validate list items
      tab.list?.forEach((item, itemIndex) => {
        const itemErrors: any = {};

        if (tab.key === 'image') {
          const imageItem = item as any;
          if (imageItem.image && !imageItem.alt) {
            itemErrors.alt = "Alt text is required when image is provided";
          }
        } else if (tab.key === 'video') {
          const videoItem = item as any;
          if (videoItem.video && !videoItem.poster) {
            itemErrors.poster = "Poster is required when video is provided";
          }
        }

        if (Object.keys(itemErrors).length > 0) {
          listErrors[itemIndex] = itemErrors;
        }
      });

      if (Object.keys(tabErrors).length > 0 || listErrors.length > 0) {
        tabsErrors[tabIndex] = {
          ...tabErrors,
          ...(listErrors.length > 0 && { list: listErrors })
        };
      }
    });

    if (tabsErrors.length > 0) {
      if (!errors.content) errors.content = {};
      errors.content.imageVideoTabsGallery = tabsErrors;
    }
  }

  return errors;
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
  formData.append('folder', 'portfolio');

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

// File input component for Cloudinary upload
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
  const [localUploading, setLocalUploading] = React.useState(false);


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

const CreatePortfolioForm = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState(0);
  const [uploadingFields, setUploadingFields] = React.useState<Set<string>>(new Set());
  const [formResetKey, setFormResetKey] = React.useState(Date.now());
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const router = useRouter();
   const handleSubmit = async (values: typeof initialValues, { setErrors, resetForm }: any) => {
    // Run custom validation for gallery-specific rules
    const validationErrors = validateForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Filter content based on selected key
      const portfolioData = {
        seo: values.seo,
        banner: values.banner,
        key: values.key,
        content: {
          card: values.content.card, // Include card in content
          [values.key]: values.content[values.key as keyof typeof values.content],
        },
      };

      // console.log("Submitting to Supabase:", portfolioData);

      // Insert into Supabase
      const { data, error: supabaseError } = await supabase
        .from("portfolio")
        .insert([portfolioData])
        .select();

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      // console.log("Portfolio created successfully:", data);
      setSuccess(true);
      setSuccessModalOpen(true);

      // Reset form after successful submission
      resetForm();

      // Clear uploading fields
      setUploadingFields(new Set());

      // Reset active tab
      setActiveTab(0);

      // Trigger a key change to reset file inputs
      setFormResetKey(Date.now());

    } catch (err: any) {
      console.error("Error creating portfolio:", err);
      setError(err.message || "Failed to create portfolio");
      setErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setSuccessModalOpen(false);
    setSuccess(false);
    router.push("/created-portfolios");
  };

  const handleCloseErrorModal = () => {
    setErrorModalOpen(false);
    setError(null);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleFileUpload = React.useCallback((fieldName: string, url: string, setFieldValue: any) => {
    setFieldValue(fieldName, url);
    setUploadingFields(prev => {
      const newSet = new Set(prev);
      newSet.delete(fieldName);
      return newSet;
    });
  }, []);

  const handleCreateAnother = (resetForm: any) => {
    setSuccess(false);
    resetForm();
    setUploadingFields(new Set());
    setActiveTab(0);
    setFormResetKey(Date.now());
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      validateOnChange={false}
      validateOnBlur={true}
      onSubmit={handleSubmit}
      validate={(values) => {
        return validateForm(values);
      }}
    >
      {({ values, handleChange, handleBlur, touched, errors, resetForm, setFieldValue }) => (
        <Form>
          <Stack spacing={4} sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
            <Typography variant="h3" gutterBottom>Create Portfolio</Typography>
            {/* <pre style={{ color: "red", background: "#111", padding: 12 }}>
              {JSON.stringify(errors, null, 2)}
            </pre> */}
            {success && (
              <Alert
                severity="success"
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => handleCreateAnother(resetForm)}
                  >
                    Create Another
                  </Button>
                }
              >
                Portfolio created successfully!
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
                    placeholder="creative design agency, branding and design agency"
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
                    error={Boolean(touched.seo?.openGraph?.title && errors.seo?.openGraph?.title)}
                    helperText={touched.seo?.openGraph?.title && errors.seo?.openGraph?.title}
                    fullWidth
                    disabled={loading}
                  />

                  <TextField
                    label="OG Description"
                    name="seo.openGraph.description"
                    value={values.seo.openGraph.description || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.seo?.openGraph?.description && errors.seo?.openGraph?.description)}
                    helperText={touched.seo?.openGraph?.description && errors.seo?.openGraph?.description}
                    fullWidth
                    disabled={loading}
                  />

                  <TextField
                    label="OG URL"
                    name="seo.openGraph.url"
                    value={values.seo.openGraph.url || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.seo?.openGraph?.url && errors.seo?.openGraph?.url)}
                    helperText={touched.seo?.openGraph?.url && errors.seo?.openGraph?.url}
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
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
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
                    error={Boolean(touched.banner?.description && errors.banner?.description)}
                    helperText={touched.banner?.description && errors.banner?.description}
                    fullWidth
                    disabled={loading}
                  />

                  {/* Banner Video URL with Cloudinary upload */}
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

                  {/* Banner Poster with Cloudinary upload */}
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

            {/* CARD Section - Added above Gallery Type */}
            <Card>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <Typography variant="h6" gutterBottom>Card</Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  All fields in this section are required.
                </Typography>
                <Stack spacing={3}>
                  <TextField
                    label="Card Title *"
                    name="content.card.cardTitle"
                    value={values.content.card?.cardTitle || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.content?.card?.ctaText && errors.content?.card?.cardTitle)}
                    helperText={touched.content?.card?.ctaText && errors.content?.card?.cardTitle}
                    fullWidth
                    disabled={loading}
                    placeholder="e.g., Artwork"
                  />
                  <TextField
                    label="CTA Text *"
                    name="content.card.ctaText"
                    value={values.content.card?.ctaText || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.content?.card?.ctaText && errors.content?.card?.ctaText)}
                    helperText={touched.content?.card?.ctaText && errors.content?.card?.ctaText}
                    fullWidth
                    disabled={loading}
                    placeholder="e.g., Learn More, Get Started, View Details"
                  />

                  <TextField
                    label="Page URL *"
                    name="content.card.pageUrl"
                    value={values.content.card?.pageUrl || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.content?.card?.pageUrl && errors.content?.card?.pageUrl)}
                    helperText={touched.content?.card?.pageUrl && errors.content?.card?.pageUrl}
                    fullWidth
                    disabled={loading}
                    placeholder="https://example.com/page"
                  />

                  {/* Card Background Image with Cloudinary upload */}
                  <FileUploadField
                    key={`card-bg-${formResetKey}`}
                    label="Background Image *"
                    name="content.card.cardBackgroundImage"
                    value={values.content.card?.cardBackgroundImage || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.content?.card?.cardBackgroundImage && errors.content?.card?.cardBackgroundImage)}
                    helperText={touched.content?.card?.cardBackgroundImage && errors.content?.card?.cardBackgroundImage ? String(errors.content.card.cardBackgroundImage) : undefined}
                    disabled={loading}
                    placeholder="https://example.com/background.jpg or upload image"
                    accept="image/*"
                    type="image"
                    onUpload={(url) => {
                      setFieldValue("content.card.cardBackgroundImage", url);
                      setUploadingFields(prev => {
                        const newSet = new Set(prev);
                        newSet.delete("content.card.cardBackgroundImage");
                        return newSet;
                      });
                    }}
                    uploading={uploadingFields.has("content.card.cardBackgroundImage")}
                    resetKey={formResetKey}
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Gallery Type Selection */}
            <Card>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <Typography variant="h6" gutterBottom>Gallery Type</Typography>
                <FormControl fullWidth disabled={loading}>
                  <InputLabel id="gallery-type-label">Select Gallery Type</InputLabel>
                  <Select
                    labelId="gallery-type-label"
                    name="key"
                    value={values.key || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.key && errors.key)}
                    label="Select Gallery Type"
                  >
                    <MenuItem value="imageGallery">Image Gallery</MenuItem>
                    <MenuItem value="videoGallery">Video Gallery</MenuItem>
                    <MenuItem value="imageVideoTabsGallery">Image & Video Tabs Gallery</MenuItem>
                  </Select>
                </FormControl>
                {touched.key && errors.key && (
                  <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                    {errors.key}
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Content Section - Dynamic based on selection */}
            <Card>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <Typography variant="h6" gutterBottom>Content</Typography>

                {values.key === "imageGallery" && (
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Image Gallery
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        (Alt text required only when image is provided)
                      </Typography>
                    </Typography>
                    <FieldArray name="content.imageGallery">
                      {({ push, remove }) => (
                        <Stack spacing={2}>
                          {values.content.imageGallery.map((item: any, index: number) => {
                            const fieldError = errors.content?.imageGallery?.[index] as any;
                            const fieldTouched = touched.content?.imageGallery?.[index];
                            const hasImage = item.image && item.image.trim().length > 0;
                            const imageFieldName = `content.imageGallery.${index}.image`;

                            return (
                              <Stack spacing={2} key={index}>
                                <Stack direction="row" spacing={1} alignItems="flex-start">
                                  <FileUploadField
                                    key={`image-gallery-${formResetKey}-${index}`}
                                    label="Image URL"
                                    name={imageFieldName}
                                    value={item.image}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={Boolean(fieldTouched?.image && fieldError?.image)}
                                    helperText={fieldTouched?.image && fieldError?.image}
                                    disabled={loading}
                                    placeholder="https://example.com/image.jpg or upload image"
                                    accept="image/*"
                                    type="image"
                                    onUpload={(url) => {
                                      setFieldValue(imageFieldName, url);
                                      setUploadingFields(prev => {
                                        const newSet = new Set(prev);
                                        newSet.delete(imageFieldName);
                                        return newSet;
                                      });
                                    }}
                                    uploading={uploadingFields.has(imageFieldName)}
                                    resetKey={`${formResetKey}-${index}`}
                                  />
                                  <TextField
                                    fullWidth
                                    label="Alt Text"
                                    name={`content.imageGallery.${index}.alt`}
                                    value={item.alt || ''}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={Boolean(hasImage && fieldTouched?.alt && fieldError?.alt)}
                                    helperText={hasImage ? (fieldTouched?.alt && fieldError?.alt) : "Optional (required if image is provided)"}
                                    disabled={loading}
                                    placeholder="Description of the image"
                                  />
                                  <IconButton
                                    onClick={() => remove(index)}
                                    disabled={loading}
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
                            onClick={() => push({ image: "", alt: "" })}
                            disabled={loading}
                            variant="outlined"
                            sx={{ alignSelf: 'flex-start' }}
                          >
                            Add Image
                          </Button>
                        </Stack>
                      )}
                    </FieldArray>
                  </Box>
                )}

                {values.key === "videoGallery" && (
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Video Gallery
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        (Poster required only when video is provided)
                      </Typography>
                    </Typography>
                    <FieldArray name="content.videoGallery">
                      {({ push, remove }) => (
                        <Stack spacing={2}>
                          {values.content.videoGallery.map((item, index) => {
                            const fieldError = errors.content?.videoGallery?.[index] as any;
                            const fieldTouched = touched.content?.videoGallery?.[index];
                            const hasVideo = item.video && item.video.trim().length > 0;
                            const videoFieldName = `content.videoGallery.${index}.video`;
                            const posterFieldName = `content.videoGallery.${index}.poster`;

                            return (
                              <Stack spacing={2} key={index}>
                                <Stack direction="row" spacing={1} alignItems="flex-start">
                                  <FileUploadField
                                    key={`video-gallery-video-${formResetKey}-${index}`}
                                    label="Video URL"
                                    name={videoFieldName}
                                    value={item.video}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={Boolean(fieldTouched?.video && fieldError?.video)}
                                    helperText={fieldTouched?.video && fieldError?.video}
                                    disabled={loading}
                                    placeholder="https://example.com/video.mp4 or upload video"
                                    accept="video/*"
                                    type="video"
                                    onUpload={(url) => {
                                      setFieldValue(videoFieldName, url);
                                      setUploadingFields(prev => {
                                        const newSet = new Set(prev);
                                        newSet.delete(videoFieldName);
                                        return newSet;
                                      });
                                    }}
                                    uploading={uploadingFields.has(videoFieldName)}
                                    resetKey={`${formResetKey}-${index}`}
                                  />
                                  <FileUploadField
                                    key={`video-gallery-poster-${formResetKey}-${index}`}
                                    label="Poster URL"
                                    name={posterFieldName}
                                    value={item.poster}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={Boolean(hasVideo && fieldTouched?.poster && fieldError?.poster)}
                                    helperText={hasVideo ? (fieldTouched?.poster && fieldError?.poster) : "Optional (required if video is provided)"}
                                    disabled={loading}
                                    placeholder="https://example.com/poster.jpg or upload image"
                                    accept="image/*"
                                    type="image"
                                    onUpload={(url) => {
                                      setFieldValue(posterFieldName, url);
                                      setUploadingFields(prev => {
                                        const newSet = new Set(prev);
                                        newSet.delete(posterFieldName);
                                        return newSet;
                                      });
                                    }}
                                    uploading={uploadingFields.has(posterFieldName)}
                                    resetKey={`${formResetKey}-${index}-poster`}
                                  />
                                  <IconButton
                                    onClick={() => remove(index)}
                                    disabled={loading}
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
                            onClick={() => push({ video: "", poster: "" })}
                            disabled={loading}
                            variant="outlined"
                            sx={{ alignSelf: 'flex-start' }}
                          >
                            Add Video
                          </Button>
                        </Stack>
                      )}
                    </FieldArray>
                  </Box>
                )}

                {values.key === "imageVideoTabsGallery" && (
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Image & Video Tabs Gallery
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        (Alt/Poster required only when Image/Video is provided)
                      </Typography>
                    </Typography>

                    {/* Auto-scrollable Tabs */}
                    <Box sx={{
                      borderBottom: 1,
                      borderColor: 'divider',
                      mb: 3,
                      overflowX: 'auto',
                      '& .MuiTabs-scrollable': {
                        overflow: 'auto !important',
                      }
                    }}>
                      <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        allowScrollButtonsMobile
                        sx={{
                          minHeight: '48px',
                          '& .MuiTabs-scrollButtons': {
                            opacity: 1,
                            '&.Mui-disabled': {
                              opacity: 0.3,
                            },
                          },
                        }}
                      >
                        {values.content.imageVideoTabsGallery.map((tab, index) => (
                          <Tab
                            key={index}
                            label={tab.tabTitle || `Tab ${index + 1}`}
                            sx={{
                              minWidth: 120,
                              maxWidth: 200,
                              textTransform: 'none',
                              fontSize: '0.875rem',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          />
                        ))}
                      </Tabs>
                    </Box>

                    <FieldArray name="content.imageVideoTabsGallery">
                      {({ push, remove }) => (
                        <Stack spacing={3}>
                          {values.content.imageVideoTabsGallery.map((tab, tabIndex) => (
                            <Box
                              key={tabIndex}
                              sx={{
                                display: activeTab === tabIndex ? 'block' : 'none',
                                p: 3,
                                border: 1,
                                borderColor: 'divider',
                                borderRadius: 2,
                                bgcolor: 'background.paper',
                              }}
                            >
                              <Stack spacing={3}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                  <TextField
                                    fullWidth
                                    label="Tab Title *"
                                    name={`content.imageVideoTabsGallery.${tabIndex}.tabTitle`}
                                    value={tab.tabTitle || ''}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={Boolean(
                                      touched.content?.imageVideoTabsGallery?.[tabIndex]?.tabTitle &&
                                      (errors.content?.imageVideoTabsGallery?.[tabIndex] as any)?.tabTitle
                                    )}
                                    helperText={
                                      touched.content?.imageVideoTabsGallery?.[tabIndex]?.tabTitle &&
                                      (errors.content?.imageVideoTabsGallery?.[tabIndex] as any)?.tabTitle
                                    }
                                    disabled={loading}
                                    size="small"
                                    required
                                  />
                                  <FormControl sx={{ minWidth: 120 }} size="small">
                                    <InputLabel>Tab Type *</InputLabel>
                                    <Select
                                      name={`content.imageVideoTabsGallery.${tabIndex}.key`}
                                      value={tab.key || 'image'}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                      label="Tab Type *"
                                      disabled={loading}
                                      error={Boolean(
                                        touched.content?.imageVideoTabsGallery?.[tabIndex]?.key &&
                                        (errors.content?.imageVideoTabsGallery?.[tabIndex] as any)?.key
                                      )}
                                    >
                                      <MenuItem value="image">Image</MenuItem>
                                      <MenuItem value="video">Video</MenuItem>
                                    </Select>
                                  </FormControl>
                                </Stack>

                                {/* Items List */}
                                <Box>
                                  <Typography variant="subtitle2" gutterBottom>
                                    {tab.key === 'image' ? 'Images' : 'Videos'}
                                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                      ({tab.list.length} items)
                                    </Typography>
                                  </Typography>

                                  <FieldArray name={`content.imageVideoTabsGallery.${tabIndex}.list`}>
                                    {({ push: pushItem, remove: removeItem }) => (
                                      <Stack spacing={2}>
                                        {tab.list.map((item, itemIndex) => {
                                          const isImageTab = tab.key === 'image';
                                          const itemData = item as any;
                                          const hasMedia = isImageTab ?
                                            (itemData.image && itemData.image.trim().length > 0) :
                                            (itemData.video && itemData.video.trim().length > 0);

                                          const tabErrors = errors.content?.imageVideoTabsGallery?.[tabIndex] as any;
                                          const fieldError = tabErrors?.list?.[itemIndex];
                                          const tabTouched = touched.content?.imageVideoTabsGallery?.[tabIndex] as any;
                                          const fieldTouched = tabTouched?.list?.[itemIndex];

                                          const imageFieldName = `content.imageVideoTabsGallery.${tabIndex}.list.${itemIndex}.image`;
                                          const videoFieldName = `content.imageVideoTabsGallery.${tabIndex}.list.${itemIndex}.video`;
                                          const posterFieldName = `content.imageVideoTabsGallery.${tabIndex}.list.${itemIndex}.poster`;

                                          return (
                                            <Stack
                                              key={itemIndex}
                                              spacing={1.5}
                                              sx={{
                                                p: 2,
                                                border: 1,
                                                borderColor: 'divider',
                                                borderRadius: 1,
                                                bgcolor: 'grey.50'
                                              }}
                                            >
                                              <Stack direction="row" spacing={1} alignItems="flex-start">
                                                {isImageTab ? (
                                                  <>
                                                    <FileUploadField
                                                      key={`tab-${tabIndex}-image-${formResetKey}-${itemIndex}`}
                                                      label="Image URL"
                                                      name={imageFieldName}
                                                      value={itemData.image || ''}
                                                      onChange={handleChange}
                                                      onBlur={handleBlur}
                                                      error={Boolean(fieldTouched?.image && fieldError?.image)}
                                                      helperText={fieldTouched?.image && fieldError?.image}
                                                      disabled={loading}
                                                      placeholder="https://example.com/image.jpg or upload image"
                                                      accept="image/*"
                                                      type="image"
                                                      onUpload={(url) => {
                                                        setFieldValue(imageFieldName, url);
                                                        setUploadingFields(prev => {
                                                          const newSet = new Set(prev);
                                                          newSet.delete(imageFieldName);
                                                          return newSet;
                                                        });
                                                      }}
                                                      uploading={uploadingFields.has(imageFieldName)}
                                                      resetKey={`${formResetKey}-${tabIndex}-${itemIndex}`}
                                                    />
                                                    <TextField
                                                      fullWidth
                                                      label="Alt Text"
                                                      name={`content.imageVideoTabsGallery.${tabIndex}.list.${itemIndex}.alt`}
                                                      value={itemData.alt || ''}
                                                      onChange={handleChange}
                                                      onBlur={handleBlur}
                                                      error={Boolean(hasMedia && fieldTouched?.alt && fieldError?.alt)}
                                                      helperText={hasMedia ?
                                                        (fieldTouched?.alt && fieldError?.alt) :
                                                        "Optional (required if image is provided)"
                                                      }
                                                      disabled={loading}
                                                      placeholder="Description of the image"

                                                    />
                                                  </>
                                                ) : (
                                                  <>
                                                    <FileUploadField
                                                      key={`tab-${tabIndex}-video-${formResetKey}-${itemIndex}`}
                                                      label="Video URL"
                                                      name={videoFieldName}
                                                      value={itemData.video || ''}
                                                      onChange={handleChange}
                                                      onBlur={handleBlur}
                                                      error={Boolean(fieldTouched?.video && fieldError?.video)}
                                                      helperText={fieldTouched?.video && fieldError?.video}
                                                      disabled={loading}
                                                      placeholder="https://example.com/video.mp4 or upload video"
                                                      accept="video/*"
                                                      type="video"
                                                      onUpload={(url) => {
                                                        setFieldValue(videoFieldName, url);
                                                        setUploadingFields(prev => {
                                                          const newSet = new Set(prev);
                                                          newSet.delete(videoFieldName);
                                                          return newSet;
                                                        });
                                                      }}
                                                      uploading={uploadingFields.has(videoFieldName)}
                                                      resetKey={`${formResetKey}-${tabIndex}-${itemIndex}`}
                                                    />
                                                    <FileUploadField
                                                      key={`tab-${tabIndex}-poster-${formResetKey}-${itemIndex}`}
                                                      label="Poster URL"
                                                      name={posterFieldName}
                                                      value={itemData.poster || ''}
                                                      onChange={handleChange}
                                                      onBlur={handleBlur}
                                                      error={Boolean(hasMedia && fieldTouched?.poster && fieldError?.poster)}
                                                      helperText={hasMedia ?
                                                        (fieldTouched?.poster && fieldError?.poster) :
                                                        "Optional (required if video is provided)"
                                                      }
                                                      disabled={loading}
                                                      placeholder="https://example.com/poster.jpg or upload image"
                                                      accept="image/*"
                                                      type="image"
                                                      onUpload={(url) => {
                                                        setFieldValue(posterFieldName, url);
                                                        setUploadingFields(prev => {
                                                          const newSet = new Set(prev);
                                                          newSet.delete(posterFieldName);
                                                          return newSet;
                                                        });
                                                      }}
                                                      uploading={uploadingFields.has(posterFieldName)}
                                                      resetKey={`${formResetKey}-${tabIndex}-${itemIndex}-poster`}
                                                    />
                                                  </>
                                                )}
                                                <IconButton
                                                  onClick={() => removeItem(itemIndex)}
                                                  disabled={loading}
                                                  size="small"
                                                  sx={{ mt: 0.5 }}
                                                >
                                                  <DeleteIcon fontSize="small" />
                                                </IconButton>
                                              </Stack>
                                            </Stack>
                                          );
                                        })}

                                        <Button
                                          startIcon={<AddIcon />}
                                          onClick={() => pushItem(
                                            tab.key === 'image'
                                              ? { image: "", alt: "" }
                                              : { video: "", poster: "" }
                                          )}
                                          disabled={loading}
                                          variant="outlined"
                                          size="small"
                                          sx={{ alignSelf: 'flex-start', mt: 1 }}
                                        >
                                          Add {tab.key === 'image' ? 'Image' : 'Video'}
                                        </Button>
                                      </Stack>
                                    )}
                                  </FieldArray>
                                </Box>
                              </Stack>

                              <Stack direction="row" spacing={2} sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                                <Button
                                  startIcon={<AddIcon />}
                                  onClick={() => push({
                                    tabTitle: `Tab ${values.content.imageVideoTabsGallery.length + 1}`,
                                    key: "image",
                                    list: [{ image: "", alt: "" }],
                                  })}
                                  disabled={loading}
                                  variant="outlined"
                                  size="small"
                                >
                                  Add New Tab
                                </Button>
                                {values.content.imageVideoTabsGallery.length > 1 && (
                                  <Button
                                    startIcon={<DeleteIcon />}
                                    onClick={() => {
                                      remove(tabIndex);
                                      // Adjust active tab if needed
                                      if (activeTab >= values.content.imageVideoTabsGallery.length - 1) {
                                        setActiveTab(Math.max(0, values.content.imageVideoTabsGallery.length - 2));
                                      }
                                    }}
                                    disabled={loading}
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                  >
                                    Remove This Tab
                                  </Button>
                                )}
                              </Stack>
                            </Box>
                          ))}
                        </Stack>
                      )}
                    </FieldArray>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || success}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{ alignSelf: 'flex-start', px: 4 }}
            >
              {loading ? "Creating..." : "Create Portfolio"}
            </Button>
          </Stack>
          {/* Success Modal */}
          <SuccessModal
            open={successModalOpen}
            onClose={handleCloseSuccessModal}
            message="Portfolio created successfully!"
            buttonText="View All Portfolio"
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

export default CreatePortfolioForm;