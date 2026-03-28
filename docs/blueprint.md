# **App Name**: NoteFlow

## Core Features:

- Note Editor: A customizable rich text editor within the application for writing, copying, pasting text, and applying basic formatting like font height and type. Includes standard controls for save, insert (paste from clipboard), and app information.
- Dynamic Floating UI: A resizable and draggable application window that can remain always-on-top of other content, with options for adjusting translucency, minimizing to a 120x120 pixel 'docked' state (20% occupancy), and maximizing up to screen size.
- Information Ingestion Tool: A generative AI tool that can process pasted text content or URLs, intelligently extracting and summarizing key information directly into the note canvas for quick review and integration.
- Note Persistence: Basic functionality to save the current note's content and its UI state (position, size, transparency settings) to ensure data is retained across sessions and retrieved upon application launch.
- Split Canvas View: A feature to 'tear off' the current note's content into a separate, independent floating window instance, effectively creating a second parallel workspace for multi-tasking.
- Ephemeral Text Dissolve: A user-triggered visual effect that gently dissolves the note's text content into the background of the canvas, offering a temporary clear slate or a sense of completion without deleting the actual data.

## Style Guidelines:

- The primary mode uses a light scheme, with a very light, almost white background (#F0F2F5) that has a subtle cool tint, paired with deep charcoal-like text (#1F2327).
- The primary accent color is a clean, mid-toned cyan (#3CDCDC) which offers a bright and active visual highlight for interactive elements and call-to-actions, chosen to be analogous to the main color.
- For interface elements and subtle visual cues, a refined desaturated blue (#476684) provides a calm yet grounding presence that contrasts effectively against the light background.
- A dark mode is also provided, featuring a very dark, slightly bluish-grey background (#22262A) with crisp white text (#F8FAFC) to minimize eye strain in low-light environments.
- All text within the application uses the 'Inter' font (sans-serif), chosen for its exceptional readability across various sizes, its modern, neutral aesthetic, and its versatile performance for both headlines and body copy in a functional note-taking context.
- A set of simple, clear line-based icons is used to represent controls and features. Icons maintain a minimalist aesthetic, ensuring quick comprehension and blending seamlessly with the app's clean visual design.
- The main note application is presented as a flexible floating panel, featuring a clear header area that consolidates essential controls (save, font, insert, info) for easy access, ensuring the content area remains central and unobstructed.
- Subtle, fluid animations enhance user interactions, including smooth transitions for dragging, resizing, minimizing, and maximizing the note panel, as well as a graceful 'dissolve' effect for the text content when triggered.