# Logger Enhancement Plan

This document outlines a forward-looking roadmap for improving the application observability and the logger system in FoodHub.

## 1. Short-Term Enhancements

### 1.1 Global API Interceptor Unification
Currently, each domain service (`authApi`, `restaurantApi`, `orderApi`) wraps its own `fetch` calls. The architecture could be enhanced by reviving or refactoring the inactive `apiClient` / `axios.instance.ts` into a single, unified fetch/axios wrapper. This would centralize network logging, ensuring that all API requests—including future features—are automatically traced without having to remember to call `logAPI` wrappers.

### 1.2 Remote Telemetry & Log Persistence
The logger currently persists logs locally. An enhancement would be to implement a remote log shipping mechanism (e.g., Datadog, Sentry, Elastic APM). A new `RemoteTransport` class should be implemented that batches log entries and sends them securely to a telemetry endpoint.

### 1.3 Enhanced Error Boundaries
Wrap the main component trees with a custom React Error Boundary that automatically catches uncaught rendering errors and reports them using the logger (e.g., `logger.error('APP', 'Uncaught render error', { error, errorInfo })`), ensuring comprehensive frontend crash reporting.

## 2. Mid-Term Enhancements

### 2.1 Web Vitals & Real User Monitoring (RUM)
Extend `logPerformance` and the underlying `Logger` to capture standardized web vitals (LCP, FID, CLS, TTFB). Integrate `web-vitals` library and automatically dispatch events to `logger.metric()` or similar structures to monitor application performance objectively from the user's perspective.

### 2.2 Trace Context Propagation (OpenTelemetry Integration)
When connecting to a backend, implement W3C Trace Context propagation. Generate unique `traceId` and `spanId` on the frontend and pass them inside HTTP headers (e.g., `traceparent`). This would allow logs and errors to be correlated perfectly between the client application and backend microservices.

## 3. Long-Term Enhancements

### 3.1 Smart Log Sampling
If the application reaches high traffic, transmitting all logs remotely becomes expensive. Implement dynamic log sampling based on log severity or user context. For instance, log 100% of errors but only 5% of `info` logs unless the user's session is explicitly marked for debugging.

### 3.2 Visual Session Replay Integration
Integrate tools like LogRocket or SessionStack alongside the logger. Ensure that custom logger events are synced to the session replay timeline, allowing developers to visually see the user's screen at the exact moment a logger event (`CHECKOUT.SUBMIT.FAILURE`) fired.

## 4. Privacy & Compliance Roadmap

### 4.1 Strict PII Stripping
Develop a more advanced Regex-based PII scrubber inside `Logger.ts` or as a transport middleware that actively looks for email formats, credit card numbers, and phone numbers in any payload or string passed to the logger, masking them dynamically before the log is recorded or persisted.
