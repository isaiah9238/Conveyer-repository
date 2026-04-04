'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Note } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@/components/ui/menubar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SummarizerDialog } from './summarizer-dialog';
import {
  FilePlus2,
  X,
  Link,
  Info,
  Sparkles,
  Dock,
  Expand,
  Shrink,
  Eye,
  EyeOff,
  GripVertical,
  Lightbulb,
  Loader2,
  Moon,
  Sun,
  Send,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sparkMode } from '@/ai/flows/spark-mode-flow';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/components/theme-provider';

interface NotePanelProps {
  note: Note;
  onUpdate: (note: Partial<Note> & { id: string }) => void;
  onClose: () => void;
  onSplit: () => void;
  onFocus: () => void;
}

const MIN_WIDTH = 250;
const MIN_HEIGHT = 150;
const DOCKED_SIZE = 120;

export function NotePanel({ note, onUpdate, onClose, onSplit, onFocus }: NotePanelProps) {
  const [isSummarizerOpen, setIsSummarizerOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isSparking, setIsSparking] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();

  const panelRef = useRef<HTMLDivElement>(null);
  const interactionRef = useRef<{
    type: 'drag' | 'resize' | null;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    startLeft: number;
    startTop: number;
  } | null>(null);
  
  const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!interactionRef.current || !panelRef.current) return;

    if (e.cancelable) {
      e.preventDefault();
    }
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const { type, startX, startY, startW, startH, startLeft, startTop } = interactionRef.current;
    
    if (type === 'drag') {
      let newX = startLeft + clientX - startX;
      let newY = startTop + clientY - startY;

      const panelWidth = panelRef.current.offsetWidth;
      const panelHeight = panelRef.current.offsetHeight;
      const { innerWidth, innerHeight } = window;

      newX = Math.max(0, Math.min(newX, innerWidth - panelWidth));
      newY = Math.max(0, Math.min(newY, innerHeight - panelHeight));

      // Wrap this in requestAnimationFrame for smoothness
      window.requestAnimationFrame(() => {
        onUpdate({ id: note.id, x: newX, y: newY });
      });
    } else if (type === 'resize') {
      const newW = Math.max(MIN_WIDTH, startW + clientX - startX);
      const newH = Math.max(MIN_HEIGHT, startH + clientY - startY);

      window.requestAnimationFrame(() => {
        onUpdate({ id: note.id, width: newW, height: newH });
      });
    }
  }, [note.id, onUpdate]);
  
  const handleInteractionEnd = useCallback(() => {
    interactionRef.current = null;
    setIsInteracting(false);
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', handleMove);
    document.removeEventListener('mouseup', handleInteractionEnd);
    document.removeEventListener('touchmove', handleMove);
    document.removeEventListener('touchend', handleInteractionEnd);
  }, [handleMove]);

  const handleInteractionStart = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, type: 'drag' | 'resize') => {
    const target = e.target as HTMLElement;
    if (type === 'drag' && target.closest('button, [role="menubar"]')) {
      return;
    }
    
    if (type === 'drag' && target.closest('.resize-handle')) {
        return;
    }

    onFocus();

    if (note.isDocked || note.isMaximized) return;

    setIsInteracting(true);
    document.body.style.userSelect = 'none';
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    interactionRef.current = {
      type,
      startX: clientX,
      startY: clientY,
      startW: panelRef.current?.offsetWidth || 0,
      startH: panelRef.current?.offsetHeight || 0,
      startLeft: panelRef.current?.offsetLeft || 0,
      startTop: panelRef.current?.offsetTop || 0,
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleInteractionEnd);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleInteractionEnd);
  }, [note.isDocked, note.isMaximized, onFocus, handleMove, handleInteractionEnd]);


  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleInteractionEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleInteractionEnd);
    };
  }, [handleMove, handleInteractionEnd]);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(note.content);
    toast({ title: "Copied to clipboard!" });
  }

  const handleSummarize = (summary: string) => {
    onUpdate({ id: note.id, content: `${note.content}\n\n--- Summary ---\n${summary}` });
  };
  
  const handleSparkMode = async () => {
    if (!note.content.trim()) {
      toast({
        title: 'Note is empty',
        description: 'Write something in your note to get creative sparks.',
        variant: 'destructive',
      });
      return;
    }
    setIsSparking(true);
    try {
      const ideas = await sparkMode({ noteContent: note.content });
      const formattedIdeas = ideas.map(idea => `- ${idea}`).join('\n');
      const newContent = `${note.content}\n\n--- Sparks ---\n${formattedIdeas}`;
      onUpdate({ id: note.id, content: newContent });
      toast({
        title: 'Sparks added!',
        description: 'Creative ideas have been added to your note.',
      });
    } catch (error) {
      console.error('Spark Mode failed', error);
      toast({
        title: 'Spark Mode Failed',
        description: (error as Error).message || 'Could not generate ideas.',
        variant: 'destructive',
      });
    } finally {
      setIsSparking(false);
    }
  };
  
  const toggleDock = () => onUpdate({ id: note.id, isDocked: !note.isDocked, isMaximized: false });
  const toggleMaximize = () => onUpdate({ id: note.id, isMaximized: !note.isMaximized, isDocked: false });
  const toggleTransparency = () => onUpdate({ id: note.id, isTransparent: !note.isTransparent });

  const toggleDissolve = () => {
    if (note.isDissolved) {
      // Restore
      const restoredText = note.dissolvedContent || '';
      const newContent = note.content
        ? `${note.content}\n\n${restoredText}`.trim()
        : restoredText;
      onUpdate({
        id: note.id,
        isDissolved: false,
        content: newContent,
        dissolvedContent: undefined,
      });
    } else {
      // Dissolve
      if (note.content) {
        onUpdate({ id: note.id, isDissolved: true, dissolvedContent: note.content });
      } else {
        // Nothing to dissolve, just toggle state to allow writing and then restoring nothing.
        onUpdate({ id: note.id, isDissolved: true, dissolvedContent: '' });
      }
    }
  };

  const panelStyle: any = {
    '--min-width': `${MIN_WIDTH}px`,
    '--min-height': `${MIN_HEIGHT}px`,
    touchAction: 'none',
  };

  if (note.isMaximized) {
    Object.assign(panelStyle, { top: 0, left: 0, width: '100vw', height: '100vh', zIndex: note.zIndex, transform: 'none', borderRadius: 0 });
  } else if (note.isDocked) {
    Object.assign(panelStyle, { top: note.y, left: note.x, width: DOCKED_SIZE, height: DOCKED_SIZE, zIndex: note.zIndex });
  } else {
    Object.assign(panelStyle, { top: note.y, left: note.x, width: note.width, height: note.height, zIndex: note.zIndex });
  }

  const noteNumber = note.title?.match(/\d+$/)?.[0];

  // Calculate if the note has "jumped" past the barrier (70% of screen)
  const barrierX = typeof window !== 'undefined' ? window.innerWidth * 0.5 : 0;
  const isOverTheWall = note.x > barrierX;

  return (
    <>
      <div
        ref={panelRef}
        style={panelStyle}
        className={cn(
          "absolute flex flex-col rounded-lg",
          // ONLY transition when NOT dragging or resizing
          !isInteracting && "transition-all duration-500 ease-in-out", 
          isOverTheWall ? "scale-95 brightness-110 shadow-[0_0_20px_rgba(0,255,255,0.3)]" : "scale-100",
          note.isTransparent && !note.isDocked && "opacity-30 hover:opacity-100 focus-within:opacity-100",
          note.isDocked && "opacity-20 hover:opacity-100 focus-within:opacity-100"
        )}
        onMouseDown={onFocus}
      >
        <Card className={cn(
            "flex flex-col w-full h-full shadow-2xl border transition-colors duration-500",
            // Change theme when jumping over the wall!
            isOverTheWall 
              ? "bg-black border-cyan-500/50 text-cyan-400" 
              : "bg-card border-primary/10",
            note.isMaximized && "rounded-none border-none shadow-none"
          )}>

          <CardHeader
            className="p-0 flex-shrink-0 bg-card/80 backdrop-blur-sm"
            onMouseDown={(e) => handleInteractionStart(e, 'drag')}
            onTouchStart={(e) => handleInteractionStart(e, 'drag')}
            onDoubleClick={note.isDocked ? toggleDock : undefined}
          >
            <div className={cn("flex items-center justify-between h-11 px-1", note.isDocked || !note.isMaximized ? 'cursor-grab active:cursor-grabbing' : 'cursor-default')}>
                {note.isDocked ? (
                    <div className='flex items-center gap-2 w-full h-full px-2'>
                        <GripVertical className='text-muted-foreground' />
                        <span className='font-bold text-lg'>C{noteNumber}</span>
                    </div>
                ) : (
                  /* 1. Add 'min-w-0' and 'overflow-hidden' here to keep the menu inside the card */
                  <div className="flex items-center min-w-0 overflow-hidden flex-grow">
                    {isEditingTitle ? (
                       <Input
                          value={note.title}
                          onChange={(e) => onUpdate({ id: note.id, title: e.target.value })}
                          onBlur={() => setIsEditingTitle(false)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === 'Escape') {
                              setIsEditingTitle(false);
                              e.currentTarget.blur();
                            }
                          }}
                          autoFocus
                          className="h-8 w-36 font-semibold text-lg px-3 py-1.5 border-0 border-b-2 border-dashed border-primary/50 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
                       />
                    ) : (
                      <span
                        onDoubleClick={() => setIsEditingTitle(true)}
                       /* 2. Added 'truncate' so long titles don't push the menu off-screen */
                        className="px-3 py-1.5 font-semibold text-lg rounded-sm cursor-pointer truncate"
                          >
                        {note.title || 'Conveyer'}
                      </span>
                    )}
                    {/* 3. Wrap the Menubar in a div that won't shrink, so the text stays visible */}
                    <div className="flex-shrink-0">
                    <Menubar className="border-none bg-transparent shadow-none h-auto p-0">
                        <MenubarMenu>
                            <MenubarTrigger>File</MenubarTrigger>
                            <MenubarContent>
                                <MenubarItem onClick={onSplit}><FilePlus2 className="mr-2 h-4 w-4" /> Split Page</MenubarItem>
                                <MenubarItem onClick={handleCopy}>Copy Content</MenubarItem>
                                <MenubarSeparator />
                                <MenubarItem onClick={onClose} className="text-destructive focus:bg-destructive/10 focus:text-destructive-foreground"><X className="mr-2 h-4 w-4" /> Close</MenubarItem>
                            </MenubarContent>
                        </MenubarMenu>
                        <MenubarMenu>
                            <MenubarTrigger>Edit</MenubarTrigger>
                            <MenubarContent>
                                <MenubarItem onClick={() => setIsSummarizerOpen(true)}><Link className="mr-2 h-4 w-4" /> Summarize...</MenubarItem>
                                <MenubarItem onClick={handleSparkMode} disabled={isSparking}>
                                  {isSparking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
                                  Spark Ideas
                                </MenubarItem>
                            </MenubarContent>
                        </MenubarMenu>
                         <MenubarMenu>
                            <MenubarTrigger>View</MenubarTrigger>
                            <MenubarContent>
                                <MenubarItem onClick={toggleTheme}>
                                  {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                                  Toggle Theme
                                </MenubarItem>
                                <MenubarSeparator />
                                <MenubarItem onClick={toggleDissolve}>
                                  <Sparkles className="mr-2 h-4 w-4" />
                                  {note.isDissolved ? 'Restore Text' : 'Dissolve Text'}
                                </MenubarItem>
                                <MenubarItem onClick={toggleTransparency}>
                                  {note.isTransparent ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
                                  {note.isTransparent ? 'Make Opaque' : 'Make Transparent'}
                                </MenubarItem>
                                <MenubarSeparator />
                                <MenubarItem onClick={toggleDock}>
                                  {note.isDocked ? <Expand className="mr-2 h-4 w-4" /> : <Dock className="mr-2 h-4 w-4" />}
                                  {note.isDocked ? 'Undock' : 'Dock'}
                                </MenubarItem>
                                <MenubarItem onClick={toggleMaximize}>
                                  {note.isMaximized ? <Shrink className="mr-2 h-4 w-4" /> : <Expand className="mr-2 h-4 w-4" />}
                                  {note.isMaximized ? 'Restore' : 'Fill Screen'}
                                </MenubarItem>
                            </MenubarContent>
                        </MenubarMenu>
                         <MenubarMenu>
                            <MenubarTrigger>Help</MenubarTrigger>
                            <MenubarContent>
                                <MenubarItem onClick={() => setIsInfoOpen(true)}><Info className="mr-2 h-4 w-4" /> About</MenubarItem>
                            </MenubarContent>
                        </MenubarMenu>
                    </Menubar>
                    </div>
                  </div>
                )}
                <div className="flex-grow h-full" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}></div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>

          {!note.isDocked && (
          <CardContent className="p-0 flex-grow relative flex flex-col">
            <Textarea
              // ... your existing Textarea props ...
              className={cn(
                'w-full flex-grow resize-none border-none focus-visible:ring-0 p-8',
                // Change font/bg if we've jumped
                isOverTheWall ? 'font-mono text-cyan-300' : 'font-code'
              )}
                value={note.content}
                onChange={e => onUpdate({ id: note.id, content: e.target.value })}
              />

              {/* NEW: The Chat Interface for the "Black Space" */}
              {isOverTheWall && (
                <div className="p-4 border-t border-cyan-900/50 bg-black/50 backdrop-blur-md">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Ask the Expert..." 
                      className="bg-cyan-950/20 border-cyan-800 text-cyan-200 placeholder:text-cyan-800"
                      onKeyDown={(e) => {
                         if(e.key === 'Enter') {
                           handleSparkMode(); // Or your new chat flow
                         }
                      }}
                    />
                    <Button size="sm" variant="ghost" className="text-cyan-500">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-[10px] mt-2 opacity-50 uppercase tracking-widest text-center">
                    In System Space - Data Permissions Active
                  </p>
                </div>
              )}
            </CardContent>
          )}

          {!note.isDocked && !note.isMaximized && (
              <div
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize text-muted-foreground/50 hover:text-muted-foreground resize-handle"
                onMouseDown={(e) => handleInteractionStart(e, 'resize')}
                onTouchStart={(e) => handleInteractionStart(e, 'resize')}
              >
                  <svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 0V16H0L16 0Z" fill="currentColor"/>
                  </svg>
              </div>
          )}
        </Card>
      </div>

      <SummarizerDialog open={isSummarizerOpen} onOpenChange={setIsSummarizerOpen} onSummarize={handleSummarize} />
      
      <AlertDialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>About Conveyer</AlertDialogTitle>
            <AlertDialogDescription>
              A fluid, always-on-top information conveyor designed for seamless information transfer and management.
              <br/><br/>
              Version 1.0.0
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
