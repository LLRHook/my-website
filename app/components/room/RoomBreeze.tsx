import "./room-breeze.css";

/** A few CSS-driven details; the workspace owns pause and visibility state. */
export default function RoomBreeze() {
  return (
    <svg className="room-breeze" viewBox="0 0 1440 850" preserveAspectRatio="none" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="breeze-linen" x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#D8D2BD" /><stop offset=".25" stopColor="#F0EAD9" /><stop offset=".5" stopColor="#E8E1CC" /><stop offset=".75" stopColor="#F6F0DF" /><stop offset="1" stopColor="#D7D1BB" />
        </linearGradient>
      </defs>
      <g className="breeze-curtain">
        <path d="M34 487c-3 44-3 93-10 146 7 7 14 0 20 4 7 4 16-5 22-1 7 4 11 0 14-5-17-56-21-108-22-149l-24 5Z" fill="url(#breeze-linen)" />
        <path d="m38 490-5 131M48 490l4 140M57 504l13 124" stroke="#C5BDA5" strokeOpacity=".45" />
        <path d="M34 628c9 5 15-2 23 2s15-2 19-2" stroke="#F7F1DD" strokeOpacity=".55" strokeWidth="1.1" />
      </g>
      <g className="breeze-air" stroke="#FFFFE9" strokeWidth="1.35" strokeLinecap="round">
        <path className="breeze-thread breeze-thread-one" d="M122 363c28-14 41 13 73 1s50-11 68-3" />
        <path className="breeze-thread breeze-thread-two" d="M171 403c24-10 40 7 68-2s40-7 60-1" />
        <path className="breeze-thread breeze-thread-three" d="M245 283c18-10 28 4 50-3s37-7 48-2" />
      </g>
      <g className="breeze-leaf" fill="#B9C99F" stroke="#879E77" strokeWidth=".6">
        <path d="M309 392c-3-7 0-12 8-13 2 7-1 12-8 13Z" />
        <path d="m310 390 5-9" />
      </g>
    </svg>
  );
}
