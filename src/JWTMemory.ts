export default class JWTMemory {
  private jwt_token: string;

  constructor() {
    this.jwt_token;
  }

  public setJWT(jwt_token: string) {
    this.jwt_token = jwt_token;
  }

  public getJWT(): string {
    return this.jwt_token;
  }
}
