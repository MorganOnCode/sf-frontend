import type { ElementType, ReactNode } from "react";

/**
 * The four "+" registration marks a blueprint object wears at its corners.
 *
 * Exported on its own for elements that cannot be wrapped — a `<button>` or a
 * `<Link>` that is itself the framed object.
 */
export function CornerMarks() {
  return (
    <>
      <i aria-hidden="true" className="corner tl" />
      <i aria-hidden="true" className="corner tr" />
      <i aria-hidden="true" className="corner bl" />
      <i aria-hidden="true" className="corner br" />
    </>
  );
}

/**
 * A wireframe object: square, hairline-bordered, marked at each corner.
 *
 * Cards, figures and major sections are drawn rather than filled, so this is the
 * frame nearly every container in the app wears.
 */
export default function Blueprint({
  as: Tag = "div",
  className = "",
  children,
}: {
  as?: ElementType;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Tag className={`blueprint ${className}`}>
      <CornerMarks />
      {children}
    </Tag>
  );
}
