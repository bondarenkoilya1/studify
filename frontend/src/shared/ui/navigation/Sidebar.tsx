import { Link } from "react-router-dom";

export type SidebarItem = {
  label: string;
  icon: string;
  to: string;
  active?: boolean;
};

type SidebarProps = {
  items: SidebarItem[];
  avatar: string;
  chevron: string;
  profileName?: string;
  footerMessage?: string;
  itemTextClassName?: string;
};

export function Sidebar({
  items,
  avatar,
  chevron,
  footerMessage,
  itemTextClassName = "text-[#43516a]",
  profileName = "Logan",
}: SidebarProps) {
  return (
    <aside className="hidden min-h-[calc(100vh-92px)] border-r border-[#e1e6ef] bg-white px-5 py-8 lg:flex lg:flex-col">
      <nav className="grid gap-5">
        {items.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className={`flex h-14 items-center gap-5 rounded-[8px] px-5 text-base font-semibold transition ${
              item.active
                ? "bg-[#f3edff] text-[#5d20d8]"
                : `${itemTextClassName} hover:bg-[#f6f8fc] hover:text-[#5d20d8]`
            }`}
          >
            <img src={item.icon} alt="" aria-hidden="true" className="size-7 shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto">
        {footerMessage ? (
          <div className="mb-8 rounded-[8px] bg-[#f5f1ff] px-6 py-8 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-[8px] text-[#6f2bd9]">
              <span className="text-5xl leading-none">✧</span>
            </div>
            <p className="text-base font-bold leading-snug text-[#5d20d8]">{footerMessage}</p>
          </div>
        ) : null}

        <button
          className="flex h-14 w-full items-center justify-between rounded-[8px] border border-[#dce2eb] bg-white px-4 shadow-sm"
          aria-label="Open profile menu"
        >
          <span className="flex items-center gap-3">
            <img src={avatar} alt="" className="size-8 rounded-[8px]" />
            <span className="font-semibold">{profileName}</span>
          </span>
          <img src={chevron} alt="" aria-hidden="true" className="size-6" />
        </button>
      </div>
    </aside>
  );
}
