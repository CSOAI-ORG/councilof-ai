import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import OsShell from "@/components/os/OsShell";
import {
  BOARD_PANE,
  DOOR_TO_LOBBY,
  DOORS,
  doorFromSearch,
  osLeaveForSearch,
  type DoorId,
  LOBBY_TO_DOOR,
} from "@/components/os/doors";
import { osDoorHref } from "@/lib/lobbyLink";

/**
 * OsLauncher — Council OS at /os. THE AG-UI HOST.
 *
 * Chat is the front door. Tabs: Board · Verify · Space · Assess · Harness.
 * Four tools: board_totals · get_axis · verify_card · list_cards.
 * Same shell as the homepage hero — no second UI, no iframe of /.
 */
export {
  BOARD_PANE,
  DOOR_TO_LOBBY,
  DOORS,
  doorFromSearch,
  osLeaveForSearch,
  LOBBY_TO_DOOR,
};
export type { DoorId };

export default function OsLauncher() {
  const search = useSearch();
  const [location, setLocation] = useLocation();
  const [door, setDoor] = useState<DoorId | null>(() => doorFromSearch(search));

  useEffect(() => {
    document.title = "Council OS | councilof.ai";
  }, []);

  useEffect(() => {
    const leave = osLeaveForSearch(search);
    if (leave) {
      window.location.assign(leave);
      return;
    }
    setDoor(doorFromSearch(search));
  }, [search]);

  return (
    <OsShell
      variant="page"
      door={door}
      onDoor={(id) => {
        setDoor(id);
        setLocation(osDoorHref(DOOR_TO_LOBBY[id], search, location === "/" ? "/" : "/os"));
      }}
    />
  );
}
