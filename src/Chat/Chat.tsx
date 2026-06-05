export function Chat({ viewer }: { viewer: string }) {
  return <div data-viewer={viewer} className="hidden" />;
}
