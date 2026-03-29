'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { Note } from '@/lib/types';
import { NotePanel } from '@/components/note-panel';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { FilePlus2 } from 'lucide-react';

const initialNote: Note = {
  id: `note-${Date.now()}`,
  content: `Welcome to Conveyer!

- Drag to move this window.
- Resize from the bottom-right corner.
- Use the menu for more options: split the page, summarize content, and more.`,
  x: 100,
  y: 100,
  width: 450,
  height: 300,
  isDocked: false,
  isMaximized: false,
  isTransparent: false,
  isDissolved: false,
  zIndex: 1,
};

export default function Home() {
  const [notes, setNotes] = useLocalStorage<Note[]>('notes', []);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const handleCreateFirstNote = () => {
    setNotes([initialNote]);
  }

  const bringToFront = useCallback((id: string) => {
    setNotes(prevNotes => {
      const maxZIndex = Math.max(0, ...prevNotes.map(n => n.zIndex));
      if (prevNotes.find(n => n.id === id)?.zIndex === maxZIndex) {
        return prevNotes;
      }
      return prevNotes.map(note =>
        note.id === id ? { ...note, zIndex: maxZIndex + 1 } : note
      );
    });
  }, [setNotes]);

  const updateNote = useCallback((updatedNote: Partial<Note> & { id: string }) => {
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === updatedNote.id ? { ...note, ...updatedNote } : note
      )
    );
  }, [setNotes]);

  const addNote = useCallback((baseNote?: Note) => {
    const maxZIndex = Math.max(0, ...notes.map(n => n.zIndex));
    const newNote: Note = {
      id: `note-${Date.now()}`,
      content: 'New Note',
      x: (baseNote?.x ?? 150) + 30,
      y: (baseNote?.y ?? 150) + 30,
      width: 450,
      height: 300,
      isDocked: false,
      isMaximized: false,
      isTransparent: false,
      isDissolved: false,
      zIndex: maxZIndex + 1,
    };
    setNotes(prevNotes => [...prevNotes, newNote]);
  }, [setNotes, notes]);

  const removeNote = useCallback((id: string) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
  }, [setNotes]);
  
  const backgroundImage = PlaceHolderImages.find(img => img.id === 'background');

  if (!isMounted) {
    return (
      <div className="h-screen w-screen bg-background" />
    );
  }

  return (
    <main className="h-screen w-screen overflow-hidden bg-background relative select-none">
      {backgroundImage && (
        <Image
          src={backgroundImage.imageUrl}
          alt={backgroundImage.description}
          fill
          className="object-cover opacity-20 dark:opacity-10"
          data-ai-hint={backgroundImage.imageHint}
          priority
        />
      )}
      
      {notes.map(note => (
        <NotePanel
          key={note.id}
          note={note}
          onUpdate={updateNote}
          onClose={() => removeNote(note.id)}
          onSplit={() => addNote(note)}
          onFocus={() => bringToFront(note.id)}
        />
      ))}

      {notes.length === 0 && (
         <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="text-center p-8 bg-card/90 backdrop-blur-lg rounded-lg shadow-xl border animate-in fade-in-50 slide-in-from-bottom-10 duration-500">
              <h1 className="text-5xl font-headline text-foreground">Conveyer</h1>
              <p className="text-muted-foreground mt-3 max-w-md mx-auto">
                Your fluid thought-space. Capture ideas, make connections, and let your thoughts flow.
              </p>
              <Button onClick={handleCreateFirstNote} size="lg" className="mt-8">
                 <FilePlus2 className="mr-2 h-5 w-5" /> Create Your First Note
              </Button>
            </div>
         </div>
      )}
    </main>
  );
}
