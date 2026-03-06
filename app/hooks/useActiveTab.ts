"use client";

import { useState } from "react";
import { ActiveTab } from "@/app/lib/types";

export function useActiveTab(initial: ActiveTab = "work") {
  return useState<ActiveTab>(initial);
}
