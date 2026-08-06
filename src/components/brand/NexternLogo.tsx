import Image from 'next/image';
import type { CSSProperties, ReactNode } from 'react';

const LOGO_SRC = '/nextern_logo_2.png';
const LOGO_IMAGE_SIZE = 2000;

type NexternLogoMarkProps = {
  alt?: string;
  priority?: boolean;
  radius?: number;
  shadow?: string;
  size?: number;
  style?: CSSProperties;
};

export function NexternLogoMark({
  alt = 'Nextern logo',
  priority = false,
  radius = 8,
  shadow,
  size = 36,
  style,
}: NexternLogoMarkProps) {
  return (
    <span
      style={{
        alignItems: 'center',
        background: '#172033',
        borderRadius: radius,
        boxShadow: shadow,
        display: 'inline-flex',
        flex: '0 0 auto',
        height: size,
        justifyContent: 'center',
        overflow: 'hidden',
        width: size,
        ...style,
      }}
    >
      <Image
        src={LOGO_SRC}
        alt={alt}
        width={LOGO_IMAGE_SIZE}
        height={LOGO_IMAGE_SIZE}
        priority={priority}
        sizes={`${size}px`}
        style={{
          display: 'block',
          height: '100%',
          objectFit: 'contain',
          transform: 'scale(1.42)',
          width: '100%',
        }}
      />
    </span>
  );
}

type NexternLogoProps = {
  dotColor?: string;
  gap?: number;
  markRadius?: number;
  markShadow?: string;
  markSize?: number;
  priority?: boolean;
  stackStyle?: CSSProperties;
  style?: CSSProperties;
  subtitle?: ReactNode;
  subtitleColor?: string;
  subtitleGap?: number;
  subtitleSize?: number;
  textColor?: string;
  textSize?: number;
  textStyle?: CSSProperties;
  textWeight?: number;
};

export function NexternLogo({
  dotColor = '#22D3EE',
  gap = 10,
  markRadius = 8,
  markShadow,
  markSize = 36,
  priority = false,
  stackStyle,
  style,
  subtitle,
  subtitleColor = '#94A3B8',
  subtitleGap = 4,
  subtitleSize = 12,
  textColor = '#FFFFFF',
  textSize = 20,
  textStyle,
  textWeight = 800,
}: NexternLogoProps) {
  return (
    <span
      style={{
        alignItems: 'center',
        display: 'inline-flex',
        gap,
        ...style,
      }}
    >
      <NexternLogoMark
        alt=""
        priority={priority}
        radius={markRadius}
        shadow={markShadow}
        size={markSize}
      />
      <span
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          lineHeight: 1.1,
          ...stackStyle,
        }}
      >
        <span
          style={{
            color: textColor,
            fontFamily: 'var(--font-display)',
            fontSize: textSize,
            fontWeight: textWeight,
            letterSpacing: 0,
            ...textStyle,
          }}
        >
          nextern<span style={{ color: dotColor }}>.</span>
        </span>
        {subtitle ? (
          <span style={{ color: subtitleColor, fontSize: subtitleSize, marginTop: subtitleGap }}>
            {subtitle}
          </span>
        ) : null}
      </span>
    </span>
  );
}
