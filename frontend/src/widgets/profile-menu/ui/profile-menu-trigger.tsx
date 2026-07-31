interface Props {
  email: string;
  userId: number;
  isOpen: boolean;
  onClick: () => void;
}

export function ProfileMenuTrigger({ email, userId, isOpen, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      aria-expanded={isOpen}
      aria-haspopup="menu"
      className="..."
    >
      <span>{email}</span>

      <span>ID: #{userId}</span>
    </button>
  );
}
