// Integration tests for the PHP API (api/*.php).
// They send real HTTP requests to a running PHP server backed by MySQL, so they
// need API_URL set, for example API_URL=http://127.0.0.1:8000.
// The GitHub Actions workflow starts PHP and MySQL and sets API_URL.

const API_URL = process.env.API_URL;

if (!API_URL && process.env.CI) {
  throw new Error("API_URL must be set when the integration tests run in CI");
}

const describeApi = API_URL ? describe : describe.skip;

// MD5 hash of "COP4331", the password stored for AYadavally in db/schema.sql.
const SEEDED_PASSWORD_HASH = "5832a71366768098cceb7095efb774f2";

async function post(endpoint, body) {
  const response = await fetch(`${API_URL}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return {
    status: response.status,
    contentType: response.headers.get("content-type"),
    data: await response.json(),
  };
}

describeApi("Login.php", () => {
  test("returns the user's ID and name for a valid login", async () => {
    const response = await post("Login.php", {
      login: "AYadavally",
      password: SEEDED_PASSWORD_HASH,
    });

    expect(response.status).toBe(200);
    expect(response.contentType).toMatch(/application\/json/);
    expect(response.data).toEqual({
      id: 1,
      firstName: "Aashish",
      lastName: "Yadavally",
      error: "",
    });
  });

  test("returns ID 0 and an error for a wrong password", async () => {
    const response = await post("Login.php", { login: "AYadavally", password: "wrong" });

    expect(response.status).toBe(200);
    expect(response.data).toEqual({
      id: 0,
      firstName: "",
      lastName: "",
      error: "No Records Found",
    });
  });
});

describeApi("SearchColors.php", () => {
  test("returns every color containing the search text", async () => {
    const response = await post("SearchColors.php", { userId: 1, search: "light" });

    expect(response.status).toBe(200);
    expect(response.contentType).toMatch(/application\/json/);
    expect(response.data.error).toBe("");
    expect(response.data.results).toEqual(
      expect.arrayContaining(["Light Blue", "Light Gray", "Light Red", "Light Green"])
    );
    for (const color of response.data.results) {
      expect(color.toLowerCase()).toContain("light");
    }
  });

  test("only searches the given user's colors", async () => {
    // User 2 (SamH) has no seeded colors.
    const response = await post("SearchColors.php", { userId: 2, search: "light" });

    expect(response.status).toBe(200);
    expect(response.data.error).toBe("No Records Found");
    expect(response.data.results).toBeUndefined();
  });
});

describeApi("AddColor.php", () => {
  test("saves a color that a later search can find", async () => {
    const newColor = `Test Color ${Date.now()}`;

    const addResponse = await post("AddColor.php", { userId: 1, color: newColor });

    expect(addResponse.status).toBe(200);
    expect(addResponse.contentType).toMatch(/application\/json/);
    expect(addResponse.data).toEqual({ error: "" });

    const searchResponse = await post("SearchColors.php", { userId: 1, search: newColor });

    expect(searchResponse.data).toEqual({ results: [newColor], error: "" });
  });
});
