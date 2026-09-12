import React, { useState, useEffect, useRef } from "react";
import { motion, type PanInfo } from "framer-motion";

export interface DraggableContainerProps {
  children: React.ReactNode;
  storageKey: string;
  width: number;
  height: number;
  defaultPosition?: { x: number; y: number };
  defaultOffset?: number; // fallback if defaultPosition isn't provided (distance from bottom-right)
  zIndex?: number;
  onClick?: () => void;
  onDoubleClick?: () => void;
  dragThreshold?: number;
}

export const DraggableContainer: React.FC<DraggableContainerProps> = ({
  children,
  storageKey,
  width,
  height,
  defaultPosition,
  defaultOffset = 20,
  zIndex = 9999,
  onClick,
  onDoubleClick,
  dragThreshold = 5,
}) => {
  const getDefaultPosition = () => {
    if (defaultPosition) return defaultPosition;
    return {
      x: window.innerWidth - width - defaultOffset,
      y: window.innerHeight - height - defaultOffset,
    };
  };

  const [position, setPosition] = useState(() => {
    if (typeof window !== "undefined") {
        return getDefaultPosition();
    }
    return { x: 0, y: 0 };
  });

  const DOUBLE_CLICK_DELAY = 300;
  const clickTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragDistance = useRef(0);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      const savedPosition = localStorage.getItem(storageKey);
      if (savedPosition) {
        try {
          const parsed = JSON.parse(savedPosition);
          const clampedX = Math.max(0, Math.min(parsed.x, window.innerWidth - width));
          const clampedY = Math.max(0, Math.min(parsed.y, window.innerHeight - height));
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
  }, [storageKey, width, height, defaultOffset]);

  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        const newX = Math.max(0, Math.min(prev.x, window.innerWidth - width));
        const newY = Math.max(0, Math.min(prev.y, window.innerHeight - height));
        if (newX !== prev.x || newY !== prev.y) {
          return { x: newX, y: newY };
        }
        return prev;
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [width, height]);

  const getDragBounds = () => {
    return {
      left: 0,
      right: window.innerWidth - width,
      top: 0,
      bottom: window.innerHeight - height,
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

  const handleInteraction = () => {
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
      if (dragDistance.current < dragThreshold && onClick) {
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
      onClickCapture={(e) => {
        // Prevent click if we dragged
        if (dragDistance.current >= dragThreshold) {
            e.stopPropagation();
        }
      }}
      animate={{ x: position.x, y: position.y }}
      initial={{ x: position.x, y: position.y }}
      transition={{ type: "tween", duration: 0.2 }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex,
        width,
        height,
      }}
    >
      <div 
        style={{ width: "100%", height: "100%", cursor: "grab" }} 
        onMouseDown={(e) => e.currentTarget.style.cursor = "grabbing"}
        onMouseUp={(e) => e.currentTarget.style.cursor = "grab"}
        onClick={handleInteraction}
      >
        {children}
      </div>
    </motion.div>
  );
};
