export default function TopoBackground({ dimmed = false }) {
  return (
    <svg
      className="topo-bg"
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="400" height="400" fill="var(--paper)" />
      <g fill="none" stroke="var(--line)" strokeWidth="1.4" opacity={dimmed ? 0.5 : 1}>
        <path d="M-20,60 C60,20 120,90 200,50 C280,10 340,70 420,40" />
        <path d="M-20,110 C60,70 130,140 210,100 C290,60 350,120 420,90" />
        <path d="M-20,160 C70,130 140,190 220,155 C300,120 360,175 420,150" />
        <path d="M-20,260 C60,230 130,290 210,250 C290,215 350,270 420,240" />
        <path d="M-20,310 C70,280 140,335 220,300 C300,270 360,320 420,295" />
        <path d="M-20,360 C60,335 130,385 210,350 C290,320 350,375 420,345" />
      </g>
    </svg>
  );
}
