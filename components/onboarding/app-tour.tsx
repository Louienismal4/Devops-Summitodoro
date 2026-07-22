"use client";

import { useEffect } from "react";
import { driver } from "driver.js";

const TOUR_STORAGE_KEY = "summitodoro:tour-complete";

export function AppTour({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;

    const launchTour = () => {
      if (window.localStorage.getItem(TOUR_STORAGE_KEY)) return;

      const tour = driver({
        showProgress: true,
        animate: true,
        overlayColor: "#102d20",
        overlayOpacity: 0.68,
        popoverClass: "summitodoro-tour",
        nextBtnText: "Next",
        prevBtnText: "Back",
        doneBtnText: "Start climbing",
        steps: [
          {
            element: '[data-tour="mountain-selector"]',
            popover: {
              title: "Choose your mountain",
              description:
                "Pick a trail before you start. Mountain switching is locked once your expedition is underway.",
              side: "right",
              align: "start",
            },
          },
          {
            element: ".timer-panel",
            popover: {
              title: "Set your focus time",
              description:
                "Choose a duration, then deploy your hiker. Checkpoints scale with your selected time.",
              side: "right",
              align: "start",
            },
          },
          {
            element: '[data-tour="music-player"]',
            popover: {
              title: "Start a YouTube stream",
              description:
                "Use the YouTube player for an optional video or live stream while you focus.",
              side: "right",
              align: "start",
            },
          },
          {
            element: ".checkpoint-dock",
            popover: {
              title: "Watch your route objectives",
              description:
                "Hover or focus a checkpoint to see when it unlocks during your session.",
              side: "top",
              align: "start",
            },
          },
        ],
        onDestroyed: () => {
          window.localStorage.setItem(TOUR_STORAGE_KEY, "true");
        },
      });

      tour.drive();
    };

    const timer = window.setTimeout(launchTour, 600);
    return () => window.clearTimeout(timer);
  }, [enabled]);

  return null;
}
