"use client";

import Image from "next/image";
import { useEffect, useRef, type RefObject } from "react";
import type { AppId } from "./Workspace";
import { containRoomTab } from "./ComputerFocus";
import { Icon } from "./RoomIcons";
import WindowCat from "./WindowCat";

export type ObjectId = "profile" | "conference" | "peru" | "games" | "climbing" | "wings" | "window" | "lamp" | "plants" | "cat";

type RoomObject = {
  title: string;
  crop?: string;
  photo?: { src: string; width: number; height: number; alt: string };
  app?: AppId;
  appLabel?: string;
};

const OBJECTS: Record<ObjectId, RoomObject> = {
  profile: { title: "Victor Ivanov", photo: { src: "/victor-profile.jpg", width: 343, height: 343, alt: "Victor's illustrated GitHub profile portrait" }, app: "about", appLabel: "About me" },
  conference: { title: "At the podium", photo: { src: "/conference-photo.jpg", width: 400, height: 400, alt: "A moment at the conference podium" }, app: "resume", appLabel: "My experience" },
  peru: { title: "Peru · September 2026", photo: { src: "/peru-travel.webp", width: 2400, height: 1800, alt: "A river running through a mountain town in Peru" } },
  games: { title: "Magic & Pokémon", crop: "1127 318 190 72", app: "interests", appLabel: "Off the clock" },
  climbing: { title: "Rock climbing", crop: "1306 326 49 56", app: "interests", appLabel: "Off the clock" },
  wings: { title: "Buffalo Wild Wings", crop: "1127 451 79 71" },
  window: { title: "By the window", crop: "20 112 397 445" },
  lamp: { title: "Desk lamp", crop: "326 413 156 239" },
  plants: { title: "Plants", crop: "1210 425 179 364" },
  cat: { title: "Meet the cat" },
};

export default function ObjectDetail({ selected, onClose, onOpenApp, returnFocus, moving }: {
  selected: ObjectId | null;
  onClose: () => void;
  onOpenApp: (id: AppId) => void;
  returnFocus: RefObject<HTMLElement | null>;
  moving: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const object = selected ? OBJECTS[selected] : null;
  const active = object !== null;

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (!active) {
      if (wasOpen.current && returnFocus.current?.isConnected) returnFocus.current.focus();
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
  }, [active, returnFocus]);

  function close() {
    dialog.current?.close();
    onClose();
  }

  return <dialog ref={dialog} className={`object-detail ${selected === "peru" ? "detail-landscape" : ""}`} aria-labelledby="object-detail-title" onKeyDown={containRoomTab} onCancel={(event) => { event.preventDefault(); close(); }} onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
    {object && <div className="object-detail-inner">
      <header className="object-detail-header"><h2 id="object-detail-title">{object.title}</h2><button ref={closeButton} className="detail-close" onClick={close}><Icon name="close" /><span>Back to room</span></button></header>
      <div className={`object-detail-visual ${object.photo ? "detail-photo" : "detail-illustration"}`}>
        {object.photo && <Image src={object.photo.src} width={object.photo.width} height={object.photo.height} alt={object.photo.alt} sizes={selected === "peru" ? "(max-width: 700px) 90vw, 720px" : "400px"} quality={90} style={{ maxWidth: object.photo.width }} />}
        {object.crop && <svg viewBox={object.crop} role="img" aria-label={object.title}><image href="/room-studio.svg" width="1440" height="850" /></svg>}
        {selected === "cat" && <div className="detail-cat" data-moving={moving}><WindowCat moving={moving} /></div>}
      </div>
      {(object.app || object.photo) && <footer className="object-detail-footer">{object.app && <button className="primary-link" onClick={() => { dialog.current?.close(); onOpenApp(object.app!); }}>{object.appLabel} <Icon name="arrow" /></button>}{object.photo && <a href={object.photo.src} target="_blank" rel="noopener noreferrer">View original photo <span aria-hidden="true">↗</span></a>}</footer>}
    </div>}
  </dialog>;
}
