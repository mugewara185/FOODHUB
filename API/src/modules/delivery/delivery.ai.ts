import { Request, Response, NextFunction } from 'express';
import { getRiskForDelivery, getActiveRisks } from './risk.engine';
import { Delivery } from './delivery.model';
import { DeliveryPartner } from './delivery-partner.model';
import { createAIProvider } from '../ai/providers/provider.factory';
import { AIProviderGenerateInput } from '../ai/providers/ai.provider.interface';
import crypto from 'crypto';

const aiCache = new Map<string, { value: any; timestamp: number }>();

export async function askDeliveryCopilot(req: Request, res: Response, next: NextFunction) {
  try {
    const { question, deliveryId } = req.body;
    
    if (!question) {
      return res.status(400).json({ success: false, message: 'Question required' });
    }

    const copilotEnabled = process.env.AI_COPILOT_ENABLED === 'true';

    // 1. Gather Deterministic Facts
    let riskFacts: any[] = [];
    let deliverySummaries: any[] = [];
    let cacheKeyStr = `Q:${question}`;
    let templateResponse = '';

    if (deliveryId) {
      const risk = getRiskForDelivery(deliveryId);
      if (risk) {
        riskFacts.push(risk);
        cacheKeyStr += `|R:${risk.type}`;
        templateResponse = risk.humanTemplate;
      }
      
      const delivery = await Delivery.findById(deliveryId);
      if (delivery) {
        const partner = delivery.partnerId ? await DeliveryPartner.findById(delivery.partnerId) : null;
        deliverySummaries.push({
          deliveryId: delivery.id,
          orderId: delivery.orderId,
          status: delivery.status,
          etaSeconds: delivery.etaSeconds,
          distanceRemainingMeters: delivery.distanceRemainingMeters,
          partnerName: partner?.name || 'Unknown',
          vehicle: partner?.vehicle || 'Unknown'
        });
      }
    } else {
      const allRisks = getActiveRisks();
      riskFacts = allRisks;
      cacheKeyStr += `|RCount:${allRisks.length}`;

      const activeDeliveries = await Delivery.find({ status: { $in: ['preparing', 'partner_assigned', 'picked_up', 'on_the_way', 'nearby'] } }).populate('partnerId');
      deliverySummaries = activeDeliveries.map(d => {
        const p = d.partnerId as any;
        return {
          deliveryId: d.id,
          orderId: d.orderId,
          status: d.status,
          etaSeconds: d.etaSeconds,
          distanceRemainingMeters: d.distanceRemainingMeters,
          partnerName: p?.name || 'Unknown',
          vehicle: p?.vehicle || 'Unknown'
        }
      });
      if (allRisks.length > 0) {
        templateResponse = `Delivery ${allRisks[0].deliveryId} needs attention. ${allRisks[0].humanTemplate}`;
      } else {
        templateResponse = "All deliveries are currently operating within normal parameters.";
      }
    }

    // 2. Check Cache
    const cacheKey = crypto.createHash('md5').update(cacheKeyStr).digest('hex');
    const cached = aiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 60000) { // 60s TTL
      return res.status(200).json({ success: true, data: cached.value });
    }

    // 3. Evaluate AI vs Deterministic
    let answerData: any;
    
    if (copilotEnabled) {
      const provider = createAIProvider(); // Use gemini via env AI_PROVIDER=gemini
      const input: AIProviderGenerateInput = {
        request: {
          conversationId: 'delivery_copilot',
          messages: [{ role: 'user', content: question }]
        },
        context: {
          requestId: crypto.randomUUID(),
          traceId: crypto.randomUUID(),
          userId: 'admin',
          userRole: 'admin',
          timestamp: new Date()
        },
        evidence: [
          { toolName: 'risk_facts', data: { results: riskFacts }, source: 'delivery.ai', toolCallId: '1', retrievedAt: new Date(), durationMs: 0 },
          { toolName: 'delivery_summaries', data: { results: deliverySummaries }, source: 'delivery.ai', toolCallId: '2', retrievedAt: new Date(), durationMs: 0 }
        ],
        systemPrompt: "You are the FoodHub Operations Copilot.\n\nAnalyze ONLY the supplied delivery and risk facts.\n\nNever invent facts.\nNever modify delivery state.\nNever claim access to databases, GPS, orders, or customers beyond the supplied context.\n\nUse the supplied numbers when explaining a problem.\n\nIf the supplied facts are insufficient, say so.\n\nReturn only valid JSON matching the requested schema."
      };

      try {
        const aiRes = await provider.generate(input);
        answerData = {
          answer: aiRes.message,
          citedDeliveryId: (aiRes as any).citedDeliveryId,
          citedEvidence: (aiRes as any).citedEvidence,
          confidence: (aiRes as any).confidence || 'medium'
        };
      } catch (err) {
        console.error('AI provider failed, falling back to deterministic template', err);
        answerData = {
          answer: templateResponse || "Could not determine answer.",
          confidence: 'high'
        };
      }
    } else {
      answerData = {
        answer: templateResponse || "Could not determine answer (Copilot Disabled).",
        confidence: 'high'
      };
    }

    aiCache.set(cacheKey, { value: answerData, timestamp: Date.now() });
    return res.status(200).json({ success: true, data: answerData });

  } catch (error) {
    next(error);
  }
}
