// src/pages/Dashboard.tsx
import React, { useEffect, useState, useRef } from "react";
import { motion as m, useAnimation } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import { IconButton, Tooltip } from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";
import { useAuth } from "../auth/AuthContext";
import { useThemeContext } from "../theme/ThemeContext";
import { useNavigate } from "react-router-dom";
import CubitLogo from "../assets/logo.svg?react";




const Dashboard: React.FC = () => {
  const theme = useTheme();
  const { toggleTheme } = useThemeContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === "dark";
  const controls = useAnimation();

const logoRef = useRef<HTMLImageElement>(null);
const [logoColor, setLogoColor] = useState("#F5F5F5");
const [colors, setColors] = useState<string[]>([]);

// Функция для расчета яркости цвета
const getBrightness = (hex: string) => {
  const rgb = parseInt(hex.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  return (r * 299 + g * 587 + b * 114) / 1000;
};

// Интерполяция между двумя цветами
const interpolateColor = (color1: string, color2: string, factor: number) => {
  const c1 = parseInt(color1.slice(1), 16);
  const c2 = parseInt(color2.slice(1), 16);
  
  const r1 = (c1 >> 16) & 0xff;
  const g1 = (c1 >> 8) & 0xff;
  const b1 = (c1 >> 0) & 0xff;
  
  const r2 = (c2 >> 16) & 0xff;
  const g2 = (c2 >> 8) & 0xff;
  const b2 = (c2 >> 0) & 0xff;
  
  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);
  
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
};

// Обновление цвета логотипа на основе анимации градиента
useEffect(() => {
  if (colors.length === 0) return;

  let animationFrame: number;
  let startTime = Date.now();

  const updateLogoColor = () => {
    const elapsed = Date.now() - startTime;
    const progress = (elapsed % 35000) / 35000; // 35s цикл как в анимации
    
    // Рассчитываем позицию в градиенте (центр экрана)
    let gradientPosition: number;
    
    if (progress < 0.25) {
      gradientPosition = progress * 2; // 0% -> 50%
    } else if (progress < 0.5) {
      gradientPosition = 0.5 + (progress - 0.25) * 2; // 50% -> 100%
    } else if (progress < 0.75) {
      gradientPosition = 1 - (progress - 0.5) * 2; // 100% -> 50%
    } else {
      gradientPosition = 0.5 - (progress - 0.75) * 2; // 50% -> 0%
    }

    // Находим два соседних цвета для интерполяции
    const colorIndex = gradientPosition * (colors.length - 1);
    const index1 = Math.floor(colorIndex);
    const index2 = Math.min(index1 + 1, colors.length - 1);
    const factor = colorIndex - index1;
    
    const currentColor = interpolateColor(colors[index1], colors[index2], factor);
    const brightness = getBrightness(currentColor);
    
    // Мягкие цвета вместо чистого чёрного/белого
    // Тёмный режим: светло-серый / тёмно-серый
    // Светлый режим: тёмно-синий / светло-кремовый
    if (isDark) {
      setLogoColor(brightness > 160 ? "#2D3748" : "#E2E8F0"); // серый тёмный / серый светлый
    } else {
      setLogoColor(brightness > 160 ? "#1E3A5F" : "#F7F9FB"); // синий тёмный / кремовый светлый
    }
    
    animationFrame = requestAnimationFrame(updateLogoColor);
  };

  updateLogoColor();

  return () => {
    if (animationFrame) cancelAnimationFrame(animationFrame);
  };
}, [colors, isDark]);

  // 🌈 улучшенный плавный градиент с более глубокими цветами

  useEffect(() => {
  const newColors = isDark
    ? [
        "#0F5699", "#500F66",
        "#0F5699", "#66210A",
        "#0F5699", "#0A6647",
      ]
    : [
        "#6DB1F2", "#E9CEF2",
        "#6DB1F2", "#F2D7CE",
        "#6DB1F2", "#CEF2E6",
      ];

  setColors(newColors);
  controls.start({
    opacity: [0, 1],
    transition: { duration: 1.5, ease: "easeOut" },
  });
}, [isDark, controls]);

  const tabs = [
    { key: "lessons", label: "Уроки", to: "/lessons" },
    { key: "rooms", label: "Комнаты", to: "/rooms" },
  ] as const;

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen text-center overflow-hidden">
      {/* 🌈 Анимированный фон с улучшенной плавностью */}
      <m.div
        key={isDark ? "dark" : "light"}
        className="fixed inset-0"
        style={{
          zIndex: 0,
          pointerEvents: "none",
          backgroundImage: `linear-gradient(135deg, ${colors.join(", ")})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "300% 300%",
        }}
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          backgroundPosition: [
            "0% 0%",
            "50% 50%",
            "100% 100%",
            "50% 50%",
            "0% 0%",
          ],
        }}
        transition={{
          opacity: { duration: 1.5, ease: "easeOut" },
          backgroundPosition: {
            duration: 35,
            ease: "linear",
            repeat: Infinity,
          },
        }}
      />

      {/* ✨ Дополнительный слой с мягким свечением */}
      <m.div
        className="fixed inset-0"
        style={{
          zIndex: 0,
          pointerEvents: "none",
          background: isDark
            ? "radial-gradient(ellipse 1200px 800px at 50% 40%, rgba(74, 95, 157, 0.15), transparent 70%)"
            : "radial-gradient(ellipse 1200px 800px at 50% 40%, rgba(91, 163, 255, 0.12), transparent 70%)",
        }}
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          duration: 8,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />

      {/* 🔅 улучшенная виньетка */}
      <div
        className="fixed inset-0"
        style={{
          zIndex: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 1100px 700px at 50% 35%, rgba(0,0,0,0.1), rgba(0,0,0,0.4))",
          mixBlendMode: isDark ? "normal" : "multiply",
          opacity: isDark ? 0.6 : 0.35,
          transition: "opacity 1.2s ease-in-out",
        }}
      />

      {/* 🌟 кнопки справа */}
      <div className="absolute top-[22px] right-[20px] flex items-center gap-[15px] z-10">
        <Tooltip title="Сменить тему">
          <IconButton onClick={toggleTheme} color="inherit" size="small">
            {theme.palette.mode === "dark" ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Tooltip>

        {user && (
          <m.div
            onClick={() => navigate("/profile")}
            className="w-[40px] h-[40px] rounded-full flex items-center justify-center text-white font-semibold shadow-light cursor-pointer select-none"
            style={{
              background: `linear-gradient(135deg, ${
                theme.palette.mode === "dark"
                  ? "#6EE7B7, #3B82F6, #9333EA"
                  : "#3B82F6, #A855F7, #F472B6"
              })`,
              backgroundSize: "200% 200%",
            }}
            animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
            transition={{
              duration: 8,
              ease: "easeInOut",
              repeat: Infinity,
            }}
            whileHover={{
              scale: 1.12,
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 0 25px rgba(59,130,246,0.5)"
                  : "0 0 25px rgba(168,85,247,0.4)",
              transition: { duration: 0.3 },
            }}
            whileTap={{ scale: 0.95 }}
          >
            {user.email?.[0]?.toUpperCase() ?? "U"}
          </m.div>
        )}
      </div>

      {/* 🌟 логотип с плавной анимацией */}
<div className="flex items-center gap-4 z-10 mb-6 select-none">
  <m.div
    initial={{ scale: 0, rotate: -90, opacity: 0 }}
    animate={{ scale: 1, rotate: 0, opacity: 1 }}
    transition={{ type: "spring", stiffness: 100, damping: 15, duration: 1.2 }}
    whileHover={{
      scale: 1.05,
      rotate: [0, -5, 5, 0],
      transition: { duration: 0.6 },
    }}
    className="w-[130px] h-[130px] drop-shadow-lg flex items-center justify-center"
  >
    <CubitLogo
      style={{
        width: "100%",
        height: "100%",
        // 🎨 Твой бренд-цвет
        color: isDark ? "#90caf9" : "#1976d2",
        transition: "color .3s ease-in-out",
      }}
    />
  </m.div>

  {/* ✅ Вернули текст */}
  <m.span
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.3, duration: 0.6 }}
    style={{
      fontSize: "4.2rem",
      fontWeight: 800,
      letterSpacing: "-0.02em",
      color: theme.palette.primary.main,
      textShadow: "0 2px 10px rgba(0,0,0,0.15)",
    }}
  >
    Cubit
  </m.span>
</div>



      {/* 👋 приветствие */}
      {user?.email && (
        <m.h1
          className="text-5xl sm:text-6xl font-extrabold tracking-tight drop-shadow-md mb-8 z-10 flex items-center justify-center gap-3"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: 0.3, 
            duration: 0.8,
            ease: "easeOut",
          }}
          style={{
            color: theme.palette.mode === "dark" ? "#FFFFFF" : "rgba(0, 0, 0, 0.85)",
          }}
        >
          Привет, {user.email}!
          {/* 🌟 машущая рука */}
          <m.span
            initial={{ rotate: 0 }}
            animate={{
              rotate: [0, 15, -10, 15, -5, 0],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              repeatDelay: 5,
              ease: "easeInOut",
            }}
            style={{ display: "inline-block", transformOrigin: "70% 70%" }}
          >
            👋
          </m.span>
        </m.h1>
      )}


{/* 🪄 крупные кнопки-вкладки */}
<m.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.4, duration: 0.6, type: "spring", stiffness: 200 }}
  className="z-10 mt-12 flex flex-wrap gap-4 justify-center"
>
  {[
    { key: "lessons", label: "Уроки", to: "/lessons" },
    { key: "rooms", label: "Комнаты", to: "/rooms" },
  ].map(({ key, label, to }) => (
    <m.div whileTap={{ scale: 0.96 }} key={key}>
      <div
        onClick={() => navigate(to)}
        style={{
          height: 60,                 // ↑ было 46
          minWidth: 180,              // ширина побольше
          borderRadius: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 28px",          // ↑ было 22
          fontWeight: 700,            // чуть жирнее
          fontSize: "1.1rem",         // ↑ было по умолчанию
          letterSpacing: "-0.01em",
          cursor: "pointer",
          transition: "transform .15s ease, background-color .25s ease, box-shadow .25s ease",
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.getContrastText(theme.palette.primary.main),
          boxShadow: "0 6px 18px rgba(0,0,0,0.25)", // тень погуще
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = isDark
            ? theme.palette.primary.light
            : theme.palette.primary.dark;
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 10px 24px rgba(0,0,0,0.28)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = theme.palette.primary.main;
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.25)";
        }}
      >
        {label}
      </div>
    </m.div>
  ))}
</m.div>


      {/* ✨ подпись */}
      <m.div
        className="absolute bottom-4 text-sm font-medium opacity-70 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        style={{
          color:
            theme.palette.mode === "dark"
              ? "rgba(255, 255, 255, 0.6)"
              : "rgba(0, 0, 0, 0.6)",
        }}
      >
        Cubit © 2025 — образовательная платформа
      </m.div>
    </div>
  );
};

export default Dashboard;