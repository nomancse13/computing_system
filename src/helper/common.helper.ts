export const isValidHttpUrl = (urlStr: string) => {
  let url: any;
  try {
    url = new URL(urlStr);
  } catch (_) {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
};
