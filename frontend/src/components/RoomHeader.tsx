// src/components/RoomHeader.tsx
import React from 'react';
import fullscreenIcon from '../assets/icons/fullscreen.svg';
import editIcon       from '../assets/icons/edit.svg';
import chatIcon       from '../assets/icons/chat.svg';

  interface RoomHeaderProps {
    name: string;
    code: string;
    bgColor?: string;
    bgImagePreview?: string | null;
    onEdit: () => void;
    onFullscreen: () => void;
    onChat: () => void;
  }

  export const RoomHeader: React.FC<RoomHeaderProps> = ({
  name, code, bgColor, bgImagePreview, onEdit, onFullscreen, onChat
}) => (
  <div
    className="relative flex-shrink-0 h-[200px] rounded-lg mx-[20px] mt-[10px] overflow-hidden"
    style={{
    backgroundColor: bgColor,
    backgroundImage: bgImagePreview
      ? `url(${bgImagePreview})`
      : undefined,
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
    >
    <img src={fullscreenIcon} alt="На весь экран" className="w-5 h-5"/>
    </button>
    </div>

    {/* Кнопка редактирования */}
    <button
      onClick={onEdit}
      className="
        absolute top-[10px] right-[10px]
        p-2 bg-white/90 rounded-full shadow
        hover:bg-white transition
      "
    >
      <img src={editIcon} alt="Редактировать" className="w-5 h-5"/>
    </button>

    {/* Кнопка чата */}
    <button
      onClick={onChat}
      className="
        absolute bottom-[10px] right-[10px]
        p-3 bg-accent text-white rounded-full shadow-lg
        hover:opacity-90 transition
      "
    >
      <img src={chatIcon} alt="Чат" className="w-6 h-6" />
    </button>
  </div>
);
