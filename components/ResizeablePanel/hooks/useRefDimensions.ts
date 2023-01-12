import { RefObject, useCallback, useEffect, useState } from "react";

// https://www.manuelkruisz.com/blog/posts/react-width-height-resize-hook
// https://stackoverflow.com/a/59989768 : get width of react element
// https://stackoverflow.com/a/67089559 : ResizeObserver
export const useRefDimensions = (myRef: RefObject<HTMLElement>) => {
  const [refWidth, setRefWidth] = useState(-1);
  const [refHeight, setRefHeight] = useState(-1);

  const handleResize = useCallback(() => {
    if (myRef.current) {
      setRefWidth(myRef.current.offsetWidth);
      setRefHeight(myRef.current.offsetHeight);
    }
  }, [myRef]);

  useEffect(() => {
    if (myRef?.current) {
      const resizeObserver = new ResizeObserver(() => handleResize());
      resizeObserver.observe(myRef?.current as Element);
    }
  }, [handleResize, myRef]);

  return { refWidth, refHeight };
};
