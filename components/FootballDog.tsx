'use client';

interface MascotProps {
  size?: number;
  animate?: boolean;
  mood?: 'happy' | 'thinking' | 'celebrating';
}

export function FootballDog({ size = 80, animate = true, mood = 'happy' }: MascotProps) {
  return (
    <div
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        animation: animate ? 'dogWag 1.5s ease-in-out infinite' : 'none',
      }}
    >
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
        {/* Body */}
        <ellipse cx="50" cy="65" rx="22" ry="18" fill="#D2936A" />
        
        {/* Head */}
        <circle cx="50" cy="38" r="22" fill="#D2936A" />
        
        {/* Ears */}
        <ellipse cx="32" cy="26" rx="9" ry="14" fill="#B8795A" transform="rotate(-15 32 26)" />
        <ellipse cx="68" cy="26" rx="9" ry="14" fill="#B8795A" transform="rotate(15 68 26)" />
        
        {/* Snout */}
        <ellipse cx="50" cy="44" rx="12" ry="9" fill="#E8B89A" />
        
        {/* Nose */}
        <ellipse cx="50" cy="39" rx="5" ry="3.5" fill="#3D2C2C" />
        
        {/* Eyes */}
        <circle cx="42" cy="33" r="4" fill="#3D2C2C" />
        <circle cx="58" cy="33" r="4" fill="#3D2C2C" />
        <circle cx="43.5" cy="31.5" r="1.5" fill="white" />
        <circle cx="59.5" cy="31.5" r="1.5" fill="white" />
        
        {/* Mouth */}
        {mood === 'happy' && (
          <path d="M 44 47 Q 50 52 56 47" stroke="#3D2C2C" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        )}
        {mood === 'celebrating' && (
          <>
            <path d="M 43 47 Q 50 54 57 47" stroke="#3D2C2C" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <ellipse cx="50" cy="50" rx="5" ry="3" fill="#FF6B88" />
          </>
        )}
        
        {/* Football scarf - green and white */}
        <rect x="30" y="56" width="40" height="6" rx="3" fill="#2d8a4e" />
        <rect x="30" y="56" width="8" height="6" rx="1" fill="white" />
        <rect x="46" y="56" width="8" height="6" rx="1" fill="white" />
        <rect x="62" y="56" width="8" height="6" rx="1" fill="white" />
        {/* Scarf tail */}
        <rect x="62" y="56" width="6" height="20" rx="3" fill="#2d8a4e" />
        <rect x="62" y="68" width="6" height="4" rx="1" fill="white" />
        
        {/* Tail */}
        <path d="M 72 65 Q 88 55 82 45" stroke="#D2936A" strokeWidth="6" fill="none" strokeLinecap="round" />
        
        {/* Paws */}
        <ellipse cx="35" cy="82" rx="9" ry="6" fill="#D2936A" />
        <ellipse cx="65" cy="82" rx="9" ry="6" fill="#D2936A" />
        
        {/* Football under paw */}
        <circle cx="65" cy="88" r="8" fill="white" stroke="#333" strokeWidth="1" />
        <path d="M 65 80 Q 70 84 68 89 Q 62 91 60 87 Q 62 82 65 80" fill="#333" />
        <path d="M 72 86 Q 71 90 67 91" stroke="#333" strokeWidth="0.8" fill="none" />
        <path d="M 58 88 Q 60 92 64 92" stroke="#333" strokeWidth="0.8" fill="none" />
        
        {/* Stars for celebrating */}
        {mood === 'celebrating' && (
          <>
            <text x="8" y="25" fontSize="12" fill="#F5C842">⭐</text>
            <text x="78" y="20" fontSize="10" fill="#F5C842">✨</text>
          </>
        )}
      </svg>
    </div>
  );
}
