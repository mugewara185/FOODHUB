import { useEffect, useRef } from 'react';

export interface Location {
  lat: number;
  lng: number;
}

export class GPSSimulator {
  private timer: ReturnType<typeof setInterval> | null = null;
  private route: Location[] = [];
  private currentStep = 0;
  private readonly intervalMs: number;
  private readonly onLocationUpdate: (loc: Location) => void;

  constructor(
    intervalMs: number = 2000,
    onLocationUpdate: (loc: Location) => void
  ) {
    this.intervalMs = intervalMs;
    this.onLocationUpdate = onLocationUpdate;
  }

  public start(route: Location[]) {
    if (this.timer) {
      console.warn('GPS Simulator already running');
      return;
    }
    if (route.length === 0) return;

    this.route = route;
    this.currentStep = 0;

    // Emit initial
    this.onLocationUpdate(this.route[this.currentStep]);

    this.timer = setInterval(() => {
      this.currentStep++;
      if (this.currentStep < this.route.length) {
        this.onLocationUpdate(this.route[this.currentStep]);
      } else {
        this.stop(); // Route completed
      }
    }, this.intervalMs);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public generateMockRoute(start: Location, end: Location, steps: number = 10): Location[] {
    const route: Location[] = [];
    for (let i = 0; i <= steps; i++) {
      route.push({
        lat: start.lat + ((end.lat - start.lat) * i) / steps,
        lng: start.lng + ((end.lng - start.lng) * i) / steps,
      });
    }
    return route;
  }
}

export function useGPSSimulator(
  enabled: boolean,
  startLoc: Location | null | undefined,
  endLoc: Location | null | undefined,
  onLocationUpdate: (loc: Location) => void,
  intervalMs: number = 2000,
  steps: number = 10
) {
  const onUpdateRef = useRef(onLocationUpdate);
  useEffect(() => {
    onUpdateRef.current = onLocationUpdate;
  });

  useEffect(() => {
    if (!enabled || !startLoc || !endLoc) return;

    const simulator = new GPSSimulator(intervalMs, (loc) => {
      onUpdateRef.current(loc);
    });

    const route = simulator.generateMockRoute(startLoc, endLoc, steps);
    simulator.start(route);

    return () => {
      simulator.stop();
    };
  }, [enabled, startLoc?.lat, startLoc?.lng, endLoc?.lat, endLoc?.lng, intervalMs, steps]);
}

