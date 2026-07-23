import { Injectable } from "@nestjs/common";
import bcrypt from "bcryptjs";

// bcryptjs (pure JS, no native bindings to compile) over `bcrypt` —
// deliberate, given this repo's Lambda-packaging constraints; a native
// module has already caused real problems elsewhere in this session
// (apps/directus's README documents an `isolated-vm` native-module
// build failure). 12 salt rounds is bcrypt's own commonly-recommended
// default for interactive login (fast enough per request, slow enough
// to resist offline brute-force of a leaked hash).
const SALT_ROUNDS = 12;

@Injectable()
export class PasswordService {
  async hash(plaintext: string): Promise<string> {
    return bcrypt.hash(plaintext, SALT_ROUNDS);
  }

  async verify(plaintext: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plaintext, hash);
  }
}
