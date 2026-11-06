declare global {
  namespace App {
    interface Locals {
      adminUser?: {
        id: string;
        username: string;
        role: string;
      } | null;
    }
  }
}
export {};