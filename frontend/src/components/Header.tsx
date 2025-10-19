// src/components/Header.tsx
import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import ExpressiveSegmentedTabs from './ui/ExpressiveSegmentedTabs';
import logoSrc from '../assets/logo.svg';
import avatarSrc from '../assets/avatar.svg';
import { motion, useReducedMotion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import { IconButton, Tooltip } from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";
import { useThemeContext } from "../theme/ThemeContext";

export const Header: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const theme = useTheme();
  const { toggleTheme } = useThemeContext();

  const tabs = [
    { key: 'lessons', label: 'Уроки', to: '/lessons' },
    { key: 'rooms',   label: 'Комнаты', to: '/rooms' },
  ] as const;

  
 const activeKey = tabs.find(t => location.pathname.startsWith(t.to))?.key;

  return (
    <motion.header
      key={user?.id ?? 'guest'}
      className="
        sticky top-[22px] mx-[20px] z-20
        h-[60px]
        px-[15px] py-[10px]
        flex items-center justify-between
        !rounded-[12px] overflow-hidden shadow-light
      "
      style={{
        willChange: 'transform',
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        
      }}
      initial={prefersReducedMotion ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -28, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { type: 'spring', stiffness: 280, damping: 18, mass: 0.7, bounce: 0.2, delay: 0.05 }
      }
    >
      {/* Логотип + название */}
      <NavLink to="/dashboard" className="flex items-center no-underline">
        <div className="w-[40px] h-[40px] rounded-md flex items-center justify-center flex-shrink-0">
          <img src={logoSrc} alt="Cubit Logo" className="w-[28px] h-[28px] object-contain" />
        </div>
        <span className="ml-[10px] text-[20px] font-bold leading-none">
          Cubit
        </span>
      </NavLink>

      {/* Правый блок */}
      <div className="flex items-center gap-[15px]">
        {user?.role !== 'GUEST' ? (
          <ExpressiveSegmentedTabs
            value={activeKey ?? ""}
            onChange={(k) => {
              const target = tabs.find(t => t.key === k);
              if (target) navigate(target.to);
            }}
            options={tabs.map(({ key, label }) => ({ key, label }))}
            size="sm"
            gap={15}             
            sx={{ minWidth: 360 }}
          />
        ) : (
          <NavLink
            to="/login"
            className="
              h-[40px] px-[24px]
              flex items-center justify-center
              text-[16px] font-medium tracking-[0.1px]
              rounded-full no-underline
              border
              transition-fast
            "
            style={{
              borderColor: theme.palette.divider,         // #CED2D6
              color: theme.palette.text.secondary,        // #626466
              
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = theme.palette.primary.main; // hover
              (e.currentTarget as HTMLAnchorElement).style.color = theme.palette.primary.main;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = theme.palette.divider;
              (e.currentTarget as HTMLAnchorElement).style.color = theme.palette.text.secondary;
            }}
          >
            Войти
          </NavLink>
        )}

        {/* Переключатель темы */}
        <Tooltip title="Сменить тему">
          <IconButton onClick={toggleTheme} color="inherit" size="small">
            {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Tooltip>

        {user?.role !== 'GUEST' && (
          <NavLink to="/profile" className="block">
            <motion.div
              className="
                w-[40px] h-[40px]
                rounded-full flex items-center justify-center
                text-white font-semibold
                shadow-light overflow-hidden cursor-pointer
              "
              style={{
                background: `linear-gradient(135deg, ${
                  theme.palette.mode === 'dark'
                    ? '#6EE7B7, #3B82F6, #9333EA'
                    : '#3B82F6, #A855F7, #F472B6'
                })`,
                backgroundSize: '200% 200%',
              }}
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity }}
              whileHover={{
                scale: 1.08,
                boxShadow:
                  theme.palette.mode === 'dark'
                    ? '0 0 20px rgba(59,130,246,0.35)'
                    : '0 0 20px rgba(168,85,247,0.25)',
              }}
            >
              {user?.email?.[0]?.toUpperCase() ?? 'U'}
            </motion.div>
          </NavLink>
        )}
      </div>
    </motion.header>
  );
};
