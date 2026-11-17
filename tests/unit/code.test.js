/**
 * @jest-environment jsdom
 */

// Front-end unit tests for public/js/code.js.
// The real script is loaded into a jsdom page, and XMLHttpRequest is replaced
// with a fake so no network calls are made.

/* global doLogin, readCookie, doLogout, addColor, searchColor, pageState */

const fs = require("fs");
const path = require("path");

const publicDir = path.join(__dirname, "..", "..", "public");
const codeSource = fs.readFileSync(path.join(publicDir, "js", "code.js"), "utf8");

// Lets the tests read and set the user variables that code.js keeps.
// It has to be loaded in the same script as code.js to share those variables.
const pageStateSource = `
globalThis.pageState = {
  get: () => ({ userId, firstName, lastName }),
  set: (state) => {
    if ("userId" in state) userId = state.userId;
    if ("firstName" in state) firstName = state.firstName;
    if ("lastName" in state) lastName = state.lastName;
  },
};
`;

class FakeXHR {
  constructor() {
    this.headers = {};
    FakeXHR.instances.push(this);
  }

  open(method, url, async) {
    this.method = method;
    this.url = url;
    this.async = async;
  }

  setRequestHeader(name, value) {
    this.headers[name] = value;
  }

  send(body) {
    this.body = body;
  }

  // Simulates the server answering the request.
  respond(status, data) {
    this.readyState = 4;
    this.status = status;
    this.responseText = JSON.stringify(data);
    this.onreadystatechange();
  }
}

function lastRequest() {
  return FakeXHR.instances[FakeXHR.instances.length - 1];
}

function loadPage(fileName) {
  const html = fs.readFileSync(path.join(publicDir, fileName), "utf8");
  document.body.innerHTML = html.match(/<body>([\s\S]*)<\/body>/)[1];
}

function clearCookie() {
  document.cookie = "firstName= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";
}

beforeAll(() => {
  window.XMLHttpRequest = FakeXHR;
  // Runs code.js in the page's global scope, the same way a <script> tag would.
  (0, eval)(codeSource + pageStateSource);
});

beforeEach(() => {
  FakeXHR.instances = [];
  clearCookie();
  pageState.set({ userId: 0, firstName: "", lastName: "" });
  // jsdom cannot follow page redirects and logs an error when code.js tries to
  // change window.location; hide that noise.
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

describe("doLogin", () => {
  beforeEach(() => {
    loadPage("index.html");
    document.getElementById("loginName").value = "SamH";
    document.getElementById("loginPassword").value = "Test";
  });

  test("posts the login and password as JSON to Login.php", () => {
    doLogin();

    const request = lastRequest();
    expect(request.method).toBe("POST");
    expect(request.url).toBe("http://159.203.177.121/LAMPAPI/Login.php");
    expect(request.headers["Content-type"]).toBe("application/json; charset=UTF-8");
    expect(JSON.parse(request.body)).toEqual({ login: "SamH", password: "Test" });
  });

  test("shows an error and saves no cookie when the login fails", () => {
    doLogin();
    lastRequest().respond(200, { id: 0, firstName: "", lastName: "", error: "No Records Found" });

    expect(document.getElementById("loginResult").textContent).toBe(
      "User/Password combination incorrect"
    );
    expect(document.cookie).toBe("");
  });

  test("saves the user in a cookie when the login succeeds", () => {
    doLogin();
    lastRequest().respond(200, { id: 2, firstName: "Sam", lastName: "Hill", error: "" });

    expect(pageState.get().userId).toBe(2);
    expect(document.cookie).toBe("firstName=Sam,lastName=Hill,userId=2");
    expect(document.getElementById("loginResult").textContent).toBe("");
  });
});

describe("readCookie", () => {
  test("loads the user's name and ID from the cookie", () => {
    document.cookie = "firstName=Aashish,lastName=Yadavally,userId=1";

    readCookie();

    expect(pageState.get().userId).toBe(1);
    expect(pageState.get().firstName).toBe("Aashish");
    expect(pageState.get().lastName).toBe("Yadavally");
  });

  test("marks the user as logged out when there is no cookie", () => {
    readCookie();

    expect(pageState.get().userId).toBe(-1);
  });
});

describe("doLogout", () => {
  test("clears the user and removes the cookie", () => {
    document.cookie = "firstName=Sam,lastName=Hill,userId=2";
    pageState.set({ userId: 2, firstName: "Sam", lastName: "Hill" });

    doLogout();

    expect(pageState.get().userId).toBe(0);
    expect(pageState.get().firstName).toBe("");
    expect(document.cookie).toBe("");
  });
});

describe("addColor", () => {
  beforeEach(() => {
    loadPage("color.html");
    pageState.set({ userId: 1 });
  });

  test("posts the new color and user ID as JSON to AddColor.php", () => {
    document.getElementById("colorText").value = "Teal";

    addColor();

    const request = lastRequest();
    expect(request.method).toBe("POST");
    expect(request.url).toBe("http://159.203.177.121/LAMPAPI/AddColor.php");
    expect(JSON.parse(request.body)).toEqual({ color: "Teal", userId: 1 });
  });

  test("shows a confirmation when the server answers", () => {
    document.getElementById("colorText").value = "Teal";

    addColor();
    lastRequest().respond(200, { error: "" });

    expect(document.getElementById("colorAddResult").textContent).toBe("Color has been added");
  });
});

describe("searchColor", () => {
  beforeEach(() => {
    loadPage("color.html");
    pageState.set({ userId: 1 });
    document.getElementById("searchText").value = "light";
  });

  test("posts the search text and user ID as JSON to SearchColors.php", () => {
    searchColor();

    const request = lastRequest();
    expect(request.method).toBe("POST");
    expect(request.url).toBe("http://159.203.177.121/LAMPAPI/SearchColors.php");
    expect(JSON.parse(request.body)).toEqual({ search: "light", userId: 1 });
  });

  test("lists each returned color on its own line", () => {
    searchColor();
    lastRequest().respond(200, { results: ["Light Blue", "Light Gray"], error: "" });

    const colorList = document.getElementById("colorList");
    expect(colorList.querySelectorAll("br")).toHaveLength(1);
    expect(colorList.textContent.split(/\s*\n\s*/)).toEqual(["Light Blue", "Light Gray"]);
    expect(document.getElementById("colorSearchResult").textContent).toBe(
      "Color(s) has been retrieved"
    );
  });

  test("leaves the list unchanged when the server finds no colors", () => {
    // SearchColors.php sends no "results" array when nothing matches, so
    // code.js fails while reading results.length (a known limitation).
    const colorList = document.getElementById("colorList");
    colorList.textContent = "Blue";

    searchColor();

    expect(() =>
      lastRequest().respond(200, { id: 0, firstName: "", lastName: "", error: "No Records Found" })
    ).toThrow(TypeError);
    expect(colorList.textContent).toBe("Blue");
  });
});
