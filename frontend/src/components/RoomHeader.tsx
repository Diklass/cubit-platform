// src/components/RoomHeader.tsx
import React from 'react';
import fullscreenIcon from '../assets/icons/fullscreen.svg';
import editIcon       from '../assets/icons/setting.svg';
import chatIcon       from '../assets/icons/chat.svg';

interface RoomHeaderProps {
  name: string;
  code: string;
  bgColor?: string;
  bgImagePreview?: string | null;
  onEdit: () => void;
  onFullscreen: () => void;
  onChat: () => void;
  compact?: boolean; // <- когда true, панель схлопывается
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({
  name,
  code,
  bgColor,
  bgImagePreview,
  onEdit,
  onFullscreen,
  onChat,
  compact = false,
}) => {
  if (compact) {
    // --- УЗКАЯ ПОЛОСА (для режима чата) ---
    return (
      <div
        className="relative flex-shrink-0 h-[56px] rounded-lg mx-[20px] mt-[10px] overflow-hidden border border-gray-200"
        style={{
          backgroundColor: bgColor || 'var(--md-sys-color-surface)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Лёгкая подложка */}
        <div className="absolute inset-0 bg-primary-container/60" />

        {/* Контент: заголовок слева, маленькие круглые кнопки справа */}
        <div className="relative z-[1] h-full px-[12px] flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <h1 className="text-white text-[18px] font-semibold truncate">{name}</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* К чатам/к материалам */}
            <button
              onClick={onChat}
              aria-label="Чат / К материалам"
              className="p-2 rounded-full bg-white/90 hover:bg-white transition shadow"
              title="Чат / К материалам"
            >
              <img src={chatIcon} alt="" className="w-4 h-4" />
            </button>

            {/* Полный экран */}
            <button
              onClick={onFullscreen}
              aria-label="На весь экран"
              className="p-2 rounded-full bg-white/90 hover:bg-white transition shadow"
              title="На весь экран"
            >
              <img src={fullscreenIcon} alt="" className="w-4 h-4" />
            </button>

            {/* Настройки */}
            <button
              onClick={onEdit}
              aria-label="Настройки"
              className="p-2 rounded-full bg-white/90 hover:bg-white transition shadow"
              title="Настройки"
            >
              <img src={editIcon} alt="" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- РАЗВЁРНУТАЯ ШАПКА (как у тебя было, с минимальными правками) ---
  return (
    <div
      className="relative flex-shrink-0 h-[200px] rounded-lg mx-[20px] mt-[10px] overflow-hidden"
      style={{
        backgroundColor: bgColor,
        backgroundImage: bgImagePreview ? `url(${bgImagePreview})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Фоновая полупрозрачная заливка */}
      <div className="absolute inset-0 bg-primary-container/80"></div>

      {/* Название комнаты */}
      <h1 className="relative text-white text-[32px] font-bold pl-[20px] pt-[20px]">
        {name}
      </h1>

      {/* Код + Fullscreen */}
      <div className="relative flex items-center gap-2 pl-[20px] mt-2">
        <span className="text-white text-[18px] font-medium">
          Код курса: {code}
        </span>
        <button
          onClick={onFullscreen}
          className="p-2 rounded-full bg-white/20 hover:bg-white/40 transition"
          aria-label="На весь экран"
          title="На весь экран"
        >
          <img src={fullscreenIcon} alt="" className="w-5 h-5" />
        </button>
      </div>

      {/* Группа правых кнопок */}
      <div className="absolute top-[10px] right-[10px] flex items-center gap-2">
        {/* Настройки */}
        <button
          onClick={onEdit}
          aria-label="Редактировать"
          className="p-2 bg-white/90 rounded-full shadow hover:bg-white transition"
          title="Редактировать"
        >
          <img src={editIcon} alt="" className="w-5 h-5" />
        </button>
      </div>

      {/* Кнопка чата — внизу справа, крупнее */}
      <button
        onClick={onChat}
        aria-label="Чат"
        className="
          absolute bottom-[10px] right-[10px]
          p-3 bg-accent text-white rounded-full shadow-lg
          hover:opacity-90 transition
        "
        title="Чат"
      >
        <img src={chatIcon} alt="" className="w-6 h-6" />
      </button>
    </div>
  );
};
