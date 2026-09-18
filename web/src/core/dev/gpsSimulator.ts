export interface Location {
  lat: number;
  lng: number;
}

export class GPSSimulator {
  private timer: ReturnType<typeof setInterval> | null = null;
  private route: Location[] = [];
  private currentStep = 0;

  constructor(
    private readonly intervalMs: number = 2000,
    private readonly onLocationUpdate: (loc: Location) => void
  ) {}

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
