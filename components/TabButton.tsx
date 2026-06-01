import type { ElementType } from "react";

export interface TabButtonProps {
  iconComponent: ElementType<{ active: boolean }>;
  onClick: () => void;
  active: boolean;
}

export const TabButton = ({ iconComponent: Icon, onClick, active }: TabButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="All posts"
    aria-pressed={active}
    className={`cursor-pointer relative flex h-11 items-center justify-center transition-colors border-b-2 ${active ? "border-[#262626] text-[#262626]" : "border-[#dbdbdb] text-[#8e8e8e] hover:text-[#262626]"}`}
  >
    <Icon active={active} />
  </button>
)