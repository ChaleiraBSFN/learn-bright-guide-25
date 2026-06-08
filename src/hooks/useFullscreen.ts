import { useState, useEffect, useCallback } from 'react';

interface FullscreenDocument extends Document {
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
  mozCancelFullScreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
}

interface FullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

export const useFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const updateState = useCallback(() => {
    const doc = document as FullscreenDocument;
    setIsFullscreen(
      !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      )
    );
  }, []);

  useEffect(() => {
    updateState();
    const events = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
    events.forEach((evt) => document.addEventListener(evt, updateState));
    return () => events.forEach((evt) => document.removeEventListener(evt, updateState));
  }, [updateState]);

  const enter = useCallback(async () => {
    const el = document.documentElement as FullscreenElement;
    if (el.requestFullscreen) await el.requestFullscreen();
    else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
    else if (el.mozRequestFullScreen) await el.mozRequestFullScreen();
    else if (el.msRequestFullscreen) await el.msRequestFullscreen();
  }, []);

  const exit = useCallback(async () => {
    const doc = document as FullscreenDocument;
    if (doc.exitFullscreen) await doc.exitFullscreen();
    else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
    else if (doc.mozCancelFullScreen) await doc.mozCancelFullScreen();
    else if (doc.msExitFullscreen) await doc.msExitFullscreen();
  }, []);

  const toggle = useCallback(() => {
    if (isFullscreen) exit();
    else enter();
  }, [isFullscreen, enter, exit]);

  return { isFullscreen, toggle, enter, exit };
};
