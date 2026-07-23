import { Controller, Get } from "@nestjs/common";

// Not part of SPEC-02's API surface — an operational endpoint for the
// smoke-test placeholder jobs in .github/workflows/terraform-apply.yml
// (development/testing.md's E2E layer) and load balancer/API Gateway
// health checks once this service is actually deployed.
@Controller("health")
export class HealthController {
  @Get()
  check(): { status: "ok" } {
    return { status: "ok" };
  }
}
