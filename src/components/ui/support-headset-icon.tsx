import type { SVGProps } from "react";

export function SupportHeadsetIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g
        stroke="#111111"
        strokeWidth="2.45"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <rect x="22" y="21" width="20" height="20" rx="6" />
        <circle cx="32" cy="28" r="3" />
        <path d="M27 34h10" />
        <path d="M28 22v-3" />
        <path d="M36 22v-3" />
        <path d="M24 30h-4" />
        <path d="M40 30h4" />
      </g>
    </svg>
  );
}
