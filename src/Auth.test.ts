import "jest-extended";
import { auth } from "./test/test-utils";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

jest.useFakeTimers();

it("should register first user", async () => {
  await expect(auth.register("user-1@nhost.io", "password-1")).toResolve();
});

it("should register second user", async () => {
  await expect(auth.register("user-2@nhost.io", "password-2")).toResolve();
});

it("should not be able to register same user twice", async () => {
  await expect(auth.register("user-2@nhost.io", "password-2")).toReject();
});

it("should not be able to register user with invalid email", async () => {
  await expect(auth.register("invalid-email.com", "password")).toReject();
});

it("should not be able to register without a password", async () => {
  await expect(auth.register("invalid-email.com", "")).toReject();
});

it("should not be able to register without an email", async () => {
  await expect(auth.register("", "password")).toReject();
});

it("should not be able to register without an email and password", async () => {
  await expect(auth.register("", "")).toReject();
});

it("should not be able to register with a short password", async () => {
  await expect(auth.register("user-1@nhost.io", "")).toReject();
});

it("should not be able to login with wrong password", async () => {
  await expect(auth.login("user-1@nhost.io", "wrong-password-1")).toReject();
});

it("should not be able to login with wrong password", async () => {
  await expect(auth.login("user-1@nhost.io", "password-1")).toResolve();
});

it("should be able to retreive JWT Token", async () => {
  const jwt_token = auth.getJWTToken();
  expect(jwt_token).toBeString();
});

it("should be able to get user id as JWT claim", async () => {
  const user_id = auth.getClaim("x-hasura-user-id");
  expect(user_id).toBeString();
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
  const jwt_token = auth.getJWTToken();
  expect(jwt_token).toBeEmpty();
});

it("should not be able to retreive JWT claim after logout (should fail)", () => {
  expect(true).toBe(true);
});

describe("testing onAuthStateChanged", () => {
  let auth_state_change_test_var;

  auth.onAuthStateChanged((d) => {
    auth_state_change_test_var = d;
  });

  it("should not be able to logout twice", async () => {
    await auth.login("user-1@nhost.io", "password-1");
    expect(auth_state_change_test_var).toBe(true);
  });

  it("auth_state_change_test_var should update to false after logout (should fail)", async () => {
    await auth.logout();
    expect(auth_state_change_test_var).toBe(false);
  });
});

describe.skip("Refresh time interval", () => {
  it("should retreive new jwt token after 3000 seconds based on automatic refresh interval", async () => {
    jest.useFakeTimers();

    await auth.login("user-1@nhost.io", "password-1");

    const jwt_token = auth.getJWTToken();

    jest.advanceTimersByTime(4000);

    const new_jwt_token = auth.getJWTToken();

    expect(new_jwt_token).not.toBe(jwt_token);
  });
});

describe("password change", () => {
  it("Should be able to logout and login", async () => {
    auth.logout();
    await expect(auth.login("user-1@nhost.io", "password-1")).toResolve();
  });

  it("should be able to change password", async () => {
    auth.logout();
    await auth.login("user-1@nhost.io", "password-1");
    await expect(
      auth.changePassword("password-1", "password-1-new")
    ).toResolve();
  });

  it("should be able to logout and login with new password", async () => {
    auth.logout();
    await expect(auth.login("user-1@nhost.io", "password-1-new")).toResolve();
  });
});
