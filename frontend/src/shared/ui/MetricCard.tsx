type MetricCardProps = {
  border: string;
  caption: string;
  icon: string;
  title: string;
  value: string;
  className?: string;
  captionClassName?: string;
  dots?: string;
  iconClassName?: string;
  titleClassName?: string;
  valueClassName?: string;
};

export function MetricCard({
  border,
  caption,
  captionClassName = "mt-2 text-base font-medium text-[#43516a]",
  className = "min-h-[148px] p-5",
  dots,
  icon,
  iconClassName = "size-11",
  title,
  titleClassName = "text-lg font-black",
  value,
  valueClassName = "mt-5 text-4xl font-black leading-none",
}: MetricCardProps) {
  return (
    <article
      className={`relative overflow-hidden rounded-[12px] border-2 bg-white shadow-[0_18px_50px_rgba(28,40,65,0.04)] ${border} ${className}`}
    >
      <div className="flex items-center gap-4">
        <img src={icon} alt="" aria-hidden="true" className={iconClassName} />
        <h2 className={titleClassName}>{title}</h2>
      </div>
      {dots ? (
        <img
          src={dots}
          alt=""
          aria-hidden="true"
          className="absolute right-6 top-[58px] w-[44px] opacity-80"
        />
      ) : null}
      <p className={valueClassName}>{value}</p>
      <p className={captionClassName}>{caption}</p>
    </article>
  );
}
