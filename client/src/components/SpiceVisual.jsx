const tones = {
  cardamom: "#6d8a52",
  clove: "#7a5340",
  "cinnamon-stick": "#a06b45",
  "black-pepper": "#3c3a32",
  "star-anise": "#8a6a4a",
  mace: "#c4a15a",
  nutmeg: "#b4834e",
  "bay-leaf": "#4f6b45",
};

function moundColor(id) {
  if (tones[id]) return tones[id];
  const palette = ["#b55245", "#c4a15a", "#6d8a52", "#7a5340", "#3c3a32", "#b4834e"];
  let index = 0;
  for (const char of id) index = (index + char.charCodeAt(0)) % palette.length;
  return palette[index];
}

export function SpiceVisual({ product, className = "" }) {
  if (product.image) {
    return <img src={product.image} alt={product.name} className={`object-cover ${className}`} />;
  }

  const fill = moundColor(product.id);
  return (
    <svg viewBox="0 0 400 300" role="img" aria-label={product.name} className={className}>
      <rect width="400" height="300" fill="#f3efe6" />
      <circle cx="48" cy="46" r="2" fill="#ddd2be" />
      <circle cx="340" cy="70" r="2.5" fill="#ddd2be" />
      <circle cx="310" cy="250" r="2" fill="#ddd2be" />
      <ellipse cx="200" cy="214" rx="128" ry="26" fill="#e6dccb" />
      <path d="M92 176c18 28 198 28 216 0 8 18-20 42-108 42S84 194 92 176z" fill="#c4b09a" />
      <ellipse cx="200" cy="168" rx="104" ry="38" fill="#d4c2aa" />
      <ellipse cx="200" cy="154" rx="86" ry="36" fill={fill} />
      <ellipse cx="168" cy="140" rx="28" ry="12" fill="#fff" opacity="0.2" />
    </svg>
  );
}

export function HeroArt() {
  return (
    <svg viewBox="0 0 640 520" className="h-full w-full" role="img" aria-label="Bowls of whole spices">
      <rect width="640" height="520" rx="28" fill="#f3efe6" />
      <path d="M40 430c80-30 480-30 560 0" fill="none" stroke="#ddd4c4" strokeWidth="18" />
      <Bowl x="170" y="150" fill="#c4a15a" />
      <Bowl x="430" y="128" fill="#b55245" />
      <Bowl x="210" y="300" fill="#6d8a52" />
      <Bowl x="450" y="292" fill="#a06b45" />
      <path d="M250 250c40 8 70 6 96-8" fill="none" stroke="#7a5340" strokeWidth="6" strokeLinecap="round" />
      <path d="M338 236c8 16-6 28-20 24" fill="none" stroke="#7a5340" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

function Bowl({ x, y, fill }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy="78" rx="92" ry="18" fill="#e6dccb" />
      <path d="M-78 18c12 36 144 36 156 0 6 22-16 48-78 48S-84 40-78 18z" fill="#c4b09a" />
      <ellipse cx="0" cy="10" rx="74" ry="28" fill="#d4c2aa" />
      <ellipse cx="0" cy="0" rx="60" ry="26" fill={fill} />
      <ellipse cx="-22" cy="-10" rx="18" ry="8" fill="#fff" opacity="0.18" />
    </g>
  );
}
