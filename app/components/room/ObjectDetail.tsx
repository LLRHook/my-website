"use client";

import Image from "next/image";
import { useEffect, useRef, type RefObject } from "react";
import type { AppId } from "./Workspace";
import { containRoomTab } from "./ComputerFocus";
import { Icon } from "./RoomIcons";
import WindowCat from "./WindowCat";

export type ObjectId = "profile" | "conference" | "peru" | "games" | "poker" | "climbing" | "wings" | "window" | "lamp" | "plants" | "cat";

type RoomObject = {
  title: string;
  category: string;
  description: string;
  facts: [string, string][];
  crop?: string;
  photo?: { src: string; width: number; height: number; alt: string };
  app?: AppId;
  appLabel?: string;
};

const OBJECTS: Record<ObjectId, RoomObject> = {
  profile: {
    title: "A familiar face.", category: "PROFILE NOTE",
    description: "The illustrated portrait from my GitHub profile. Follow it into the computer for a little about me, the systems I work on, and the tools I reach for.",
    facts: [["From", "My GitHub profile"], ["Format", "Digital illustration"]],
    photo: { src: "/victor-profile.jpg", width: 343, height: 343, alt: "Victor's illustrated GitHub profile portrait" }, app: "about", appLabel: "Read about me",
  },
  conference: {
    title: "Away from the desk.", category: "PHOTO NOTE",
    description: "A moment at a conference podium, kept beside the résumé.",
    facts: [["In the room", "Beside the computer"], ["The photo", "A moment at the podium"]],
    photo: { src: "/conference-photo.jpg", width: 400, height: 400, alt: "A moment at the conference podium" }, app: "resume", appLabel: "Explore my experience",
  },
  peru: {
    title: "Peru · September 2026", category: "A POSTCARD FROM THE TRIP",
    description: "A photo from my September 2026 trip to Peru. Mountains on both sides, a river through town, and a view worth keeping beside the desk.",
    facts: [["Place", "Peru"], ["Trip", "September 2026"]],
    photo: { src: "/peru-travel.webp", width: 2400, height: 1800, alt: "A river running through a mountain town in Peru" }, app: "interests", appLabel: "More off the clock",
  },
  games: {
    title: "There’s always another deck.", category: "THE GAME SHELF",
    description: "Pokémon collecting means hunting for cards and opening packs with friends. Magic: The Gathering belongs here too. The five deck boxes nod to Magic’s five colors.",
    facts: [["On the shelf", "Magic: The Gathering · Pokémon"], ["In the room", "Middle shelf, right of the desk"]], crop: "1127 318 190 72", app: "interests", appLabel: "More off the clock",
  },
  poker: {
    title: "A seat at the table.", category: "CARDS ON THE DESK",
    description: "Poker earns a little corner of the desk: a few chips, a pair of cards, and another game built around choices. A quiet nod to one of my interests.",
    facts: [["The details", "Playing cards & poker chips"], ["In the room", "Right side of the desk"]], crop: "977 567 125 88", app: "interests", appLabel: "Explore my interests",
  },
  climbing: {
    title: "One more attempt.", category: "A DIFFERENT KIND OF PROBLEM",
    description: "Rock climbing is my regular break from the screen. A chalk bag and carabiner keep that part of my life close by: different holds, the same satisfaction of working through a problem.",
    facts: [["The details", "Chalk bag & carabiner"], ["In the room", "Beside the game shelf"]], crop: "1306 326 49 56", app: "interests", appLabel: "More off the clock",
  },
  wings: {
    title: "Wings after a long week.", category: "A FAVORITE COMFORT",
    description: "A small gold carton is the room’s nod to Buffalo Wild Wings. The familiar things deserve a place here alongside the projects and books.",
    facts: [["A nod to", "Buffalo Wild Wings"], ["In the room", "Bottom shelf"]], crop: "1127 451 79 71", app: "interests", appLabel: "Explore my interests",
  },
  window: {
    title: "Let a little outside in.", category: "THE WINDOW CORNER",
    description: "An imagined view for this virtual room: green trees, afternoon light, and a curtain that catches the breeze. The window is also the cat’s favorite place to do very little.",
    facts: [["The scene", "An illustrated room"], ["The mood", "A quiet afternoon"]], crop: "20 112 397 445",
  },
  lamp: {
    title: "A little pool of light.", category: "ON THE WORKBENCH",
    description: "A forest-green task lamp, warm oak, and a keyboard within reach. The room’s small working details make a home for the software on the screen.",
    facts: [["The details", "Articulated task lamp"], ["In the room", "Left side of the desk"]], crop: "326 413 156 239", app: "projects", appLabel: "See what I’m building",
  },
  plants: {
    title: "Room to grow.", category: "THE GREEN CORNER",
    description: "A trailing plant spills over the shelf, with another pot down on the floor. These are illustrated details in the virtual room, drawn to keep the workspace feeling calm and lived in.",
    facts: [["The details", "Trailing leaves & terracotta"], ["In the room", "Right side of the studio"]], crop: "1210 425 179 364",
  },
  cat: {
    title: "Resident quality assurance.", category: "CURRENTLY ON A BREAK",
    description: "The virtual room’s sleepiest resident. Mostly napping, occasionally looking around, sometimes stopping for a quick groom. Say hello below, then let him get back to it.",
    facts: [["Favorite spot", "The window sill"], ["Current assignment", "Taking it easy"]],
  },
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
      <header className="object-detail-header"><span className="eyebrow">THINGS AROUND THE ROOM</span><button ref={closeButton} className="detail-close" onClick={close}><Icon name="close" /><span>Back to room</span></button></header>
      <div className="object-detail-layout">
        <div className={`object-detail-visual ${object.photo ? "detail-photo" : "detail-illustration"}`}>
          {object.photo && <Image src={object.photo.src} width={object.photo.width} height={object.photo.height} alt={object.photo.alt} sizes={selected === "peru" ? "(max-width: 700px) 90vw, 720px" : "400px"} quality={90} style={{ maxWidth: object.photo.width }} />}
          {object.crop && <svg viewBox={object.crop} role="img" aria-label={`Close-up of ${object.title}`}><image href="/room-studio.svg" width="1440" height="850" /></svg>}
          {selected === "cat" && <div className="detail-cat" data-moving={moving}><WindowCat moving={moving} /></div>}
          <span className="detail-visual-tag">{object.photo ? "FROM MY PHOTO NOTES" : "A SMALL DETAIL, UP CLOSE"}</span>
        </div>
        <div className="object-detail-story"><p className="eyebrow">{object.category}</p><h2 id="object-detail-title">{object.title}</h2><p className="detail-description">{object.description}</p><dl>{object.facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><div className="detail-actions">{object.app && <button className="primary-link" onClick={() => { dialog.current?.close(); onOpenApp(object.app!); }}>{object.appLabel} <Icon name="arrow" /></button>}{object.photo && <a href={object.photo.src} target="_blank" rel="noopener noreferrer">View original photo <span aria-hidden="true">↗</span></a>}</div></div>
      </div>
      <footer className="object-detail-footer">A closer look at Victor’s workspace.<span>ESC to return to the room</span></footer>
    </div>}
  </dialog>;
}
