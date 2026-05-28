import { getFlag } from "@/lib/flags";

interface Props {
  code: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function FlagImage({ code, size = 32, className, style }: Props) {
  const emoji = getFlag(code);
  const codePoints = [...emoji].map((c) => c.codePointAt(0)!.toString(16)).join("-");
  const src = `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${codePoints}.svg`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      width={size}
      height={size}
      alt={code}
      className={className}
      style={{ display: "inline-block", ...style }}
    />
  );
}
