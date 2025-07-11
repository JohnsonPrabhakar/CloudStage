// This file is created to break a circular dependency between
// CreateEventForm.tsx and firebase-service.ts

export const getYouTubeEmbedUrl = (url: string): string | null => {
  if (!url) return null;

  let videoId: string | null = null;
  
  try {
      if (url.includes("youtube.com/watch")) {
        const urlParams = new URLSearchParams(new URL(url).search);
        videoId = urlParams.get("v");
      }
      else if (url.includes("youtu.be/")) {
        videoId = new URL(url).pathname.slice(1);
      }
      else if (url.includes("youtube.com/embed/")) {
        videoId = new URL(url).pathname.split('/embed/')[1];
      }
      else if (url.includes("youtube.com/live/")) {
        videoId = new URL(url).pathname.split('/live/')[1];
      }
  } catch(e) {
      const patterns = [
          /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
          /(?:https?:\/\/)?youtu\.be\/([^?]+)/,
          /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/,
          /(?:https?:\/\/)?(?:www\.)?youtube\.com\/live\/([^?]+)/
      ];
      for (const pattern of patterns) {
          const match = url.match(pattern);
          if (match && match[1]) {
              videoId = match[1];
              break;
          }
      }
  }

  if (videoId) {
      videoId = videoId.split('?')[0].split('&')[0];
  }
  
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
};

export const getYouTubeVideoId = (url: string): string | null => {
    const embedUrl = getYouTubeEmbedUrl(url);
    if (!embedUrl) {
        return null;
    }
    const parts = embedUrl.split('/embed/');
    if (parts.length > 1) {
        const videoId = parts[1].split('?')[0];
        return videoId;
    }
    return null;
};
