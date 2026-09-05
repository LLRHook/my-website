import "./room-motion.css";

/** Small, reusable vector details; all idle motion stays in CSS. */
export default function RoomAtmosphere() {
  return (
    <svg className="room-atmosphere" viewBox="0 0 1440 850" preserveAspectRatio="none" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="room-attention-light" cx="0" cy="0" r="1" gradientTransform="translate(547 506) rotate(35) scale(332 111)" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF8D8" stopOpacity=".5" /><stop offset=".65" stopColor="#FFF5CA" stopOpacity=".2" /><stop offset="1" stopColor="#FFF9DD" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="room-soft-shade" x1="340" y1="380" x2="695" y2="687" gradientUnits="userSpaceOnUse">
          <stop stopColor="#526442" stopOpacity=".09" /><stop offset=".7" stopColor="#526442" stopOpacity=".045" /><stop offset="1" stopColor="#526442" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g className="atmosphere-light">
        <ellipse className="atmosphere-light-breath" cx="547" cy="506" rx="375" ry="255" fill="url(#room-attention-light)" />
      </g>
      <g className="atmosphere-canopy" fill="url(#room-soft-shade)">
        <path d="M293 358c82 46 152 118 254 198 50 41 99 82 155 130l-11 4c-52-49-101-86-151-124-89-67-173-157-250-201l3-7Z" />
        <path d="M366 424c-36-12-64-6-81-24 31-11 66-4 81 24Zm19 6c-13-37-8-61-21-80 32 13 49 50 21 80Zm63 57c-49-24-86-13-113-37 36-15 90-6 113 37Zm17 2c-8-42 5-69-4-91 38 24 45 66 4 91Z" />
        <path d="M515 544c-51-21-81-4-114-25 47-22 87-5 114 25Zm27 8c-13-44 6-75 1-100 35 28 34 74-1 100Zm53 62c-44-19-89-12-102-32 39-13 81-1 102 32Zm18-5c-5-39 10-61 5-84 30 22 25 65-5 84Z" />
      </g>
      <g className="atmosphere-motes" fill="#FFF9DE">
        <circle className="room-mote mote-one" cx="315" cy="370" r="1.35" />
        <circle className="room-mote mote-two" cx="398" cy="434" r="1.1" />
        <circle className="room-mote mote-three" cx="459" cy="379" r="1.45" />
        <circle className="room-mote mote-four" cx="492" cy="527" r=".9" />
        <circle className="room-mote mote-five" cx="354" cy="491" r="1.15" />
        <circle className="room-mote mote-six" cx="605" cy="581" r="1.25" />
      </g>
    </svg>
  );
}
