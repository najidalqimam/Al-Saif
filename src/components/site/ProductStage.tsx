import type { ReactNode } from "react";
import { ShowcaseStage } from "@/components/site/showcase";

const LIGHT_STAGE = new Set(["case"]);

export function ProductStage({
  id,
  alt,
  size = "md",
  className = "",
  children,
}: {
  id: string;
  alt: string;
  size?: "sm" | "md" | "lg" | "icon";
  className?: string;
  children?: ReactNode;
}) {
  const light = LIGHT_STAGE.has(id);

  return (
    <ShowcaseStage size={size} tone={light ? "light" : "green"} className={className} overlay={children}>
      <img src={light ? `/card-photos/product-${id}.png` : `/showcase/${id}.png`} alt={alt} />
    </ShowcaseStage>
  );
}
