"use client";

import Image from "next/image";

const SIZES = {
  xs: 20,
  sm: 24,
  md: 32,
  lg: 48,
} as const;

interface UserAvatarProps {
  src?: string | null;
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
}

export default function UserAvatar({
  src,
  name,
  size = "md",
  className = "",
}: UserAvatarProps) {
  const px = SIZES[size];
  const letter = name?.charAt(0)?.toUpperCase() || "?";

  if (src) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-full ${className}`}
        style={{ width: px, height: px }}
      >
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          sizes={`${px}px`}
        />
      </div>
    );
  }

  const fontSize =
    size === "xs"
      ? "text-[10px]"
      : size === "sm"
        ? "text-[11px]"
        : size === "md"
          ? "text-sm"
          : "text-lg";

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gray-800 font-semibold text-neon-pink ${fontSize} ${className}`}
      style={{ width: px, height: px }}
    >
      {letter}
    </div>
  );
}
