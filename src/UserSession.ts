import jwt_decode from "jwt-decode";
import { Session } from "./types";

export default class UserSession {
  private session: Session | null;
  private claims: string[];

  constructor() {
    this.session = null;
    this.claims = [];
  }

  public setSession(session: Session | null) {
    this.session = session;

    if (session && session.jwt_token) {
      const jwtTokenDecoded: string[] = jwt_decode(session.jwt_token);
      this.claims = jwtTokenDecoded["https://hasura.io/jwt/claims"];
    } else {
      this.claims = [];
    }
  }

  public getSession(): Session | null {
    return this.session;
  }

  public getClaim(claim: string): string {
    return this.claims[claim];
  }
}
