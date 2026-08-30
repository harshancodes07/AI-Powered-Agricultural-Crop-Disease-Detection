/*
 * The service mark: a gopuram silhouette whose tiers resolve into a leaf.
 *
 * Temple towers step upward in named tiers and Tamil Nadu's are the most
 * recognisable thing on its skyline; a leaf growing out of one says what
 * this particular service is for. Drawn in the kolam's single line weight.
 *
 * This is an invented mark for a demonstration project. It deliberately does
 * not reproduce any real state or departmental emblem.
 */
export default function Emblem({ size = 44, className = '' }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Three stepped tiers of the tower. */}
      <path d="M14 56h36M17 56V44h30v12M20 44V34h24v10M24 34V26h16v8" />
      {/* The finial opens into a leaf instead of a kalasam. */}
      <path d="M32 26V14" />
      <path d="M32 20c0-6 4-10 9-10 0 6-4 10-9 10zM32 20c0-6-4-10-9-10 0 6 4 10 9 10z" />
      {/* A pulli at the apex, tying the mark to the kolam grammar. */}
      <circle cx="32" cy="9" r="2" fill="currentColor" stroke="none" />
    </svg>
  )
}
