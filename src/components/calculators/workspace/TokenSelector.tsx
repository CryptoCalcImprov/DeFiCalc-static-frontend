"use client";

import type { ChangeEvent, KeyboardEvent } from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import clsx from "clsx";

import {
  type CoinGeckoAsset,
  useCoinGeckoAssetSearch,
} from "@/hooks/useCoinGeckoAssetSearch";

export type TokenSelectorProps = {
  value: string;
  onSelect: (value: string, asset?: CoinGeckoAsset) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  name?: string;
  id?: string;
  className?: string;
};

export function TokenSelector({
  value,
  onSelect,
  placeholder,
  required,
  disabled,
  name,
  id,
  className,
}: TokenSelectorProps) {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const resolvedId = id ?? generatedId;

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const { assets, isLoading, error } = useCoinGeckoAssetSearch(inputValue);

  const listboxId = useMemo(() => `${resolvedId}-listbox`, [resolvedId]);

  useEffect(() => {
    if (!isOpen || assets.length === 0) {
      setFocusedIndex(-1);
      return;
    }

    const existingIndex = assets.findIndex((asset) => asset.symbol === inputValue.toUpperCase());
    if (existingIndex >= 0) {
      setFocusedIndex(existingIndex);
      return;
    }

    setFocusedIndex(0);
  }, [isOpen, assets, inputValue]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current) {
        return;
      }

      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setInputValue(nextValue);
    onSelect(nextValue);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleOptionSelect = (asset: CoinGeckoAsset) => {
    setInputValue(asset.symbol);
    onSelect(asset.symbol, asset);
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = () => {
    window.setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    }, 100);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        setIsOpen(true);
        event.preventDefault();
      }
      return;
    }

    if (!assets.length) {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setFocusedIndex((current) => {
        const nextIndex = current + 1;
        if (nextIndex >= assets.length) {
          return assets.length - 1;
        }
        return nextIndex;
      });
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setFocusedIndex((current) => {
        const nextIndex = current - 1;
        if (nextIndex < 0) {
          return 0;
        }
        return nextIndex;
      });
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < assets.length) {
        handleOptionSelect(assets[focusedIndex]);
      } else {
        setIsOpen(false);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      setFocusedIndex(-1);
      return;
    }
  };

  const renderStatusMessage = () => {
    if (isLoading) {
      return (
        <li className="px-3 py-2 text-xs text-muted" role="presentation">
          Loading tokens…
        </li>
      );
    }

    if (error) {
      return (
        <li className="px-3 py-2 text-xs text-critical/90" role="presentation">
          {error}
        </li>
      );
    }

    if (!assets.length) {
      return (
        <li className="px-3 py-2 text-xs text-muted" role="presentation">
          No tokens found. Try another search.
        </li>
      );
    }

    return null;
  };

  return (
    <div ref={containerRef} className={clsx("relative", className)}>
      <input
        id={resolvedId}
        name={name}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleInputKeyDown}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={
          focusedIndex >= 0 ? `${listboxId}-option-${focusedIndex}` : undefined
        }
        className="w-full rounded-xl border border-ocean/60 bg-surface/90 px-3 py-1.5 text-sm text-slate-50 placeholder:text-slate-500 shadow-inner focus:border-mint focus:bg-surface/95 focus:outline-none focus:ring-1 focus:ring-mint/35 disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-2xl sm:px-4 sm:py-2 sm:text-base"
      />
      {isOpen || isLoading ? (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-ocean/40 bg-slate-900/95 shadow-xl backdrop-blur-sm sm:rounded-2xl">
          <ul role="listbox" id={listboxId} aria-label="Token suggestions" className="max-h-60 overflow-y-auto py-1">
            {assets.map((asset, index) => {
              const isFocused = index === focusedIndex;
              return (
                <li
                  key={asset.symbol}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={isFocused}
                  className={clsx(
                    "flex cursor-pointer flex-col gap-0.5 px-3 py-2 text-xs text-slate-100 transition sm:text-sm",
                    isFocused ? "bg-mint/15 text-mint" : "hover:bg-slate-800/60",
                  )}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    handleOptionSelect(asset);
                  }}
                  onMouseEnter={() => setFocusedIndex(index)}
                >
                  <span className="font-semibold tracking-wide">{asset.symbol}</span>
                  <span className="text-[11px] text-slate-400 sm:text-xs">{asset.name}</span>
                </li>
              );
            })}
            {(isLoading || error || !assets.length) && renderStatusMessage()}
          </ul>
        </div>
      ) : null}
      {!isOpen && error ? (
        <p className="mt-1 text-xs text-critical/90 sm:text-sm">{error}</p>
      ) : null}
    </div>
  );
}
