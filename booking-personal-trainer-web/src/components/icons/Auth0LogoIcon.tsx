export default function Auth0LogoIcon({
  className = "",
  "aria-label": ariaLabel = "Auth0 logo",
}: {
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      role="img"
      aria-label={ariaLabel}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="currentColor"
        d="M12 2.25l7.5 3.3v6.55c0 5.02-3.27 9.17-7.5 9.65-4.23-.48-7.5-4.63-7.5-9.65V5.55L12 2.25zm0 4.1l-1.36 2.33-2.64.55 1.8 2.01-.26 2.73L12 13l2.46.97-.26-2.73 1.8-2.01-2.64-.55L12 6.35z"
      />
    </svg>
  );
}

