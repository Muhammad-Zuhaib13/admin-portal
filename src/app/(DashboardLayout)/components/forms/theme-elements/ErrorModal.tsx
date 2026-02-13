"use client"
import React from "react";
import {
  Box,
  TextField,
  Button,
  Stack,
  Typography,
  Modal,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
const ErrorModal = ({ open, onClose, message }: {
  open: boolean;
  onClose: () => void;
  message: string;
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="error-modal-title"
      aria-describedby="error-modal-description"
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%',
        maxWidth: '500px',
        bgcolor: 'background.paper',
        boxShadow: 24,
        borderRadius: 2,
        p: 4,
      }}>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'grey.500',
          }}
        >
          <CloseIcon />
        </IconButton>
        <Stack spacing={2} alignItems="center">
          <ErrorOutlineIcon sx={{ fontSize: 60, color: 'error.main' }} />
          <Typography id="error-modal-title" variant="h6" component="h2" align="center">
            Error
          </Typography>
          <Typography id="error-modal-description" align="center">
            {message}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={onClose}
            sx={{ mt: 2 }}
          >
            Close
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
};

export default ErrorModal