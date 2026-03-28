'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { summarizeExternalContent } from '@/ai/flows/summarize-external-content-flow';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface SummarizerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSummarize: (summary: string) => void;
}

export function SummarizerDialog({ open, onOpenChange, onSummarize }: SummarizerDialogProps) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: 'Input required',
        description: 'Please paste some text or a URL to summarize.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const isUrl = content.trim().startsWith('http://') || content.trim().startsWith('https://');
      const input = isUrl ? { url: content.trim() } : { content: content.trim() };
      const summary = await summarizeExternalContent(input);
      onSummarize(summary);
      onOpenChange(false);
      setContent('');
      toast({
        title: 'Success!',
        description: 'Content summarized and added to your note.',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Summarization Failed',
        description: (error as Error).message || 'An unknown error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Summarize Content</DialogTitle>
          <DialogDescription>
            Paste text or a URL below. The AI will summarize it and append it to your note.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="content-to-summarize">Text or URL</Label>
            <Textarea
              id="content-to-summarize"
              placeholder="Paste your content or a URL here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Summarize & Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
