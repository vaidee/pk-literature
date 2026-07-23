import { PasswordService } from "./password.service";

describe("PasswordService", () => {
  const service = new PasswordService();

  it("verifies a correctly hashed password", async () => {
    const hash = await service.hash("correct horse battery staple");
    expect(await service.verify("correct horse battery staple", hash)).toBe(true);
  });

  it("rejects the wrong password", async () => {
    const hash = await service.hash("correct horse battery staple");
    expect(await service.verify("wrong password", hash)).toBe(false);
  });

  it("produces a different hash each time (random salt)", async () => {
    const a = await service.hash("same password");
    const b = await service.hash("same password");
    expect(a).not.toBe(b);
  });
});
