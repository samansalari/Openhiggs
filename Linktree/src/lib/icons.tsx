import {
  BookOpen, Briefcase, Calendar, Camera, Code, Dribbble, Facebook, FileText, Figma, Github, Gitlab,
  Globe, Heart, Instagram, Link as LinkIcon, Linkedin, Mail, MapPin, Mic, Music, Newspaper, Phone,
  ShoppingBag, Sparkles, Star, Twitch, Twitter, Video, Youtube, type LucideIcon,
} from "lucide-react";
import type { ReactElement, SVGProps } from "react";

export const LINK_ICONS: Record<string, LucideIcon> = {
  link: LinkIcon, globe: Globe, briefcase: Briefcase, sparkles: Sparkles, newspaper: Newspaper,
  "file-text": FileText, calendar: Calendar, mail: Mail, phone: Phone, "book-open": BookOpen,
  code: Code, camera: Camera, video: Video, music: Music, mic: Mic, "shopping-bag": ShoppingBag,
  heart: Heart, star: Star, "map-pin": MapPin, linkedin: Linkedin, github: Github,
  instagram: Instagram, youtube: Youtube, figma: Figma, dribbble: Dribbble,
};

export function LinkIconView({ name, className }: { name: string | null | undefined; className?: string }) {
  const Icon = (name && LINK_ICONS[name]) || LinkIcon;
  return <Icon className={className} aria-hidden="true" />;
}

/** Favicon URL for a link's domain, or null when the URL can't be parsed. */
export function faviconUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`;
  } catch {
    return null;
  }
}

function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.46 21H2.39l7.17-8.2L2 3h6.33l4.37 5.77L17.75 3Zm-1.08 16.17h1.7L7.4 4.74H5.58l11.09 14.43Z" />
    </svg>
  );
}
function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-2.59-2.6c.27 0 .53.04.77.12V9.77a5.7 5.7 0 1 0 4.91 5.63V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.3 4.3 0 0 1-3.24-1.48Z" />
    </svg>
  );
}

type IconComp = (p: { className?: string | undefined }) => ReactElement;
const wrap = (I: LucideIcon): IconComp => (p) => <I {...p} aria-hidden="true" />;
const wrapSvg = (I: (p: SVGProps<SVGSVGElement>) => ReactElement): IconComp => (p) => <I {...p} aria-hidden="true" />;

export const SOCIAL_PLATFORMS: Record<string, { label: string; icon: IconComp }> = {
  instagram: { label: "Instagram", icon: wrap(Instagram) },
  linkedin: { label: "LinkedIn", icon: wrap(Linkedin) },
  x: { label: "X", icon: wrapSvg(XIcon) },
  tiktok: { label: "TikTok", icon: wrapSvg(TikTokIcon) },
  youtube: { label: "YouTube", icon: wrap(Youtube) },
  github: { label: "GitHub", icon: wrap(Github) },
  gitlab: { label: "GitLab", icon: wrap(Gitlab) },
  facebook: { label: "Facebook", icon: wrap(Facebook) },
  twitter: { label: "Twitter", icon: wrap(Twitter) },
  twitch: { label: "Twitch", icon: wrap(Twitch) },
  dribbble: { label: "Dribbble", icon: wrap(Dribbble) },
  figma: { label: "Figma", icon: wrap(Figma) },
  email: { label: "Email", icon: wrap(Mail) },
  website: { label: "Website", icon: wrap(Globe) },
};

export function SocialIconView({ platform, className }: { platform: string; className?: string }) {
  const Icon = SOCIAL_PLATFORMS[platform]?.icon ?? wrap(Globe);
  return <Icon className={className} />;
}
