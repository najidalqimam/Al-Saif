export function bannerBackground(dir: "rtl" | "ltr") {
  const towardText =
    "linear-gradient(to left, #124e3f 0%, #0c2830 48%, #08131c 100%)";
  const towardTextLtr =
    "linear-gradient(to right, #124e3f 0%, #0c2830 48%, #08131c 100%)";
  return dir === "rtl" ? towardText : towardTextLtr;
}
