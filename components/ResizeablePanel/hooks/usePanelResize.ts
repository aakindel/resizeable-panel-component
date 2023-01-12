// https://stackoverflow.com/a/68742668 (usePanelResize hook)
import { useState, RefObject, useRef, useEffect } from "react";
import { useRefDimensions } from "./useRefDimensions";

type usePanelResizeProps = {
  containerRef: RefObject<HTMLElement>;
  panelRef: RefObject<HTMLElement>;
  handleWidth: number;
  minWidth?: number;
  initialWidth?: number;
  pxMaxPanelWidth?: number;
  shouldPanelDefaultToMaxWidth?: boolean;
  isInFullscreenMode?: boolean;
  shouldContainerContainHandle?: boolean;
};

type usePanelResizeReturn = {
  panelWidth: number;
  isResizing: boolean;
  onResizeStart: (e: PointerEvent | TouchEvent) => void;
  onResizeEnd: (e: PointerEvent | TouchEvent) => void;
};

/* create fixed positioned `coverDiv` that covers entire area,
   and initially disable events on `coverDiv` (which allows events 
   to reach elements below `coverDiv`); when resizing, events will be
   enabled on `coverDiv` which will block events from reaching below
   (i.e., if you're resizing and your mouse hovers over a button
   in an iframe, the iframe button's hover event will not fire);
   TODO: address bug where the cursor is still 'ew-resize' 
   after the user has let go of the mouse
     - (see https://stackoverflow.com/a/41921911 : inconsistent 'fix') */
const createCoverDiv = ({
  coverID,
  isBodyCover = false,
}: {
  coverID: string;
  isBodyCover?: boolean;
}) => {
  const coverDiv = document.createElement("div");

  if (isBodyCover) {
    /* use `id` create a single coverDiv to cover the entire body  */
    coverDiv.id = coverID;
  } else {
    /* use an attribute to allow for multiple coverDivs (in the case
       where there are multiple resizable panels on a single page)  */
    coverDiv.setAttribute("data-cover-div", coverID);
  }
  coverDiv.style.zIndex = "99999";
  coverDiv.style.position = "fixed";
  coverDiv.style.top = "0";
  coverDiv.style.left = "0";
  coverDiv.style.right = "0";
  coverDiv.style.bottom = "0";
  coverDiv.style.cursor = "auto";
  coverDiv.style.pointerEvents = "none";
  coverDiv.style.userSelect = "none";
  coverDiv.style.touchAction = "none";
  return coverDiv;
};

/* enable events on coverDiv and thus block
   events from reaching elements below coverDiv */
const enableCoverDivEvents = ({
  coverID,
  containerRef,
  isBodyCover = false,
}: {
  coverID: string;
  containerRef?: RefObject<HTMLElement>;
  isBodyCover?: boolean;
}) => {
  const coverDiv = isBodyCover
    ? document.getElementById(coverID)
    : (containerRef?.current?.querySelector(
        `[data-cover-div="${coverID}"]`
      ) as HTMLElement);

  if (!containerRef && !isBodyCover) {
    console.error("`containerRef` must be provided if `!isBodyCover`");
  }

  if (coverDiv) {
    coverDiv.style.cursor = "ew-resize";
    coverDiv.style.pointerEvents = "auto";
    coverDiv.style.userSelect = "auto";
    coverDiv.style.touchAction = "auto";
  }
};

/* disable events on coverDiv and thus allow
  events to reach elements below coverDiv */
const disableCoverDivEvents = ({
  coverID,
  containerRef,
  isBodyCover = false,
}: {
  coverID: string;
  containerRef?: RefObject<HTMLElement>;
  isBodyCover?: boolean;
}) => {
  const coverDiv = isBodyCover
    ? document.getElementById(coverID)
    : (containerRef?.current?.querySelector(
        `[data-cover-div="${coverID}"]`
      ) as HTMLElement);

  if (!containerRef && !isBodyCover) {
    console.error("`containerRef` must be provided if `!isBodyCover`");
  }

  if (coverDiv) {
    coverDiv.style.cursor = "auto";
    coverDiv.style.pointerEvents = "none";
    coverDiv.style.userSelect = "none";
    coverDiv.style.touchAction = "none";
  }
};

const getMaxWidth = ({
  containerRef,
  handleWidth,
  pxMaxPanelWidth,
  shouldContainerContainHandle,
  isInFullscreenMode,
}: {
  containerRef: RefObject<HTMLElement>;
  handleWidth: number;
  pxMaxPanelWidth?: number;
  shouldContainerContainHandle: boolean;
  isInFullscreenMode: boolean;
}) => {
  if (containerRef && containerRef.current) {
    if (pxMaxPanelWidth) {
      return pxMaxPanelWidth;
    }

    return shouldContainerContainHandle
      ? containerRef.current.clientWidth - handleWidth
      : isInFullscreenMode
      ? containerRef.current.clientWidth - handleWidth
      : containerRef.current.clientWidth;
  }
  return 0;
};

