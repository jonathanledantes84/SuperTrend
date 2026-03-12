export const LogoSVG = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M10 70 L35 45 C40 40, 50 40, 55 45 C60 50, 60 60, 55 65 C50 70, 40 70, 35 65 C30 60, 30 50, 35 45 L75 15"
      stroke="currentColor"
      strokeWidth="10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M75 15 L55 15 M75 15 L75 35"
      stroke="currentColor"
      strokeWidth="10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M45 55 L52 42 H45 L48 35 L40 48 H47 Z"
      fill="currentColor"
    />
  </svg>
);
