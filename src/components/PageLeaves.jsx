// Ambient decorative leaves drifting down behind the whole page. Fixed and
// pointer-events:none so it never affects layout or interaction; rendered as
// the very first element so normal DOM stacking keeps it behind every
// section's own background, only showing through in the gaps.
export function PageLeaves() {
  return (
    <div className="page-leaves" aria-hidden="true">
      {Array.from({ length: 7 }, (_, index) => (
        <span key={index} className={`page-leaf page-leaf-${(index % 3) + 1}`} />
      ))}
    </div>
  );
}
