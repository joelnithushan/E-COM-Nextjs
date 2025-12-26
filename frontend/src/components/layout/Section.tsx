import React from 'react';
import { cn } from '@/lib/utils';
import Container from './Container';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  background?: 'white' | 'gray' | 'primary' | 'transparent';
}

const Section: React.FC<SectionProps> = ({
  children,
  className,
  containerClassName,
  containerSize = 'lg',
  padding = 'md',
  background = 'transparent',
}) => {
  const paddingClasses = {
    none: '',
    sm: 'py-8 md:py-12',
    md: 'py-12 md:py-16 lg:py-20',
    lg: 'py-16 md:py-20 lg:py-24',
    xl: 'py-20 md:py-24 lg:py-32',
  };

  const backgroundClasses = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    primary: 'bg-primary-50',
    transparent: '',
  };

  return (
    <section
      className={cn(
        paddingClasses[padding],
        backgroundClasses[background],
        className
      )}
    >
      <Container size={containerSize} className={containerClassName}>
        {children}
      </Container>
    </section>
  );
};

export default Section;




