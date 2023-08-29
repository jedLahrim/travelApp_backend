import { Request } from "express";
export class securityGuard {
  constructor(private readonly csrfService) {}

  async canActivate(request: Request): Promise<boolean> {
    try {
      await this.csrfService.verifyCsrfToken(request);

      // CSRF token is valid
      return true;
    } catch (error) {
      // Invalid CSRF token
      return false;
    }
  }
}
