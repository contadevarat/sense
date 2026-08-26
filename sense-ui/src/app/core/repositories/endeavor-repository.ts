import { Endeavor, EndeavorInput } from '../../models/endeavor';

/**
 * Persistence contract for endeavors. The browser never talks to a
 * database directly - implementations either wrap browser storage
 * (for local dev) or an HTTP API in front of whatever cloud database
 * backs it (DynamoDB, RDS, ...). Swapping implementations is a single
 * DI provider change in app.config.ts; nothing else in the app cares.
 */
export abstract class EndeavorRepository {
  abstract list(): Promise<Endeavor[]>;
  abstract get(id: string): Promise<Endeavor | undefined>;
  abstract create(input: EndeavorInput): Promise<Endeavor>;
  abstract update(id: string, input: EndeavorInput): Promise<Endeavor>;
  abstract delete(id: string): Promise<void>;
}
