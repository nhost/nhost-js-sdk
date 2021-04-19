import "jest-extended";
import { nhost, auth } from "./test/test-utils";

jest.useFakeTimers("modern");

it("should register first user", async () => {
  await expect(
    auth.register({ email: "user-1@nhost.io", password: "password-1" })
  ).toResolve();
});

it("should register second user", async () => {
  await expect(
    auth.register({ email: "user-2@nhost.io", password: "password-2" })
  ).toResolve();
});

it("should register a magic link user when magic link mode is enabled", async () => {
  await nhost.withEnv({
    ENABLE_MAGIC_LINK: 'true',
  }, async () => {
    await expect(
      auth.register({ email: "magic-link-user@nhost.io" })
    ).toResolve();
  }, {
    ENABLE_MAGIC_LINK: 'false'
  })
});

it("should not register a magic link user when magic link mode is disabled", async () => {
  await nhost.withEnv({
    ENABLE_MAGIC_LINK: 'false',
  }, async () => {
    await expect(
      auth.register({ email: "magic-link-user@nhost.io" })
    ).toReject();
  })
});

it("should not be able to register same user twice", async () => {
  await expect(
    auth.register({ email: "user-2@nhost.io", password: "password-2" })
  ).toReject();
});

it("should not be able to register user with invalid email", async () => {
  await expect(
    auth.register({ email: "invalid-email.com", password: "password" })
  ).toReject();
});

it("should not be able to register without a password", async () => {
  await expect(
    auth.register({ email: "invalid-email.com", password: "" })
  ).toReject();
});

it("should not be able to register without an email", async () => {
  await expect(auth.register({ email: "", password: "password" })).toReject();
});

it("should not be able to register without an email and password", async () => {
  await expect(auth.register({ email: "", password: "" })).toReject();
});

it("should not be able to register with a short password", async () => {
  await expect(
    auth.register({ email: "user-1@nhost.io", password: "" })
  ).toReject();
});

it("should not be able to login with wrong password", async () => {
  await expect(
    auth.login({ email: "user-1@nhost.io", password: "wrong-password-1" })
  ).toReject();
});

it("should be able to login with correct password", async () => {
  await expect(
    auth.login({ email: "user-1@nhost.io", password: "password-1" })
  ).toResolve();
});

it("should be able to retreive JWT Token", async () => {
  const JWTToken = auth.getJWTToken();
  expect(JWTToken).toBeString();
});

it("should be able to get user id as JWT claim", async () => {
  const userId = auth.getClaim("x-hasura-user-id");
  expect(userId).toBeString();
});

it("should be authenticated", async () => {
  await expect(auth.isAuthenticated()).toBe(true);
});

it("should be abele to logout", async () => {
  await expect(auth.logout()).toResolve();
});

it("should be able to logout twice", async () => {
  await expect(auth.logout()).toResolve();
});

it("should not be authenticated", async () => {
  await expect(auth.isAuthenticated()).toBe(false);
});

it("should not be able to retreive JWT token after logout", () => {

  const JWTToken = auth.getJWTToken();
  expect(JWTToken).toBeNull();
});

it("should not be able to retreive JWT claim after logout", () => {
  expect(auth.getClaim("x-hasura-user-id")).toBeNull();
});

it("should be able to login without a password when magic link mode is enabled", async () => {
  await nhost.withEnv({
    ENABLE_MAGIC_LINK: 'true'
  }, async () => {
    await expect(
      auth.login({ email: "magic-link-user@nhost.io" })
    ).toResolve();
  }, {
    ENABLE_MAGIC_LINK: 'false'
  })
});

it("should not be able to login without a password when magic link mode is disabled", async () => {
  await nhost.withEnv({
    ENABLE_MAGIC_LINK: 'false'
  }, async () => {
    await expect(
      auth.login({ email: "magic-link-user@nhost.io" })
    ).toReject();
  })
});

describe("testing onAuthStateChanged", () => {
  let authStateVar: boolean;

  const unsubscribe = auth.onAuthStateChanged((d: boolean) => {
    authStateVar = d;
  });

  it("login should set authStateVar to true", async () => {
    await auth.login({ email: "user-1@nhost.io", password: "password-1" });
    expect(authStateVar).toBe(true);
  });

  it("logout should set authStateVar to false", async () => {
    await auth.logout();
    expect(authStateVar).toBe(false);
  });

  it("unsubscribe auth state changes, login, authStateVar should be unchanged", async () => {
    unsubscribe();
    await auth.login({ email: "user-1@nhost.io", password: "password-1" });
    expect(authStateVar).toBe(false);
  });
});

describe.skip("Refresh time interval", () => {
  it("should retreive new jwt token after 3000 seconds based on automatic refresh interval", async () => {
    jest.useFakeTimers();

    await auth.login({ email: "user-1@nhost.io", password: "password-1" });

    const jwt_token = auth.getJWTToken();

    jest.advanceTimersByTime(960000); // 16 min

    const newJWTToken = auth.getJWTToken();

    expect(newJWTToken).not.toBe(jwt_token);
  });

  it("should retreive new jwt token after 3000 seconds based on automatic refresh interval", async () => {
    jest.useFakeTimers();

    let tokenStateVar = 0;
    auth.onTokenChanged(() => {
      tokenStateVar++;
    });

    await auth.login({ email: "user-1@nhost.io", password: "password-1" });

    expect(tokenStateVar).toBe(1);
    jest.advanceTimersByTime(960000); // 16 min
    expect(tokenStateVar).toBe(2);
  });
});

describe("password change", () => {
  it("Should be able to logout and login", async () => {
    auth.logout();
    await expect(
      auth.login({ email: "user-1@nhost.io", password: "password-1" })
    ).toResolve();
  });

  it("should be able to change password", async () => {
    auth.logout();
    await auth.login({ email: "user-1@nhost.io", password: "password-1" });
    await expect(
      auth.changePassword("password-1", "password-1-new")
    ).toResolve();
  });

  it("should be able to logout and login with new password", async () => {
    auth.logout();
    await expect(
      auth.login({ email: "user-1@nhost.io", password: "password-1-new" })
    ).toResolve();
  });
});
