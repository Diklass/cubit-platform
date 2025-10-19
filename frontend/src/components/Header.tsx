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
    { key: 'lessons',   label: 'Уроки',       to: '/lessons' },
    { key: 'rooms',     label: 'Комнаты',     to: '/rooms' },
  ] as const;

  const activeKey =
    tabs.find(t => location.pathname.startsWith(t.to))?.key ?? tabs[0].key;

    

  return (
    <motion.header
      key={user?.id ?? 'guest'}
      className="sticky top-[22px] mx-[20px] z-20 rounded-lg h-[60px] p-[10px] flex items-center justify-between shadow-md"
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
      {/* Логотип */}
      <NavLink to="/dashboard" className="flex items-center no-underline">
        <div className="w-[60px] h-[60px] rounded-lg flex items-center justify-center flex-shrink-0">
          <img src={logoSrc} alt="Cubit Logo" className="w-[42px] h-[42px] object-contain" />
        </div>
        <span className="ml-[10px] text-[24px] font-bold">
          Cubit
        </span>
      </NavLink>

      {/* Правый блок */}
      <div className="flex items-center gap-[20px]">
        {user?.role !== 'GUEST' ? (
          <ExpressiveSegmentedTabs
            value={activeKey}
            onChange={(k) => {
              const target = tabs.find(t => t.key === k);
              if (target) navigate(target.to);
            }}
            options={tabs.map(({ key, label }) => ({ key, label }))}
            size="sm"
            gap={10}
            sx={{ minWidth: 360 }}
          />
        ) : (
          <NavLink
            to="/login"
            className="h-[40px] px-[24px] flex items-center justify-center text-[16px] font-medium tracking-[0.1px] rounded-full border no-underline"
            style={{
              borderColor: theme.palette.divider,
              color: theme.palette.text.primary,
            }}
          >
            Войти
          </NavLink>
        )}

         {/* Переключатель темы */}
        <Tooltip title="Сменить тему">
          <IconButton onClick={toggleTheme} color="inherit">
            {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Tooltip>

        {user?.role !== 'GUEST' && (
          <NavLink to="/profile" className="block">
            <motion.div
              className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-white font-semibold shadow-md overflow-hidden cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${theme.palette.mode === 'dark'
                    ? '#6EE7B7, #3B82F6, #9333EA'
                    : '#3B82F6, #A855F7, #F472B6'
                  })`,
                backgroundSize: '200% 200%',
              }}
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                duration: 6,
                ease: 'easeInOut',
                repeat: Infinity,
              }}
              whileHover={{
                scale: 1.1,
                boxShadow:
                  theme.palette.mode === 'dark'
                    ? '0 0 20px rgba(59,130,246,0.4)'
                    : '0 0 20px rgba(168,85,247,0.3)',
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
