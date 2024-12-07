interface OrgConnectorProps {
  childCount: number;
}

export function OrgConnector({ childCount }: OrgConnectorProps) {
  const width = Math.max((childCount - 1) * 320, 0);
  
  return (
    <div className="absolute left-1/2 -translate-x-1/2">
      {/* Vertical line down from parent */}
      <div className="absolute left-1/2 -translate-x-px top-full w-0.5 h-16 bg-indigo-200" />
      
      {/* Horizontal line */}
      {childCount > 1 && (
        <div 
          className="absolute bg-indigo-200 h-0.5"
          style={{
            top: 'calc(100% + 64px)',
            width: `${width}px`,
            left: `${-width/2}px`
          }}
        />
      )}
      
      {/* Vertical lines to children */}
      {childCount > 0 && Array.from({ length: childCount }).map((_, index) => {
        const xPos = (index - (childCount - 1) / 2) * 320;
        return (
          <div
            key={index}
            className="absolute bg-indigo-200 w-0.5 h-16"
            style={{
              top: 'calc(100% + 64px)',
              left: `${xPos}px`,
            }}
          />
        );
      })}
    </div>
  );
}