import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, Box, Typography, IconButton } from "@mui/material";
import { AutoAwesome, Close } from "@mui/icons-material";
import { FloatingTrigger } from "../../../core/ui/buttons/FloatingTrigger";
import { logger } from "../../../core/dev/logger";

export const AdminAIAssistantTrigger: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
    logger.info("ADMIN.AI.OPEN", "Admin AI assistant trigger opened", { category: "UI", timestamp: new Date().toISOString() });
  };

  const handleClose = () => {
    setIsOpen(false);
    logger.info("ADMIN.AI.CLOSE", "Admin AI assistant trigger closed", { category: "UI", timestamp: new Date().toISOString() });
  };

  return (
    <>
      <FloatingTrigger
        icon={<AutoAwesome fontSize="medium" />}
        storageKey="adminAIAssistantPosition"
        onClick={handleOpen}
        color="#7e22ce" // Distinct AI purple color
        title="Admin AI Assistant"
        defaultOffset={80} // Offset higher than dev console so they don't overlap if both are visible
      />

      <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#7e22ce", color: "white" }}>
          <Box display="flex" alignItems="center" gap={1}>
            <AutoAwesome />
            <Typography variant="h6" fontWeight={700}>FoodHub Admin AI</Typography>
          </Box>
          <IconButton onClick={handleClose} sx={{ color: "white" }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>
            Welcome to the future of Admin Operations
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            This is the integration boundary for the upcoming FoodHub Admin AI.
            Once connected to the backend MCP services, you will be able to ask natural language questions about your analytics, order trends, and restaurant performance.
          </Typography>
          <Box sx={{ mt: 3, p: 2, bgcolor: "grey.100", borderRadius: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Coming soon:
            </Typography>
            <ul>
              <li>"Why is revenue lower this week?"</li>
              <li>"Show me the biggest causes of cancelled orders."</li>
              <li>"Which restaurants are underperforming?"</li>
            </ul>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};
