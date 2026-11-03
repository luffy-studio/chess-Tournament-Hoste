import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check } from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';

export interface CopyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: string | (() => string);
  label?: string;
  copiedLabel?: string;
  successMessage?: string;
  errorMessage?: string;
  variant?: 'primary' | 'secondary' | 'subtle' | 'icon-only';
  size?: 'sm' | 'md' | 'lg';
  iconSize?: number;
  showToast?: boolean;
  onCopySuccess?: () => void;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  label = 'Copy',
  copiedLabel = 'Copied!',
  successMessage,
  errorMessage,
  variant = 'secondary',
  size = 'md',
  iconSize = 14,
  showToast = true,
  className = '',
  onCopySuccess,
  onClick,
  disabled,
  ...rest
}) => {
  const [copied, setCopied] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) onClick(e);
    if (disabled || isCopying) return;

    setIsCopying(true);
    const content = typeof text === 'function' ? text() : text;
    const success = await copyToClipboard(content, {
      successMessage,
      errorMessage,
      showToast,
    });

    setIsCopying(false);

    if (success) {
      setCopied(true);
      if (onCopySuccess) onCopySuccess();

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  };

  const baseStyles =
    'inline-flex items-center justify-center gap-1.5 font-medium rounded-full transition-all duration-150 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B08401] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] font-sans';

  const variantStyles = {
    primary: copied
      ? 'bg-[#5B6E57] text-[#FAF6F2] font-medium shadow-sm'
      : 'bg-[#B08401] text-[#FAF6F2] hover:bg-[#997200] font-semibold',
    secondary: copied
      ? 'bg-[#5B6E57]/15 text-[#5B6E57] border border-[#5B6E57]/40'
      : 'bg-[#FFFFFF] hover:bg-[#FAF6F2] text-[#683B2B] border border-[#DED1BD] hover:border-[#B08401] shadow-sm',
    subtle: copied
      ? 'bg-[#5B6E57]/15 text-[#5B6E57] border border-[#5B6E57]/40'
      : 'bg-transparent hover:bg-[#DED1BD]/40 text-[#7A6658] hover:text-[#683B2B] border border-transparent',
    'icon-only': copied
      ? 'p-2 bg-[#5B6E57]/15 text-[#5B6E57] border border-[#5B6E57]/40 rounded-full'
      : 'p-2 bg-[#FFFFFF] hover:bg-[#FAF6F2] text-[#7A6658] hover:text-[#683B2B] border border-[#DED1BD] rounded-full shadow-sm',
  }[variant];

  const sizeStyles =
    variant === 'icon-only'
      ? size === 'sm'
        ? 'p-1.5'
        : size === 'lg'
        ? 'p-2.5'
        : 'p-2'
      : size === 'sm'
      ? 'px-2.5 py-1 text-xs'
      : size === 'lg'
      ? 'px-4 py-2 text-sm'
      : 'px-3 py-1.5 text-xs';

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={disabled || isCopying}
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
      aria-label={copied ? copiedLabel : label}
      title={copied ? copiedLabel : label}
      {...rest}
    >
      {copied ? (
        <>
          <Check size={iconSize} className="text-[#5B6E57] shrink-0 animate-in zoom-in-50 duration-150" />
          {variant !== 'icon-only' && <span className="font-semibold text-[#5B6E57]">{copiedLabel}</span>}
        </>
      ) : (
        <>
          <Copy size={iconSize} className="shrink-0 opacity-70 group-hover:opacity-100 transition-opacity text-[#683B2B]" />
          {variant !== 'icon-only' && <span>{label}</span>}
        </>
      )}
    </button>
  );
};
