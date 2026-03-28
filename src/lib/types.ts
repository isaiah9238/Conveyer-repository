export type Note = {
  id: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isDocked: boolean;
  isMaximized: boolean;
  isTransparent: boolean;
  isDissolved: boolean;
  zIndex: number;
  dissolvedContent?: string;
};
