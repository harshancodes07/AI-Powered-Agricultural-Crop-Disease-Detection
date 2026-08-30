/*
 * Plant motifs drawn in the same single-weight line as the kolam, so the
 * botanical and the traditional read as one hand rather than clip art
 * dropped next to a pattern.
 *
 * The four plants are the four crops the model actually supports, so a
 * motif always tells the reader something true about the screen it marks.
 */

const PATHS = {
  // Paddy — nel. A drooping grain head, the crop of the Cauvery delta.
  paddy: (
    <>
      <path d="M32 60V22" />
      <path d="M32 30c0-7 6-12 13-12-1 8-6 12-13 12zM32 40c0-7-6-12-13-12 1 8 6 12 13 12zM32 50c0-7 6-12 13-12-1 8-6 12-13 12z" />
    </>
  ),
  // Neem — vembu. The village pharmacy tree; pinnate leaflets on a rachis.
  neem: (
    <>
      <path d="M32 60C32 40 32 26 32 14" />
      <path d="M32 22c-6-6-14-6-18-2 5 6 13 7 18 2zM32 22c6-6 14-6 18-2-5 6-13 7-18 2zM32 36c-6-6-14-6-18-2 5 6 13 7 18 2zM32 36c6-6 14-6 18-2-5 6-13 7-18 2z" />
    </>
  ),
  // Banana leaf — vaazhai. Split blade, the plate every Tamil meal is served on.
  banana: (
    <>
      <path d="M32 62V16" />
      <path d="M32 18c14 2 20 14 18 30-10 2-18-6-18-18zM32 18c-14 2-20 14-18 30 10 2 18-6 18-18z" />
      <path d="M32 26l12 6M32 36l11 6M32 26l-12 6M32 36l-11 6" />
    </>
  ),
  // Maize — cholam. Cob with husk peeled back.
  maize: (
    <>
      <path d="M32 62V44" />
      <path d="M32 44c-9 0-14-8-14-18s5-16 14-16 14 6 14 16-5 18-14 18z" />
      <path d="M32 12v32M25 16l14 4M25 24l14 4M25 32l14 4" />
    </>
  )
}

/** Maps the API's crop values onto a motif; unknown crops get the neem. */
export const CROP_MOTIF = {
  rice: 'paddy',
  corn: 'maize',
  tomato: 'banana',
  potato: 'paddy',
  other: 'neem'
}

export default function PlantMotif({ name = 'neem', size = 40, className = '', strokeWidth = 2.2 }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[name] || PATHS.neem}
    </svg>
  )
}
