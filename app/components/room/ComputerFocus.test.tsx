import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { containRoomTab } from "./ComputerFocus";
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it("wraps focus past controls disabled through their fieldset", () => {
  vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue([{}] as unknown as DOMRectList);
  render(<dialog open onKeyDown={containRoomTab}><button>Close</button><fieldset disabled><input aria-label="Disabled choice" /></fieldset></dialog>);
  const close=screen.getByRole("button",{name:"Close"});
  close.focus();
  expect(fireEvent.keyDown(close,{key:"Tab",cancelable:true})).toBe(false);
  expect(close).toHaveFocus();
  expect(fireEvent.keyDown(close,{key:"Tab",shiftKey:true,cancelable:true})).toBe(false);
  expect(close).toHaveFocus();
});
