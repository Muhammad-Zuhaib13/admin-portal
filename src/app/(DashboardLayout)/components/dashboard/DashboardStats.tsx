// app/(DashboardLayout)/components/dashboard/DashboardStatsCards.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  CircularProgress,
  Alert,
  Avatar,
} from "@mui/material";
import {
  Article as ArticleIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  Collections as CollectionsIcon,
  Campaign as CampaignIcon,
} from "@mui/icons-material";
import { supabase } from "@/app/lib/supabase";

interface BlogStats {
  totalBlogs: number;
  totalTags: number;
  totalUrls: number;
  totalParagraphs: number;
  recentBlogs: number;
}

interface SEOBannerStats {
  totalBanners: number;
  totalOGImages: number;
  totalVideos: number;
  totalPosters: number;
  recentBanners: number;
}

interface PortfolioStats {
  totalPortfolios: number;
  totalImages: number;
  totalVideos: number;
  totalTabs: number;
  totalCards: number;
  recentPortfolios: number;
}

interface MediaStats {
  totalImages: number;
  totalVideos: number;
  totalMedia: number;
}

const DashboardStatsCards = () => {
  const [blogStats, setBlogStats] = useState<BlogStats>({
    totalBlogs: 0,
    totalTags: 0,
    totalUrls: 0,
    totalParagraphs: 0,
    recentBlogs: 0,
  });
  const [bannerStats, setBannerStats] = useState<SEOBannerStats>({
    totalBanners: 0,
    totalOGImages: 0,
    totalVideos: 0,
    totalPosters: 0,
    recentBanners: 0,
  });
  const [portfolioStats, setPortfolioStats] = useState<PortfolioStats>({
    totalPortfolios: 0,
    totalImages: 0,
    totalVideos: 0,
    totalTabs: 0,
    totalCards: 0,
    recentPortfolios: 0,
  });
  const [mediaStats, setMediaStats] = useState<MediaStats>({
    totalImages: 0,
    totalVideos: 0,
    totalMedia: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all statistics from Supabase
  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch blogs data
      const { data: blogsData, error: blogsError } = await supabase
        .from("blogs")
        .select("*")
        .order("created_at", { ascending: false });

      if (blogsError) throw blogsError;

      // Fetch SEO banners data
      const { data: bannersData, error: bannersError } = await supabase
        .from("seo_banners")
        .select("*")
        .order("created_at", { ascending: false });

      if (bannersError) throw bannersError;

      // Fetch portfolios data
      const { data: portfoliosData, error: portfoliosError } = await supabase
        .from("portfolio")
        .select("*")
        .order("created_at", { ascending: false });

      if (portfoliosError) throw portfoliosError;

      // Calculate blog stats
      let totalTags = 0;
      let totalUrls = 0;
      let totalParagraphs = 0;
      let recentBlogs = 0;

      blogsData?.forEach(blog => {
        totalTags += blog.content?.tags?.list?.length || 0;
        totalUrls += blog.content?.urls?.list?.length || 0;
        totalParagraphs += blog.content?.description?.length || 0;
      });

      // Calculate recent blogs (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      recentBlogs = blogsData?.filter(blog =>
        new Date(blog.created_at) > weekAgo
      ).length || 0;

      setBlogStats({
        totalBlogs: blogsData?.length || 0,
        totalTags,
        totalUrls,
        totalParagraphs,
        recentBlogs,
      });

      // Calculate SEO banner stats
      let totalOGImages = 0;
      let totalVideos = 0;
      let totalPosters = 0;
      let recentBanners = 0;

      bannersData?.forEach(banner => {
        if (banner.seo?.openGraph?.image) totalOGImages++;
        if (banner.banner?.videoUrl) totalVideos++;
        if (banner.banner?.poster) totalPosters++;
      });

      recentBanners = bannersData?.filter(banner =>
        new Date(banner.created_at) > weekAgo
      ).length || 0;

      setBannerStats({
        totalBanners: bannersData?.length || 0,
        totalOGImages,
        totalVideos,
        totalPosters,
        recentBanners,
      });

      // Calculate portfolio stats
      let totalImages = 0;
      let portfolioVideos = 0;
      let totalTabs = 0;
      let totalCards = 0;
      let recentPortfolios = 0;

      portfoliosData?.forEach(portfolio => {
        if (portfolio.content?.card?.cardBackgroundImage) totalCards++;

        if (portfolio.key === "imageGallery") {
          totalImages += portfolio.content?.imageGallery?.length || 0;
        } else if (portfolio.key === "videoGallery") {
          portfolioVideos += portfolio.content?.videoGallery?.length || 0;
        } else if (portfolio.key === "imageVideoTabsGallery") {
          totalTabs += portfolio.content?.imageVideoTabsGallery?.length || 0;
          portfolio.content?.imageVideoTabsGallery?.forEach((tab:any) => {
            totalImages += tab.key === "image" ? (tab.list?.length || 0) : 0;
            portfolioVideos += tab.key === "video" ? (tab.list?.length || 0) : 0;
          });
        }
      });

      recentPortfolios = portfoliosData?.filter(portfolio =>
        new Date(portfolio.created_at) > weekAgo
      ).length || 0;

      setPortfolioStats({
        totalPortfolios: portfoliosData?.length || 0,
        totalImages,
        totalVideos: portfolioVideos,
        totalTabs,
        totalCards,
        recentPortfolios,
      });

      // Calculate total media stats
      const totalAllImages = totalOGImages + totalPosters + totalImages;
      const totalAllVideos = totalVideos + portfolioVideos;

      setMediaStats({
        totalImages: totalAllImages,
        totalVideos: totalAllVideos,
        totalMedia: totalAllImages + totalAllVideos,
      });

    } catch (err: any) {
      console.error("Error fetching dashboard stats:", err);
      setError(err.message || "Failed to fetch dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Stack spacing={2} alignItems="center">
          <CircularProgress size={50} />
          <Typography color="text.secondary">Loading dashboard statistics...</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Total Blogs Card */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{
            borderRadius: 2,
            boxShadow: 2,
            transition: 'transform 0.3s, box-shadow 0.3s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 4,
            }
          }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: '#2196f3', width: 56, height: 56 }}>
                  <ArticleIcon sx={{ fontSize: 28 }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    {blogStats.totalBlogs}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Blogs
                  </Typography>
                  <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 0.5 }}>
                    +{blogStats.recentBlogs} this week
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Total SEO Banners Card */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{
            borderRadius: 2,
            boxShadow: 2,
            transition: 'transform 0.3s, box-shadow 0.3s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 4,
            }
          }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: '#4caf50', width: 56, height: 56 }}>
                  <CampaignIcon sx={{ fontSize: 28 }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {bannerStats.totalBanners}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total SEO Banners
                  </Typography>
                  <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 0.5 }}>
                    +{bannerStats.recentBanners} this week
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Portfolios Card */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{
            borderRadius: 2,
            boxShadow: 2,
            transition: 'transform 0.3s, box-shadow 0.3s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 4,
            }
          }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: '#ff9800', width: 56, height: 56 }}>
                  <CollectionsIcon sx={{ fontSize: 28 }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {portfolioStats.totalPortfolios}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Portfolios
                  </Typography>
                  <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 0.5 }}>
                    +{portfolioStats.recentPortfolios} this week
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Media Card */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{
            borderRadius: 2,
            boxShadow: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            transition: 'transform 0.3s, box-shadow 0.3s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 4,
            }
          }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <ImageIcon sx={{ fontSize: 28, color: 'white' }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="white">
                    {mediaStats.totalMedia}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Total Media Files
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                      🖼️ {mediaStats.totalImages}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                      🎥 {mediaStats.totalVideos}
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Summary Card */}
        {/* <Grid size={{ xs: 12 }}>
          <Card sx={{
            borderRadius: 2,
            boxShadow: 2,
            bgcolor: '#f5f5f5',
          }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, md: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: '#607d8b', width: 48, height: 48 }}>
                      <CampaignIcon sx={{ fontSize: 24 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" fontWeight="bold" color="#37474f">
                        Grand Total
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        All Content Items
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, md: 9 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'white', borderRadius: 2 }}>
                        <Typography variant="h6" fontWeight="bold" color="primary.main">
                          {blogStats.totalBlogs + bannerStats.totalBanners + portfolioStats.totalPortfolios}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Total Items
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'white', borderRadius: 2 }}>
                        <Typography variant="h6" fontWeight="bold" color="success.main">
                          {blogStats.recentBlogs + bannerStats.recentBanners + portfolioStats.recentPortfolios}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          New This Week
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'white', borderRadius: 2 }}>
                        <Typography variant="h6" fontWeight="bold" color="warning.main">
                          {blogStats.totalTags + blogStats.totalUrls + blogStats.totalParagraphs}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Blog Elements
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'white', borderRadius: 2 }}>
                        <Typography variant="h6" fontWeight="bold" color="secondary.main">
                          {mediaStats.totalMedia}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Media Files
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid> */}
      </Grid>
    </Box>
  );
};

export default DashboardStatsCards;