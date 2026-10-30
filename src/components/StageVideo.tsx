/**
 * A video in a compare step. YouTube links become an embedded player; any
 * other src (e.g. /video/clip.mp4) plays in a normal video player. Add
 * #t=start,end (in seconds) to play only part:
 *   [video https://www.youtube.com/watch?v=VIDEO_ID#t=3663,3757 "Caption"]
 * It starts playing, muted, as soon as it's on screen (browsers only allow
 * autoplay without sound; the viewer turns the sound on in the player).
 * Only rendered while on screen, so it stops when it slides away.
 */
export default function StageVideo({ src, title, active = true }: { src: string; title?: string; active?: boolean }) {
    const [url, frag] = src.split("#t=");
    const [startS, endS] = (frag ?? "").split(",");
    const start = Math.floor(Number(startS) || 0);
    const end = endS ? Math.floor(Number(endS)) : undefined;
  
    if (!active) return <div className="stage-video" aria-hidden="true" />;
  
    const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
    if (yt) {
      const params = new URLSearchParams({ rel: "0", modestbranding: "1", autoplay: "1", mute: "1", playsinline: "1" });
      if (start) params.set("start", String(start));
      if (end) params.set("end", String(end));
      return (
        <iframe
          className="stage-video"
          src={`https://www.youtube-nocookie.com/embed/${yt[1]}?${params}`}
          title={title ?? "Video"}
          allow="autoplay; accelerometer; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }
    return (
      <video
        className="stage-video"
        src={frag ? `${url}#t=${frag}` : url}
        controls
        autoPlay
        muted
        playsInline
        preload="metadata"
      />
    );
  }