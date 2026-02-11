"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Button,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent,
  Avatar,
  LinearProgress,
  Grid,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  CalendarToday,
  Link as LinkIcon,
  Tag as TagIcon,
  Image as ImageIcon,
  Description as DescriptionIcon,
} from "@mui/icons-material";
import { supabase } from "@/app/lib/supabase";
import { useRouter } from "next/navigation";
import { IconSearch } from "@tabler/icons-react";

interface Blog {
  id: number;
  seo: {
    title: string;
    description: string;
    keywords: string;
    canonicalURL: string;
    openGraph: {
      title: string;
      description: string;
      url: string;
      image: string;
    };
  };
  banner: {
    title: string;
    description: string;
    videoUrl: string;
  };
  content: {
    title: string;
    thumbImage: string;
    createdDate: string;
    cta: {
      slug: string;
      text: string;
    };
    description: Array<{
      text: string;
    }>;
    tags: {
      list: Array<{
        text: string;
      }>;
      text: string;
    };
    urls: {
      list: Array<{
        text: string;
        href: string;
      }>;
      text: string;
    };
  };
  created_at: string;
  updated_at: string;
  status?: string;
}

const CreatedBlogsPage = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    totalBlogs: 0,
    totalTags: 0,
    totalUrls: 0,
    totalParagraphs: 0,
  });
  const router = useRouter();

  // Fetch blogs from Supabase
  const fetchBlogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from("blogs")
        .select("*")
        .order("created_at", { ascending: false });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      setBlogs(data || []);
      calculateStats(data || []);
    } catch (err: any) {
      console.error("Error fetching blogs:", err);
      setError(err.message || "Failed to fetch blogs");
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (blogsData: Blog[]) => {
    let totalTags = 0;
    let totalUrls = 0;
    let totalParagraphs = 0;

    blogsData.forEach(blog => {
      totalTags += blog.content?.tags?.list?.length || 0;
      totalUrls += blog.content?.urls?.list?.length || 0;
      totalParagraphs += blog.content?.description?.length || 0;
    });

    setStats({
      totalBlogs: blogsData.length,
      totalTags,
      totalUrls,
      totalParagraphs,
    });
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle delete confirmation
  const handleDeleteClick = (id: number) => {
    setBlogToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!blogToDelete) return;

    try {
      const { error: supabaseError } = await supabase
        .from("blogs")
        .delete()
        .eq("id", blogToDelete);

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      // Refresh the list
      fetchBlogs();
      setDeleteDialogOpen(false);
      setBlogToDelete(null);
    } catch (err: any) {
      console.error("Error deleting blog:", err);
      setError(err.message || "Failed to delete blog");
    }
  };

  // Handle edit
  const handleEdit = (id: number) => {
    router.push(`/edit-blog/${id}`);
  };

  // Handle view
  const handleView = (id: number) => {
    router.push(`/edit-blog/${id}`);
  };

  // Handle create new blog
  const handleCreateNew = () => {
    router.push("/create-blog");
  };

  // Filter blogs based on search term
  const filteredBlogs = blogs.filter((blog) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      blog.seo?.title?.toLowerCase().includes(searchLower) ||
      blog.content?.title?.toLowerCase().includes(searchLower) ||
      blog.banner?.title?.toLowerCase().includes(searchLower) ||
      blog.seo?.keywords?.toLowerCase().includes(searchLower) ||
      blog.id.toString().includes(searchLower) ||
      blog.content?.tags?.list?.some(tag =>
        tag.text.toLowerCase().includes(searchLower)
      ) ||
      blog.seo?.description?.toLowerCase().includes(searchLower)
    );
  });

  // Calculate paginated data
  const paginatedBlogs = filteredBlogs.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status color
  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "published":
        return "success";
      case "draft":
        return "warning";
      case "archived":
        return "error";
      default:
        return "default";
    }
  };

  // Truncate text
  const truncateText = (text: string, length: number) => {
    if (!text) return "";
    return text.length > length ? text.substring(0, length) + "..." : text;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Created Blogs
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateNew}
              startIcon={<EditIcon />}
            >
              Create New Blog
            </Button>
            <Button
              variant="outlined"
              onClick={fetchBlogs}
              startIcon={<RefreshIcon />}
              disabled={loading}
            >
              Refresh
            </Button>
          </Stack>
        </Stack>

        {/* Search and Stats */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="body1" color="text.secondary">
              Showing {filteredBlogs.length} of {blogs.length} blogs
          </Typography>
          <TextField
            size="small"
            placeholder="Search blogs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: 400 }}
            InputProps={{
              startAdornment: (
                <IconSearch />
              ),
            }}
          />
        </Stack>
      </Box>

      {/* Stats Cards */}
      {!loading && blogs.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ md: 3, sm: 6, xs: 12 }}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <DescriptionIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{stats.totalBlogs}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Blogs</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <Stack spacing={2} alignItems="center">
            <CircularProgress />
            <Typography color="text.secondary">Loading blogs...</Typography>
          </Stack>
        </Box>
      ) : (
        <>
          {/* Table */}
          <TableContainer component={Paper} elevation={2}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ backgroundColor: 'primary.light' }}>
                <TableRow>
                  <TableCell><Typography fontWeight="bold">ID</Typography></TableCell>
                  <TableCell><Typography fontWeight="bold">Content</Typography></TableCell>
                  <TableCell><Typography fontWeight="bold">SEO & Banner</Typography></TableCell>
                  <TableCell><Typography fontWeight="bold">Tags & URLs</Typography></TableCell>
                  <TableCell><Typography fontWeight="bold">Dates</Typography></TableCell>
                  <TableCell align="center"><Typography fontWeight="bold">Actions</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedBlogs.length > 0 ? (
                  paginatedBlogs.map((blog) => (
                    <TableRow
                      key={blog.id}
                      hover
                      sx={{
                        "&:last-child td, &:last-child th": { border: 0 },
                        "&:hover": { backgroundColor: 'action.hover' },
                      }}
                    >
                      {/* ID Column */}
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          #{blog.id}
                        </Typography>
                      </TableCell>

                      {/* Content Column */}
                      <TableCell>
                        <Stack spacing={1}>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {blog.content?.title || "No Title"}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <ImageIcon fontSize="small" color="action" />
                            <Typography variant="caption" color="text.secondary">
                              {blog.content?.thumbImage ? "Has thumbnail" : "No thumbnail"}
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <TagIcon fontSize="small" color="action" />
                            <Typography variant="caption">
                              CTA: {blog.content?.cta?.text || "No CTA"}
                            </Typography>
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            {blog.content?.description?.length || 0} paragraph(s)
                          </Typography>
                        </Stack>
                      </TableCell>

                      {/* SEO & Banner Column */}
                      <TableCell>
                        <Stack spacing={1}>
                          <Typography variant="body2" fontWeight="medium">
                            {truncateText(blog.seo?.title || "No SEO Title", 40)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {truncateText(blog.banner?.title || "No Banner Title", 30)}
                          </Typography>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap">
                            {blog.seo?.keywords?.split(',').slice(0, 2).map((keyword, idx) => (
                              <Chip
                                key={idx}
                                label={keyword.trim()}
                                size="small"
                                variant="outlined"
                                sx={{ mt: 0.5 }}
                              />
                            ))}
                            {blog.seo?.keywords?.split(',').length > 2 && (
                              <Chip
                                label={`+${blog.seo.keywords.split(',').length - 2}`}
                                size="small"
                                sx={{ mt: 0.5 }}
                              />
                            )}
                          </Stack>
                        </Stack>
                      </TableCell>

                      {/* Tags & URLs Column */}
                      <TableCell>
                        <Stack spacing={1}>
                          {/* Tags */}
                          <Box>
                            <Typography variant="caption" fontWeight="medium" display="block">
                              Tags ({blog.content?.tags?.list?.length || 0})
                            </Typography>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                              {blog.content?.tags?.list?.slice(0, 2).map((tag, idx) => (
                                <Chip
                                  key={idx}
                                  label={tag.text}
                                  size="small"
                                  sx={{ mt: 0.5 }}
                                />
                              ))}
                              {blog.content?.tags?.list?.length > 2 && (
                                <Chip
                                  label={`+${blog.content.tags.list.length - 2}`}
                                  size="small"
                                  sx={{ mt: 0.5 }}
                                />
                              )}
                            </Stack>
                          </Box>

                          {/* URLs */}
                          <Box>
                            <Typography variant="caption" fontWeight="medium" display="block">
                              URLs ({blog.content?.urls?.list?.length || 0})
                            </Typography>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                              {blog.content?.urls?.list?.slice(0, 2).map((url, idx) => (
                                <Chip
                                  key={idx}
                                  icon={<LinkIcon fontSize="small" />}
                                  label={truncateText(url.text, 15)}
                                  size="small"
                                  variant="outlined"
                                  sx={{ mt: 0.5 }}
                                />
                              ))}
                              {blog.content?.urls?.list?.length > 2 && (
                                <Chip
                                  label={`+${blog.content.urls.list.length - 2}`}
                                  size="small"
                                  sx={{ mt: 0.5 }}
                                />
                              )}
                            </Stack>
                          </Box>
                        </Stack>
                      </TableCell>

                      {/* Dates Column */}
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <CalendarToday fontSize="small" color="action" />
                            <Typography variant="caption">
                              {formatDate(blog.content?.createdDate || blog.created_at)}
                            </Typography>
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            Created: {formatDate(blog.created_at)}
                          </Typography>
                          {/* <Typography variant="caption" color="text.secondary">
                            Updated: {formatDate(blog.updated_at)}
                          </Typography> */}
                        </Stack>
                      </TableCell>

                      {/* Actions Column */}
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="Preview">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleView(blog.id)}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEdit(blog.id)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteClick(blog.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      {searchTerm ? (
                        <Stack spacing={2} alignItems="center">
                          <Typography variant="h6" color="text.secondary">
                            No blogs found matching "{searchTerm}"
                          </Typography>
                          <Button
                            variant="outlined"
                            onClick={() => setSearchTerm("")}
                          >
                            Clear Search
                          </Button>
                        </Stack>
                      ) : (
                        <Stack spacing={2} alignItems="center">
                          <Typography variant="h6" color="text.secondary">
                            No blogs created yet
                          </Typography>
                          <Button
                            variant="contained"
                            onClick={handleCreateNew}
                          >
                            Create Your First Blog
                          </Button>
                        </Stack>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {filteredBlogs.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredBlogs.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{ mt: 2 }}
            />
          )}
        </>
      )}



      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this blog? This action cannot be undone.
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This will delete all SEO data, banner content, and associated tags/URLs.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete Blog
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CreatedBlogsPage;