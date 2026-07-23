import { JwtTokenService } from "./jwt.service";

describe("JwtTokenService", () => {
  beforeEach(() => {
    process.env.JWT_SIGNING_SECRET = "test-signing-secret";
  });

  it("round-trips a signed access token", () => {
    const service = new JwtTokenService();
    const token = service.signAccessToken({ sub: "user-1", email: "a@example.com" });
    const payload = service.verifyAccessToken(token);
    expect(payload).toMatchObject({ sub: "user-1", email: "a@example.com" });
  });

  it("rejects a token signed with a different secret", () => {
    const service = new JwtTokenService();
    const token = service.signAccessToken({ sub: "user-1", email: "a@example.com" });

    process.env.JWT_SIGNING_SECRET = "a-different-secret";
    const otherService = new JwtTokenService();
    expect(otherService.verifyAccessToken(token)).toBeNull();
  });

  it("rejects a malformed token without throwing", () => {
    const service = new JwtTokenService();
    expect(service.verifyAccessToken("not-a-real-jwt")).toBeNull();
  });
});
