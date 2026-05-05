import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface Props {
  title: string;
  content: React.ReactNode;
}

export function HelpButton({ title, content }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className="fixed bottom-6 right-6 rounded-full shadow-lg z-40 h-12 w-12 bg-card hover:bg-accent"
          aria-label="Aide"
        >
          <HelpCircle className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="prose prose-sm dark:prose-invert mt-4 max-w-none">
          {content}
        </div>
      </SheetContent>
    </Sheet>
  );
}
