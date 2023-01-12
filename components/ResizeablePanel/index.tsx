import React, { useCallback, useEffect, useRef } from "react";
import usePanelResize from "./hooks/usePanelResize";
import { ArrowsPointingOutIcon } from "@heroicons/react/24/outline";
import { useRefDimensions } from "./hooks/useRefDimensions";
import useFullscreen from "./hooks/useFullscreen";

const DEFAULT_PX_HANDLE_WIDTH = 22;
const DEFAULT_PX_MIN_WIDTH = 350;

type ResizeablePanelContentProps = {
  pxHeight?: number;
  pxWidth?: number;
  handleWidth: number;
  containerRef: React.MutableRefObject<null>;
  panelRef: React.MutableRefObject<null>;
  panelRefWidth: number;
  panelWidth: number;
  isInFullscreenMode: boolean;
  panelRefHeight: number;
  containerRefWidth: number;
  containerRefHeight: number;
  containerBgColor: string;
  containerFullscreenBgColor: string;
  toggleFullscreen: () => void;
  onResizeStart: (e: PointerEvent | TouchEvent) => void;
  children?:
    | React.ReactNode
    | ((x: {
        panelRefWidth: number;
        panelRefHeight: number;
        containerRefWidth: number;
        containerRefHeight: number;
        isInFullscreenMode: boolean;
        toggleFullscreen: () => void;
      }) => React.ReactNode);
};