const usePanelResize = ({
  containerRef,
  panelRef,
  handleWidth,
  initialWidth = 0,
  minWidth = 0,
  pxMaxPanelWidth,
  shouldPanelDefaultToMaxWidth = false,
  shouldContainerContainHandle = false,
  isInFullscreenMode = false,
}: usePanelResizeProps): usePanelResizeReturn => {
  const hasWindow = typeof window !== undefined;
  const bodyCoverID = "resizeable-panel-body-cover-div-id";
  const containerCoverID = "resizeable-panel-container-cover-div-id";

  useEffect(() => {
    if (!document.getElementById(bodyCoverID)) {
      // create `bodyCoverDiv` that covers entire screen
      const bodyCoverDiv = createCoverDiv({
        coverID: bodyCoverID,
        isBodyCover: true,
      });
      document.body?.append(bodyCoverDiv);
    }

    if (containerRef.current) {
      const doesCoverDivAlreadyExist = Array.from(
        containerRef.current.children
      ).filter((elem) => elem.getAttribute("data-cover-div")).length;

      if (!doesCoverDivAlreadyExist) {
        /* create `containerCoverDiv` that covers entire container
         (this is necessary for when the container is fullscreen) */
        const containerCoverDiv = createCoverDiv({
          coverID: containerCoverID,
        });
        containerRef.current?.append(containerCoverDiv);
      }
    }
  }, [containerCoverID, containerRef]);

  // https://stackoverflow.com/a/45936724 : prevent page scroll on initial drag
  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.style.touchAction = "none";
    }
  }, [panelRef]);

  // https://blog.thoughtspile.tech/2021/10/18/non-react-state/ : xPos useRef
  /* `startingResizeXPos` will be used in calculating 
     the panel's new width after the panel is resized */
  const startingResizeXPos = useRef<number>(0);

  const [
    localShouldPanelDefaultToMaxWidth,
    setLocalShouldPanelDefaultToMaxWidth,
  ] = useState(shouldPanelDefaultToMaxWidth);

  // `isResizing` will be exported to inform other components of resizing
  const [isResizing, setIsResizing] = useState(false);

  const [panelWidth, setPanelWidth] = useState(
    initialWidth ? initialWidth : minWidth
  );

  /* `oldPanelWidth` will be used in determining what `panelWidth`
     should be when the user toggles between fullscreen and normal mode */
  const [oldPanelWidth, setOldPanelWidth] = useState(0);

  /* set `panelWidth` to `maxWidth` if `shouldPanelDefaultToMaxWidth` */
  useEffect(() => {
    if (localShouldPanelDefaultToMaxWidth && containerRef.current) {
      const maxWidth = getMaxWidth({
        containerRef,
        handleWidth,
        pxMaxPanelWidth,
        shouldContainerContainHandle,
        isInFullscreenMode,
      });

      /* only set `panelWidth` to `maxWidth` when `!isInFullscreenMode`
         to fix bug where `panelWidth` is set to `maxWidth` 
         every time the user switches to fullscreen mode */
      setLocalShouldPanelDefaultToMaxWidth(false);
      !isInFullscreenMode && setPanelWidth(maxWidth);
    }
  }, [
    containerRef,
    shouldPanelDefaultToMaxWidth,
    handleWidth,
    isInFullscreenMode,
    shouldContainerContainHandle,
    pxMaxPanelWidth,
    localShouldPanelDefaultToMaxWidth,
  ]);

  /* this `useRefDimensions` call makes the `panelWidth > maxWidth` check work
     by updating the containerRef width with useState to trigger rerender? */
  useRefDimensions(containerRef);

  // handle setting panelWidth when full screen is toggled
  useEffect(() => {
    if (containerRef.current) {
      const maxWidth = getMaxWidth({
        containerRef,
        handleWidth,
        pxMaxPanelWidth,
        shouldContainerContainHandle,
        isInFullscreenMode,
      });

      /* conditions below are for resizing the panel on switch from
         normal mode to fullscreen mode; the conditions in `onResize`
         make sure that `minWidth <= panelWidth <= maxWidth` is true. */
      if (panelWidth > maxWidth) {
        /* if fullscreen `panelWidth` > normal `maxWidth`, 
           set normal `panelWidth` to normal `maxWidth` */
        setOldPanelWidth(panelWidth);
        !isInFullscreenMode && setPanelWidth(maxWidth);
      } else if (oldPanelWidth <= maxWidth && oldPanelWidth > panelWidth) {
        /* if fullscreen `panelWidth` > normal `maxWidth` and then 
           user switches to normal mode, then switches back to 
           fullscreen mode without resizing in between switches 
           (since `oldPanelWidth` is reset in `onResizeStart`),
           then maintain fullscreen `panelWidth` (i.e. `oldPanelWidth`) 
           instead of setting fullscreen `panelWidth` to normal `maxWidth` */
        setPanelWidth(oldPanelWidth);
      }
    }
  }, [
    containerRef,
    containerRef.current?.clientWidth,
    panelWidth,
    minWidth,
    oldPanelWidth,
    handleWidth,
    shouldContainerContainHandle,
    isInFullscreenMode,
    pxMaxPanelWidth,
  ]);

  // https://stackoverflow.com/a/61732450 : find touch position js
  const isTouchEvent = (e: PointerEvent | TouchEvent) => {
    return (
      e.type == "touchstart" ||
      e.type == "touchmove" ||
      e.type == "touchend" ||
      e.type == "touchcancel"
    );
  };

  const onResizeStart = (e: PointerEvent | TouchEvent) => {
    /* enable events on cover divs and thus block
       events from reaching elements below cover divs */
    enableCoverDivEvents({
      coverID: bodyCoverID,
      isBodyCover: true,
    });
    enableCoverDivEvents({
      coverID: containerCoverID,
      containerRef,
    });

    // reset `oldPanelWidth`
    setOldPanelWidth(0);

    if (panelRef.current) {
      /* don't set pointerEvents to none b/c that messes up resize cursor
         i.e. don't do `panelRef.current.style.pointerEvents = "none";` */
      panelRef.current.style.userSelect = "none";
      panelRef.current.style.touchAction = "none";
    }

    if (containerRef.current) {
      containerRef.current.classList.add("resizing");
      containerRef.current.style.cursor = "ew-resize";

      /* set `startingResizeXPos` to the pointer's X location starting from 
         the container's left X bound, not the window's left X bound (i.e. 0) */
      const bounds = containerRef.current.getBoundingClientRect();
      startingResizeXPos.current = (e as PointerEvent).clientX - bounds.left;
    }

    // add pointer and touch listeners for `onResize` and `onResizeEnd`
    if (hasWindow) {
      window.addEventListener("pointermove", onResize);
      window.addEventListener("touchmove", onResize);
      window.addEventListener("touchend", onResizeEnd);
      window.addEventListener("pointerup", onResizeEnd);
    }
  };

  const onResize = (e: PointerEvent | TouchEvent) => {
    setIsResizing(true);

    if (containerRef.current) {
      const maxWidth = getMaxWidth({
        containerRef,
        handleWidth,
        pxMaxPanelWidth,
        shouldContainerContainHandle,
        isInFullscreenMode,
      });

      // calculate new panel width
      const bounds = containerRef.current.getBoundingClientRect();
      const newReziseXPos = isTouchEvent(e)
        ? (e as TouchEvent).touches[0].clientX - bounds.left
        : (e as PointerEvent).clientX - bounds.left;
      const newWidth = panelWidth - startingResizeXPos.current + newReziseXPos;

      // ensure `panelWidth` never exceeds `minWidth` or `maxWidth`s
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setPanelWidth(newWidth);
      } else if (newWidth < minWidth) {
        setPanelWidth(minWidth);
      } else if (newWidth > maxWidth) {
        setPanelWidth(maxWidth);
      }
    }
  };

  const onResizeEnd = () => {
    setIsResizing(false);

    /* disable events on cover divs and thus allow
       events to reach elements below cover divs */
    disableCoverDivEvents({
      coverID: bodyCoverID,
      isBodyCover: true,
    });
    disableCoverDivEvents({
      coverID: containerCoverID,
      containerRef,
    });

    if (panelRef.current) {
      panelRef.current.style.pointerEvents = "auto";
      panelRef.current.style.userSelect = "auto";
    }

    if (containerRef.current) {
      containerRef.current.classList.remove("resizing");
      containerRef.current.style.cursor = "auto";
    }

    // remove pointer and touch listeners for `onResize` and `onResizeEnd`
    if (hasWindow) {
      window.removeEventListener("pointermove", onResize);
      window.removeEventListener("touchmove", onResize);
      window.removeEventListener("touchend", onResizeEnd);
      window.removeEventListener("pointerup", onResizeEnd);
    }
  };

  return { panelWidth, isResizing, onResizeStart, onResizeEnd };
};

export default usePanelResize;
