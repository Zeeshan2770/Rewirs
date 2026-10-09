function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (u.pathname.startsWith("/embed/")) return url;
    }
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.replace("/", "");
      return `https://player.vimeo.com/video/${id}`;
    }
    return null;
  } catch {
    return null;
  }
}

export function LessonVideo({ url }: { url: string }) {
  const embed = getEmbedUrl(url);

  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl border border-base-700 bg-base-900">
      {embed ? (
        <iframe
          src={embed}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Lesson video"
        />
      ) : (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video src={url} controls controlsList="nodownload" className="h-full w-full" />
      )}
    </div>
  );
}
