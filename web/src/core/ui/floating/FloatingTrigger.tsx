import React from "react";
import { Box, Stack } from "@mui/material";
import { DragIndicator } from "@mui/icons-material";
import { DraggableContainer } from "../draggable/DraggableContainer";

export interface FloatingTriggerProps {
  icon: React.ReactNode;
  storageKey: string;
  onClick: () => void;
  onDoubleClick?: () => void;
  color?: string;
  title?: string;
  fabWidth?: number;
  fabHeight?: number;
  defaultOffset?: number;
  dragThreshold?: number;
}

export const FloatingTrigger: React.FC<FloatingTriggerProps> = ({
  icon,
  storageKey,
  onClick,
  onDoubleClick,
  color = "warning.main",
  title = "Click to open | Drag freely | Double-click to reset",
  fabWidth = 56,
  fabHeight = 56,
  defaultOffset = 20,
  dragThreshold = 5,
}) => {
  return (
    <DraggableContainer
      storageKey={storageKey}
      width={fabWidth}
      height={fabHeight}
      defaultOffset={defaultOffset}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      dragThreshold={dragThreshold}
    >
      <Box
        sx={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          bgcolor: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: 4,
          color: "white",
          transition: "all 0.2s ease",
          userSelect: "none",
          "&:hover": {
            transform: "scale(1.05)",
            boxShadow: 6,
          },
        }}
        role="button"
        tabIndex={0}
        title={title}
        onKeyDown={(e) => e.key === "Enter" && onClick()}
      >
        <Stack alignItems="center" spacing={0.5}>
          {icon}
          <DragIndicator sx={{ fontSize: 10, opacity: 0.7 }} />
        </Stack>
      </Box>
    </DraggableContainer>
  );
};
