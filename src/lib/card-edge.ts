export function cardEdge(id: string) {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 33 + id.charCodeAt(index)) >>> 0;
  }
  const hue = (hash * 47) % 360;
  return `hsl(${hue} 52% 42%)`;
}
