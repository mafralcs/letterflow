export default function BackgroundPaths() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <svg
        className="absolute w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 0.1 }} />
            <stop offset="100%" style={{ stopColor: "hsl(var(--secondary))", stopOpacity: 0.05 }} />
          </linearGradient>
          <linearGradient id="grad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: "hsl(var(--secondary))", stopOpacity: 0.08 }} />
            <stop offset="100%" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 0.03 }} />
          </linearGradient>
        </defs>
        
        {/* Animated flowing paths */}
        <path
          d="M-100,200 Q200,100 500,200 T1100,200 Q1300,250 1600,200"
          fill="none"
          stroke="url(#grad1)"
          strokeWidth="2"
          opacity="0.4"
        >
          <animate
            attributeName="d"
            dur="20s"
            repeatCount="indefinite"
            values="
              M-100,200 Q200,100 500,200 T1100,200 Q1300,250 1600,200;
              M-100,250 Q200,150 500,250 T1100,250 Q1300,200 1600,250;
              M-100,200 Q200,100 500,200 T1100,200 Q1300,250 1600,200
            "
          />
        </path>
        
        <path
          d="M-100,400 Q300,300 600,400 T1200,400 Q1400,450 1700,400"
          fill="none"
          stroke="url(#grad2)"
          strokeWidth="3"
          opacity="0.3"
        >
          <animate
            attributeName="d"
            dur="25s"
            repeatCount="indefinite"
            values="
              M-100,400 Q300,300 600,400 T1200,400 Q1400,450 1700,400;
              M-100,350 Q300,450 600,350 T1200,350 Q1400,400 1700,350;
              M-100,400 Q300,300 600,400 T1200,400 Q1400,450 1700,400
            "
          />
        </path>
        
        <path
          d="M-100,600 Q250,500 550,600 T1150,600 Q1350,650 1650,600"
          fill="none"
          stroke="url(#grad1)"
          strokeWidth="2"
          opacity="0.25"
        >
          <animate
            attributeName="d"
            dur="30s"
            repeatCount="indefinite"
            values="
              M-100,600 Q250,500 550,600 T1150,600 Q1350,650 1650,600;
              M-100,650 Q250,550 550,650 T1150,650 Q1350,700 1650,650;
              M-100,600 Q250,500 550,600 T1150,600 Q1350,650 1650,600
            "
          />
        </path>

        {/* Floating circles */}
        <circle cx="200" cy="150" r="60" fill="url(#grad1)" opacity="0.15">
          <animate attributeName="cy" dur="15s" values="150;180;150" repeatCount="indefinite" />
        </circle>
        
        <circle cx="1200" cy="500" r="80" fill="url(#grad2)" opacity="0.1">
          <animate attributeName="cy" dur="18s" values="500;470;500" repeatCount="indefinite" />
        </circle>
        
        <circle cx="800" cy="300" r="50" fill="url(#grad1)" opacity="0.12">
          <animate attributeName="cy" dur="20s" values="300;330;300" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}
