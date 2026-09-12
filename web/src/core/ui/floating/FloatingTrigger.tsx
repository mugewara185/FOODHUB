import React, { useState, useEffect, useRef } from "react";
import { motion, type PanInfo } from "framer-motion";
import { Box, Stack } from "@mui/material";
import { DragIndicator } from "@mui/icons-material";

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
  const defaultX = window.innerWidth - fabWidth - defaultOffset;
  const defaultY = window.innerHeight - fabHeight - defaultOffset;
  const [position, setPosition] = useState({ x: defaultX, y: defaultY });

  const DOUBLE_CLICK_DELAY = 300;
  const clickTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragDistance = useRef(0);
  const initialized = useRef(false);

  const getDefaultPosition = () => {
    return {
      x: window.innerWidth - fabWidth - defaultOffset,
      y: window.innerHeight - fabHeight - defaultOffset,
    };
  };

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      const savedPosition = localStorage.getItem(storageKey);
      if (savedPosition) {
        try {
          const parsed = JSON.parse(savedPosition);
          const clampedX = Math.max(0, Math.min(parsed.x, window.innerWidth - fabWidth));
          const clampedY = Math.max(0, Math.min(parsed.y, window.innerHeight - fabHeight));
          setPosition({ x: clampedX, y: clampedY });
        } catch (e) {
          console.error("Failed to parse saved position", e);
          localStorage.removeItem(storageKey);
          setPosition(getDefaultPosition());
        }
      } else {
        setPosition(getDefaultPosition());
      }
    }
  }, [storageKey, fabWidth, fabHeight, defaultOffset]);

  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        const newX = Math.max(0, Math.min(prev.x, window.innerWidth - fabWidth));
        const newY = Math.max(0, Math.min(prev.y, window.innerHeight - fabHeight));
        if (newX !== prev.x || newY !== prev.y) {
          return { x: newX, y: newY };
        }
        return prev;
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [fabWidth, fabHeight]);

  const getDragBounds = () => {
    return {
      left: 0,
      right: window.innerWidth - fabWidth,
      top: 0,
      bottom: window.innerHeight - fabHeight,
    };
  };

  const handleDragStart = () => {
    dragDistance.current = 0;
  };

  const handleDrag = (_: unknown, info: PanInfo) => {
    dragDistance.current = Math.sqrt(info.offset.x ** 2 + info.offset.y ** 2);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const bounds = getDragBounds();
    const dragOffset = info.offset;
    
    if (dragOffset) {
      let newX = position.x + dragOffset.x;
      let newY = position.y + dragOffset.y;

      newX = Math.max(bounds.left, Math.min(newX, bounds.right));
      newY = Math.max(bounds.top, Math.min(newY, bounds.bottom));

      setPosition({ x: newX, y: newY });
      localStorage.setItem(storageKey, JSON.stringify({ x: newX, y: newY }));
    }
    
    setTimeout(() => {
      dragDistance.current = 0;
    }, DOUBLE_CLICK_DELAY + 1);
  };

  const handleFabClick = () => {
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      if (onDoubleClick) {
        onDoubleClick();
      } else {
        resetPosition();
      }
      return;
    }
    clickTimeout.current = setTimeout(() => {
      if (dragDistance.current < dragThreshold) {
        onClick();
      }
      clickTimeout.current = null;
    }, DOUBLE_CLICK_DELAY);
  };

  const resetPosition = () => {
    const defaultPos = getDefaultPosition();
    setPosition(defaultPos);
    localStorage.setItem(storageKey, JSON.stringify(defaultPos));
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={10}
      dragConstraints={getDragBounds()}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      animate={{ x: position.x, y: position.y }}
      initial={{ x: position.x, y: position.y }}
      transition={{ type: "tween", duration: 0.2 }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 9999,
        cursor: "grab",
      }}
      whileDrag={{ cursor: "grabbing" }}
    >
      <Box
        onClick={handleFabClick}
        sx={{
          width: fabWidth,
          height: fabHeight,
          borderRadius: "50%",
          bgcolor: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: 4,
          color: "white",
          transition: "all 0.2s ease",
          userSelect: "none",
          "&:hover": {
            transform: "scale(1.05)",
            boxShadow: 6,
          },
          "&:active": {
            cursor: "grabbing",
          },
        }}
        role="button"
        tabIndex={0}
        title={title}
        onKeyDown={(e) => e.key === "Enter" && handleFabClick()}
      >
        <Stack alignItems="center" spacing={0.5}>
          {icon}
          <DragIndicator sx={{ fontSize: 10, opacity: 0.7 }} />
        </Stack>
      </Box>
    </motion.div>
  );
};
