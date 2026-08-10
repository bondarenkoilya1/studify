type LoginFormHeaderProps = {
  title: string;
  description: string;
};

export function LoginFormHeader({ title, description }: LoginFormHeaderProps) {
  return (
    <div className="mb-7 flex flex-col items-center sm:mb-9">
      <h1 className="text-center text-3xl font-light tracking-[-0.03em] sm:text-4xl">
        {title}
      </h1>

      <p className="mt-3 max-w-sm text-center text-base leading-relaxed text-studify-muted sm:text-lg">
        {description}
      </p>
    </div>
  );
}
