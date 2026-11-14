export function LinkedText({ text }: { text: string }) {
  const parts = text.split(/((?:https?:\/\/|www\.)[^\s<>]+)/g);
  return <>{parts.map((part, index) => {
    if (!/^(?:https?:\/\/|www\.)/i.test(part)) return part;
    const address = part.replace(/[.,!?;:)\]}>]+$/, "");
    const suffix = part.slice(address.length);
    try {
      const url = new URL(address.startsWith("www.") ? `https://${address}` : address);
      if (!["http:", "https:"].includes(url.protocol)) return part;
      return <span key={index}><a href={url.href} target="_blank" rel="noopener noreferrer nofollow" className="break-all text-brand underline underline-offset-2">{address}</a>{suffix}</span>;
    } catch { return part; }
  })}</>;
}