const ResizeablePanelContent = ({
  pxHeight,
  pxWidth,
  handleWidth,
  containerRef,
  panelRef,
  panelRefWidth,
  panelWidth,
  isInFullscreenMode,
  panelRefHeight,
  containerRefWidth,
  containerRefHeight,
  containerBgColor,
  containerFullscreenBgColor,
  toggleFullscreen,
  onResizeStart,
  children,
}: ResizeablePanelContentProps) => {
  return (
    <div
      ref={containerRef}
      style={{
        width: pxWidth ? `${pxWidth}px` : "100%",
        height: pxHeight ? `${pxHeight}px` : "auto",
        opacity: panelRefWidth !== -1 ? "1" : "0",
        backgroundColor: isInFullscreenMode
          ? containerFullscreenBgColor
          : containerBgColor,
      }}
    >
      <div
        ref={panelRef}
        className="relative h-full max-w-full"
        style={{
          width: `${panelWidth}px`,
        }}
      >
        {/* PANEL CHILDREN */}
        <div
          className="h-full w-full overflow-hidden rounded-[5px] border 
            border-solid border-[#e5e7eb] [transform:translateZ(1px)]"
        >
          {typeof children === "function"
            ? children({
                panelRefWidth,
                panelRefHeight,
                containerRefWidth,
                containerRefHeight,
                isInFullscreenMode,
                toggleFullscreen,
              })
            : children}
        </div>

        {/* PANEL RESIZE HANDLE */}
        <div
          className="absolute top-0 left-full flex h-full cursor-ew-resize items-center justify-center bg-transparent"
          style={{
            width: `${handleWidth}px`,
            zIndex: 999,
          }}
          onPointerDown={(e) => onResizeStart(e as unknown as PointerEvent)}
        >
          <div className="h-8 w-[0.375rem] rounded-[9999px] bg-[#94a3b8]"></div>
        </div>
      </div>
    </div>
  );
};

type ResizeablePanelProps = {
  pxHeight?: number;
  pxWidth?: number;
  pxMinPanelWidth?: number;
  pxInitialPanelWidth?: number;
  pxMaxPanelWidth?: number;
  pxHandleWidth?: number;
  shouldShowTopbar?: boolean;
  shouldHideOptions?: boolean;
  shouldShowFullscreenOption?: boolean;
  shouldPanelDefaultToMaxWidth?: boolean;
  shouldContainerContainHandle?: boolean;
  containerBgColor?: string;
  containerFullscreenBgColor?: string;
  title?: string | React.ReactElement;
  children?:
    | React.ReactNode
    | ((x: {
        panelRefWidth: number;
        panelRefHeight: number;
        containerRefWidth: number;
        containerRefHeight: number;
        isInFullscreenMode: boolean;
        toggleFullscreen: () => void;
      }) => React.ReactNode);
};

export const ResizeablePanel = ({ ...props }: ResizeablePanelProps) => {
  const {
    pxHeight,
    pxWidth,
    pxMinPanelWidth,
    pxInitialPanelWidth,
    pxMaxPanelWidth,
    pxHandleWidth,
    title,
    shouldShowTopbar = true,
    shouldHideOptions = false,
    shouldShowFullscreenOption = true,
    shouldPanelDefaultToMaxWidth = true,
    shouldContainerContainHandle = false,
    containerBgColor = "#fff",
    containerFullscreenBgColor = "#fff",
  } = props;

  const containerRef = useRef(null);
  const panelRef = useRef(null);
  const handleWidth = pxHandleWidth ? pxHandleWidth : DEFAULT_PX_HANDLE_WIDTH;

  // get panel width and height
  const { refWidth: panelRefWidth, refHeight: panelRefHeight } =
    useRefDimensions(panelRef);

  // get container width and height
  const { refWidth: containerRefWidth, refHeight: containerRefHeight } =
    useRefDimensions(containerRef);

  const { isInFullscreenMode, toggleFullscreen } = useFullscreen({
    elemRef: containerRef,
  });

  // pass handle width into hook and use it to limit max size
  const { panelWidth, onResizeStart } = usePanelResize({
    containerRef,
    panelRef,
    handleWidth,
    minWidth: pxMinPanelWidth ? pxMinPanelWidth : DEFAULT_PX_MIN_WIDTH,
    initialWidth: pxInitialPanelWidth
      ? pxInitialPanelWidth
      : DEFAULT_PX_MIN_WIDTH,
    pxMaxPanelWidth,
    shouldPanelDefaultToMaxWidth,
    shouldContainerContainHandle,
    isInFullscreenMode,
  });

  const contentProps: ResizeablePanelContentProps = {
    pxHeight,
    pxWidth,
    handleWidth,
    containerRef,
    panelRef,
    panelRefWidth,
    panelWidth,
    isInFullscreenMode,
    panelRefHeight,
    containerRefWidth,
    containerRefHeight,
    containerBgColor,
    containerFullscreenBgColor,
    toggleFullscreen,
    onResizeStart,
  };

  return (
    <div className="flex w-full flex-col">
      {typeof props.children === "function" ? (
        <></>
      ) : (
        shouldShowTopbar && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <h1 className="flex self-center text-xl font-bold leading-7 tracking-normal text-slate-700">
              {typeof title === "string" ? <span>{title}</span> : title}
            </h1>
            {!shouldHideOptions && (
              <div className="flex space-x-2">
                <div
                  className="pointer-events-none inset-y-0 right-0 
                  flex w-9 items-center justify-center"
                >
                  {shouldShowFullscreenOption && (
                    <button
                      className="pointer-events-auto flex h-8 w-8 items-center 
                        justify-center rounded-md border border-solid border-gray-300 
                        hover:bg-gray-100 focus:outline-none focus:ring focus:ring-blue-300"
                      onClick={() => {
                        toggleFullscreen();
                      }}
                    >
                      <ArrowsPointingOutIcon
                        className="h-5 w-5 stroke-2 text-gray-500"
                        aria-hidden="true"
                      />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      )}
      <ResizeablePanelContent {...contentProps}>
        {typeof props.children === "function"
          ? props.children
          : () => {
              return (
                <React.Fragment>
                  {props.children as React.ReactNode}
                </React.Fragment>
              );
            }}
      </ResizeablePanelContent>
    </div>
  );
};

type ResizeablePanelIFrameProps = ResizeablePanelProps & {
  src: string;
};

export const ResizeablePanelIFrame = ({
  src: iframeSrc,
  ...props
}: ResizeablePanelIFrameProps) => {
  const contentRef = useRef<HTMLIFrameElement>(null);
  const { pxHandleWidth } = props;

  const handleWidth = pxHandleWidth ? pxHandleWidth : DEFAULT_PX_HANDLE_WIDTH;

  const loadPanelIFrame = useCallback(() => {
    // if the link is internal
    if (contentRef?.current?.src?.startsWith("/")) {
      const handleDiv = document.createElement("div");
      handleDiv.id = "iframe-handle";
      handleDiv.setAttribute(
        "class",
        "absolute top-0 left-full flex h-full cursor-ew-resize items-center justify-center bg-transparent"
      );
      handleDiv.style.width = `${handleWidth}px`;

      try {
        const nextElem =
          contentRef?.current?.contentWindow?.document.getElementById("__next");

        if (nextElem) {
          nextElem.style.height = "100vh";
          if (
            !contentRef?.current?.contentWindow?.document.getElementById(
              "iframe-handle"
            )
          ) {
            /* iframe takes up full width so touchEvents on handle will be
             picked up by iframe unless iframe has its own resize handle in the
             same location of the panel resize handle */
            nextElem.appendChild(handleDiv);
          }
        }

        if (contentRef?.current?.contentWindow?.document) {
          contentRef.current.contentWindow.document.body.style.height = "100%";
          contentRef.current.contentWindow.document.body.style.width = "100%";
          contentRef.current.contentWindow.document.body.style.overflow =
            "hidden";
        }
      } catch (error) {
        console.error(error);
      }
    }
  }, [contentRef, handleWidth]);

  useEffect(() => {
    loadPanelIFrame();
  }, [loadPanelIFrame]);

  return (
    <ResizeablePanel {...props}>
      <iframe
        className="h-full w-full overflow-hidden"
        ref={contentRef}
        src={iframeSrc}
        onLoad={() => {
          loadPanelIFrame();
        }}
      ></iframe>
    </ResizeablePanel>
  );
};
