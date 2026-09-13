export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 rounded-chat rounded-bl-sm bg-white px-4 py-3 border border-line w-fit" role="status" aria-label="Assistant is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-slate animate-dot-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}
