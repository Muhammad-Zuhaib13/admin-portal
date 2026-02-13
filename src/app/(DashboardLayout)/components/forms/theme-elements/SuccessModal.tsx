"use client"
import React from "react";
import {
    Box,
    Button,
    Stack,
    Typography,
    Modal,
    IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
const SuccessModal = ({ open, onClose, message, buttonText, onButtonClick }: {
    open: boolean;
    onClose: () => void;
    message: string;
    buttonText?: string;
    onButtonClick?: () => void;
}) => {
    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="success-modal-title"
            aria-describedby="success-modal-description"
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
                    <CheckCircleOutlineIcon sx={{ fontSize: 60, color: 'success.main' }} />
                    <Typography id="success-modal-title" variant="h6" component="h2" align="center">
                        Success
                    </Typography>
                    <Typography id="success-modal-description" align="center">
                        {message}
                    </Typography>
                    {buttonText && onButtonClick && (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={onButtonClick}
                            sx={{ mt: 2 }}
                        >
                            {buttonText}
                        </Button>
                    )}
                </Stack>
            </Box>
        </Modal>
    );
};

export default SuccessModal