import React from 'react';
import ProcessedLogo from './ProcessedLogo';

interface LogoProps {
  className?: string;
  white?: boolean;
  height?: number;
}

const Logo: React.FC<LogoProps> = ({ className = "", white = false, height = 60 }) => {
  return <ProcessedLogo className={className} height={height} />;
};

export default Logo;