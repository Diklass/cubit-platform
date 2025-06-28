// src/components/NavButton.tsx
import React from 'react';
import { NavLink, NavLinkProps } from 'react-router-dom';

type NavButtonProps =
  | ({ to: string } & NavLinkProps & { onClick?: never; children: React.ReactNode })
  | ({ onClick: () => void; to?: never; children: React.ReactNode });

/**
 * Пилюльная кнопка-навигатор в трёх состояниях:
 * - default: border, прозрачный bg
 * - hover: bg=light-gray
 * - active (для NavLink): bg=accent, text-white, border-transparent
 */
export const NavButton: React.FC<NavButtonProps> = props => {
  const base = [
    'h-[40px] px-[24px]',
    'flex items-center justify-center',
    'text-[16px] font-medium tracking-[0.1px]',
    'rounded-full transition-colors',
  ].join(' ');

  // Если передан to — рендерим NavLink
  if ('to' in props && props.to !== undefined) {
    return (
      <NavLink
        to={props.to}
        className={({ isActive }) =>
          [
            base,
            isActive
              ? 'bg-accent text-white border-transparent'
              : 'border border-gray-600 text-on-surface hover:bg-light-gray',
          ].join(' ')
        }
      >
        {props.children}
      </NavLink>
    );
  }

  // Иначе — обычная кнопка с "неактивным" стилем
  return (
    <button
      onClick={props.onClick}
      className={[
        base,
        // у кнопки из модального окна всегда default+hover
        'border border-gray-600 text-on-surface hover:bg-light-gray',
      ].join(' ')}
    >
      {props.children}
    </button>
  );
};
