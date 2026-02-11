'use client'
import { Grid, Box } from '@mui/material';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import CreateBlogForm from '../components/forms/theme-elements/CreateBlogForm';
import CreatePortfolioForm from "@/app/(DashboardLayout)/components/forms/theme-elements/CreatePortfolioForm"
const Dashboard = () => {
  return (
    <PageContainer title="Dashboard" description="this is Dashboard">
      <Box>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 12 }}>
            <CreatePortfolioForm />
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
}

export default Dashboard;
