import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { ChatMsg } from '../chat';
import { Icon } from '../icons';

type Props = {
  mallName: string;
  messages: ChatMsg[];
  typing: boolean;
  onSend: (text: string) => void;
};

function RichText({ text }: { text: string }) {
  const parts = text.split('**');
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? <strong key={index}>{part}</strong> : <span key={index}>{part}</span>,
      )}
    </>
  );
}

export function AssistantScreen({ mallName, messages, typing, onSend }: Props) {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, typing]);

  const waiting = typing && messages[messages.length - 1]?.role !== 'bot';

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft('');
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col w-full relative assistant-screen">
      <header className="flex-none px-4 pb-12 pt-[4px] text-center">
        <div className="flex-none size-[40px] grid place-items-center mx-auto mb-8 rounded-full bg-[var(--brand)] shadow-[0_7px_14px_-7px_rgba(232,121,47,0.95)]">
          <Icon name="sparkle" size={22} />
        </div>
        <h1 className="m-0 text-[13.5px] font-semibold">Crowd Assistant</h1>
        <p className="mt-3 text-[10px] text-[var(--muted)]">Here to help with your mall trip</p>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-9 p-[4px_14px_10px] scrollbar-none" ref={scrollRef}>
        {messages.map((message) => {
          if (message.role === 'user') {
            return (
              <div key={message.id} className="flex justify-end">
                <div className="bubble bubble-user">{message.text}</div>
              </div>
            );
          }

          if (message.kind === 'list') {
            return (
              <div key={message.id} className="flex msg-bot">
                <div className="bubble bubble-bot list-bubble">
                  <p className="list-title">{message.title}</p>
                  <div className="rank-list">
                    {message.items?.map((item, index) => (
                      <div key={item.name} className="rank-item">
                        <span className={`rank-num rank-${index + 1}`}>{index + 1}</span>
                        <span className="rank-info">
                          <span className="rank-name">{item.name}</span>
                          <span className="rank-meta">
                            {item.pct}% · {item.status}
                          </span>
                        </span>
                        <span className="rank-walk">
                          <Icon name="walk" size={12} strokeWidth={1.8} />
                          {item.walk[0]}–{item.walk[1]} min walk
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={message.id} className="flex msg-bot">
              <div className="bubble bubble-bot">
                <RichText text={message.text ?? ''} />
              </div>
            </div>
          );
        })}

        {waiting && (
          <div className="flex msg-bot">
            <div className="bubble bubble-bot typing" aria-label="Assistant is typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>

      <form className="flex-none flex items-center gap-8 p-[8px_14px_2px]" onSubmit={submit}>
        <input
          className="chat-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={typing ? 'Thinking…' : 'Ask about crowds or the best time to go…'}
          aria-label="Ask the crowd assistant"
          disabled={typing}
        />
        <button type="submit" className="send-btn" aria-label="Send message" disabled={!draft.trim() || typing}>
          <Icon name="send" size={17} strokeWidth={2.2} />
        </button>
      </form>
      <span className="flex-none pt-2 pb-8 text-center text-[8.5px] text-[var(--ink-soft)]">{mallName} · live crowd data</span>
    </div>
  );
}
