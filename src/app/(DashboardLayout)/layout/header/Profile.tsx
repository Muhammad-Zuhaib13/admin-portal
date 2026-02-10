"use client";

import React, { useState } from "react";
import {
  Avatar,
  Box,
  Menu,
  Button,
  IconButton,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { IconUser, IconLogout } from "@tabler/icons-react";

const Profile = () => {
  const [anchorEl2, setAnchorEl2] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick2 = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl2(event.currentTarget);
  };

  const handleClose2 = () => {
    setAnchorEl2(null);
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Wait a bit for auth state to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Force reload and redirect
      window.location.assign("/authentication/login");
      
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect even on error
      window.location.assign("/authentication/login");
    }
  };

  return (
    <Box >
      <IconButton
        size="large"
        aria-label="profile menu"
        color="inherit"
        aria-controls="profile-menu"
        aria-haspopup="true"
        sx={{
          ...(anchorEl2 && {
            color: "primary.main",
          }),
        }}
        onClick={handleClick2}
      >
        <Avatar
          src="/images/profile/user-1.jpg"
          alt="User Avatar"
          sx={{
            width: 35,
            height: 35,
          }}
        />
      </IconButton>
      
      <Menu
        id="profile-menu"
        anchorEl={anchorEl2}
        keepMounted
        open={Boolean(anchorEl2)}
        onClose={handleClose2}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        sx={{
          "& .MuiMenu-paper": {
            width: "200px",
          },
        }}
      >
        <MenuItem>
          <ListItemIcon>
            <IconUser width={20} />
          </ListItemIcon>
          <ListItemText>Admin</ListItemText>
        </MenuItem>
        
        <Box mt={1} py={1} px={2}>
          <Button
            onClick={handleLogout}
            variant="outlined"
            color="primary"
            fullWidth
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <IconLogout width={16} />}
          >
            {loading ? "Logging out..." : "Logout"}
          </Button>
        </Box>
      </Menu>
    </Box>
  );
};

export default Profile;