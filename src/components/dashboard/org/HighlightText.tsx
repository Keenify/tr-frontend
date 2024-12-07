interface HighlightTextProps {
  text: string;
  searchTerm: string;
}

export function HighlightText({ text, searchTerm }: HighlightTextProps) {
  if (!searchTerm || searchTerm.length < 2) {
    return <>{text}</>;
  }

  const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));

  return (
    <>
      {parts.map((part, index) => (
        <span
          key={index}
          className={
            part.toLowerCase() === searchTerm.toLowerCase()
              ? 'bg-yellow-300 px-1 rounded animate-pulse'
              : ''
          }
        >
          {part}
        </span>
      ))}
    </>
  );
}