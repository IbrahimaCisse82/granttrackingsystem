import { useState } from 'react';
import { useComments } from '@/hooks/useComments';
import { MessageSquare, Send, Trash2, Loader2 } from 'lucide-react';

interface Props {
  projectId: string;
  reportIndex: number;
}

export default function ReportComments({ projectId, reportIndex }: Props) {
  const { comments, isLoading, addComment, deleteComment, currentUserId } = useComments(projectId, reportIndex);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await addComment(text.trim());
      setText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-6 rounded-[10px] border border-rule bg-card">
      <div className="border-b border-rule px-4 py-3 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-primary" />
        <h3 className="text-[13px] font-semibold">Commentaires ({comments.length})</h3>
      </div>
      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>
        ) : comments.length === 0 ? (
          <p className="text-xs text-muted-foreground italic text-center py-3">Aucun commentaire pour ce rapport</p>
        ) : (
          comments.map(c => (
            <div key={c.id} className={`rounded-lg p-3 text-xs ${c.userId === currentUserId ? 'bg-primary/5 border border-primary/10' : 'bg-muted/50 border border-rule'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-foreground">{c.userName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleString('fr-FR')}</span>
                  {c.userId === currentUserId && (
                    <button onClick={() => deleteComment(c.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-foreground/80 whitespace-pre-wrap">{c.content}</p>
            </div>
          ))
        )}

        {/* Input */}
        <div className="flex gap-2 pt-2 border-t border-rule">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Écrire un commentaire…"
            rows={2}
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-xs outline-none resize-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
          />
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || sending}
            className="self-end rounded-md bg-primary px-3 py-2 text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground">Ctrl+Entrée pour envoyer</p>
      </div>
    </div>
  );
}
