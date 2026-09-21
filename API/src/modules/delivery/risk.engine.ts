import { IDelivery } from './delivery.model';
import { getIO } from '../../socket';

export interface RiskFact {
  etaSecondsExpected: number;
  etaSecondsCurrent: number;
  etaDeltaSeconds: number;
  avgSpeedLast4Min: number;
  avgSpeedPrev4Min: number;
  speedDropPct: number;
  pickupDurationSeconds: number;
  deliveryAgeSeconds: number;
  distanceRemainingMeters: number;
  lastGpsUpdateAgoSeconds: number;
}

export interface RiskResult {
  deliveryId: string;
  orderId: string;
  severity: "low" | "medium" | "high" | "critical";
  type: "eta_drift" | "speed_drop" | "sla_breach" | "pickup_delay" | "stale_gps" | "partner_scarcity";
  evidence: RiskFact;
  humanTemplate: string;
  detectedAt: string;
}

const activeRisks = new Map<string, RiskResult>();

export async function evaluateRisk(delivery: IDelivery) {
  // Simplified risk evaluation for demo
  const age = (Date.now() - delivery.createdAt.getTime()) / 1000;
  let severity: "low" | "medium" | "high" | "critical" | null = null;
  let type: RiskResult['type'] | null = null;
  let humanTemplate = '';

  const facts: RiskFact = {
    etaSecondsExpected: 1800, // 30 min SLA
    etaSecondsCurrent: delivery.etaSeconds || 0,
    etaDeltaSeconds: (delivery.etaSeconds || 0) - 1800,
    avgSpeedLast4Min: 14, // Mocked speeds for demo
    avgSpeedPrev4Min: 27,
    speedDropPct: 48,
    pickupDurationSeconds: delivery.timestamps?.pickedUpAt ? (delivery.timestamps.pickedUpAt.getTime() - delivery.createdAt.getTime()) / 1000 : age,
    deliveryAgeSeconds: age,
    distanceRemainingMeters: delivery.distanceRemainingMeters || 0,
    lastGpsUpdateAgoSeconds: 0,
  };

  // Condition for demo purposes: If delivery is 'out_for_delivery' and age is high or forced condition
  if (delivery.status === 'out_for_delivery' && (facts.speedDropPct > 40 || facts.etaSecondsCurrent > 2000)) {
    severity = 'high';
    type = 'speed_drop';
    humanTemplate = `Order #${delivery.orderId} is ${Math.round(facts.etaSecondsCurrent/60)} minutes behind schedule. Partner speed dropped from ${facts.avgSpeedPrev4Min} km/h to ${facts.avgSpeedLast4Min} km/h over the last 4 minutes.`;
  } else if (delivery.status === 'partner_assigned' && age > 600) {
    severity = 'medium';
    type = 'pickup_delay';
    humanTemplate = `Order #${delivery.orderId} has been preparing for ${Math.round(age/60)} minutes.`;
  }

  if (severity && type) {
    const risk: RiskResult = {
      deliveryId: delivery.id,
      orderId: delivery.orderId.toString(),
      severity,
      type,
      evidence: facts,
      humanTemplate,
      detectedAt: new Date().toISOString()
    };
    activeRisks.set(delivery.id, risk);

    const io = getIO();
    io.to('admin_fleet').emit('delivery:risk', risk);
  } else {
    // Clear risk if resolved
    if (activeRisks.has(delivery.id)) {
      activeRisks.delete(delivery.id);
      const io = getIO();
      io.to('admin_fleet').emit('delivery:risk_cleared', { deliveryId: delivery.id });
    }
  }
}

export function getActiveRisks(): RiskResult[] {
  return Array.from(activeRisks.values());
}

export function getRiskForDelivery(deliveryId: string): RiskResult | undefined {
  return activeRisks.get(deliveryId);
}
