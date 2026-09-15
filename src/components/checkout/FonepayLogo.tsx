// "Checkout by Fonepay" brand mark — real assets extracted directly from
// Fonepay's own "Guideline- Checkout by Fonepay.pdf" (the guideline itself
// had no attached image files, only page renders; the actual logo images
// were embedded inside the PDF and pulled out with `mutool extract`, then
// had their baked-in white background floodfill-removed with ImageMagick,
// verified pixel-by-pixel to still be Fonepay Red #ce2027 with the "fone"
// lettering intact). Source PDF: docs/Checkout by Fonepay/Guideline-
// Checkout by Fonepay.pdf. Do not recolor, stretch, or drop the red box
// around "fone" — those are explicit Don'ts in the guideline's Brand
// Don'ts page.
interface FonepayLogoProps {
  // "lockup" = full "Checkout by [fone pay]" mark, per the guideline's
  // Master Logo (primary preference) — used wherever the mark stands
  // alone as a heading (dialog title, centered above the QR).
  // "mark" = just the red [fone pay] box, per the guideline's own
  // allowance ("for tight UI like checkout buttons, reduce to 0.5X") and
  // the Merchant Banking App Preview page, which shows only the box mark
  // inside a payment-method row.
  variant?: "lockup" | "mark";
  // Height in px. The guideline's minimum allowed size is 45px (digital/
  // print) for the full lockup's overall height — callers using the
  // lockup variant should stay at or above that; the mark variant follows
  // the "tight UI" 0.5X allowance instead.
  height?: number;
  className?: string;
}

const ASSET_SRC: Record<NonNullable<FonepayLogoProps["variant"]>, string> = {
  lockup: "/fonepay/checkout-by-fonepay-lockup.png",
  // Source aspect ratio: 218 x 95 (lockup) / 218 x 70 (mark) — used to
  // derive width from the requested height so the mark never stretches.
  mark: "/fonepay/fonepay-mark.png",
};
const ASPECT_RATIO: Record<NonNullable<FonepayLogoProps["variant"]>, number> = {
  lockup: 218 / 95,
  mark: 218 / 70,
};

export function FonepayLogo({ variant = "lockup", height = 32, className }: FonepayLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={ASSET_SRC[variant]}
      alt="Checkout by Fonepay"
      className={className}
      style={{ height, width: height * ASPECT_RATIO[variant] }}
    />
  );
}
