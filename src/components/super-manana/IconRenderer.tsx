import React from 'react';
import {
  AlarmClock,
  Droplets,
  Brain,
  Activity,
  Scale,
  Flame,
  Snowflake,
  Sparkles,
  Heart,
  BookOpen,
  Target,
  Shield,
  Sun,
  Compass,
  CheckCircle2,
  Clock,
  Moon,
  Zap,
} from 'lucide-react';

interface IconRendererProps {
  name: string;
  className?: string;
}

export const IconRenderer: React.FC<IconRendererProps> = ({ name, className = 'w-5 h-5' }) => {
  switch (name) {
    case 'AlarmClock':
      return <AlarmClock className={className} />;
    case 'Droplets':
      return <Droplets className={className} />;
    case 'Brain':
      return <Brain className={className} />;
    case 'Activity':
      return <Activity className={className} />;
    case 'Scale':
      return <Scale className={className} />;
    case 'Flame':
      return <Flame className={className} />;
    case 'Snowflake':
      return <Snowflake className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'Heart':
      return <Heart className={className} />;
    case 'BookOpen':
      return <BookOpen className={className} />;
    case 'Target':
      return <Target className={className} />;
    case 'Shield':
      return <Shield className={className} />;
    case 'Sun':
      return <Sun className={className} />;
    case 'Compass':
      return <Compass className={className} />;
    case 'CheckCircle2':
      return <CheckCircle2 className={className} />;
    case 'Clock':
      return <Clock className={className} />;
    case 'Moon':
      return <Moon className={className} />;
    case 'Zap':
      return <Zap className={className} />;
    default:
      return <Sparkles className={className} />;
  }
};
