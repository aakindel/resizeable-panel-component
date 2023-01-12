import { RefObject, useCallback, useEffect, useState } from "react";
import fscreen from "fscreen";

// https://github.com/ChiragRupani/fullscreen-react/blob/main/src/FSUtility.ts
// https://github.com/rafgraph/fscreen
// https://stackoverflow.com/a/71519904 : hook
// https://stackoverflow.com/a/70131097

type useFullscreenProps = {
  elemRef: RefObject<HTMLElement>;
};

type useFullscreenReturn = {
  isInFullscreenMode: boolean;
  toggleFullscreen: () => void;
};

const useFullscreen = ({
  elemRef,
}: useFullscreenProps): useFullscreenReturn => {
  const [isInFullscreenMode, setIsInFullscreenMode] = useState(false);
  useEffect(() => {
    setIsInFullscreenMode(fscreen.fullscreenElement !== null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fscreen.fullscreenElement]);

  const toggleFullscreen = useCallback(() => {
    if (isInFullscreenMode) {
      fscreen.exitFullscreen();
    } else {
      if (elemRef && elemRef.current) {
        fscreen.requestFullscreen(elemRef.current);
      }
    }
  }, [isInFullscreenMode, elemRef]);

  return { isInFullscreenMode, toggleFullscreen };
};

export default useFullscreen;
