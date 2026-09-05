"use client";

import { useEffect, useRef, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { Icon } from "./RoomIcons";

export function containRoomTab(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== "Tab") return;
  const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )).filter((element) => element.tabIndex >= 0 && element.getClientRects().length > 0);
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

export default function ComputerFocus({ active, onClose, returnFocus, fallbackFocus, children }: {
  active: boolean;
  onClose: () => void;
  returnFocus: RefObject<HTMLElement | null>;
  fallbackFocus: RefObject<HTMLButtonElement | null>;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (!active) {
      if (wasOpen.current) {
        const trigger = returnFocus.current;
        if (trigger?.isConnected) trigger.focus();
        else fallbackFocus.current?.focus();
      }
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;
    element.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    return () => {
      element.close();
      document.body.style.overflow = previous;
    };
  }, [active, returnFocus, fallbackFocus]);

  function close() {
    dialog.current?.close();
    onClose();
  }

  return <>
    {!active && children}
    <dialog ref={dialog} className="computer-focus" aria-labelledby="computer-focus-title" onKeyDown={containRoomTab} onCancel={(event) => { event.preventDefault(); close(); }} onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div className="computer-focus-inner">
        <header className="computer-focus-header"><div><span className="eyebrow">A CLOSER LOOK</span><h2 id="computer-focus-title">Your seat at my desk.</h2></div><button ref={closeButton} className="detail-close" onClick={close}><Icon name="close" /><span>Back to room</span></button></header>
        <div className="focused-monitor-wrap">{active && children}</div>
        <p className="computer-focus-caption">Open a folder to explore. Your place on the computer stays here.</p>
      </div>
    </dialog>
  </>;
}
