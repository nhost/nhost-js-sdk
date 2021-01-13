import jwt_decode from "jwt-decode";

export default class JWTMemory {
  private JWTToken: string;
  private claims: any;

  constructor() {
    this.JWTToken;
    this.claims;
  }

  public setJWT(JWTToken: string) {
    this.JWTToken = JWTToken;
    const jwt_token_ecoded = jwt_decode(JWTToken) as any;
    this.claims = jwt_token_ecoded["https://hasura.io/jwt/claims"];
  }

  public getJWT(): string {
    return this.JWTToken;
  }

  public getClaim(claim: string): string {
    return this.claims[claim];
  }

  public clearJWT(): void {
    this.JWTToken = "";
    this.claims = [];
  }
}
