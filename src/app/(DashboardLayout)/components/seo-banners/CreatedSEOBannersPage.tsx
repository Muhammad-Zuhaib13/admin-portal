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
  Grid,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  CalendarToday,
  Link as LinkIcon,
  Image as ImageIcon,
  VideoCameraBack as VideoIcon,
  Description as DescriptionIcon,
  CloudUpload as CloudUploadIcon,
} from "@mui/icons-material";
import { supabase } from "@/app/lib/supabase";
import { useRouter } from "next/navigation";
import { IconSearch } from "@tabler/icons-react";

interface SEOBanner {
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
    poster: string;
  };
  created_at: string;
  updated_at: string;
  status?: string;
}

const CreatedSEOBannersPage = () => {
  const [seoBanners, setSEOBanners] = useState<SEOBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    totalBanners: 0,
    totalImages: 0,
    totalVideos: 0,
  });
  const router = useRouter();

  // Fetch SEO Banners from Supabase
  const fetchSEOBanners = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from("seo_banners")
        .select("*")
        .order("created_at", { ascending: false });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      setSEOBanners(data || []);
      calculateStats(data || []);
    } catch (err: any) {
      console.error("Error fetching SEO Banners:", err);
      setError(err.message || "Failed to fetch SEO Banners");
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (bannersData: SEOBanner[]) => {
    let totalImages = 0;
    let totalVideos = 0;

    bannersData.forEach(banner => {
      if (banner.seo?.openGraph?.image) totalImages++;
      if (banner.banner?.videoUrl) totalVideos++;
      if (banner.banner?.poster) totalImages++;
    });

    setStats({
      totalBanners: bannersData.length,
      totalImages,
      totalVideos,
    });
  };

  useEffect(() => {
    fetchSEOBanners();
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
    setBannerToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!bannerToDelete) return;

    try {
      const { error: supabaseError } = await supabase
        .from("seo_banners")
        .delete()
        .eq("id", bannerToDelete);

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      // Refresh the list
      fetchSEOBanners();
      setDeleteDialogOpen(false);
      setBannerToDelete(null);
    } catch (err: any) {
      console.error("Error deleting SEO Banner:", err);
      setError(err.message || "Failed to delete SEO Banner");
    }
  };

  // Handle edit
  const handleEdit = (id: number) => {
    router.push(`/edit-seo-banners/${id}`);
  };

  // Handle view
  const handleView = (id: number) => {
    router.push(`/edit-seo-banners/${id}`);
  };

  // Handle create new SEO Banner
  const handleCreateNew = () => {
    router.push("/create-seo-banners");
  };

  // Filter SEO Banners based on search term
  const filteredBanners = seoBanners.filter((banner) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      banner.seo?.title?.toLowerCase().includes(searchLower) ||
      banner.banner?.title?.toLowerCase().includes(searchLower) ||
      banner.seo?.keywords?.toLowerCase().includes(searchLower) ||
      banner.id.toString().includes(searchLower) ||
      banner.seo?.description?.toLowerCase().includes(searchLower)
    );
  });

  // Calculate paginated data
  const paginatedBanners = filteredBanners.slice(
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
            Created SEO Banners
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateNew}
              startIcon={<CloudUploadIcon />}
            >
              Create New SEO Banner
            </Button>
            <Button
              variant="outlined"
              onClick={fetchSEOBanners}
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
            Showing {filteredBanners.length} of {seoBanners.length} SEO Banners
          </Typography>
          <TextField
            size="small"
            placeholder="Search SEO Banners..."
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
      {!loading && seoBanners.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <DescriptionIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{stats.totalBanners}</Typography>
                    <Typography variant="body2" color="text.secondary">Total SEO Banners</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <ImageIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{stats.totalImages}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Images</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <VideoIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{stats.totalVideos}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Videos</Typography>
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
            <Typography color="text.secondary">Loading SEO Banners...</Typography>
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
                  <TableCell><Typography fontWeight="bold">SEO Settings</Typography></TableCell>
                  <TableCell><Typography fontWeight="bold">Banner Details</Typography></TableCell>
                  <TableCell><Typography fontWeight="bold">Media Assets</Typography></TableCell>
                  <TableCell><Typography fontWeight="bold">Dates</Typography></TableCell>
                  <TableCell align="center"><Typography fontWeight="bold">Actions</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedBanners.length > 0 ? (
                  paginatedBanners.map((banner) => (
                    <TableRow
                      key={banner.id}
                      hover
                      sx={{
                        "&:last-child td, &:last-child th": { border: 0 },
                        "&:hover": { backgroundColor: 'action.hover' },
                      }}
                    >
                      {/* ID Column */}
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          #{banner.id}
                        </Typography>
                      </TableCell>

                      {/* SEO Settings Column */}
                      <TableCell>
                        <Stack spacing={1}>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {banner.seo?.title || "No SEO Title"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {truncateText(banner.seo?.description || "No description", 60)}
                          </Typography>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap">
                            {banner.seo?.keywords?.split(',').slice(0, 2).map((keyword, idx) => (
                              <Chip
                                key={idx}
                                label={keyword.trim()}
                                size="small"
                                variant="outlined"
                                sx={{ mt: 0.5 }}
                              />
                            ))}
                            {banner.seo?.keywords?.split(',').length > 2 && (
                              <Chip
                                label={`+${banner.seo.keywords.split(',').length - 2}`}
                                size="small"
                                sx={{ mt: 0.5 }}
                              />
                            )}
                          </Stack>
                          <Typography variant="caption">
                            URL: {truncateText(banner.seo?.canonicalURL || "No URL", 30)}
                          </Typography>
                        </Stack>
                      </TableCell>

                      {/* Banner Details Column */}
                      <TableCell>
                        <Stack spacing={1}>
                          <Typography variant="body2" fontWeight="medium">
                            {banner.banner?.title || "No Banner Title"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {truncateText(banner.banner?.description || "No description", 50)}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <VideoIcon fontSize="small" color="action" />
                            <Typography variant="caption">
                              {banner.banner?.videoUrl ? "Has video" : "No video"}
                            </Typography>
                          </Stack>
                        </Stack>
                      </TableCell>

                      {/* Media Assets Column */}
                      <TableCell>
                        <Stack spacing={1}>
                          {/* OG Image */}
                          <Box>
                            <Typography variant="caption" fontWeight="medium" display="block">
                              Open Graph Image
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                              <ImageIcon fontSize="small" color={banner.seo?.openGraph?.image ? "success" : "error"} />
                              <Typography variant="caption">
                                {banner.seo?.openGraph?.image ? "✓ Uploaded" : "✗ Missing"}
                              </Typography>
                            </Stack>
                          </Box>

                          {/* Banner Video */}
                          <Box>
                            <Typography variant="caption" fontWeight="medium" display="block">
                              Banner Video
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                              <VideoIcon fontSize="small" color={banner.banner?.videoUrl ? "success" : "error"} />
                              <Typography variant="caption">
                                {banner.banner?.videoUrl ? "✓ Uploaded" : "✗ Missing"}
                              </Typography>
                            </Stack>
                          </Box>

                          {/* Banner Poster */}
                          <Box>
                            <Typography variant="caption" fontWeight="medium" display="block">
                              Video Poster
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                              <ImageIcon fontSize="small" color={banner.banner?.poster ? "success" : "error"} />
                              <Typography variant="caption">
                                {banner.banner?.poster ? "✓ Uploaded" : "✗ Missing"}
                              </Typography>
                            </Stack>
                          </Box>
                        </Stack>
                      </TableCell>

                      {/* Dates Column */}
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography variant="caption" color="text.secondary">
                            Created: {formatDate(banner.created_at)}
                          </Typography>
                          {/* <Typography variant="caption" color="text.secondary">
                            Updated: {formatDate(banner.updated_at)}
                          </Typography> */}
                          {banner.status && (
                            <Chip
                              label={banner.status}
                              size="small"
                              color={getStatusColor(banner.status) as any}
                              sx={{ mt: 0.5 }}
                            />
                          )}
                        </Stack>
                      </TableCell>

                      {/* Actions Column */}
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="Preview">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleView(banner.id)}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEdit(banner.id)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteClick(banner.id)}
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
                            No SEO Banners found matching "{searchTerm}"
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
                            No SEO Banners created yet
                          </Typography>
                          <Button
                            variant="contained"
                            onClick={handleCreateNew}
                          >
                            Create Your First SEO Banner
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
          {filteredBanners.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredBanners.length}
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
            Are you sure you want to delete this SEO Banner? This action cannot be undone.
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This will delete all SEO data and banner media assets.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete SEO Banner
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CreatedSEOBannersPage;