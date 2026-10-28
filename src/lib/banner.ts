export function bannerBackground(dir: "rtl" | "ltr") {
  const towardText =
    "linear-gradient(to left, #1d3c78 0%, #142238 46%, #0b1220 100%)";
  const towardTextLtr =
    "linear-gradient(to right, #1d3c78 0%, #142238 46%, #0b1220 100%)";
  return dir === "rtl" ? towardText : towardTextLtr;
}
