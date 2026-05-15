// Bridge: re-export everything from the root schema.ts
// Many server files reference drizzle/schema — this keeps them working.
export * from '../schema';
