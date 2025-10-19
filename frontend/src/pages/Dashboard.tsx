import React, { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import logo from "../assets/logo.svg";
import { useAuth } from "../auth/AuthContext";

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const isDark = theme.palette.mode === "dark";
  const controls = useAnimation();

  // 💡 Чтобы при переключении темы фон плавно переходил
  const [colors, setColors] = useState<string[]>(
    isDark
      ? ["#7c3aed", "#db2777", "#ea580c", "#059669"]
      : ["#f6d365", "#fda085", "#f78da7", "#a78bfa"]
  );

  useEffect(() => {
    const newColors = isDark
      ? ["#7c3aed", "#db2777", "#ea580c", "#059669"]
      : ["#f6d365", "#fda085", "#f78da7", "#a78bfa"];
    // плавно анимируем смену палитры
    controls.start({
      opacity: [0, 1],
      transition: { duration: 1.2, ease: "easeInOut" },
    });
    setColors(newColors);
  }, [isDark, controls]);

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen text-center overflow-hidden"
      style={{ position: "relative", zIndex: 1 }}
    >
      {/* 🌈 Градиент во весь экран */}
      <motion.div
        key={isDark ? "dark" : "light"}
        className="fixed inset-0"
        style={{
          zIndex: 0,
          pointerEvents: "none",
          background: `linear-gradient(120deg, ${colors.join(", ")})`,
          backgroundSize: "400% 400%",
          transition: "background 1.2s ease-in-out",
        }}
        animate={{
          opacity: [0, 1],
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          opacity: { duration: 1.2, ease: "easeInOut" },
          backgroundPosition: {
            duration: 20,
            ease: "easeInOut",
            repeat: Infinity,
          },
        }}
      />

      {/* 🔆 Мягкая виньетка (чтобы кнопки/текст читались) */}
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

      {/* 🌟 Логотип */}
      <motion.img
        src={logo}
        alt="Cubit Logo"
        initial={{ scale: 0, rotate: -90, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 12 }}
        className="w-[130px] h-[130px] mb-6 select-none drop-shadow-lg"
      />

      {/* 👋 Приветствие */}
      {user?.email && (
        <motion.h1
          className="text-5xl sm:text-6xl font-extrabold tracking-tight drop-shadow-md"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          style={{
            color:
              theme.palette.mode === "dark"
                ? "#FFFFFF"
                : "rgba(0, 0, 0, 0.85)",
          }}
        >
          Привет, {user.email}! 👋
        </motion.h1>
      )}

      {/* ✨ Подпись внизу */}
      <motion.div
        className="absolute bottom-4 text-sm font-medium opacity-70"
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
      </motion.div>
    </div>
  );
};

export default Dashboard;
