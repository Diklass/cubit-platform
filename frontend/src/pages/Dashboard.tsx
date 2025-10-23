// src/pages/Dashboard.tsx
import React, { useEffect, useState } from "react";
import { motion as m, useAnimation } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import { IconButton, Tooltip } from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";
import { useAuth } from "../auth/AuthContext";
import { useThemeContext } from "../theme/ThemeContext";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.svg";
import ExpressiveSegmentedTabs from "../components/ui/ExpressiveSegmentedTabs";


const Dashboard: React.FC = () => {
  const theme = useTheme();
  const { toggleTheme } = useThemeContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === "dark";
  const controls = useAnimation();

  // 🌈 плавный градиент
  const [colors, setColors] = useState<string[]>([]);
  useEffect(() => {
    const newColors = isDark
      ? ["#0E1A2B", "#12365C", "#1D5BAF", "#3C96EF"]
      : ["#E8F4FF", "#BFDFFF", "#6BB6FF", "#3C96EF"];
    setColors(newColors);
    controls.start({ opacity: [0, 1], transition: { duration: 1.2 } });
  }, [isDark, controls]);

  const tabs = [
    { key: "lessons", label: "Уроки", to: "/lessons" },
    { key: "rooms", label: "Комнаты", to: "/rooms" },
  ] as const;

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen text-center overflow-hidden">
      {/* 🌈 Анимированный фон */}
      <m.div
        key={isDark ? "dark" : "light"}
        className="fixed inset-0"
        style={{
          zIndex: 0,
          pointerEvents: "none",
          backgroundImage: `linear-gradient(120deg, ${colors.join(", ")})`,
backgroundRepeat: "no-repeat",
backgroundSize: "400% 400%",
          transition: "background 1s ease-in-out",
        }}
        animate={{
          backgroundPosition: [
            "0% 50%",
            "100% 50%",
            "0% 50%",
          ], // двигаем градиент
        }}
        transition={{
          duration: 25,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />

      {/* 🔅 виньетка */}
      <div
        className="fixed inset-0"
        style={{
          zIndex: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(1000px 600px at 50% 30%, rgba(0,0,0,0.18), rgba(0,0,0,0.35))",
          mixBlendMode: isDark ? "normal" : "multiply",
          opacity: isDark ? 0.55 : 0.4,
          transition: "opacity 0.8s ease-in-out",
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
              duration: 6,
              ease: "easeInOut",
              repeat: Infinity,
            }}
            whileHover={{
              scale: 1.1,
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 0 20px rgba(59,130,246,0.4)"
                  : "0 0 20px rgba(168,85,247,0.3)",
            }}
          >
            {user.email?.[0]?.toUpperCase() ?? "U"}
          </m.div>
        )}
      </div>

      {/* 🌟 логотип */}
      <m.img
        src={logo}
        alt="Cubit Logo"
        initial={{ scale: 0, rotate: -90, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 12 }}
        className="w-[130px] h-[130px] mb-6 select-none drop-shadow-lg z-10"
      />

      {/* 👋 приветствие */}
      {user?.email && (
        <m.h1
          className="text-5xl sm:text-6xl font-extrabold tracking-tight drop-shadow-md mb-8 z-10 flex items-center justify-center gap-3"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
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
              duration: 2,
              repeat: Infinity,
              repeatDelay: 6, // каждые 6 сек
              ease: "easeInOut",
            }}
            style={{ display: "inline-block", transformOrigin: "70% 70%" }}
          >
            👋
          </m.span>
        </m.h1>
      )}

      {/* 🪄 вкладки (крупные стандартные) */}
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5, type: "spring", stiffness: 200 }}
        className="z-10 mt-10"
      >
        <ExpressiveSegmentedTabs
          options={tabs.map(({ key, label }) => ({ key, label }))}
          value={""}
          onChange={(k) => {
            const target = tabs.find((t) => t.key === k);
            if (target) navigate(target.to);
          }}
          size="md"
          gap={18}
          sx={{
            minWidth: 480,
            "& [role='tab']": {
              minHeight: 50,
              px: 3,
              py: 1.8,
              fontSize: "1.125rem",
              fontWeight: 600,
            },
          }}
        />
      </m.div>

      {/* ✨ подпись */}
      <m.div
        className="absolute bottom-4 text-sm font-medium opacity-70 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
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
