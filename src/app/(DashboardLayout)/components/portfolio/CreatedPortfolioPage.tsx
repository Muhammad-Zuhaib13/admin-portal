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
  LinearProgress,
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
  Videocam as VideoIcon,
  Title as TitleIcon,
} from "@mui/icons-material";
import { supabase } from "@/app/lib/supabase";
import { useRouter } from "next/navigation";
import { IconSearch } from "@tabler/icons-react";

interface Portfolio {
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
  key: string;
  content: {
    card: {
      ctaText: string;
      pageUrl: string;
      cardBackgroundImage: string;
    };
    imageGallery?: Array<{
      image: string;
      alt: string;
    }>;
    videoGallery?: Array<{
      video: string;
      poster: string;
    }>;
    imageVideoTabsGallery?: Array<{
      tabTitle: string;
      key: string;
      list: Array<{
        image?: string;
        alt?: string;
        video?: string;
        poster?: string;
      }>;
    }>;
  };
  created_at: string;
  updated_at: string;
  status?: string;
}

const CreatedPortfolioPage = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [portfolioToDelete, setPortfolioToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    totalPortfolios: 0,
    totalImages: 0,
    totalVideos: 0,
    totalTabs: 0,
  });
  const router = useRouter();

  // Fetch portfolios from Supabase
  const fetchPortfolios = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from("portfolio")
        .select("*")
        .order("created_at", { ascending: false });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      setPortfolios(data || []);
      calculateStats(data || []);
    } catch (err: any) {
      console.error("Error fetching portfolios:", err);
      setError(err.message || "Failed to fetch portfolios");
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (portfoliosData: Portfolio[]) => {
    let totalImages = 0;
    let totalVideos = 0;
    let totalTabs = 0;

    portfoliosData.forEach(portfolio => {
      if (portfolio.key === "imageGallery") {
        totalImages += portfolio.content?.imageGallery?.length || 0;
      } else if (portfolio.key === "videoGallery") {
        totalVideos += portfolio.content?.videoGallery?.length || 0;
      } else if (portfolio.key === "imageVideoTabsGallery") {
        totalTabs += portfolio.content?.imageVideoTabsGallery?.length || 0;
        portfolio.content?.imageVideoTabsGallery?.forEach(tab => {
          totalImages += tab.key === "image" ? (tab.list?.length || 0) : 0;
          totalVideos += tab.key === "video" ? (tab.list?.length || 0) : 0;
        });
      }
    });

    setStats({
      totalPortfolios: portfoliosData.length,
      totalImages,
      totalVideos,
      totalTabs,
    });
  };

  useEffect(() => {
    fetchPortfolios();
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
    setPortfolioToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!portfolioToDelete) return;

    try {
      const { error: supabaseError } = await supabase
        .from("portfolio")
        .delete()
        .eq("id", portfolioToDelete);

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      // Refresh the list
      fetchPortfolios();
      setDeleteDialogOpen(false);
      setPortfolioToDelete(null);
    } catch (err: any) {
      console.error("Error deleting portfolio:", err);
      setError(err.message || "Failed to delete portfolio");
    }
  };

  // Handle edit
  const handleEdit = (id: number) => {
    router.push(`/edit-portfolio/${id}`);
  };

  // Handle view
  const handleView = (id: number) => {
    router.push(`/edit-portfolio/${id}`);
  };

  // Handle create new portfolio
  const handleCreateNew = () => {
    router.push("/create-portfolio");
  };

  // Filter portfolios based on search term
  const filteredPortfolios = portfolios.filter((portfolio) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      portfolio.seo?.title?.toLowerCase().includes(searchLower) ||
      portfolio.banner?.title?.toLowerCase().includes(searchLower) ||
      portfolio.seo?.keywords?.toLowerCase().includes(searchLower) ||
      portfolio.id.toString().includes(searchLower) ||
      portfolio.content?.card?.ctaText?.toLowerCase().includes(searchLower) ||
      portfolio.seo?.description?.toLowerCase().includes(searchLower) ||
      portfolio.key?.toLowerCase().includes(searchLower)
    );
  });

  // Calculate paginated data
  const paginatedPortfolios = filteredPortfolios.slice(
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

  // Get gallery type label and color
  const getGalleryTypeInfo = (type: string) => {
    switch (type) {
      case "imageGallery":
        return { label: "Image Gallery", color: "primary" as const };
      case "videoGallery":
        return { label: "Video Gallery", color: "secondary" as const };
      case "imageVideoTabsGallery":
        return { label: "Mixed Tabs", color: "success" as const };
      default:
        return { label: "Unknown", color: "default" as const };
    }
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

  // Get media count
  const getMediaCount = (portfolio: Portfolio) => {
    if (portfolio.key === "imageGallery") {
      return `${portfolio.content?.imageGallery?.length || 0} images`;
    } else if (portfolio.key === "videoGallery") {
      return `${portfolio.content?.videoGallery?.length || 0} videos`;
    } else if (portfolio.key === "imageVideoTabsGallery") {
      const tabs = portfolio.content?.imageVideoTabsGallery || [];
      const totalItems = tabs.reduce((acc, tab) => acc + (tab.list?.length || 0), 0);
      return `${tabs.length} tabs, ${totalItems} items`;
    }
    return "No media";
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Created Portfolios
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateNew}
              startIcon={<EditIcon />}
            >
              Create New Portfolio
            </Button>
            <Button
              variant="outlined"
              onClick={fetchPortfolios}
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
            Showing {filteredPortfolios.length} of {portfolios.length} portfolios
          </Typography>
          <TextField
            size="small"
            placeholder="Search portfolios..."
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
      {!loading && portfolios.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ md: 3, sm: 6, xs: 12 }}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <DescriptionIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{stats.totalPortfolios}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Portfolios</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ md: 3, sm: 6, xs: 12 }}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: 'secondary.main' }}>
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
          <Grid size={{ md: 3, sm: 6, xs: 12 }}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
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
          <Grid size={{ md: 3, sm: 6, xs: 12 }}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <TagIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{stats.totalTabs}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Tabs</Typography>
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
            <Typography color="text.secondary">Loading portfolios...</Typography>
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
                  <TableCell><Typography fontWeight="bold">Banner</Typography></TableCell>
                  <TableCell><Typography fontWeight="bold">SEO & Card</Typography></TableCell>
                  <TableCell><Typography fontWeight="bold">Gallery Type & Media</Typography></TableCell>
                  <TableCell><Typography fontWeight="bold">Dates</Typography></TableCell>
                  <TableCell align="center"><Typography fontWeight="bold">Actions</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedPortfolios.length > 0 ? (
                  paginatedPortfolios.map((portfolio) => {
                    const galleryInfo = getGalleryTypeInfo(portfolio.key);
                    return (
                    <TableRow
                      key={portfolio.id}
                      hover
                      sx={{
                        "&:last-child td, &:last-child th": { border: 0 },
                        "&:hover": { backgroundColor: 'action.hover' },
                      }}
                    >
                      {/* ID Column */}
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          #{portfolio.id}
                        </Typography>
                      </TableCell>

                      {/* Banner Column */}
                      <TableCell>
                        <Stack spacing={1}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <TitleIcon fontSize="small" color="action" />
                            <Typography variant="subtitle1" fontWeight="medium">
                              {truncateText(portfolio.banner?.title || "No Banner Title", 30)}
                            </Typography>
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            {truncateText(portfolio.banner?.description || "No description", 50)}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <VideoIcon fontSize="small" color="action" />
                            <Typography variant="caption">
                              {portfolio.banner?.videoUrl ? "Has video" : "No video"}
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <ImageIcon fontSize="small" color="action" />
                            <Typography variant="caption">
                              {portfolio.banner?.poster ? "Has poster" : "No poster"}
                            </Typography>
                          </Stack>
                        </Stack>
                      </TableCell>

                      {/* SEO & Card Column */}
                      <TableCell>
                        <Stack spacing={1}>
                          <Typography variant="body2" fontWeight="medium">
                            {truncateText(portfolio.seo?.title || "No SEO Title", 40)}
                          </Typography>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap">
                            {portfolio.seo?.keywords?.split(',').slice(0, 2).map((keyword, idx) => (
                              <Chip
                                key={idx}
                                label={keyword.trim()}
                                size="small"
                                variant="outlined"
                                sx={{ mt: 0.5 }}
                              />
                            ))}
                            {portfolio.seo?.keywords?.split(',').length > 2 && (
                              <Chip
                                label={`+${portfolio.seo.keywords.split(',').length - 2}`}
                                size="small"
                                sx={{ mt: 0.5 }}
                              />
                            )}
                          </Stack>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <LinkIcon fontSize="small" color="action" />
                            <Typography variant="caption">
                              CTA: {portfolio.content?.card?.ctaText || "No CTA"}
                            </Typography>
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            {portfolio.content?.card?.cardBackgroundImage ? "Has background" : "No background"}
                          </Typography>
                        </Stack>
                      </TableCell>

                      {/* Gallery Type & Media Column */}
                      <TableCell>
                        <Stack spacing={1}>
                          <Chip
                            label={galleryInfo.label}
                            size="small"
                            color={galleryInfo.color}
                            variant="outlined"
                          />
                          <Typography variant="caption" fontWeight="medium">
                            {getMediaCount(portfolio)}
                          </Typography>
                          
                          {/* Show sample items based on type */}
                          {portfolio.key === "imageGallery" && portfolio.content?.imageGallery && (
                            <Stack direction="row" spacing={0.5} flexWrap="wrap">
                              {portfolio.content.imageGallery.slice(0, 2).map((item, idx) => (
                                <Chip
                                  key={idx}
                                  icon={<ImageIcon fontSize="small" />}
                                  label={truncateText(item.alt || "Image", 15)}
                                  size="small"
                                  variant="outlined"
                                  sx={{ mt: 0.5 }}
                                />
                              ))}
                              {portfolio.content.imageGallery.length > 2 && (
                                <Chip
                                  label={`+${portfolio.content.imageGallery.length - 2}`}
                                  size="small"
                                  sx={{ mt: 0.5 }}
                                />
                              )}
                            </Stack>
                          )}

                          {portfolio.key === "videoGallery" && portfolio.content?.videoGallery && (
                            <Stack direction="row" spacing={0.5} flexWrap="wrap">
                              {portfolio.content.videoGallery.slice(0, 2).map((item, idx) => (
                                <Chip
                                  key={idx}
                                  icon={<VideoIcon fontSize="small" />}
                                  label="Video"
                                  size="small"
                                  variant="outlined"
                                  sx={{ mt: 0.5 }}
                                />
                              ))}
                              {portfolio.content.videoGallery.length > 2 && (
                                <Chip
                                  label={`+${portfolio.content.videoGallery.length - 2}`}
                                  size="small"
                                  sx={{ mt: 0.5 }}
                                />
                              )}
                            </Stack>
                          )}

                          {portfolio.key === "imageVideoTabsGallery" && portfolio.content?.imageVideoTabsGallery && (
                            <Stack direction="row" spacing={0.5} flexWrap="wrap">
                              {portfolio.content.imageVideoTabsGallery.slice(0, 2).map((tab, idx) => (
                                <Chip
                                  key={idx}
                                  label={truncateText(tab.tabTitle || `Tab ${idx + 1}`, 15)}
                                  size="small"
                                  variant="outlined"
                                  sx={{ mt: 0.5 }}
                                />
                              ))}
                              {portfolio.content.imageVideoTabsGallery.length > 2 && (
                                <Chip
                                  label={`+${portfolio.content.imageVideoTabsGallery.length - 2}`}
                                  size="small"
                                  sx={{ mt: 0.5 }}
                                />
                              )}
                            </Stack>
                          )}
                        </Stack>
                      </TableCell>

                      {/* Dates Column */}
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <CalendarToday fontSize="small" color="action" />
                            <Typography variant="caption">
                              Created: {formatDate(portfolio.created_at)}
                            </Typography>
                          </Stack>
                          {/* <Typography variant="caption" color="text.secondary">
                            Updated: {formatDate(portfolio.updated_at)}
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
                              onClick={() => handleView(portfolio.id)}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEdit(portfolio.id)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteClick(portfolio.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  )})
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      {searchTerm ? (
                        <Stack spacing={2} alignItems="center">
                          <Typography variant="h6" color="text.secondary">
                            No portfolios found matching "{searchTerm}"
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
                            No portfolios created yet
                          </Typography>
                          <Button
                            variant="contained"
                            onClick={handleCreateNew}
                          >
                            Create Your First Portfolio
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
          {filteredPortfolios.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredPortfolios.length}
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
            Are you sure you want to delete this portfolio? This action cannot be undone.
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This will delete all SEO data, banner content, gallery items, and associated media.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete Portfolio
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CreatedPortfolioPage;