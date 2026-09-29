import React from 'react';
import {
  Code2,
  Gamepad2,
  Layers,
  Smartphone,
  BookOpen,
  Terminal,
  Cpu,
  GraduationCap,
  Binary,
  Repeat,
  Boxes,
  Filter,
  Github,
  ListFilter,
  Globe,
  Compass,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';

interface ProjectIconProps {
  name: string;
  topic?: string;
  className?: string;
}

export const ProjectIcon: React.FC<ProjectIconProps> = ({ name, topic, className = "w-4 h-4" }) => {
  const norm = (name || '').toLowerCase();

  if (norm.includes('code') || norm === 'code2') return <Code2 className={className} />;
  if (norm.includes('game') || norm === 'gamepad2') return <Gamepad2 className={className} />;
  if (norm.includes('layer') || norm === 'layers') return <Layers className={className} />;
  if (norm.includes('phone') || norm === 'smartphone') return <Smartphone className={className} />;
  if (norm.includes('book') || norm === 'bookopen') return <BookOpen className={className} />;
  if (norm.includes('terminal')) return <Terminal className={className} />;
  if (norm.includes('cpu')) return <Cpu className={className} />;
  if (norm.includes('grad') || norm === 'graduationcap') return <GraduationCap className={className} />;
  if (norm.includes('binary')) return <Binary className={className} />;
  if (norm.includes('repeat')) return <Repeat className={className} />;
  if (norm.includes('box') || norm === 'boxes') return <Boxes className={className} />;
  if (norm.includes('filter') && !norm.includes('list')) return <Filter className={className} />;
  if (norm.includes('listfilter')) return <ListFilter className={className} />;
  if (norm.includes('github') || norm === 'git') return <Github className={className} />;
  if (norm.includes('globe')) return <Globe className={className} />;
  if (norm.includes('compass')) return <Compass className={className} />;
  if (norm.includes('sparkle') || norm === 'sparkles' || topic === 'google-ai') return <Sparkles className={className} />;

  // Topic fallbacks
  if (topic === 'html') return <Code2 className={className} />;
  if (topic === 'js') return <Terminal className={className} />;
  if (topic === 'google-ai') return <Sparkles className={className} />;

  return <LinkIcon className={className} />;
};
