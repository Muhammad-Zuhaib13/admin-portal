"use client";

import React from "react";
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
import { supabase } from "@/app/lib/supabase";

// Update validation schema to include tags and urls
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
            text: Yup.string().required("Link text is required"),
            href: Yup.string().url("Must be a valid URL").required("URL is required"),
          })
        )
        .min(1, "At least one URL is required"),
      text: Yup.string().default("Urls"),
    }),
    thumbImage: Yup.string().url("Must be a valid URL").optional(),
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

const CreateBlogForm = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (values: typeof initialValues) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Prepare data for Supabase
      const blogData = {
        seo: values.seo,
        banner: values.banner,
        content: values.content,
      };

      console.log("Submitting to Supabase:", blogData);

      // Insert into Supabase
      const { data, error: supabaseError } = await supabase
        .from("blogs")
        .insert([blogData])
        .select();

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      console.log("Blog created successfully:", data);
      setSuccess(true);
      
    } catch (err: any) {
      console.error("Error creating blog:", err);
      setError(err.message || "Failed to create blog");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      validateOnChange={false}
      validateOnBlur={true}
      onSubmit={handleSubmit}
    >
      {({ values, handleChange, handleBlur, touched, errors, resetForm }) => (
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
                Blog created successfully!
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

                  <TextField
                    label="OG Image"
                    name="seo.openGraph.image"
                    value={values.seo.openGraph.image}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(
                      touched.seo?.openGraph?.image &&
                      errors.seo?.openGraph?.image
                    )}
                    helperText={
                      touched.seo?.openGraph?.image &&
                      errors.seo?.openGraph?.image
                    }
                    fullWidth
                    disabled={loading}
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
                  
                  <TextField
                    label="Video URL"
                    name="banner.videoUrl"
                    value={values.banner.videoUrl}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(
                      touched.banner?.videoUrl &&
                      errors.banner?.videoUrl
                    )}
                    helperText={
                      touched.banner?.videoUrl &&
                      errors.banner?.videoUrl
                    }
                    fullWidth
                    disabled={loading}
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Content Section */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Content</Typography>
                <Stack spacing={3}>
                  <TextField
                    label="Content Title"
                    name="content.title"
                    value={values.content.title}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.content?.title && errors.content?.title)}
                    helperText={touched.content?.title && errors.content?.title}
                    fullWidth
                    disabled={loading}
                  />
                  
                  <TextField
                    label="Thumbnail Image URL"
                    name="content.thumbImage"
                    value={values.content.thumbImage}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.content?.thumbImage && errors.content?.thumbImage)}
                    helperText={touched.content?.thumbImage && errors.content?.thumbImage}
                    fullWidth
                    disabled={loading}
                    placeholder="https://example.com/image.jpg"
                  />
                  
                  <TextField
                    label="Created Date"
                    name="content.createdDate"
                    type="date"
                    value={values.content.createdDate}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={Boolean(touched.content?.createdDate && errors.content?.createdDate)}
                    helperText={touched.content?.createdDate && errors.content?.createdDate}
                    fullWidth
                    disabled={loading}
                    InputLabelProps={{ shrink: true }}
                  />
                  
                  {/* CTA */}
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>Call to Action (CTA)</Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <TextField
                        label="CTA Slug"
                        name="content.cta.slug"
                        value={values.content.cta.slug}
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
                        value={values.content.cta.text}
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
                                  value={item.text}
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
                                  value={item.text}
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
                                    value={item.text}
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
                                    value={item.href}
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

            {/* Submit Button */}
            <Button 
              type="submit" 
              variant="contained" 
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{ alignSelf: 'flex-start', px: 4 }}
            >
              {loading ? "Creating..." : "Create Blog"}
            </Button>
          </Stack>
        </Form>
      )}
    </Formik>
  );
};

export default CreateBlogForm;