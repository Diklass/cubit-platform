import React, { useState, useEffect } from 'react';
import { NavButton } from './NavButton';
import { HexColorPicker } from 'react-colorful';

export interface RoomSettings {
  title: string;
  bgColor: string;
}

interface Props {
  initial: RoomSettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: RoomSettings) => void;
}

export const RoomSettingsModal: React.FC<Props> = ({
  initial,
  isOpen,
  onClose,
  onSave,
}) => {
  const basePresets = ['#6750A4', '#33691E', '#006A67', '#B3261E', '#1E88E5'];
  const [title, setTitle] = useState(initial.title);
  const [bgColor, setBgColor] = useState(initial.bgColor);
  const [userPresets, setUserPresets] = useState<string[]>([]);

  const [showPicker, setShowPicker] = useState(false);
  const [tempPickerColor, setTempPickerColor] = useState(initial.bgColor);

  useEffect(() => {
    setTitle(initial.title);
    setBgColor(initial.bgColor);
    setTempPickerColor(initial.bgColor);
  }, [initial, isOpen]);

  const onAddColorClick = () => {
    setTempPickerColor(bgColor);
    setShowPicker(true);
  };

  const confirmPicker = () => {
    const color = tempPickerColor;
    if (!basePresets.includes(color) && !userPresets.includes(color)) {
      setUserPresets(prev => [...prev, color]);
    }
    setBgColor(color);
    setShowPicker(false);
  };

  const cancelPicker = () => {
    setShowPicker(false);
  };

  const removeUserPreset = (color: string) => {
    setUserPresets(prev => prev.filter(c => c !== color));
    if (bgColor === color) {
      setBgColor(basePresets[0] || '');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-[92px] z-50">
      <div className="relative bg-surface rounded-lg shadow-level3 border border-outline w-full max-w-md mx-4 p-6 space-y-6">
        <h2 className="text-lg font-medium text-on-surface">Настройки комнаты</h2>

        {/* Название комнаты */}
        <div className="flex flex-col space-y-1">
          <label className="font-medium text-on-surface-variant">Название комнаты:</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Текущий цвет */}
        <div className="flex items-center space-x-3">
          <label className="font-medium text-on-surface-variant">Текущий цвет:</label>
          <div
            className="w-10 h-10 rounded cursor-pointer border"
            style={{ backgroundColor: bgColor }}
            onClick={onAddColorClick}
          />
          <span className="text-sm text-on-surface-variant">{bgColor}</span>
        </div>

        {/* Базовые пресеты */}
        <div className="flex flex-wrap gap-3 items-center">
          {basePresets.map(color => (
            <button
              key={color}
              onClick={() => setBgColor(color)}
              style={{ backgroundColor: color }}
              className={`w-10 h-10 rounded-full ring-2 transition ${
                bgColor === color ? 'ring-primary' : 'ring-transparent'
              }`}
            />
          ))}
        </div>

        {/* Пользовательские пресеты с удалением */}
        <div className="flex flex-wrap gap-3 items-center">
          {userPresets.map(color => (
            <div key={color} className="relative">
              <button
                onClick={() => setBgColor(color)}
                style={{ backgroundColor: color }}
                className={`w-10 h-10 rounded-full ring-2 transition ${
                  bgColor === color ? 'ring-primary' : 'ring-transparent'
                }`}
              />
              <button
                onClick={() => removeUserPreset(color)}
                className="absolute -top-1 -right-1 bg-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
              >
                &minus;
              </button>
            </div>
          ))}
          <button
            onClick={onAddColorClick}
            className="px-3 py-1 border rounded hover:bg-gray-100 transition"
          >
            Добавить цвет
          </button>
        </div>

        {/* Цветовой пикер поверх */}
        {showPicker && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="bg-surface rounded-lg p-4 space-y-4">
              <HexColorPicker
                color={tempPickerColor}
                onChange={setTempPickerColor}
              />
              <div className="flex justify-end space-x-2">
                <NavButton onClick={cancelPicker}>Отмена</NavButton>
                <NavButton onClick={confirmPicker}>OK</NavButton>
              </div>
            </div>
          </div>
        )}

        {/* Кнопки действия */}
        <div className="flex justify-end space-x-3 pt-4">
          <NavButton onClick={onClose}>Отмена</NavButton>
          <NavButton onClick={() => onSave({ title, bgColor })}>Сохранить</NavButton>
        </div>
      </div>
    </div>
  );
};
