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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
  ChevronDown,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sparkMode } from '@/ai/flows/spark-mode-flow';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/components/theme-provider';

interface NotePanelProps {
  note: Note;
  onUpdate: (note: Partial<Note> & { id: string }) => void;
  onClose: () => void;
  onSplit: () => void;
  onFocus: () => void;
  otherNotes?: Note[];
}

const MIN_WIDTH = 250;
const MIN_HEIGHT = 150;
const DOCKED_SIZE = 120;

export function NotePanel({ note, onUpdate, onClose, onSplit, onFocus, otherNotes = [] }: NotePanelProps) {
  const [isSummarizerOpen, setIsSummarizerOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isSparking, setIsSparking] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();

  // Directive state
  const [objective, setObjective] = useState('');
  const [details, setDetails] = useState('');
  const [outputFormat, setOutputFormat] = useState('');

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

  const handleMerge = (sourceNote: Note) => {
    const formattedData = `\n\n--- MERGED FROM ${sourceNote.title} ---\n${sourceNote.content}`;
    onUpdate({ id: note.id, content: note.content + formattedData });
    toast({ title: `Merged content from ${sourceNote.title}` });
  };

  const handleSummarize = (summary: string) => {
    onUpdate({ id: note.id, content: `${note.content}\n\n--- Summary ---\n${summary}` });
  };
  
  const handleSparkMode = async () => {
    const fullContext = `
      Objective: ${objective}
      Specific Details: ${details}
      Desired Output: ${outputFormat}
      
      Current Note Content:
      ${note.content}
    `.trim();

    if (!note.content.trim() && !objective.trim()) {
      toast({
        title: 'Input Required',
        description: 'Provide content or an objective for the Courier.',
        variant: 'destructive',
      });
      return;
    }
    setIsSparking(true);
    try {
      const ideas = await sparkMode({ noteContent: fullContext });
      const formattedIdeas = ideas.map(idea => `- ${idea}`).join('\n');
      const newContent = `${note.content}\n\n--- Courier Response ---\n${formattedIdeas}`;
      onUpdate({ id: note.id, content: newContent });
      toast({
        title: 'Mission Complete',
        description: 'The Courier has delivered new data.',
      });
      // Reset directives after launch
      setObjective('');
      setDetails('');
      setOutputFormat('');
    } catch (error) {
      console.error('Spark Mode failed', error);
      toast({
        title: 'Mission Failure',
        description: (error as Error).message || 'Courier intercepted or failed.',
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
      if (note.content) {
        onUpdate({ id: note.id, isDissolved: true, dissolvedContent: note.content });
      } else {
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
  const barrierX = typeof window !== 'undefined' ? window.innerWidth * 0.5 : 0;
  const isOverTheWall = note.x > barrierX;

  return (
    <>
      <div
        ref={panelRef}
        style={panelStyle}
        className={cn(
          "absolute flex flex-col rounded-lg",
          !isInteracting && "transition-all duration-500 ease-in-out", 
          isOverTheWall ? "scale-95 brightness-110 shadow-[0_0_20px_rgba(0,255,255,0.3)]" : "scale-100",
          note.isTransparent && !note.isDocked && "opacity-30 hover:opacity-100 focus-within:opacity-100",
          note.isDocked && "opacity-20 hover:opacity-100 focus-within:opacity-100"
        )}
        onMouseDown={onFocus}
      >
        <Card className={cn(
            "flex flex-col w-full h-full shadow-2xl border transition-colors duration-500",
            isOverTheWall 
              ? "bg-black border-cyan-500/50 text-cyan-400" 
              : "bg-card border-primary/10",
            note.isMaximized && "rounded-none border-none shadow-none"
          )}>

          <CardHeader
            className="p-0 flex-shrink-0 bg-card/80 backdrop-blur-sm"
            onMouseDown={(e) => handleInteractionStart(e, 'drag')}
            onTouchStart={(e) => handleInteractionStart(e, 'drag')}
          >
            <div className={cn("flex items-center justify-between h-11 px-1", note.isDocked || !note.isMaximized ? 'cursor-grab active:cursor-grabbing' : 'cursor-default')}>
                {note.isDocked ? (
                    <div className='flex items-center gap-2 w-full h-full px-2'>
                        <GripVertical className='text-muted-foreground' />
                        <span className='font-bold text-lg'>C{noteNumber}</span>
                    </div>
                ) : (
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
                        className="px-3 py-1.5 font-semibold text-lg rounded-sm cursor-pointer truncate"
                      >
                        {note.title || 'Conveyer'}
                      </span>
                    )}
                    <div className="flex-shrink-0">
                    <Menubar className="border-none bg-transparent shadow-none h-auto p-0">
                        <MenubarMenu>
                            <MenubarTrigger>File</MenubarTrigger>
                            <MenubarContent>
                                <MenubarItem onClick={onSplit}><FilePlus2 className="mr-2 h-4 w-4" /> Split Page</MenubarItem>
                                {otherNotes.length > 0 && (
                                  <MenubarSeparator />
                                )}
                                {otherNotes.map(other => (
                                  <MenubarItem key={other.id} onClick={() => handleMerge(other)}>
                                    Merge from {other.title}
                                  </MenubarItem>
                                ))}
                                <MenubarSeparator />
                                <MenubarItem onClick={handleCopy}>Copy Content</MenubarItem>
                                <MenubarSeparator />
                                <MenubarItem onClick={onClose} className="text-destructive focus:bg-destructive/10 focus:text-destructive-foreground"><X className="mr-2 h-4 w-4" /> Close</MenubarItem>
                            </MenubarContent>
                        </MenubarMenu>
                        <MenubarMenu>
                            <MenubarTrigger>Edit</MenubarTrigger>
                            <MenubarContent>
                                <MenubarItem onClick={() => setIsSummarizerOpen(true)}><Link className="mr-2 h-4 w-4" /> External Feed...</MenubarItem>
                                <MenubarItem onClick={handleSparkMode} disabled={isSparking}>
                                  {isSparking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
                                  Spark Mission
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
                                  {note.isDissolved ? 'Restore Data' : 'Dissolve Data'}
                                </MenubarItem>
                                <MenubarItem onClick={toggleTransparency}>
                                  {note.isTransparent ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
                                  {note.isTransparent ? 'Opaque Mode' : 'Ghost Mode'}
                                </MenubarItem>
                                <MenubarSeparator />
                                <MenubarItem onClick={toggleDock}>
                                  {note.isDocked ? <Expand className="mr-2 h-4 w-4" /> : <Dock className="mr-2 h-4 w-4" />}
                                  {note.isDocked ? 'Undock' : 'Dock to Cube'}
                                </MenubarItem>
                                <MenubarItem onClick={toggleMaximize}>
                                  {note.isMaximized ? <Shrink className="mr-2 h-4 w-4" /> : <Expand className="mr-2 h-4 w-4" />}
                                  {note.isMaximized ? 'Exit Fullscreen' : 'Fullscreen'}
                                </MenubarItem>
                            </MenubarContent>
                        </MenubarMenu>
                         <MenubarMenu>
                            <MenubarTrigger>Help</MenubarTrigger>
                            <MenubarContent>
                                <MenubarItem onClick={() => setIsInfoOpen(true)}><Info className="mr-2 h-4 w-4" /> Protocols & About</MenubarItem>
                            </MenubarContent>
                        </MenubarMenu>
                    </Menubar>
                    </div>
                  </div>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>

          {!note.isDocked && (
          <CardContent className="p-0 flex-grow relative flex flex-col overflow-hidden">
            <Textarea
                placeholder="Secure Mission Log..."
                className={cn(
                  'w-full flex-grow resize-none border-none focus-visible:ring-0 p-6 bg-transparent',
                  isOverTheWall ? 'font-mono text-cyan-300' : 'font-body'
                )}
                value={note.content}
                onChange={e => onUpdate({ id: note.id, content: e.target.value })}
              />

              <div className="px-4 pb-4 mt-auto">
                 <Accordion type="single" collapsible className="w-full border-t border-primary/10">
                    <AccordionItem value="directives" className="border-none">
                      <AccordionTrigger className="py-2 text-xs uppercase tracking-widest text-muted-foreground hover:no-underline">
                        Mission Directives
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3 pb-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase opacity-50">Objective</Label>
                          <Input 
                            value={objective}
                            onChange={(e) => setObjective(e.target.value)}
                            placeholder="Clear objective statement..." 
                            className="h-8 text-xs bg-muted/30 border-primary/5"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase opacity-50">Parameters</Label>
                          <Input 
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            placeholder="Keywords, context, constraints..." 
                            className="h-8 text-xs bg-muted/30 border-primary/5"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase opacity-50">Output Format</Label>
                          <Input 
                            value={outputFormat}
                            onChange={(e) => setOutputFormat(e.target.value)}
                            placeholder="Table, bullets, summary..." 
                            className="h-8 text-xs bg-muted/30 border-primary/5"
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                 </Accordion>
                 
                 <Button 
                    className="w-full mt-2 group bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border-primary/20" 
                    variant="outline"
                    onClick={handleSparkMode}
                    disabled={isSparking}
                  >
                    {isSparking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                    Launch Mission
                 </Button>
              </div>

              {isOverTheWall && (
                <div className="absolute inset-x-0 bottom-0 p-1 pointer-events-none opacity-20">
                   <p className="text-[8px] uppercase tracking-[0.3em] text-center text-cyan-500">System Space Active</p>
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
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-headline flex items-center gap-2">
               <Info className="text-primary" /> Conveyer Protocols
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-6 pt-4 text-foreground">
              <section>
                <h3 className="font-bold text-primary uppercase tracking-wider text-sm mb-2">About the System</h3>
                <p>A fluid, always-on-top information conveyor designed for seamless data transfer and AI-augmented thought processing.</p>
              </section>

              <section className="space-y-4">
                <h3 className="font-bold text-primary uppercase tracking-wider text-sm">Mission Directive Guidelines</h3>
                <p className="text-muted-foreground text-xs italic">To improve performance, focus on these core areas:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">1. Clarity & Specificity</h4>
                    <p className="text-xs text-muted-foreground">Ensure each directive is unambiguous and leaves no room for misinterpretation. Use precise language.</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">2. Scope & Boundaries</h4>
                    <p className="text-xs text-muted-foreground">Clearly define what is within the directive's purview and what is outside. This prevents overreach.</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">3. Prioritization</h4>
                    <p className="text-xs text-muted-foreground">Establish a clear hierarchy for directives to resolve potential conflicts during execution.</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">4. Measurability</h4>
                    <p className="text-xs text-muted-foreground">Incorporate metrics or observable outcomes that indicate successful adherence to the directive.</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">5. Adaptability</h4>
                    <p className="text-xs text-muted-foreground">Design directives to be robust enough to handle varying conditions using principles rather than rigid steps.</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">6. Conciseness</h4>
                    <p className="text-xs text-muted-foreground">Remove unnecessary jargon or redundant phrasing to make directives easy to apply.</p>
                  </div>
                </div>
              </section>

              <p className="text-[10px] text-muted-foreground text-center border-t pt-4">
                System Version 1.1.0 | Signal Strength: Optimized
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="bg-primary text-primary-foreground hover:bg-primary/90">Acknowledged</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
