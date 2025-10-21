import React, { useRef, useState, useEffect } from "react";
import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";

interface CustomScrollAreaProps {
  children: React.ReactNode;
  padding?: string;
  collapsed?: boolean;
}

export const CustomScrollArea: React.FC<CustomScrollAreaProps> = ({
  children,
  padding = "0 24px 20px 20px",
  collapsed = false,
}) => {
  const theme = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const [scrollInfo, setScrollInfo] = useState({ height: 0, top: 0 });
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);

  // === Константы (проверь, что суммы оффсетов не "съедают" всю высоту) ===
  const TOP_OFFSET = 70;
  const BOTTOM_OFFSET = 70;
  const SCROLL_SMOOTHNESS = 0.7;
  const MIN_THUMB_HEIGHT = 30;
  const WIDTH = collapsed ? 6 : 12;
  const RIGHT_OFFSET = collapsed ? 4 : 6;

  const computeThumb = () => {
    const el = scrollRef.current;
    if (!el) return { thumbHeight: 0, thumbTop: 0, railHeight: 0, maxScrollTop: 0 };

    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight <= clientHeight) {
  setScrollInfo({ height: clientHeight, top: TOP_OFFSET });
  return;
}
    
    const availableHeight = Math.max(0, clientHeight - TOP_OFFSET - BOTTOM_OFFSET);

    // Если контента меньше окна — рельса нулевая, ползунок фиксируем сверху
    if (scrollHeight <= clientHeight || availableHeight <= 0) {
      const h = Math.max(availableHeight, 0);
      return {
        thumbHeight: Math.max(h, MIN_THUMB_HEIGHT > h ? h : MIN_THUMB_HEIGHT),
        thumbTop: TOP_OFFSET,
        railHeight: 0,
        maxScrollTop: 0,
      };
    }

    const thumbHeight = Math.max(
      (clientHeight / scrollHeight) * availableHeight,
      MIN_THUMB_HEIGHT
    );

    const railHeight = Math.max(0, availableHeight - thumbHeight);
    const maxScrollTop = Math.max(0, scrollHeight - clientHeight);

    let ratio = 0;
    if (maxScrollTop > 0) {
      ratio = scrollTop / maxScrollTop;
    }
    const thumbTop = TOP_OFFSET + ratio * railHeight;

    return { thumbHeight, thumbTop, railHeight, maxScrollTop };
  };

  const updateThumb = () => {
  const { thumbHeight, thumbTop } =
    computeThumb() || { thumbHeight: 0, thumbTop: 0 };

  if (isDraggingRef.current) {
    // Во время drag обновляем только размер (на случай resize)
    setScrollInfo((prev) => ({ ...prev, height: thumbHeight }));
    return;
  }

  setScrollInfo({
    height: thumbHeight,
    top: thumbTop,
  });
};

  useEffect(() => {
    updateThumb();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateThumb);
    window.addEventListener("resize", updateThumb);
    return () => {
      el.removeEventListener("scroll", updateThumb);
      window.removeEventListener("resize", updateThumb);
    };
  }, []);

  // === Плавный скролл колесиком ===
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let targetScroll = el.scrollTop;
    let isScrolling = false;

    const smoothScroll = () => {
      if (!el) return;
      const diff = targetScroll - el.scrollTop;
      el.scrollTop += diff * 0.15;
      if (Math.abs(diff) > 0.5) requestAnimationFrame(smoothScroll);
      else isScrolling = false;
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.buttons === 4) return; // не мешаем автоскроллу (средняя кнопка)
      e.preventDefault();
      setVisible(true);
      setIsInteracting(true);

      const maxScrollTop = Math.max(0, el.scrollHeight - el.clientHeight);
      targetScroll += e.deltaY * SCROLL_SMOOTHNESS;
      targetScroll = Math.max(0, Math.min(targetScroll, maxScrollTop));

      if (!isScrolling) {
        isScrolling = true;
        requestAnimationFrame(smoothScroll);
      }

      clearTimeout((handleWheel as any)._timer);
      (handleWheel as any)._timer = setTimeout(() => {
        setIsInteracting(false);
        if (!hovered && !dragging) setVisible(false);
      }, 1200);
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [hovered, dragging]);

  // === Drag (перетаскивание ползунка) ===
const startDrag = (e: React.MouseEvent) => {
  e.preventDefault();
  const el = scrollRef.current;
  const wrapper = wrapperRef.current;
  if (!el || !wrapper) return;

  isDraggingRef.current = true;
  setDragging(true);
  setVisible(true);
  setIsInteracting(true);

  const startY = e.clientY;
  const startScrollTop = el.scrollTop;
  const { scrollHeight, clientHeight } = el;
  const availableHeight = clientHeight - TOP_OFFSET - BOTTOM_OFFSET;

  const thumbHeight = Math.max(
    (clientHeight / scrollHeight) * availableHeight,
    MIN_THUMB_HEIGHT
  );
  const maxScrollTop = scrollHeight - clientHeight;
  const railHeight = availableHeight - thumbHeight;
  const scrollPerPixel = maxScrollTop / railHeight; // ← масштаб

  const onMove = (me: MouseEvent) => {
    me.preventDefault();
    const deltaY = me.clientY - startY;
    const newScrollTop = startScrollTop + deltaY * scrollPerPixel;
    el.scrollTop = Math.max(0, Math.min(maxScrollTop, newScrollTop));
  };

  const onUp = () => {
    isDraggingRef.current = false;
    setDragging(false);
    setIsInteracting(false);
    updateThumb();
    if (!hovered) setVisible(false);
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
  };

  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
};

  const handleMouseEnter = () => setVisible(true);
  const handleMouseLeave = () => {
    if (!isInteracting && !dragging) setVisible(false);
  };

  const thumbColor = dragging
    ? "#3C96EF"
    : hovered
    ? theme.palette.mode === "dark"
      ? "#4a4a4a"
      : "#DCE9F5"
    : theme.palette.mode === "dark"
    ? "#4a4a4a"
    : "#D0D7E2";

  return (
    <Box
      ref={wrapperRef}
      sx={{
        position: "relative",
        flex: "1 1 auto",
        height: "calc(100% - 40px)",
        mt: "20px",
        borderRadius: "inherit",
        overflow: "hidden",
        pr: "8px",
        // Чтобы при drag не выделялся текст
        userSelect: "none",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Box
        ref={scrollRef}
        sx={{
          overflowY: "auto",
          overflowX: "hidden",
          height: "100%",
          padding,
          pr: "20px",
          "&::-webkit-scrollbar": { width: "0px", height: "0px" },
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {children}
      </Box>

      <Box
        sx={{
          position: "absolute",
          top: `${scrollInfo.top}px`,
          right: `${RIGHT_OFFSET}px`,
          width: `${WIDTH}px`,
          height: `${scrollInfo.height}px`,
          backgroundColor: thumbColor,
          borderRadius: "999px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          cursor: "grab",
          transition:
            "background-color 0.25s ease, opacity 0.4s ease, width 0.2s ease",
          opacity: visible || dragging ? 1 : 0,
          // На всякий: чтобы клики точно ловились поверх контента
          pointerEvents: "auto",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onMouseDown={startDrag}
      />
    </Box>
  );
};
