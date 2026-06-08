import { useState, useEffect, useCallback } from 'react';

export const useFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const updateState = useCallback(() => {
    setIsFullscreen(
      !!(
        document.fullscreenElement ||
        // @ts-expect-error vendor prefixed
        document.webkitFullscreenElement ||
        // @ts-expect-error vendor prefixed
        document.mozFullScreenElement ||
        // @ts-expect-error vendor prefixed
        document.msFullscreenElement
      )
    );
  }, []);

  useEffect(() => {
    updateState();
    document.addEventListener('fullscreenchange', updateState);
    // @ts-expect-error vendor prefixed
    document.addEventListener('webkitfullscreenchange', updateState);
    // @ts-expect-error vendor prefixed
    document.addEventListener('mozfullscreenchange', updateState);
    // @ts-expect-error vendor prefixed
    document.addEventListener('MSFullscreenChange', updateState);

    return () => {
      document.removeEventListener('fullscreenchange', updateState);
      // @ts-expect-error vendor prefixed
      document.removeEventListener('webkitfullscreenchange', updateState);
      // @ts-expect-error vendor prefixed
      document.removeEventListener('mozfullscreenchange', updateState);
      // @ts-expect-error vendor prefixed
      document.removeEventListener('MSFullscreenChange', updateState);
    };
  }, [updateState]);

  const enter = useCallback(async () => {
    const el = document.documentElement;
    if (el.requestFullscreen) await el.requestFullscreen();
    // @ts-expect-error vendor prefixed
    else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
    // @ts-expect-error vendor prefixed
    else if (el.mozRequestFullScreen) await el.mozRequestFullScreen();
    // @ts-expect-error vendor prefixed
    else if (el.msRequestFullscreen) await el.msRequestFullscreen();
  }, []);

  const exit = useCallback(async () => {
    if (document.exitFullscreen) await document.exitFullscreen();
    // @ts-expect-error vendor prefixed
    else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
    // @ts-expect-error vendor prefixed
    else if (document.mozCancelFullScreen) await document.mozCancelFullScreen();
    // @ts-expect-error vendor prefixed
    else if (document.msExitFullscreen) await document.msExitFullscreen();
  }, []);

  const toggle = useCallback(() => {
    if (isFullscreen) exit();
    else enter();
  }, [isFullscreen, enter, exit]);

  return { isFullscreen, toggle, enter, exit };
};
