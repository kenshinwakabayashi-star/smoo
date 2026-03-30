interface SmooLogoIconProps {
  size?: number
  variant?: 'dark' | 'light'
}

/**
 * smoo brand icon — two overlapping circles (Venn) with a house in the center.
 * variant="dark"  → dark green background (used on colored bg)
 * variant="light" → transparent background (used on white/pale bg)
 */
export function SmooLogoIcon({ size = 40, variant = 'dark' }: SmooLogoIconProps) {
  const bgFill = variant === 'dark' ? '#1a5c3a' : 'transparent'
  const leftCircleFill = variant === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.55)'
  const rightCircleFill = variant === 'dark' ? 'rgba(93,202,165,0.45)' : 'rgba(93,202,165,0.60)'
  const houseColor = variant === 'dark' ? '#ffffff' : '#1a5c3a'
  // Door fill punches through the house body — matches the bg for dark, pale for light
  const doorFill = variant === 'dark' ? '#1a5c3a' : '#f0f9f4'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {variant === 'dark' && <rect width="44" height="44" rx="12" fill={bgFill} />}
      {/* Left circle */}
      <circle cx="17" cy="22" r="13" fill={leftCircleFill} />
      {/* Right circle */}
      <circle cx="27" cy="22" r="13" fill={rightCircleFill} />
      {/* House icon centered in the overlap */}
      <path
        d="M22 13L13 20.5V32H18.5V26H25.5V32H31V20.5L22 13Z"
        fill={houseColor}
        opacity={variant === 'dark' ? 1 : 0.9}
      />
      {/* Door — filled with bg color to create opening in the house body */}
      <rect x="19.5" y="26" width="5" height="6" rx="1" fill={doorFill} />
    </svg>
  )
}

/** Full horizontal lockup: icon + wordmark */
interface SmooLogoFullProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'dark' | 'light'
  tagline?: boolean
}

export function SmooLogoFull({ size = 'md', variant = 'dark', tagline = false }: SmooLogoFullProps) {
  const iconSize = size === 'sm' ? 32 : size === 'lg' ? 56 : 44
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-2xl'
  const textColor = variant === 'dark' ? 'text-[#1c1c1a]' : 'text-white'
  const taglineColor = variant === 'dark' ? 'text-[#1a5c3a]/60' : 'text-white/60'

  return (
    <div className="flex flex-col items-center gap-3">
      <SmooLogoIcon size={iconSize} variant={variant} />
      <div className="text-center">
        <p className={`font-bold tracking-tight leading-none ${textSize} ${textColor}`}>smoo</p>
        {tagline && (
          <p className={`mt-1 text-sm ${taglineColor}`}>二人の家計をスムーズに</p>
        )}
      </div>
    </div>
  )
}
