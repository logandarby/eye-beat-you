import "./FunnyStickers.css";

export default function FunnyStickers() {
  return (
    <>
      <div className="cute-tag scale-75 sm:scale-100 origin-top-right">
        <div className="cute-tag-hello">
          <svg viewBox="0 0 120 20">
            <defs>
              <path
                id="curve"
                d={`M 10 25 Q 60 5 110 25`}
                fill="none"
              />
            </defs>
            <text>
              <textPath
                href="#curve"
                startOffset="50%"
                textAnchor="middle"
              >
                Hello
              </textPath>
            </text>
          </svg>
        </div>
        <span className="cute-tag-gorgeous">Gorgeous!</span>
      </div>
      <div className="warning-notice sticker-shine scale-75 sm:scale-100 origin-bottom-left">
        <div className="warning-notice-inner">
          <div className="warning-notice-title">WARNING:</div>
          <div className="warning-notice-text">
            Objects in mirror are more handsome than they appear.
          </div>
        </div>
      </div>

      <div className="circle-sticker sticker-shine scale-75 sm:scale-100 origin-left -translate-x-8 sm:translate-x-6">
        <svg viewBox="0 0 120 120">
          <defs>
            <path
              id="circle"
              d="M 60,60 m -45,0 a 45,45 0 1,1 90,0 a 45,45 0 1,1 -90,0"
              fill="none"
            />
          </defs>
          <text>
            <textPath href="#circle" startOffset="11%">
              My head is shaped like an egg.
            </textPath>
          </text>
          <g transform="translate(40, 85) scale(0.007, 0.007) translate(-640, -350) rotate(-90)">
            <path
              d="M3170 6659 c-585 -60 -1143 -473 -1582 -1172 -100 -160 -274 -504 -341 -677 -395 -1013 -421 -2054 -70 -2860 217 -501 537 -871 975 -1131 239 -142 477 -229 767 -280 145 -26 451 -36 604 -20 917 93 1661 711 1976 1639 70 204 117 420 146 667 23 189 23 566 1 778 -55 522 -198 1032 -419 1491 -190 394 -392 689 -656 960 -363 371 -735 566 -1158 606 -119 11 -122 11 -243 -1z"
              fill="var(--color-brand-cream)"
              stroke="var(--color-brand-dark)"
              strokeWidth="80"
            />
          </g>
        </svg>
      </div>

      <div className="encouragement-badge scale-75 sm:scale-100 origin-top-left">
        <div className="encouragement-text-bg"></div>
        <div className="encouragement-orange"></div>
        <svg viewBox="0 0 180 180">
          <defs>
            <path
              id="encouragement-circle"
              d="M 90,90 m -58,0 a 58,58 0 1,1 116,0 a 58,58 0 1,1 -116,0"
              fill="none"
            />
          </defs>
          <text>
            <textPath href="#encouragement-circle" startOffset="0%">
              You're doing amazing sweetie
            </textPath>
          </text>
          <g transform="rotate(126 90 90)">
            <g transform="translate(98, 20) scale(0.055, 0.055)">
              <path
                d="M6.839,137.02l46.417,47.774l-8.028,68.045l-0.045,0.619c-0.33,8.836,2.138,16.25,7.129,21.429c7.104,7.374,18.707,8.866,30.214,3.677l61.621-33.545l61.099,33.281l0.518,0.264c4.637,2.087,9.201,3.148,13.579,3.148c6.484,0,12.39-2.428,16.63-6.825c4.991-5.179,7.46-12.593,7.13-21.429l-8.079-68.664l45.793-47.05l0.624-0.724c6.398-8.417,8.415-18.073,5.535-26.482c-2.884-8.409-10.395-14.8-20.611-17.524l-68.781-11.09l-29.99-60.339l-0.452-0.792c-5.916-9.052-14.594-14.247-23.811-14.247c-8.861,0-17.113,4.634-23.247,13.035l-35.47,62.327L22.495,92.344l-0.853,0.193c-10.141,2.895-17.575,9.422-20.398,17.912C-1.58,118.935,0.456,128.624,6.839,137.02z"
                fill="var(--color-brand-cream)"
              />
            </g>
          </g>
        </svg>
      </div>

      <img
        src="/eye-beat-you/star.svg"
        alt="Star sticker"
        className="star-sticker sticker-shine scale-75 sm:scale-100 origin-bottom-right"
      />
    </>
  );
}
