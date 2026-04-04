4/
├── src/
│   ├── ai/                # Genkit AI flows and configuration
│   │   ├── flows/         # Contains all the AI-powered logic
│   │   │   ├── summarize-external-content-flow.ts
│   │   │   └── summarize-my-note.ts
│   │   └── genkit.ts      # Genkit plugin and model configuration
│   │
│   ├── app/               # Next.js App Router pages and layouts
│   │   ├── globals.css    # Global styles and Tailwind directives
│   │   ├── layout.tsx     # The root layout for the entire app
│   │   └── page.tsx       # The main page component for the app
│   │
│   ├── components/        # Reusable React components
│   │   ├── ui/            # Core UI components from ShadCN
│   │   ├── note-panel.tsx # The main draggable note window
│   │   └── summarizer-dialog.tsx # The dialog for summarizing content
│   │
│   ├── hooks/             # Custom React hooks for shared logic
│   │   ├── use-local-storage.ts # Manages saving notes to the browser
│   │   ├── use-mobile.tsx # Detects if the user is on a mobile device
│   │   └── use-toast.ts   # Handles showing toast notifications
│   │
│   └── lib/               # Shared utilities, types, and constants
│       ├── placeholder-images.json # Data for placeholder images
│       ├── placeholder-images.ts # Loads placeholder image data
│       ├── types.ts       # TypeScript type definitions (like the Note type)
│       └── utils.ts       # Utility functions, like cn() for classnames
│
├── .env                   # Environment variables (e.g., API keys)
├── next.config.ts         # Configuration for the Next.js framework
├── package.json           # Project dependencies and scripts
├── tailwind.config.ts     # Tailwind CSS theme and configuration
└── tsconfig.json          # TypeScript compiler options
