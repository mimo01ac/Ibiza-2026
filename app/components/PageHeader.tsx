"use client";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  color?: "pink" | "cyan" | "purple" | "yellow";
}

const colorMap = {
  pink: "text-neon-pink text-glow-pink",
  cyan: "text-neon-cyan text-glow-cyan",
  purple: "text-neon-purple text-glow-purple",
  yellow: "text-neon-yellow text-glow-yellow",
};

export default function PageHeader({
  title,
  subtitle,
  color = "pink",
}: PageHeaderProps) {
  return (
    <div className="mb-8 text-center">
      <h2 className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${colorMap[color]}`}>
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-sm text-gray-400">{subtitle}</p>
      )}
      <div className="mx-auto mt-4 h-px w-32 bg-gradient-to-r from-transparent via-neon-purple to-transparent" />
    </div>
  );
}
