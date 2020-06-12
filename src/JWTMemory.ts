import jwt_decode from "jwt-decode";

export default class JWTMemory {
  private jwt_token: string;
  private claims: any;

  constructor() {
    this.jwt_token;
    this.claims;
  }

  public setJWT(jwt_token: string) {
    this.jwt_token = jwt_token;
    const jwt_token_ecoded = jwt_decode(jwt_token) as any;
    this.claims = jwt_token_ecoded["https://hasura.io/jwt/claims"];
  }

  public getJWT(): string {
    return this.jwt_token;
  }

  public getClaim(claim: string): string {
    return this.claims[claim];
  }

  public clearJWT(): void {
    this.jwt_token = "";
  }
}
